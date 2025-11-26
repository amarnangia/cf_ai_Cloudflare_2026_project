/// <reference types="@cloudflare/workers-types" />

export class ChatDO {
  state: DurableObjectState;

  constructor(state: DurableObjectState) {
    this.state = state;
  }

  async fetch(request: Request) {
    const url = new URL(request.url);

    if (request.method === "GET") {
      const data = (await this.state.storage.get("data")) || {
        style: "Bharatanatyam",
        level: "Beginner",
        history: [],
      };
      return new Response(JSON.stringify(data));
    }

    if (request.method === "POST") {
      const body = await request.json();
      await this.state.storage.put("data", body);
      return new Response("Saved");
    }

    return new Response("Method not allowed", { status: 405 });
  }
}
