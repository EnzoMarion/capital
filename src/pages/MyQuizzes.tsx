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

    if (!user) return <p>Connecte-toi !</p>;
    if (!quizzes.length) return <p>Tu n’as créé aucun quiz personnalisé.</p>;

    return (
        <div className="quiz-card input-mode" style={{maxWidth:580,margin:"auto"}}>
            <h2>Mes quiz personnalisés</h2>
            <ul style={{display:'flex',flexDirection:'column',gap:30}}>
                {quizzes.map(q => (
                    <li key={q.id} style={{borderBottom:'1px solid #444',paddingBottom:10}}>
                        <strong>{q.title}</strong>
                        <div style={{color:'#ddd',marginBottom:8}}>{q.description}</div>
                        <button style={{marginRight:14}} onClick={()=>navigate(`/quiz?quiz_id=${q.id}`)}>Lancer ce quiz</button>
                    </li>
                ))}
            </ul>
        </div>
    );
}
