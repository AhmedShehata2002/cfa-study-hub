// Cloudflare Worker — proxies the Claude API (key stays server-side) AND syncs study data
// across devices via Workers KV, so your phone and laptop see the same progress.
//
// Setup:
//   wrangler kv namespace create STUDY_KV        (then add the binding to wrangler.toml)
//   wrangler secret put ANTHROPIC_API_KEY
//   wrangler secret put SYNC_TOKEN                (make up any random string — this is
//                                                   what proves requests are really from
//                                                   your app, not a stranger who found the URL)
//   wrangler deploy

function corsHeaders() {
  return {
    "Access-Control-Allow-Origin": "https://ahmedshehata2002.github.io",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, x-sync-token",
  };
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (request.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders() });
    }

    // --- Claude API proxy ---
    if (url.pathname === "/v1/messages") {
      if (request.method !== "POST") return new Response("Method not allowed", { status: 405 });
      const body = await request.text();
      const upstream = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": env.ANTHROPIC_API_KEY,
          "anthropic-version": "2023-06-01",
        },
        body,
      });
      const responseBody = await upstream.text();
      return new Response(responseBody, {
        status: upstream.status,
        headers: { "Content-Type": "application/json", ...corsHeaders() },
      });
    }

    // --- Study data sync (all endpoints require the shared token) ---
    if (url.pathname.startsWith("/sync/")) {
      if (request.headers.get("x-sync-token") !== env.SYNC_TOKEN) {
        return new Response("Unauthorized", { status: 401, headers: corsHeaders() });
      }

      // GET /sync/list — pull everything down (used when the app loads on a device)
      if (url.pathname === "/sync/list" && request.method === "GET") {
        const list = await env.STUDY_KV.list({ prefix: "study:" });
        const result = {};
        for (const k of list.keys) {
          result[k.name] = await env.STUDY_KV.get(k.name);
        }
        return new Response(JSON.stringify(result), {
          headers: { "Content-Type": "application/json", ...corsHeaders() },
        });
      }

      // POST /sync/set  { key, value } — push one changed key up (used on every save)
      if (url.pathname === "/sync/set" && request.method === "POST") {
        const { key, value } = await request.json();
        if (!key) return new Response("Missing key", { status: 400, headers: corsHeaders() });
        await env.STUDY_KV.put(key, value);
        return new Response("ok", { headers: corsHeaders() });
      }
    }

    return new Response("Not found", { status: 404, headers: corsHeaders() });
  },
};
