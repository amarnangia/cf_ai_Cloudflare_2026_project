import { danceResources } from './dance_resources';
import { ChatDO } from './chatD0';

export { ChatDO };

export default {
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
      const memoryRes = await chat.fetch("https://memory", { method: "GET" });
      const memory = await memoryRes.json() as { style: string; level: string; history: Array<{ user: string; ai: string }> };

      // 3. Get relevant dance resources
      const resources = (danceResources as any)[memory.style]?.[memory.level] || [];

      // 4. Build contextual prompt with user's learning history
      const recentHistory = memory.history.slice(-3).map(h => `User: ${h.user}\nAI: ${h.ai}`).join('\n\n');
      
      const prompt = `You are NrityaAI, an expert Indian classical dance instructor. The user is learning ${memory.style} at ${memory.level} level.

Available resources: ${JSON.stringify(resources)}

Recent conversation:
${recentHistory}

Current question: ${message}

Provide helpful, encouraging guidance about Indian classical dance. Be specific to their style and level.`;

      // 5. Get AI response
      const aiRes = await env.AI.run("@cf/meta/llama-3.1-8b-instruct" as any, {
        prompt
      }) as { response: string };

      const reply = aiRes.response || "I'm here to help you learn Indian classical dance!";

      // 6. Save conversation to memory
      memory.history.push({ user: message, ai: reply });
      await chat.fetch("https://memory", {
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
