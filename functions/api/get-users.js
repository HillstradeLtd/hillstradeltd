export async function onRequest(context) {
  const { request, env } = context;
  
  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Content-Type": "application/json"
  };

  if (request.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (request.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), { status: 405, headers: corsHeaders });
  }

  try {
    const { adminPassword } = await request.json();

    // Secure Admin Gateway Check
    // You can change "HillstradeAdmin2026!" to whatever secure password you prefer
    if (adminPassword !== "HillstradeAdmin2026!") {
      return new Response(JSON.stringify({ error: "Unauthorized access denied" }), { status: 401, headers: corsHeaders });
    }

    // List all keys starting with 'user:' prefix from Cloudflare KV
    const userKeys = await env.HILLSTRADE_DB.list({ prefix: "user:" });
    const usersList = [];

    for (const key of userKeys.keys) {
      const data = await env.HILLSTRADE_DB.get(key.name);
      if (data) {
        const parsed = JSON.parse(data);
        // Remove password before sending data to the dashboard interface for security
        delete parsed.password; 
        usersList.push(parsed);
      }
    }

    return new Response(JSON.stringify({ success: true, users: usersList }), { status: 200, headers: corsHeaders });

  } catch (err) {
    return new Response(JSON.stringify({ error: "Server error: " + err.message }), { status: 500, headers: corsHeaders });
  }
}
