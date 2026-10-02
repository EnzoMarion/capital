import { createClient } from "npm:@supabase/supabase-js@2";

const productionOrigin = "https://capital-black.vercel.app";
const isAllowedOrigin = (origin: string) => origin === productionOrigin || /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin);

function corsHeaders(origin: string | null) {
    const allowedOrigin = origin && isAllowedOrigin(origin) ? origin : null;
    return {
    ...(allowedOrigin ? { "Access-Control-Allow-Origin": allowedOrigin } : {}),
    "Vary": "Origin",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Cache-Control": "no-store, max-age=0",
    "X-Content-Type-Options": "nosniff",
    };
}

function json(body: Record<string, unknown>, origin: string | null, status = 200) {
    return new Response(JSON.stringify(body), {
        status,
        headers: { ...corsHeaders(origin), "Content-Type": "application/json" },
    });
}

Deno.serve(async request => {
    const origin = request.headers.get("Origin");
    if (origin && !isAllowedOrigin(origin)) return json({ error: "Origine non autorisée." }, null, 403);
    if (request.method === "OPTIONS") return new Response("ok", { headers: corsHeaders(origin) });
    if (request.method !== "POST") return json({ error: "Méthode non autorisée." }, origin, 405);

    const authorization = request.headers.get("Authorization");
    const token = authorization?.match(/^Bearer\s+(.+)$/i)?.[1];
    if (!token) return json({ error: "Session absente." }, origin, 401);

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!supabaseUrl || !anonKey || !serviceRoleKey) {
        return json({ error: "Configuration serveur incomplète." }, origin, 500);
    }

    const userClient = createClient(supabaseUrl, anonKey, {
        auth: { persistSession: false, autoRefreshToken: false },
    });
    const { data: authData, error: authError } = await userClient.auth.getUser(token);
    if (authError || !authData.user) return json({ error: "Session invalide." }, origin, 401);

    const admin = createClient(supabaseUrl, serviceRoleKey, {
        auth: { persistSession: false, autoRefreshToken: false },
    });
    const userId = authData.user.id;
    const tables = ["quizzes", "quiz_review_items", "quiz_country_progress", "quiz_attempts"] as const;

    for (const table of tables) {
        const { error } = await admin.from(table).delete().eq("user_id", userId);
        if (error && error.code !== "42P01") {
            console.error(`Account deletion failed while removing ${table}:`, error.code);
            return json({ error: "Les données du compte n’ont pas toutes pu être supprimées. Réessaie ou contacte l’assistance." }, origin, 500);
        }
    }

    const { error: deleteError } = await admin.auth.admin.deleteUser(userId);
    if (deleteError) {
        console.error("Supabase account deletion failed:", deleteError.code);
        return json({ error: "Le compte n’a pas pu être supprimé. Réessaie ou contacte l’assistance." }, origin, 500);
    }

    return json({ success: true }, origin);
});
