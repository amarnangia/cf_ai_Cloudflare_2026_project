import { danceResources } from './dance_resources';
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
- RESOURCES: asking for videos, books, or learning materials
- GENERAL: general conversation or greeting

User message: "${message}"

Respond with just the category name.`;
    
    const intentRes = await ai.run("@cf/meta/llama-3.1-8b-instruct", { prompt: intentPrompt });
    const intent = intentRes.response?.trim() || "GENERAL";

    // Agent 2: Specialized Response based on Intent
    let specializedPrompt = "";
    
    switch(intent) {
      case "TECHNIQUE":
        specializedPrompt = `You are a dance technique expert specializing in ${memory.style}. The user is at ${memory.level} level.
Provide detailed, step-by-step technical guidance for: ${message}
Include body positioning, hand gestures, and common mistakes to avoid.`;
        break;
      case "THEORY":
        specializedPrompt = `You are a dance historian and cultural expert in ${memory.style}. 
Explain the cultural significance, history, and philosophy behind: ${message}
Make it engaging and educational for a ${memory.level} student.`;
        break;
      case "PRACTICE":
        specializedPrompt = `You are a dance practice coach for ${memory.style}. Create a structured practice routine for: ${message}
Include warm-up, main exercises, and cool-down appropriate for ${memory.level} level.`;
        break;
      case "RESOURCES":
        specializedPrompt = `You are a dance education curator. Recommend specific learning resources for: ${message}
Available resources: ${JSON.stringify(resources)}
Suggest the best materials for a ${memory.level} ${memory.style} student.`;
        break;
      default:
        specializedPrompt = `You are NrityaAI, a friendly dance instructor. Respond warmly to: ${message}
User is learning ${memory.style} at ${memory.level} level.`;
    }

    const specializedRes = await ai.run("@cf/meta/llama-3.1-8b-instruct", { prompt: specializedPrompt });
    
    // Agent 3: Response Enhancement & Personalization
    const enhancePrompt = `You are a master dance instructor. Take this response and enhance it with:
1. Personal encouragement based on their ${memory.level} level
2. Connection to their ${memory.style} journey
3. A specific next step or practice suggestion

Original response: ${specializedRes.response}

Enhance this response to be more personal and actionable:`;
    
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
      const resources = (danceResources as any)[memory.style]?.[memory.level] || [];

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
