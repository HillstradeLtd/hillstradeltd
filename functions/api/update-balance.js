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
    const { adminPassword, email, balance, earnings } = await request.json();

    // Secure Admin Gateway Check
    // Must match the password you set in get-users.js
    if (adminPassword !== "HillstradeAdmin2026!") {
      return new Response(JSON.stringify({ error: "Unauthorized access denied" }), { status: 401, headers: corsHeaders });
    }

    if (!email) {
      return new Response(JSON.stringify({ error: "Missing user identification email" }), { status: 400, headers: corsHeaders });
    }

    const key = `user:${email.toLowerCase().trim()}`;
    const userData = await env.HILLSTRADE_DB.get(key);

    if (!userData) {
      return new Response(JSON.stringify({ error: "Investor profile not found" }), { status: 404, headers: corsHeaders });
    }

    const user = JSON.parse(userData);

    // Update the numbers if they were provided in the admin panel
    if (balance !== undefined) user.balance = balance;
    if (earnings !== undefined) user.earnings = earnings;

    // Save the updated profile back to Cloudflare KV storage
    await env.HILLSTRADE_DB.put(key, JSON.stringify(user));

    return new Response(JSON.stringify({ success: true, message: "Investor dashboard updated successfully" }), { status: 200, headers: corsHeaders });

  } catch (err) {
    return new Response(JSON.stringify({ error: "Server error: " + err.message }), { status: 500, headers: corsHeaders });
  }
}
