import { supabase } from "./supabase";

type ExportTable = "quizzes" | "quiz_attempts" | "quiz_country_progress" | "quiz_review_items";

const EXPORT_TABLES: { name: ExportTable; orderBy: string }[] = [
    { name: "quizzes", orderBy: "id" },
    { name: "quiz_attempts", orderBy: "id" },
    { name: "quiz_country_progress", orderBy: "country_code" },
    { name: "quiz_review_items", orderBy: "id" },
];

async function exportOwnedRows(table: ExportTable, orderBy: string, userId: string) {
    const rows: Record<string, unknown>[] = [];
    const pageSize = 500;
    let from = 0;
    let totalRows: number | null = null;

    for (;;) {
        const { data, count, error } = await supabase
            .from(table)
            .select("*", { count: "exact" })
            .eq("user_id", userId)
            .order(orderBy, { ascending: true })
            .range(from, from + pageSize - 1);

        if (error) {
            if (error.code === "PGRST205" || error.code === "42P01") return rows;
            throw error;
        }

        const page = (data ?? []) as Record<string, unknown>[];
        rows.push(...page);
        totalRows = count ?? totalRows;
        if (!page.length || totalRows === null || rows.length >= totalRows) return rows;
        from += page.length;
    }
}

export async function downloadMyData(user: { id: string; email: string; avatarUrl?: string | null }) {
    const { data: authData, error: authError } = await supabase.auth.getUser();
    if (authError || !authData.user) throw authError ?? new Error("Session absente.");

    const datasets: Partial<Record<ExportTable, Record<string, unknown>[]>> = {};
    for (const table of EXPORT_TABLES) {
        datasets[table.name] = await exportOwnedRows(table.name, table.orderBy, user.id);
    }

    const exportFile = {
        format: "Atlas personal data export",
        exported_at: new Date().toISOString(),
        account: {
            id: authData.user.id,
            email: authData.user.email ?? user.email,
            created_at: authData.user.created_at,
            updated_at: authData.user.updated_at,
            last_sign_in_at: authData.user.last_sign_in_at,
            email_confirmed_at: authData.user.email_confirmed_at,
            app_metadata: authData.user.app_metadata,
            user_metadata: authData.user.user_metadata,
            identities: authData.user.identities,
        },
        datasets,
    };
    const blob = new Blob([JSON.stringify(exportFile, null, 2)], { type: "application/json;charset=utf-8" });
    const objectUrl = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = objectUrl;
    link.download = `atlas-donnees-personnelles-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
}

export async function deleteMyAccount() {
    const { data, error } = await supabase.functions.invoke("delete-account", { body: {} });
    if (error) throw error;
    if (data?.error) throw new Error(String(data.error));
}
