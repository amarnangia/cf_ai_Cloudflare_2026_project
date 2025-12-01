import { danceResources, getResourcesByCategory, searchResources } from './dance_resources';
import { ChatDO } from './chatD0';

export { ChatDO };

export default {
  // Optimized Multi-Agent Workflow (2 AI calls instead of 4)
  async executeWorkflow(message: string, memory: any, resources: any[], ai: any) {
    // Agent 1: Combined Style Detection + Intent Classification
    const analysisPrompt = `Analyze this dance learning request and provide TWO outputs:

Message: "${message}"

1. DANCE STYLE: Identify if asking about specific dance style:
- Bharatanatyam, Kathak, Odissi, Kuchipudi, Manipuri, Mohiniyattam (classical)
- Folk (if mentions Bhangra, Garba, Dandiya, Giddha, Lavani, etc.)
- STYLES_OVERVIEW (if asking about "dance styles" or "types of dance")
- NONE (if no specific style mentioned)

2. INTENT: Classify the request:
- TECHNIQUE: specific moves, postures, techniques
- THEORY: history, philosophy, cultural aspects
- PRACTICE: exercises, routines, practice guidance
- RESOURCES: videos, tutorials, "show me", "recommend", "help me learn"
- STYLES_OVERVIEW: asking about different dance styles
- GENERAL: conversation or greeting

Format your response as:
STYLE: [detected style]
INTENT: [classified intent]`;
    
    const analysisRes = await ai.run("@cf/meta/llama-3.1-8b-instruct", { prompt: analysisPrompt });
    const analysisText = analysisRes.response || "";
    
    // Parse the analysis
    const styleMatch = analysisText.match(/STYLE:\s*([^\n]+)/);
    const intentMatch = analysisText.match(/INTENT:\s*([^\n]+)/);
    
    const detectedStyle = styleMatch ? styleMatch[1].trim() : "NONE";
    const intent = intentMatch ? intentMatch[1].trim() : "GENERAL";
    
    // Update memory if new style detected
    if (detectedStyle !== "NONE" && detectedStyle !== "STYLES_OVERVIEW" && detectedStyle !== memory.style) {
      memory.style = detectedStyle;
    }
    
    // Agent 2: Specialized Response + Enhancement (Combined)
    let specializedPrompt = "";
    const currentStyle = memory.style || detectedStyle || "Indian dance";
    
    // Get recent conversation context
    const recentHistory = memory.history.slice(-4).map(h => `User: ${h.user}\nAI: ${h.ai}`).join('\n\n');
    const contextPrefix = recentHistory ? `Recent conversation:\n${recentHistory}\n\n` : '';
    
    switch(intent) {
      case "TECHNIQUE":
        specializedPrompt = `You are a dance technique expert specializing in ${currentStyle}. 

${contextPrefix}User asked: "${message}"
User level: ${memory.level}

Provide step-by-step technique guidance. Make it encouraging for a ${memory.level} student and include a specific next practice step. Keep under 120 words.`;
        break;
        
      case "THEORY":
        specializedPrompt = `You are a dance historian and cultural expert in ${currentStyle}.

${contextPrefix}User asked: "${message}"
User level: ${memory.level}

Explain the cultural significance engagingly. Add encouragement for their ${memory.level} level and suggest how this knowledge helps their practice. Keep under 120 words.`;
        break;
        
      case "PRACTICE":
        specializedPrompt = `You are a dance practice coach for ${currentStyle}.

${contextPrefix}User asked: "${message}"
User level: ${memory.level}

Create a structured practice routine with 3-4 exercises. Add encouragement for ${memory.level} level and mention you have tutorial videos available. Keep under 120 words.`;
        break;
        
      case "RESOURCES":
        // Get relevant resources
        const targetStyle = detectedStyle !== "NONE" ? detectedStyle : memory.style;
        let relevantResources = [];
        if (targetStyle && targetStyle !== "STYLES_OVERVIEW") {
          const styleResources = getResourcesByCategory(targetStyle, memory.level);
          if (styleResources && styleResources.length > 0) {
            relevantResources = styleResources.slice(0, 3);
          } else {
            const keywords = message.toLowerCase().split(' ');
            const searchResults = searchResources(targetStyle, memory.level, keywords);
            relevantResources = searchResults.slice(0, 3);
          }
        }
        
        if (relevantResources.length === 0) {
          relevantResources = danceResources.General?.slice(0, 3) || [];
        }
        
        const styleDisplayName = targetStyle || "dance";
        
        specializedPrompt = `You are a resource curator. ${contextPrefix}User asked: "${message}"

Recommend these specific tutorials with exact URLs:

${relevantResources.map(r => `**${r.title}**\n${r.url}\n${r.description}`).join('\n\n')}

Format: "Here are excellent ${styleDisplayName} tutorials for you:\n\n**[Title]**\n[URL]\n[Why helpful]\n\n**[Title 2]**\n[URL 2]\n[Why helpful]"

Add encouragement for ${memory.level} level. Copy URLs exactly.`;
        break;
        
      case "STYLES_OVERVIEW":
        specializedPrompt = `You are a dance expert. ${contextPrefix}User asked: "${message}"

Provide overview of Indian dance styles:

**Classical:** Bharatanatyam (Tamil Nadu), Kathak (North India), Odissi (Odisha), Kuchipudi (Andhra Pradesh), Manipuri (Manipur), Mohiniyattam (Kerala)

**Folk & Popular:** Bhangra (Punjab), Garba/Dandiya (Gujarat), Bollywood

Ask which interests them for personalized recommendations! Keep encouraging.`;
        break;
        
      default:
        specializedPrompt = `You are NrityaAI, a friendly dance instructor. ${contextPrefix}User said: "${message}"

User profile: ${memory.level} level, learning ${currentStyle}

Respond warmly and offer to share specific tutorial videos and resources. Keep encouraging and under 120 words.`;
    }
    
    const finalRes = await ai.run("@cf/meta/llama-3.1-8b-instruct", { prompt: specializedPrompt });
    
    return {
      intent,
      detectedStyle,
      specializedResponse: finalRes.response,
      finalResponse: finalRes.response || "I'm here to help you learn Indian dance!",
      workflow: "Optimized 2-agent system: Analysis → Specialized Response + Enhancement"
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

      const body = await request.json() as { 
        message?: string; 
        userId: string; 
        chatId?: number;
        action?: string;
        chats?: any[];
      };
      const { message, userId, action, chats } = body;
      
      // Handle chat management actions
      if (action === 'getChats') {
        const id = env.CHAT.idFromName(userId);
        const chat = env.CHAT.get(id);
        const chatsRes = await chat.fetch("https://example.com/chats", { method: "GET" });
        const chatsData = await chatsRes.json();
        return Response.json({ chats: chatsData }, {
          headers: { "Access-Control-Allow-Origin": "*" }
        });
      }
      
      if (action === 'saveChats') {
        const id = env.CHAT.idFromName(userId);
        const chat = env.CHAT.get(id);
        await chat.fetch("https://example.com/chats", {
          method: "POST",
          body: JSON.stringify(chats)
        });
        return Response.json({ success: true }, {
          headers: { "Access-Control-Allow-Origin": "*" }
        });
      }
      
      if (!message) {
        return Response.json({ error: 'Message required' }, { 
          status: 400,
          headers: { "Access-Control-Allow-Origin": "*" }
        });
      }

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

      // 3. Get relevant dance resources (only if style is set)
      const resources = memory.style ? getResourcesByCategory(memory.style, memory.level) || [] : [];

      // 4. WORKFLOW: Optimized Multi-Agent Dance Instruction System
      const workflow = await this.executeWorkflow(message, memory, [], env.AI);
      const reply = workflow.finalResponse;

      // 5. Save conversation to memory (including any style updates)
      memory.history.push({ user: message, ai: reply });
      
      // Update style if it was detected and changed
      if (workflow.detectedStyle && workflow.detectedStyle !== "NONE" && workflow.detectedStyle !== "STYLES_OVERVIEW") {
        memory.style = workflow.detectedStyle;
        console.log('Updated style to:', memory.style);
      }
      
      console.log('Saving memory for user:', userId, 'Style:', memory.style, 'History length:', memory.history.length);
      
      await chat.fetch("https://example.com/memory", {
        method: "POST",
        body: JSON.stringify(memory)
      });

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
