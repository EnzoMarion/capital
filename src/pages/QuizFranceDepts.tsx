import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { CarteFranceDept } from "../components/CarteFranceDept";
import { supabase } from "../api/supabase";
import FranceQuizResult, { type FranceAnswer } from "./FranceQuizResult";
import { useAuth } from "../context/useAuth";
import { useQuizAttemptSave } from "../api/quizAttempts";
import { normalizeDepartmentCode } from "../utils/franceGeography";

type Department = { id: number; code: string; nom: string; cheflieu: string; region: string | null };
type AnswerMode = "input" | "multiple" | "map";

function shuffle<T>(items: T[]): T[] {
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

export default function QuizFranceDepts() {
    const [searchParams] = useSearchParams();
    const mode: AnswerMode = searchParams.get("type") === "input" ? "input" : searchParams.get("type") === "map" ? "map" : "multiple";
    const identifyDepartment = searchParams.get("game") === "department";
    const answerLabel = identifyDepartment ? "nom" : "cheflieu";
    const [departments, setDepartments] = useState<Department[]>([]);
    const [order, setOrder] = useState<number[]>([]);
    const [current, setCurrent] = useState(0);
    const [answer, setAnswer] = useState("");
    const [selectedMapCode, setSelectedMapCode] = useState<string | null>(null);
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
            const { data, error: queryError } = await supabase.from("fr_departements").select("id, code, nom, cheflieu, region");
            if (!active) return;
            if (queryError) setError("Les données des départements français n’ont pas pu être chargées.");
            else if (!data?.length) setError("Aucun département n’est disponible.");
            else {
                const rows = data as Department[];
                setDepartments(rows);
                setOrder(shuffle(rows.map((_, index) => index)));
            }
            setLoading(false);
        })().catch(() => {
            if (active) { setError("Connexion impossible aux données françaises."); setLoading(false); }
        });
        return () => { active = false; };
    }, []);

    const department = departments[order[current]];
    const options = useMemo(() => {
        if (!department || mode !== "multiple") return [];
        const correctAnswer = department[answerLabel];
        const wrong = shuffle([...new Set(departments.map(item => item[answerLabel]).filter(name => name && name !== correctAnswer))]).slice(0, 3);
        return shuffle([correctAnswer, ...wrong]);
    }, [answerLabel, department, departments, mode]);
    const latestAnswer = answers[answers.length - 1];

    useEffect(() => {
        if (showCorrection) nextButtonRef.current?.focus();
        else if (mode === "input") inputRef.current?.focus();
    }, [showCorrection, current, mode]);

    const attemptSave = useQuizAttemptSave({
        enabled: finished && answers.length > 0,
        userId: user?.id,
        quizKey: identifyDepartment ? "france_identification" : "france_departements",
        score: answers.filter(item => item.isCorrect).length,
        totalQuestions: answers.length,
        scopeKey: identifyDepartment ? "identification-departements" : "prefectures-departements",
        scopeLabel: identifyDepartment ? "Identification des départements" : "Préfectures des départements",
    });

    function submit(value: string) {
        if (!department || showCorrection) return;
        const correctAnswer = department[answerLabel];
        const isCorrect = normalize(value) === normalize(correctAnswer);
        setAnswer(value);
        setAnswers(previous => [...previous, {
            question: identifyDepartment ? `Département ${department.code}` : `${department.nom} (${department.code})`,
            userAnswer: value,
            correctAnswer,
            isCorrect,
        }]);
        setShowCorrection(true);
    }

    function submitMapAnswer() {
        if (!department || !selectedMapCode || showCorrection) return;
        const chosen = departments.find(item => normalizeDepartmentCode(item.code) === normalizeDepartmentCode(selectedMapCode));
        const isCorrect = normalizeDepartmentCode(selectedMapCode) === normalizeDepartmentCode(department.code);
        setAnswer(chosen?.nom ?? selectedMapCode);
        setAnswers(previous => [...previous, { question: `Localiser ${department.nom} (${department.code})`, userAnswer: chosen?.nom ?? selectedMapCode, correctAnswer: department.nom, isCorrect }]);
        setShowCorrection(true);
    }

    function handleEnterKeyDown(event: React.KeyboardEvent<HTMLElement>) {
        if (event.key !== "Enter" || event.repeat) return;
        if (showCorrection) {
            event.preventDefault();
            next();
        } else if (mode === "input") {
            event.preventDefault();
            submit(answer);
        } else if (mode === "map" && selectedMapCode) {
            const focusedMapCode = (event.target as HTMLElement).dataset.mapCode;
            if (focusedMapCode && normalizeDepartmentCode(focusedMapCode) !== normalizeDepartmentCode(selectedMapCode)) return;
            event.preventDefault();
            submitMapAnswer();
        }
    }

    function next() {
        if (current === order.length - 1) { setFinished(true); return; }
        setCurrent(index => index + 1);
        setAnswer("");
        setSelectedMapCode(null);
        setShowCorrection(false);
    }

    function restart() {
        setOrder(shuffle(departments.map((_, index) => index)));
        setCurrent(0);
        setAnswer("");
        setSelectedMapCode(null);
        setAnswers([]);
        setShowCorrection(false);
        setFinished(false);
    }

    if (loading) return <p className="loading-state">Chargement des départements…</p>;
    if (error) return <p className="empty-state error" role="alert">{error}</p>;
    if (!departments.length) return <p className="empty-state">Aucun département disponible.</p>;
    if (finished) {
        return <FranceQuizResult title={identifyDepartment ? "Identification des départements" : "Préfectures françaises"} answers={answers} onRestart={restart} saveStatus={attemptSave.status} saveError={attemptSave.errorMessage} onRetrySave={attemptSave.retry} />;
    }
    if (!department) return <p className="empty-state">Aucun département disponible.</p>;

    if (mode === "map") {
        const targetName = department.nom;
        const latestMapAnswer = answers[answers.length - 1];
        const revealCorrect = showCorrection && !latestMapAnswer?.isCorrect;
        return <main className="map-guess-screen france-map-guess-screen" onKeyDown={handleEnterKeyDown}>
            <div className="map-guess-heading"><p className="section-kicker">France · Carte muette · {identifyDepartment ? "Départements" : "Préfectures"}</p><h1>{identifyDepartment ? "Localise ce département" : "Dans quel département se trouve cette préfecture ?"}</h1><p><strong>{identifyDepartment ? targetName : department.cheflieu}</strong></p></div>
            <div className="map-guess-france-map"><CarteFranceDept answerHighlight={revealCorrect ? department.code : undefined} hideHighlightName selectedCode={selectedMapCode} onSelect={showCorrection ? undefined : setSelectedMapCode} /></div>
            <div className="map-guess-controls"><span className="map-guess-picked" aria-live="polite">{selectedMapCode ? "Zone présélectionnée" : "Touchez une zone pour la sélectionner"}</span><button type="button" className="map-guess-clear" disabled={!selectedMapCode || showCorrection} onClick={() => setSelectedMapCode(null)}>Effacer</button>
                {!showCorrection ? <button type="button" className="primary-btn" disabled={!selectedMapCode} onClick={submitMapAnswer}>Valider</button> : <button ref={nextButtonRef} type="button" className="primary-btn" onClick={next}>{current === order.length - 1 ? "Voir le résultat" : "Suivant"}</button>}
            </div>
            {showCorrection && <p className={`quiz-correction ${latestMapAnswer?.isCorrect ? "correct" : "wrong"}`} role="status">{latestMapAnswer?.isCorrect ? "Bonne réponse !" : <>C’était <strong>{targetName}</strong>.</>}</p>}
            <div className="map-guess-progress">Question {current + 1} sur {order.length} · {answers.filter(item => item.isCorrect).length} bonne{answers.filter(item => item.isCorrect).length === 1 ? "" : "s"} réponse{answers.filter(item => item.isCorrect).length === 1 ? "" : "s"}</div>
        </main>;
    }

    return (
        <main className="quizfr-wrapper france-game-card" onKeyDown={handleEnterKeyDown}>
            <p className="section-kicker">France · {identifyDepartment ? "Départements" : "Préfectures"} · {mode === "multiple" ? "QCM" : "Saisie libre"}</p>
            <h1>{identifyDepartment ? "Quel département est colorié ?" : "Retrouve la préfecture"}</h1>
            <div className="france-quiz-layout">
                <div className="france-map-panel"><CarteFranceDept highlight={department.code} hideHighlightName={identifyDepartment} /></div>
                <div className="france-answer-panel">
                    {!identifyDepartment && <p className="quizfr-question"><span className="quizfr-tricolor" role="img" aria-label="Drapeau français"><i /><i /><i /></span><strong>{department.nom}</strong><span className="quizfr-deptcode">({department.code})</span></p>}
                    {mode === "multiple" ? (
                        <div className="mc-choices france-mc-choices" aria-label={identifyDepartment ? "Choisis le département" : "Choisis la préfecture"}>
                            {options.map(option => <button key={option} type="button" className={`mc-btn${showCorrection && option === department[answerLabel] ? " correct" : showCorrection && latestAnswer?.userAnswer === option ? " wrong" : ""}`} disabled={showCorrection} onClick={() => submit(option)}>{option}</button>)}
                        </div>
                    ) : (
                        <form className="quizfr-form" onSubmit={event => { event.preventDefault(); submit(answer); }}>
                            <label htmlFor="answer">{identifyDepartment ? "Quel est le nom de ce département ?" : "Quel est le chef-lieu (préfecture) ?"}</label>
                            <input id="answer" ref={inputRef} value={answer} onChange={event => setAnswer(event.target.value)} disabled={showCorrection} autoComplete="off" />
                            {!showCorrection && <button type="submit">Valider</button>}
                        </form>
                    )}
                    {showCorrection && <p className={`quiz-correction ${latestAnswer?.isCorrect ? "correct" : "wrong"}`} role="status">{latestAnswer?.isCorrect ? "Bonne réponse !" : <>La bonne réponse était <strong>{department[answerLabel]}</strong>.</>}</p>}
                    {showCorrection && <button ref={nextButtonRef} type="button" className="primary-btn france-next" onClick={next}>{current === order.length - 1 ? "Voir le résultat" : "Suivant"}</button>}
                    <div className="quizfr-progress">Question {current + 1} sur {order.length} · {answers.filter(item => item.isCorrect).length} bonne{answers.filter(item => item.isCorrect).length > 1 ? "s" : ""} réponse{answers.filter(item => item.isCorrect).length > 1 ? "s" : ""}</div>
                </div>
            </div>
        </main>
    );
}
