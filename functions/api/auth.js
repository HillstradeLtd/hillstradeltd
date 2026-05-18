export async function onRequest(context) {
  const { request, env } = context;
  
  // Allow cross-origin requests for your dynamic forms
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
    const { action, email, password, name } = await request.json();

    if (!email || !password) {
      return new Response(JSON.stringify({ error: "Missing email or password" }), { status: 400, headers: corsHeaders });
    }

    const key = `user:${email.toLowerCase().trim()}`;

    // REGISTER ACTION
    if (action === "register") {
      const existingUser = await env.HILLSTRADE_DB.get(key);
      if (existingUser) {
        return new Response(JSON.stringify({ error: "Investor profile already exists" }), { status: 400, headers: corsHeaders });
      }

      const newUser = {
        name: name || "Premium Investor",
        email: email.toLowerCase().trim(),
        password: password, // In a corporate production environment, passwords should be cryptographically hashed
        balance: "0.00000000",
        earnings: "0.00000000",
        status: "Active Secure Node"
      };

      await env.HILLSTRADE_DB.put(key, JSON.stringify(newUser));
      return new Response(JSON.stringify({ success: true, user: newUser }), { status: 201, headers: corsHeaders });
    }

    // LOGIN ACTION
    if (action === "login") {
      const userData = await env.HILLSTRADE_DB.get(key);
      if (!userData) {
        return new Response(JSON.stringify({ error: "Profile not found" }), { status: 404, headers: corsHeaders });
      }

      const user = JSON.stringify(userData);
      if (user.password !== password) {
        return new Response(JSON.stringify({ error: "Invalid password credentials" }), { status: 401, headers: corsHeaders });
      }

      return new Response(JSON.stringify({ success: true, user }), { status: 200, headers: corsHeaders });
    }

    return new Response(JSON.stringify({ error: "Invalid action" }), { status: 400, headers: corsHeaders });

  } catch (err) {
    return new Response(JSON.stringify({ error: "Server error: " + err.message }), { status: 500, headers: corsHeaders });
  }
}
