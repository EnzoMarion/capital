import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { supabase } from "../api/supabase";
import { useNavigate } from "react-router-dom";
import type { Quiz } from "../api/types.ts";

export default function MyQuizzes({ embedded = false }: { embedded?: boolean }) {
    const { user } = useAuth();
    const [quizzes, setQuizzes] = useState<Quiz[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        if (!user) { setLoading(false); return; }
        let active = true;
        const loadQuizzes = async () => {
            try {
                const { data, error: queryError } = await supabase.from("quizzes").select("*").eq("user_id", user.id).order("created_at", { ascending: false });
                if (!active) return;
                if (queryError) setError("Tes quiz n’ont pas pu être chargés.");
                setQuizzes(data || []);
            } catch {
                if (active) setError("Tes quiz n’ont pas pu être chargés.");
            } finally {
                if (active) setLoading(false);
            }
        };
        void loadQuizzes();
        return () => { active = false; };
    }, [user]);

    async function handleDelete(id: string | number) {
        setError(null);
        if (!user) return;
        if (!window.confirm("Supprimer ce quiz ?")) return;
        const { data, error: deleteError } = await supabase.from("quizzes").delete()
            .eq("id", id).eq("user_id", user.id).select("id").maybeSingle();
        if (deleteError) {
            setError("Impossible de supprimer ce quiz. Réessaie.");
            return;
        }
        if (!data) { setError("Ce quiz n’existe plus ou tu n’as pas l’autorisation de le supprimer."); return; }
        setQuizzes(qs => qs.filter(q => String(q.id) !== String(id)));
    }


    if (!user) return <p className="empty-state">Connecte-toi pour voir tes quiz.</p>;
    if (loading) return <p className="loading-state">Chargement de tes quiz…</p>;
    if (error && !quizzes.length) return <p className="empty-state error" role="alert">{error}</p>;
    if (!quizzes.length) return <p className={embedded ? "dashboard-quizzes-empty" : ""}>Tu n’as créé aucun quiz personnalisé.</p>;

    return (
        <div className={embedded ? "dashboard-quizzes" : "quiz-card input-mode quizzes-list"}>
            {!embedded && <h2 className="quizzes-title">Mes quiz personnalisés</h2>}
            {error && <div className="auth-message error" role="alert">{error}</div>}
            <ul className="quizzes-ul">
                {quizzes.map(q => {
                    return (
                        <li key={q.id} className="quizzes-li">
                            <strong className="quizzes-li-title">{q.title}</strong>
                            <div className="quizzes-li-desc">{q.description}</div>
                            <div className="quizzes-li-actions">
                                <button className="quizzes-li-btn" onClick={() => navigate(`/quiz-type?quiz_id=${encodeURIComponent(String(q.id))}`)}>
                                    Jouer
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
