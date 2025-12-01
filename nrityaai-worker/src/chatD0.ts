/// <reference types="@cloudflare/workers-types" />

export class ChatDO {
  state: DurableObjectState;

  constructor(state: DurableObjectState) {
    this.state = state;
  }

  async fetch(request: Request) {
    const url = new URL(request.url);
    const path = url.pathname;

    if (request.method === "GET") {
      if (path === "/memory") {
        const data = (await this.state.storage.get("data")) || {
          style: null,
          level: "Beginner",
          history: [],
        };
        return new Response(JSON.stringify(data));
      }
      
      if (path === "/chats") {
        const chats = (await this.state.storage.get("chats")) || [];
        return new Response(JSON.stringify(chats));
      }
    }

    if (request.method === "POST") {
      if (path === "/memory") {
        const body = await request.json();
        await this.state.storage.put("data", body);
        return new Response("Saved");
      }
      
      if (path === "/chats") {
        const chats = await request.json();
        await this.state.storage.put("chats", chats);
        return new Response("Saved");
      }
    }

    return new Response("Method not allowed", { status: 405 });
  }
}
