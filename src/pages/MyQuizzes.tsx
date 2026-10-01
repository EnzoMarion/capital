import { useEffect, useState, type ReactNode } from "react";
import { useAuth } from "../context/useAuth";
import { supabase } from "../api/supabase";
import { useNavigate } from "react-router-dom";
import type { Quiz } from "../api/types.ts";
import { getCustomQuestionMode } from "../utils/customQuizModes";

type QuizCategory = "monde" | "france" | "suisse" | "usa" | "mixte";

const QUIZ_CATEGORIES: { key: QuizCategory; label: string; icon: ReactNode }[] = [
    { key: "monde", label: "Monde", icon: String.fromCodePoint(0x1f30d) },
    { key: "france", label: "France", icon: <svg className="custom-quiz-category-flag" viewBox="0 0 30 20"><rect width="10" height="20" fill="#0055a4"/><rect x="10" width="10" height="20" fill="#fff"/><rect x="20" width="10" height="20" fill="#ef4135"/></svg> },
    { key: "suisse", label: "Suisse", icon: <svg className="custom-quiz-category-flag custom-quiz-category-flag-swiss" viewBox="0 0 24 24"><rect width="24" height="24" rx="3" fill="#d52b1e"/><path d="M9 4h6v5h5v6h-5v5H9v-5H4V9h5z" fill="#fff"/></svg> },
    { key: "usa", label: "États-Unis", icon: <svg className="custom-quiz-category-flag" viewBox="0 0 38 26"><rect width="38" height="26" rx="3" fill="#fff"/>{[0, 4, 8, 12, 16, 20, 24].map(y => <rect key={y} y={y} width="38" height="2" fill="#c43b4a"/>)}<rect width="17" height="14" rx="1" fill="#244477"/>{[[3, 3], [8, 3], [13, 3], [5.5, 6.5], [10.5, 6.5], [3, 10], [8, 10], [13, 10]].map(([x, y], index) => <circle key={index} cx={x} cy={y} r=".8" fill="#fff"/>)}</svg> },
    { key: "mixte", label: "Quiz mixtes", icon: String.fromCodePoint(0x1f5fa, 0xfe0f) },
];

function quizCategory(quiz: Quiz): QuizCategory {
    let settings: unknown = quiz.settings;
    if (typeof settings === "string") {
        try {
            settings = JSON.parse(settings);
        } catch {
            settings = {};
        }
    }
    const settingsObject = settings && typeof settings === "object" && !Array.isArray(settings)
        ? settings as Record<string, unknown>
        : {};
    const questions = Array.isArray(settingsObject.questions) ? settingsObject.questions : [];
    const categories = new Set<Exclude<QuizCategory, "mixte">>();
    for (const question of questions) {
        if (!question || typeof question !== "object" || !("question_type" in question)) continue;
        const group = getCustomQuestionMode(String(question.question_type))?.group;
        if (group === "pays") categories.add("monde");
        else if (group === "france") categories.add("france");
        else if (group === "suisse") categories.add("suisse");
        else if (group === "usa") categories.add("usa");
    }
    if (categories.size > 1) return "mixte";
    return categories.values().next().value ?? "monde";
}

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

    const groupedQuizzes = new Map<QuizCategory, Quiz[]>(QUIZ_CATEGORIES.map(category => [category.key, []]));
    quizzes.forEach(quiz => groupedQuizzes.get(quizCategory(quiz))?.push(quiz));

    return (
        <div className={embedded ? "dashboard-quizzes" : "quiz-card input-mode quizzes-list"}>
            {!embedded && <h2 className="quizzes-title">Mes quiz personnalisés</h2>}
            {error && <div className="auth-message error" role="alert">{error}</div>}
            <div className="custom-quiz-categories">
                {QUIZ_CATEGORIES.filter(category => category.key !== "mixte" || groupedQuizzes.get("mixte")?.length).map(category => {
                    const categoryQuizzes = groupedQuizzes.get(category.key) ?? [];
                    return <details className="custom-quiz-category" key={category.key}>
                        <summary>
                            <span className="custom-quiz-category-name"><span aria-hidden="true">{category.icon}</span>{category.label}</span>
                            <span className="custom-quiz-category-count">{categoryQuizzes.length} quiz{categoryQuizzes.length === 1 ? "" : "s"}</span>
                            <i aria-hidden="true" />
                        </summary>
                        {categoryQuizzes.length ? <ul className="quizzes-ul">
                            {categoryQuizzes.map(q => <li key={q.id} className="quizzes-li">
                                <strong className="quizzes-li-title">{q.title}</strong>
                                {q.description && <div className="quizzes-li-desc">{q.description}</div>}
                                <div className="quizzes-li-actions">
                                    <button className="quizzes-li-btn" onClick={() => navigate(`/quiz-type?quiz_id=${encodeURIComponent(String(q.id))}`)}>Jouer</button>
                                    <button className="quizzes-li-edit" onClick={() => navigate(`/edit-quiz/${q.id}`)}>Modifier</button>
                                    <button className="quizzes-li-delete" onClick={() => handleDelete(q.id)}>Supprimer</button>
                                </div>
                            </li>)}
                        </ul> : <p className="custom-quiz-category-empty">Aucun quiz dans cette catégorie.</p>}
                    </details>;
                })}
            </div>
        </div>
    );
}
