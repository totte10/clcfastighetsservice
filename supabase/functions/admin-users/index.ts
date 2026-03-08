import { createClient } from "https://esm.sh/@supabase/supabase-js@2.98.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
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

    // Verify caller is admin using service role client with user's token
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
        avatar_url: profiles?.find((p: any) => p.id === u.id)?.avatar_url || null,
        roles: roles?.filter((r: any) => r.user_id === u.id).map((r: any) => r.role) || [],
      }));

      return new Response(JSON.stringify(enriched), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
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
    return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
