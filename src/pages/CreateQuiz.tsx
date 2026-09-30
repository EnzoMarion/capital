import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { supabase } from "../api/supabase";
import CustomQuizBuilder from "../components/CustomQuizBuilder";
import type { CustomQuestion } from "../utils/customQuizModes";

export default function CreateQuiz() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [selectedQuestions, setSelectedQuestions] = useState<CustomQuestion[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [saving, setSaving] = useState(false);

    async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setError(null);
        if (!user) { setError("Connecte-toi pour enregistrer un quiz."); return; }
        if (!title.trim()) { setError("Ajoute un titre à ton quiz."); return; }
        if (!selectedQuestions.length) { setError("Sélectionne au moins une question."); return; }

        setSaving(true);
        try {
            const { error: insertError } = await supabase.from("quizzes").insert([{
                user_id: user.id,
                title: title.trim(),
                description: description.trim(),
                settings: { questions: selectedQuestions, mode: "custom_sequence" },
            }]);
            if (insertError) setError("Le quiz n’a pas pu être créé. Réessaie.");
            else navigate("/#mes-quiz");
        } catch {
            setError("Connexion impossible. Le quiz n’a pas pu être créé.");
        } finally {
            setSaving(false);
        }
    }

    return (
        <form className="quiz-card input-mode quiz-create-form custom-quiz-page" onSubmit={handleSubmit}>
            <CustomQuizBuilder
                title={title} setTitle={setTitle}
                description={description} setDescription={setDescription}
                selectedQuestions={selectedQuestions} setSelectedQuestions={setSelectedQuestions}
            />
            {error && <p className="quiz-create-error" role="alert">{error}</p>}
            <footer className="custom-builder-footer">
                <span>{selectedQuestions.length} question{selectedQuestions.length === 1 ? "" : "s"} dans le quiz</span>
                <button type="submit" className="quiz-create-btn" disabled={saving}>
                    {saving ? "Enregistrement…" : "Créer mon quiz"}
                </button>
            </footer>
        </form>
    );
}
