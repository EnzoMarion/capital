import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { supabase } from "../api/supabase";
import { useNavigate } from "react-router-dom";
import type { Quiz } from "../api/types.ts";

export default function MyQuizzes() {
    const { user } = useAuth();
    const [quizzes, setQuizzes] = useState<Quiz[]>([]);
    const navigate = useNavigate();

    useEffect(() => {
        if (!user) return;
        supabase.from("quizzes").select("*").eq("user_id", user.id)
            .then(({ data }) => setQuizzes(data || []));
    }, [user]);

    async function handleDelete(id: string) {
        if (!window.confirm("Supprimer ce quiz ?")) return;
        const { error } = await supabase.from("quizzes").delete().eq("id", id);
        if (!error) setQuizzes(qs => qs.filter(q => q.id !== id));
    }

    if (!user) return <p>Connecte-toi !</p>;
    if (!quizzes.length) return <p>Tu n’as créé aucun quiz personnalisé.</p>;

    return (
        <div className="quiz-card input-mode quizzes-list">
            <h2 className="quizzes-title">Mes quiz personnalisés</h2>
            <ul className="quizzes-ul">
                {quizzes.map(q => {
                    let settingsObj = q.settings;
                    if (typeof settingsObj === "string") {
                        try { settingsObj = JSON.parse(settingsObj); } catch {}
                    }
                    let inputTypeLabel = "";
                    if (settingsObj?.inputType === "multiple") inputTypeLabel = "QCM";
                    else if (settingsObj?.inputType === "input") inputTypeLabel = "Saisie";

                    return (
                        <li key={q.id} className="quizzes-li">
                            <strong className="quizzes-li-title">{q.title}</strong>
                            <div className="quizzes-li-desc">{q.description}</div>
                            <div className="quizzes-li-actions">
                                <button className="quizzes-li-btn" onClick={()=>navigate(`/quiz?quiz_id=${q.id}`)}>
                                    {inputTypeLabel || "Lancer ce quiz"}
                                </button>
                                <button className="quizzes-li-edit" onClick={() => navigate(`/edit-quiz/${q.id}`)}>
                                    Modifier
                                </button>
                                <button className="quizzes-li-delete" onClick={()=>handleDelete(q.id)}>
                                    Supprimer
                                </button>
                            </div>
                        </li>
                    );
                })}
            </ul>
        </div>
    );
}
