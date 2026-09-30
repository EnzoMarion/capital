import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { supabase } from "../api/supabase";
import CustomQuizBuilder from "../components/CustomQuizBuilder";
import type { CustomQuestion } from "../utils/customQuizModes";

export default function EditQuiz() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const { id } = useParams<{ id: string }>();
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [selectedQuestions, setSelectedQuestions] = useState<CustomQuestion[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [quizLoading, setQuizLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (!user || !id) { setQuizLoading(false); return; }
        let active = true;
        void (async () => {
            try {
                const { data, error: queryError } = await supabase.from("quizzes").select("title, description, settings").eq("id", id).eq("user_id", user.id).single();
                if (!active) return;
                if (queryError || !data) { setError("Ce quiz n’existe pas ou n’est pas accessible."); return; }
                setTitle(data.title || "");
                setDescription(data.description || "");
                let settings: Record<string, unknown> | null = null;
                if (typeof data.settings === "string") {
                    try {
                        const parsed: unknown = JSON.parse(data.settings);
                        if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) settings = parsed as Record<string, unknown>;
                    } catch { settings = null; }
                } else if (data.settings && typeof data.settings === "object" && !Array.isArray(data.settings)) {
                    settings = data.settings as Record<string, unknown>;
                }
                const questions = settings?.questions;
                setSelectedQuestions(Array.isArray(questions) ? questions as CustomQuestion[] : []);
            } catch {
                if (active) setError("Impossible de charger ce quiz. Réessaie.");
            } finally {
                if (active) setQuizLoading(false);
            }
        })();
        return () => { active = false; };
    }, [user, id]);

    async function handleDeleteQuiz() {
        setError(null);
        if (!id || !user || !window.confirm("Supprimer définitivement ce quiz ?")) return;
        const { data, error: deleteError } = await supabase.from("quizzes").delete().eq("id", id).eq("user_id", user.id).select("id").maybeSingle();
        if (deleteError) setError("Impossible de supprimer ce quiz. Réessaie.");
        else if (!data) setError("Ce quiz n’existe plus ou tu n’as pas l’autorisation de le modifier.");
        else navigate("/#mes-quiz");
    }

    async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setError(null);
        if (!user || !id) return;
        if (!title.trim()) { setError("Ajoute un titre à ton quiz."); return; }
        if (!selectedQuestions.length) { setError("Sélectionne au moins une question."); return; }

        setSaving(true);
        try {
            const { error: updateError } = await supabase.from("quizzes").update({
                title: title.trim(), description: description.trim(),
                settings: { questions: selectedQuestions, mode: "custom_sequence" },
            }).eq("id", id).eq("user_id", user.id);
            if (updateError) setError("La modification n’a pas pu être enregistrée.");
            else navigate("/#mes-quiz");
        } catch {
            setError("Connexion impossible. La modification n’a pas été enregistrée.");
        } finally {
            setSaving(false);
        }
    }

    if (quizLoading) return <p className="loading-state">Chargement du quiz…</p>;
    if (error && !title) return <p className="empty-state error" role="alert">{error}</p>;

    return (
        <form className="quiz-card input-mode quiz-create-form custom-quiz-page" onSubmit={handleSubmit}>
            <CustomQuizBuilder
                title={title} setTitle={setTitle}
                description={description} setDescription={setDescription}
                selectedQuestions={selectedQuestions} setSelectedQuestions={setSelectedQuestions}
            />
            {error && <p className="quiz-create-error" role="alert">{error}</p>}
            <footer className="custom-builder-footer custom-builder-edit-footer">
                <button type="button" className="quiz-delete-btn" onClick={handleDeleteQuiz}>Supprimer ce quiz</button>
                <span>{selectedQuestions.length} question{selectedQuestions.length === 1 ? "" : "s"}</span>
                <button type="submit" className="quiz-create-btn" disabled={saving}>
                    {saving ? "Enregistrement…" : "Enregistrer les modifications"}
                </button>
            </footer>
        </form>
    );
}
