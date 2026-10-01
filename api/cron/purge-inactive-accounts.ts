import { createClient } from "@supabase/supabase-js";
import type { IncomingMessage, ServerResponse } from "node:http";

type CronRequest = IncomingMessage & { method?: string };
type CronResponse = ServerResponse & {
    status: (code: number) => CronResponse;
    json: (body: unknown) => void;
};

const PERSONAL_TABLES = ["quizzes", "quiz_review_items", "quiz_country_progress", "quiz_attempts"] as const;
const MAX_DELETIONS_PER_RUN = 50;
const ACCOUNT_RETENTION_MONTHS = 24;

function olderThanRetentionPeriod(timestamp: string | null) {
    if (!timestamp) return false;
    const cutoff = new Date();
    const day = cutoff.getUTCDate();
    cutoff.setUTCDate(1);
    cutoff.setUTCMonth(cutoff.getUTCMonth() - ACCOUNT_RETENTION_MONTHS);
    const lastDayOfCutoffMonth = new Date(Date.UTC(cutoff.getUTCFullYear(), cutoff.getUTCMonth() + 1, 0)).getUTCDate();
    cutoff.setUTCDate(Math.min(day, lastDayOfCutoffMonth));
    return new Date(timestamp).getTime() < cutoff.getTime();
}

export default async function purgeInactiveAccounts(request: CronRequest, response: CronResponse) {
    if (request.method !== "GET") return response.status(405).json({ error: "Method not allowed." });

    const cronSecret = process.env.CRON_SECRET;
    if (!cronSecret || request.headers.authorization !== `Bearer ${cronSecret}`) {
        return response.status(401).json({ error: "Unauthorized." });
    }

    const supabaseUrl = process.env.SUPABASE_URL ?? process.env.VITE_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!supabaseUrl || !serviceRoleKey) {
        console.error("Inactive account cleanup is missing its server configuration.");
        return response.status(500).json({ error: "Server configuration is incomplete." });
    }

    const admin = createClient(supabaseUrl, serviceRoleKey, {
        auth: { persistSession: false, autoRefreshToken: false },
    });

    const inactiveUsers = [];
    for (let page = 1; ; page += 1) {
        const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 1000 });
        if (error) {
            console.error("Inactive account cleanup could not list users:", error.code);
            return response.status(500).json({ error: "Could not list accounts." });
        }

        inactiveUsers.push(...data.users.filter(user =>
            olderThanRetentionPeriod(user.last_sign_in_at ?? user.created_at),
        ));
        if (data.users.length < 1000) break;
    }

    let deleted = 0;
    let failed = 0;
    for (const user of inactiveUsers.slice(0, MAX_DELETIONS_PER_RUN)) {
        let personalDataDeleted = true;
        for (const table of PERSONAL_TABLES) {
            const { error } = await admin.from(table).delete().eq("user_id", user.id);
            if (error && error.code !== "42P01" && error.code !== "PGRST205") {
                console.error(`Inactive account cleanup could not clear ${table}:`, error.code);
                personalDataDeleted = false;
                break;
            }
        }
        if (!personalDataDeleted) {
            failed += 1;
            continue;
        }

        const { error } = await admin.auth.admin.deleteUser(user.id);
        if (error) {
            console.error("Inactive account cleanup could not delete an Auth user:", error.code);
            failed += 1;
            continue;
        }
        deleted += 1;
    }

    return response.status(200).json({
        deleted,
        failed,
        remainingEligible: Math.max(0, inactiveUsers.length - deleted - failed),
    });
}
