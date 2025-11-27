import { danceResources, getResourcesByCategory, searchResources } from './dance_resources';
import { ChatDO } from './chatD0';

export { ChatDO };

export default {
  // Multi-Agent Workflow for Dance Instruction
  async executeWorkflow(message: string, memory: any, resources: any[], ai: any) {
    // Agent 1: Intent Classification
    const intentPrompt = `Classify this dance learning request into one of these categories:
- TECHNIQUE: asking about specific moves, postures, or techniques
- THEORY: asking about history, philosophy, or cultural aspects  
- PRACTICE: asking for exercises, routines, or practice guidance
- RESOURCES: asking for videos, books, learning materials, tutorials, "show me", "recommend", "what should I watch", "help me learn"
- GENERAL: general conversation or greeting

User message: "${message}"

Note: If they want to LEARN something or need HELP with something, classify as RESOURCES.
If they say "show me", "recommend", "tutorial", "video", "learn", "help" - classify as RESOURCES.

Respond with just the category name.`;
    
    const intentRes = await ai.run("@cf/meta/llama-3.1-8b-instruct", { prompt: intentPrompt });
    const intent = intentRes.response?.trim() || "GENERAL";

    // Agent 2: Specialized Response based on Intent
    let specializedPrompt = "";
    
    switch(intent) {
      case "TECHNIQUE":
        specializedPrompt = `You are a dance technique expert. Provide step-by-step guidance for: ${message}
For ${memory.level} ${memory.style} students. If relevant, mention that you can recommend specific tutorial videos if they ask for resources.`;
        break;
      case "THEORY":
        specializedPrompt = `You are a dance historian. Explain the cultural significance of: ${message}
Keep response under 100 words. Make it engaging for a ${memory.level} ${memory.style} student.`;
        break;
      case "PRACTICE":
        specializedPrompt = `You are a practice coach. Create a routine for: ${message}
For ${memory.level} ${memory.style} students. Include 3-4 key exercises. Mention that you have specific tutorial videos if they want to see demonstrations.`;
        break;
      case "RESOURCES":
        // Enhanced resource selection based on query
        const keywords = message.toLowerCase().split(' ');
        const searchResults = searchResources(memory.style, memory.level, keywords);
        const relevantResources = searchResults.length > 0 ? searchResults.slice(0, 3) : resources.slice(0, 3);
        
        specializedPrompt = `You are a resource curator. Someone asked: "${message}"

You MUST recommend these specific tutorials and include their exact URLs:

${relevantResources.map(r => `**${r.title}**
${r.url}
${r.description}`).join('\n\n')}

Your response format:
"Here are excellent ${memory.style} tutorials for you:

**[Resource Title]**
[Full URL]
[Why it's helpful]

**[Resource Title 2]**
[Full URL 2]
[Why it's helpful]"

You MUST copy the exact URLs from above. Do not modify them.`;
        break;
      default:
        specializedPrompt = `You are NrityaAI, a friendly dance instructor. Respond warmly to: ${message}
User is learning ${memory.style} at ${memory.level} level. Always offer to share specific tutorial videos and resources to help them learn better!`;
    }

    const specializedRes = await ai.run("@cf/meta/llama-3.1-8b-instruct", { prompt: specializedPrompt });
    
    // Agent 3: Response Enhancement & Personalization
    const enhancePrompt = `Take this dance instruction and make it more encouraging and personal:

Original: ${specializedRes.response}

Add:
- Brief encouragement for ${memory.level} level
- One specific next step
- Keep total response under 120 words

Enhanced response:`;
    
    const finalRes = await ai.run("@cf/meta/llama-3.1-8b-instruct", { prompt: enhancePrompt });
    
    return {
      intent,
      specializedResponse: specializedRes.response,
      finalResponse: finalRes.response || "I'm here to help you learn Indian classical dance!",
      workflow: "3-agent system: Intent → Specialization → Enhancement"
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
      const memory = await memoryRes.json() as { style: string; level: string; history: Array<{ user: string; ai: string }> };

      // 3. Get relevant dance resources
      const resources = getResourcesByCategory(memory.style, memory.level) || [];

      // 4. WORKFLOW: Multi-Agent Dance Instruction System
      const workflow = await this.executeWorkflow(message, memory, resources, env.AI);
      const reply = workflow.finalResponse;

      // 6. Save conversation to memory
      memory.history.push({ user: message, ai: reply });
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
