import { createClient } from "https://esm.sh/@supabase/supabase-js@2.98.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "No auth" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const userClient = createClient(supabaseUrl, serviceRoleKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user } } = await userClient.auth.getUser();
    if (!user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const adminClient = createClient(supabaseUrl, serviceRoleKey);
    const { data: roleCheck } = await adminClient.from("user_roles").select("role").eq("user_id", user.id).eq("role", "admin").single();
    if (!roleCheck) {
      return new Response(JSON.stringify({ error: "Not admin" }), { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const url = new URL(req.url);
    const action = url.searchParams.get("action");

    if (req.method === "GET" && action === "list-users") {
      const { data: { users }, error } = await adminClient.auth.admin.listUsers({ perPage: 100 });
      if (error) throw error;

      const { data: roles } = await adminClient.from("user_roles").select("*");
      const { data: profiles } = await adminClient.from("profiles").select("*");

      const enriched = users.map((u: any) => ({
        id: u.id,
        email: u.email,
        created_at: u.created_at,
        last_sign_in_at: u.last_sign_in_at,
        full_name: profiles?.find((p: any) => p.id === u.id)?.full_name || "",
        username: profiles?.find((p: any) => p.id === u.id)?.username || null,
        avatar_url: profiles?.find((p: any) => p.id === u.id)?.avatar_url || null,
        roles: roles?.filter((r: any) => r.user_id === u.id).map((r: any) => r.role) || [],
      }));

      return new Response(JSON.stringify(enriched), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    if (req.method === "POST" && action === "create-user") {
      const { name, username, password, role } = await req.json();
      if (!name?.trim() || !username?.trim() || !password?.trim()) {
        return new Response(JSON.stringify({ error: "Namn, användarnamn och lösenord krävs" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }

      const cleanUsername = username.trim().toLowerCase();
      const email = `${cleanUsername}@app.internal`;

      // Check if username exists
      const { data: existingProfile } = await adminClient.from("profiles").select("id").eq("username", cleanUsername).maybeSingle();
      if (existingProfile) {
        return new Response(JSON.stringify({ error: "Användarnamnet är redan taget" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }

      const { data: newUser, error: createError } = await adminClient.auth.admin.createUser({
        email,
        password: password.trim(),
        email_confirm: true,
        user_metadata: { full_name: name.trim(), username: cleanUsername },
      });

      if (createError) throw createError;

      // Ensure profile has username (trigger should create it, but update to be safe)
      await adminClient.from("profiles").upsert({
        id: newUser.user.id,
        full_name: name.trim(),
        username: cleanUsername,
      }, { onConflict: "id" });

      // Assign role
      if (role && (role === "admin" || role === "worker")) {
        await adminClient.from("user_roles").upsert(
          { user_id: newUser.user.id, role },
          { onConflict: "user_id,role" }
        );
      }

      return new Response(JSON.stringify({ ok: true, user: { id: newUser.user.id, username: cleanUsername } }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    if (req.method === "POST" && action === "update-password") {
      const { userId, password } = await req.json();
      if (!userId || !password?.trim()) {
        return new Response(JSON.stringify({ error: "userId och password krävs" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
      const { error } = await adminClient.auth.admin.updateUserById(userId, { password: password.trim() });
      if (error) throw error;
      return new Response(JSON.stringify({ ok: true }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    if (req.method === "POST" && action === "set-role") {
      const { userId, role, remove } = await req.json();
      if (remove) {
        await adminClient.from("user_roles").delete().eq("user_id", userId).eq("role", role);
      } else {
        await adminClient.from("user_roles").upsert({ user_id: userId, role }, { onConflict: "user_id,role" });
      }
      return new Response(JSON.stringify({ ok: true }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    if (req.method === "POST" && action === "invite-user") {
      const { email } = await req.json();
      const { data, error } = await adminClient.auth.admin.inviteUserByEmail(email);
      if (error) throw error;
      return new Response(JSON.stringify({ ok: true, user: data.user }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    if (req.method === "POST" && action === "delete-user") {
      const { userId } = await req.json();
      if (userId === user.id) {
        return new Response(JSON.stringify({ error: "Cannot delete yourself" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
      const { error } = await adminClient.auth.admin.deleteUser(userId);
      if (error) throw error;
      return new Response(JSON.stringify({ ok: true }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    return new Response(JSON.stringify({ error: "Unknown action" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
