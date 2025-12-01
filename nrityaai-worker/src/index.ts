import { danceResources, getResourcesByCategory, searchResources } from './dance_resources';
import { ChatDO } from './chatD0';

export { ChatDO };

export default {
  // Multi-Agent Workflow for Dance Instruction
  async executeWorkflow(message: string, memory: any, resources: any[], ai: any) {
    // First, detect if user is asking about a specific dance style
    const danceStylePrompt = `Analyze this message and identify if the user is asking about a specific dance style.

Message: "${message}"

Dance styles to look for:
- Bharatanatyam (South Indian classical)
- Kathak (North Indian classical)
- Odissi (Odia classical)
- Kuchipudi (Telugu classical)
- Bollywood (film dance)
- Folk (includes Bhangra, Garba, Dandiya, Giddha, Lavani, etc.)
- Other (Manipuri, Mohiniyattam, etc.)

Special cases:
- If they mention "Bhangra", "Garba", "Dandiya", "Giddha", "Lavani", or other folk dances, respond with "Folk"
- If they mention a classical dance name, respond with that exact name
- If they ask about "dance styles" or "types of dance" in general, respond with "STYLES_OVERVIEW"
- If no specific style is mentioned, respond with "NONE"

Response:`;
    
    const styleRes = await ai.run("@cf/meta/llama-3.1-8b-instruct", { prompt: danceStylePrompt });
    let detectedStyle = styleRes.response?.trim() || "NONE";
    
    // Handle specific folk dance mentions
    const folkDances = ['bhangra', 'garba', 'dandiya', 'giddha', 'lavani', 'kalbelia', 'ghoomar'];
    const messageLower = message.toLowerCase();
    if (folkDances.some(dance => messageLower.includes(dance))) {
      detectedStyle = "Folk";
    }
    
    // Update memory if a new style is detected
    if (detectedStyle !== "NONE" && detectedStyle !== "STYLES_OVERVIEW" && detectedStyle !== memory.style) {
      memory.style = detectedStyle;
    }
    
    // Agent 1: Intent Classification
    const intentPrompt = `Classify this dance learning request into one of these categories:
- TECHNIQUE: asking about specific moves, postures, or techniques
- THEORY: asking about history, philosophy, or cultural aspects  
- PRACTICE: asking for exercises, routines, or practice guidance
- RESOURCES: asking for videos, books, learning materials, tutorials, "show me", "recommend", "what should I watch", "help me learn"
- STYLES_OVERVIEW: asking about different dance styles or types of dance
- GENERAL: general conversation or greeting

User message: "${message}"

Note: If they want to LEARN something or need HELP with something, classify as RESOURCES.
If they say "show me", "recommend", "tutorial", "video", "learn", "help" - classify as RESOURCES.
If they ask about "dance styles", "types of dance", "what dances are there" - classify as STYLES_OVERVIEW.

Respond with just the category name.`;
    
    const intentRes = await ai.run("@cf/meta/llama-3.1-8b-instruct", { prompt: intentPrompt });
    const intent = intentRes.response?.trim() || "GENERAL";

    // Agent 2: Specialized Response based on Intent
    let specializedPrompt = "";
    
    switch(intent) {
      case "TECHNIQUE":
        specializedPrompt = `You are a dance technique expert. Provide step-by-step guidance for: ${message}
For ${memory.level} ${memory.style || detectedStyle} students. If relevant, mention that you can recommend specific tutorial videos if they ask for resources.`;
        break;
      case "THEORY":
        specializedPrompt = `You are a dance historian. Explain the cultural significance of: ${message}
Keep response under 100 words. Make it engaging for a ${memory.level} ${memory.style || detectedStyle} student.`;
        break;
      case "PRACTICE":
        specializedPrompt = `You are a practice coach. Create a routine for: ${message}
For ${memory.level} ${memory.style || detectedStyle} students. Include 3-4 key exercises. Mention that you have specific tutorial videos if they want to see demonstrations.`;
        break;
      case "RESOURCES":
        // Enhanced resource selection based on query and detected style
        const targetStyle = detectedStyle !== "NONE" ? detectedStyle : memory.style;
        const keywords = message.toLowerCase().split(' ');
        
        // Get resources for the target style
        let relevantResources = [];
        if (targetStyle) {
          // First try to get style-specific resources
          const styleResources = getResourcesByCategory(targetStyle, memory.level);
          if (styleResources.length > 0) {
            relevantResources = styleResources.slice(0, 3);
          } else {
            // Try search if no direct resources found
            const searchResults = searchResources(targetStyle, memory.level, keywords);
            relevantResources = searchResults.slice(0, 3);
          }
        }
        
        // If still no resources found, fall back to general resources
        if (relevantResources.length === 0) {
          relevantResources = danceResources.General.slice(0, 3);
        }
        
        const styleDisplayName = targetStyle || "dance";
        
        specializedPrompt = `You are a resource curator. Someone asked: "${message}"

You MUST recommend these specific tutorials and include their exact URLs:

${relevantResources.map(r => `**${r.title}**
${r.url}
${r.description}`).join('\n\n')}

Your response format:
"Here are excellent ${styleDisplayName} tutorials for you:

**[Resource Title]**
[Full URL]
[Why it's helpful]

**[Resource Title 2]**
[Full URL 2]
[Why it's helpful]"

You MUST copy the exact URLs from above. Do not modify them.`;
        break;
      case "STYLES_OVERVIEW":
        specializedPrompt = `You are a dance expert. The user asked: "${message}"

Provide a brief overview of Indian dance styles:

**Classical Dance Forms:**
- Bharatanatyam (Tamil Nadu) - Temple dance with precise movements
- Kathak (North India) - Storytelling dance with spins
- Odissi (Odisha) - Sculptural poses and fluid movements
- Kuchipudi (Andhra Pradesh) - Dramatic dance-drama
- Manipuri (Manipur) - Graceful devotional dance
- Mohiniyattam (Kerala) - Feminine classical dance

**Folk & Popular:**
- Bhangra (Punjab) - Energetic harvest dance
- Garba/Dandiya (Gujarat) - Festival circle dances
- Bollywood - Film-inspired contemporary dance

Ask which style interests them most for personalized recommendations!`;
        break;
      default:
        const currentStyle = memory.style || "Indian dance";
        specializedPrompt = `You are NrityaAI, a friendly dance instructor. Respond warmly to: ${message}
User is learning ${currentStyle} at ${memory.level} level. Always offer to share specific tutorial videos and resources to help them learn better!`;
    }

    const specializedRes = await ai.run("@cf/meta/llama-3.1-8b-instruct", { prompt: specializedPrompt });
    
    // Agent 3: Response Enhancement & Personalization (skip for STYLES_OVERVIEW)
    let finalResponse;
    if (intent === "STYLES_OVERVIEW") {
      finalResponse = specializedRes.response;
    } else {
      const enhancePrompt = `Take this dance instruction and make it more encouraging and personal:

Original: ${specializedRes.response}

Add:
- Brief encouragement for ${memory.level} level
- One specific next step
- Keep total response under 120 words

Enhanced response:`;
      
      const finalRes = await ai.run("@cf/meta/llama-3.1-8b-instruct", { prompt: enhancePrompt });
      finalResponse = finalRes.response || "I'm here to help you learn Indian dance!";
    }
    
    return {
      intent,
      detectedStyle,
      specializedResponse: specializedRes.response,
      finalResponse,
      workflow: "3-agent system: Style Detection → Intent → Specialization → Enhancement"
    };
  },

  async fetch(request: Request, env: Env): Promise<Response> {
    try {
      // Handle CORS preflight requests
      if (request.method === "OPTIONS") {
        return new Response(null, {
          headers: {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "POST, OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type",
          },
        });
      }
      
      if (request.method !== "POST") {
        return new Response("Method not allowed", { 
          status: 405,
          headers: {
            "Access-Control-Allow-Origin": "*",
          }
        });
      }

      const { message, userId } = await request.json() as { message: string; userId: string };

      // 1. Get Durable Object for persistent memory
      const id = env.CHAT.idFromName(userId);
      const chat = env.CHAT.get(id);

      // 2. Load user's dance learning memory
      const memoryRes = await chat.fetch("https://example.com/memory", { method: "GET" });
      const memory = await memoryRes.json() as { style: string | null; level: string; history: Array<{ user: string; ai: string }> };
      
      // Initialize defaults if not set
      if (!memory.style) memory.style = null;
      if (!memory.level) memory.level = "Beginner";
      if (!memory.history) memory.history = [];
      
      console.log('Loaded memory for user:', userId, 'Style:', memory.style, 'Level:', memory.level, 'History length:', memory.history.length);

      // 3. Get relevant dance resources (only if style is set)
      const resources = memory.style ? getResourcesByCategory(memory.style, memory.level) || [] : [];

      // 4. WORKFLOW: Multi-Agent Dance Instruction System
      const workflow = await this.executeWorkflow(message, memory, resources, env.AI);
      const reply = workflow.finalResponse;

      // 6. Save conversation to memory (including any style updates)
      memory.history.push({ user: message, ai: reply });
      
      // Update style if it was detected and changed
      if (workflow.detectedStyle && workflow.detectedStyle !== "NONE" && workflow.detectedStyle !== "STYLES_OVERVIEW") {
        memory.style = workflow.detectedStyle;
        console.log('Updated style to:', memory.style);
      }
      
      console.log('Saving memory for user:', userId, 'Style:', memory.style, 'History length:', memory.history.length);
      
      const saveRes = await chat.fetch("https://example.com/memory", {
        method: "POST",
        body: JSON.stringify(memory)
      });
      
      if (!saveRes.ok) {
        console.error('Failed to save memory:', await saveRes.text());
      }

      return Response.json({ reply }, {
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "POST, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type",
        },
      });
    } catch (error) {
      console.error('Worker error:', error);
      return Response.json({ 
        error: 'Internal server error',
        message: error.message 
      }, { 
        status: 500,
        headers: {
          "Access-Control-Allow-Origin": "*",
        }
      });
    }
  }
};
