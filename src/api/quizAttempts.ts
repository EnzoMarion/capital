import { useEffect, useRef, useState } from "react";
import { supabase } from "./supabase";

export type MyQuizStat = {
    quiz_key: string;
    scope_key: string;
    scope_label: string;
    attempt_count: number;
    best_percent: number;
    best_score: number;
    best_total: number;
    // These fields are deliberately null until the server-side cohort threshold is met.
    player_count: number | null;
    players_below: number | null;
};

export const QUIZ_STAT_LABELS: Record<string, string> = {
    capitales_monde: "Capitales du monde",
    drapeaux: "Drapeaux",
    union_europeenne: "Union européenne",
    france_departements: "Préfectures françaises",
    france_identification: "Identification des départements",
    france_regions: "Régions françaises",
    france_mountains: "Chaînes de montagnes françaises",
    france_rivers: "Fleuves français",
    switzerland_cantons: "Cantons suisses",
    switzerland_chief_towns: "Chefs-lieux suisses",
    switzerland_canton_flags: "Drapeaux des cantons suisses",
    usa_states: "Identification des États américains",
    usa_state_capitals: "Capitales des États américains",
    usa_state_flags: "Drapeaux des États américains",
    personnalise_france: "Quiz personnalisés France",
    personnalise_suisse: "Quiz personnalisés Suisse",
    personnalise_usa: "Quiz personnalisés États-Unis",
    personnalise: "Quiz personnalisés",
};

export async function recordQuizAttempt(
    userId: string | undefined,
    quizKey: string,
    score: number,
    totalQuestions: number,
    scopeKey = "global",
    scopeLabel = "Toutes les questions",
) {
    if (!userId || totalQuestions < 1) return;
    const { error } = await supabase.from("quiz_attempts").insert({
        user_id: userId,
        quiz_key: quizKey,
        scope_key: scopeKey,
        scope_label: scopeLabel,
        score,
        total_questions: totalQuestions,
        is_complete: true,
    });
    if (error) throw error;
}

export async function fetchMyQuizStats() {
    const { data, error } = await supabase.rpc("get_my_quiz_stats");
    if (error) throw error;
    return (data ?? []) as MyQuizStat[];
}

export type CountryProgressResult = { country_code: string; is_correct: boolean };

export async function recordCountryProgress(
    userId: string,
    answers: { countryCode: string; isCorrect: boolean }[],
) {
    const rows = answers.map(answer => ({
        user_id: userId,
        quiz_key: "capitales_monde",
        country_code: answer.countryCode,
        is_correct: answer.isCorrect,
        updated_at: new Date().toISOString(),
    }));
    if (!rows.length) return;
    const { error } = await supabase
        .from("quiz_country_progress")
        .upsert(rows, { onConflict: "user_id,quiz_key,country_code" });
    if (error) throw error;
}

export async function fetchMyCountryProgress(userId: string) {
    const { data, error } = await supabase
        .from("quiz_country_progress")
        .select("country_code,is_correct")
        .eq("user_id", userId)
        .eq("quiz_key", "capitales_monde");
    if (error) throw error;
    return (data ?? []) as CountryProgressResult[];
}

export type QuizAttemptSaveStatus = "idle" | "saving" | "saved" | "error" | "signed_out";

export function useQuizAttemptSave({
    enabled,
    userId,
    quizKey,
    score,
    totalQuestions,
    scopeKey,
    scopeLabel,
}: {
    enabled: boolean;
    userId?: string;
    quizKey: string;
    score: number;
    totalQuestions: number;
    scopeKey: string;
    scopeLabel: string;
}) {
    const [status, setStatus] = useState<QuizAttemptSaveStatus>("idle");
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [retryCount, setRetryCount] = useState(0);
    const recordedAttempt = useRef<string | null>(null);
    const attemptKey = JSON.stringify([userId, quizKey, score, totalQuestions, scopeKey, scopeLabel]);

    useEffect(() => {
        if (!enabled) {
            recordedAttempt.current = null;
            setStatus("idle");
            setErrorMessage(null);
            return;
        }
        if (!userId) {
            setStatus("signed_out");
            return;
        }
        if (recordedAttempt.current === attemptKey) return;

        recordedAttempt.current = attemptKey;
        setStatus("saving");
        setErrorMessage(null);
        void recordQuizAttempt(userId, quizKey, score, totalQuestions, scopeKey, scopeLabel)
            .then(() => setStatus("saved"))
            .catch((error: unknown) => {
                console.error("Échec de l’enregistrement du score Supabase.", error);
                recordedAttempt.current = null;
                setStatus("error");
                if (error && typeof error === "object" && "message" in error && typeof error.message === "string") {
                    const code = "code" in error && typeof error.code === "string" ? ` (${error.code})` : "";
                    const details = "details" in error && typeof error.details === "string" ? ` — ${error.details}` : "";
                    setErrorMessage(`${error.message}${code}${details}`);
                } else {
                    setErrorMessage("Erreur Supabase inconnue.");
                }
            });
    }, [attemptKey, enabled, quizKey, retryCount, scopeKey, scopeLabel, score, totalQuestions, userId]);

    return { status, errorMessage, retry: () => setRetryCount(count => count + 1) };
}
