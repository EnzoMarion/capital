import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { supabase } from "../api/supabase";
import { CarteFranceDept } from "../components/CarteFranceDept";
import FranceQuizResult, { type FranceAnswer } from "./FranceQuizResult";
import { useAuth } from "../context/AuthContext";
import { useQuizAttemptSave } from "../api/quizAttempts";

type Department = { id: number; code: string; nom: string; region: string | null };
type Region = { name: string; departmentCodes: string[] };
type AnswerMode = "input" | "multiple";

function shuffle<T>(items: T[]) {
    const copy = [...items];
    for (let i = copy.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
}

function normalize(value: string) {
    return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[’'`-]/g, " ").replace(/[^\p{L}\p{N}]/gu, "").toLocaleLowerCase("fr-FR");
}

export default function QuizFranceRegions() {
    const [searchParams] = useSearchParams();
    const mode: AnswerMode = searchParams.get("type") === "input" ? "input" : "multiple";
    const [regions, setRegions] = useState<Region[]>([]);
    const [order, setOrder] = useState<number[]>([]);
    const [current, setCurrent] = useState(0);
    const [answer, setAnswer] = useState("");
    const [answers, setAnswers] = useState<FranceAnswer[]>([]);
    const [showCorrection, setShowCorrection] = useState(false);
    const [finished, setFinished] = useState(false);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const inputRef = useRef<HTMLInputElement | null>(null);
    const nextButtonRef = useRef<HTMLButtonElement | null>(null);
    const { user } = useAuth();

    useEffect(() => {
        let active = true;
        void (async () => {
            const { data, error: queryError } = await supabase.from("fr_departements").select("id, code, nom, region");
            if (!active) return;
            if (queryError) setError("Les données des régions françaises n’ont pas pu être chargées.");
            else {
                const rows = ((data ?? []) as Department[]).filter(item => item.code && item.nom && item.region);
                const byRegion = new Map<string, Set<string>>();
                rows.forEach(item => {
                    const codes = byRegion.get(item.region!) ?? new Set<string>();
                    codes.add(item.code);
                    byRegion.set(item.region!, codes);
                });
                const uniqueRegions = [...byRegion.entries()]
                    .map(([name, codes]) => ({ name, departmentCodes: [...codes] }))
                    .sort((a, b) => a.name.localeCompare(b.name, "fr"));
                if (!uniqueRegions.length) setError("Aucune région n’est renseignée dans les données françaises.");
                setRegions(uniqueRegions);
                setOrder(shuffle(uniqueRegions.map((_, index) => index)));
            }
            setLoading(false);
        })().catch(() => {
            if (active) { setError("Connexion impossible aux données françaises."); setLoading(false); }
        });
        return () => { active = false; };
    }, []);

    const region = regions[order[current]];
    const options = useMemo(() => {
        if (!region || mode !== "multiple") return [];
        return shuffle([region.name, ...shuffle(regions.filter(item => item.name !== region.name).map(item => item.name)).slice(0, 3)]);
    }, [mode, region, regions]);
    const latestAnswer = answers[answers.length - 1];

    useEffect(() => {
        if (showCorrection) nextButtonRef.current?.focus();
        else if (mode === "input") inputRef.current?.focus();
    }, [showCorrection, current, mode]);

    const attemptSave = useQuizAttemptSave({
        enabled: finished && answers.length > 0,
        userId: user?.id,
        quizKey: "france_regions",
        score: answers.filter(item => item.isCorrect).length,
        totalQuestions: answers.length,
        scopeKey: "toutes-les-regions",
        scopeLabel: "Toutes les régions",
    });

    function submit(value: string) {
        if (!region || showCorrection) return;
        const isCorrect = normalize(value) === normalize(region.name);
        setAnswer(value);
        setAnswers(previous => [...previous, {
            question: "Région coloriée sur la carte",
            userAnswer: value,
            correctAnswer: region.name,
            isCorrect,
        }]);
        setShowCorrection(true);
    }

    function next() {
        if (current === order.length - 1) { setFinished(true); return; }
        setCurrent(index => index + 1);
        setAnswer("");
        setShowCorrection(false);
    }

    function restart() {
        setOrder(shuffle(regions.map((_, index) => index)));
        setCurrent(0);
        setAnswer("");
        setAnswers([]);
        setShowCorrection(false);
        setFinished(false);
    }

    if (loading) return <p className="loading-state">Chargement du quiz des régions…</p>;
    if (error) return <p className="empty-state error" role="alert">{error}</p>;
    if (finished) {
        return <FranceQuizResult title="Régions françaises" answers={answers} onRestart={restart} saveStatus={attemptSave.status} saveError={attemptSave.errorMessage} onRetrySave={attemptSave.retry} />;
    }
    if (!region) return <p className="empty-state">Aucune région disponible pour ce quiz.</p>;

    return (
        <main className="quizfr-wrapper france-game-card">
            <p className="section-kicker">France · Régions · {mode === "multiple" ? "QCM" : "Saisie libre"}</p>
            <h1>Quelle région est coloriée ?</h1>
            <div className="france-quiz-layout">
                <div className="france-map-panel"><CarteFranceDept highlight={region.departmentCodes} hideHighlightName /></div>
                <div className="france-answer-panel">
                    {mode === "multiple" ? (
                        <div className="mc-choices france-mc-choices" aria-label="Choisis la région">
                            {options.map(option => <button key={option} type="button" className={`mc-btn${showCorrection && option === region.name ? " correct" : showCorrection && latestAnswer?.userAnswer === option ? " wrong" : ""}`} disabled={showCorrection} onClick={() => submit(option)}>{option}</button>)}
                        </div>
                    ) : (
                        <form className="quizfr-form" onSubmit={event => { event.preventDefault(); submit(answer); }}>
                            <label htmlFor="region-answer">Quel est le nom de cette région ?</label>
                            <input id="region-answer" ref={inputRef} value={answer} disabled={showCorrection} onChange={event => setAnswer(event.target.value)} autoComplete="off" />
                            {!showCorrection && <button type="submit">Valider</button>}
                        </form>
                    )}
                    {showCorrection && <p className={`quiz-correction ${latestAnswer?.isCorrect ? "correct" : "wrong"}`} role="status">{latestAnswer?.isCorrect ? "Bonne réponse !" : <>La bonne réponse était <strong>{region.name}</strong>.</>}</p>}
                    {showCorrection && <button ref={nextButtonRef} className="primary-btn france-next" type="button" onClick={next}>{current === order.length - 1 ? "Voir le résultat" : "Suivant"}</button>}
                    <div className="quizfr-progress">Question {current + 1} sur {order.length} · {answers.filter(item => item.isCorrect).length} bonne{answers.filter(item => item.isCorrect).length > 1 ? "s" : ""} réponse{answers.filter(item => item.isCorrect).length > 1 ? "s" : ""}</div>
                </div>
            </div>
        </main>
    );
}
