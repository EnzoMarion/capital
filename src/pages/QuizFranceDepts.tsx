import { useEffect, useState, useRef } from "react";
import { CarteFranceDept } from "../components/CarteFranceDept";
import { supabase } from "../api/supabase";

type Dep = {
    id: number;
    code: string;
    nom: string;
    cheflieu: string;
    svg_id: string;
    region: string | null;
};

function shuffle<T>(arr: T[]): T[] {
    const out = arr.slice();
    for (let i = out.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [out[i], out[j]] = [out[j], out[i]];
    }
    return out;
}

export default function QuizFranceDepts() {
    const [depts, setDepts] = useState<Dep[]>([]);
    const [order, setOrder] = useState<number[]>([]);
    const [current, setCurrent] = useState(0);
    const [answer, setAnswer] = useState("");
    const [score, setScore] = useState(0);
    const [showCorrection, setShowCorrection] = useState(false);
    const [success, setSuccess] = useState<boolean | null>(null);
    const [done, setDone] = useState(false);

    const inputRef = useRef<HTMLInputElement | null>(null);

    useEffect(() => {
        supabase.from("fr_departements").select("*").then(({ data}) => {
            if (data && data.length) {
                setDepts(data);
                setOrder(shuffle(Array.from({ length: data.length }, (_, i) => i)));
            }
        });
    }, []);

    useEffect(() => {
        if (!showCorrection && inputRef.current) {
            inputRef.current.focus();
        }
    }, [showCorrection, current]);

    if (!depts.length) return <p>Chargement…</p>;

    if (done) {
        return (
            <div className="quizfr-result">
                <h2>Quiz terminé!</h2>
                <div className="quizfr-score">Score: {score} / {order.length}</div>
                <button onClick={() => {
                    setOrder(shuffle(Array.from({ length: depts.length }, (_, i) => i)));
                    setCurrent(0);
                    setScore(0);
                    setShowCorrection(false);
                    setSuccess(null);
                    setDone(false);
                    setAnswer("");
                }}>
                    Recommencer
                </button>
            </div>
        );
    }

    const dept = depts[order[current]];

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (showCorrection) return;
        const correct = answer.trim().toLowerCase() === dept.cheflieu.toLowerCase();
        setSuccess(correct);
        setShowCorrection(true);
        if (correct) setScore(s => s + 1);
    }

    function next() {
        setShowCorrection(false);
        setSuccess(null);
        setAnswer("");
        if (current < order.length - 1) {
            setCurrent(c => c + 1);
        } else {
            setDone(true);
        }
    }

    return (
        <div className="quizfr-wrapper">
            <h2>Quiz : Départements français</h2>
            <CarteFranceDept highlight={dept.code} />
            <div className="quizfr-question">
                <span className="quizfr-frflag">
                    <img
                        src="https://flagcdn.com/fr.svg"
                        alt="France"
                        className="quizfr-frflag-img"
                    />
                </span>
                <b>{dept.nom}</b> <span className="quizfr-deptcode">({dept.code})</span>
            </div>
            <form className="quizfr-form" onSubmit={handleSubmit}>
                <label htmlFor="answer">Quel est le chef-lieu (préfecture)?</label>
                <input
                    id="answer"
                    ref={inputRef}
                    value={answer}
                    onChange={e => setAnswer(e.target.value)}
                    disabled={showCorrection}
                    autoComplete="off"
                />
                {showCorrection && (
                    <div className={success ? "pass" : "fail"}>
                        {success ? "Bravo !" : (
                            <>Raté. Le chef-lieu était: <b>{dept.cheflieu}</b></>
                        )}
                    </div>
                )}
                {!showCorrection && (
                    <button type="submit">Valider</button>
                )}
                {showCorrection && (
                    <button type="button" onClick={next} className="quizfr-next">
                        {current === order.length - 1 ? "Terminer" : "Suivant"}
                    </button>
                )}
            </form>
            <div className="quizfr-progress">{current + 1} / {order.length}</div>
        </div>
    );
}
