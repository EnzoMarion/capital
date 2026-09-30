import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useQuizAttemptSave } from "../api/quizAttempts";
import { CarteFrancePhysique } from "../components/CarteFrancePhysique";
import FranceQuizResult, { type FranceAnswer } from "./FranceQuizResult";
import { FRENCH_MOUNTAIN_RANGES, FRENCH_RIVERS, type FrancePhysicalFeature } from "../utils/francePhysicalGeography";

type FeatureType = "mountains" | "rivers";
type AnswerMode = "input" | "multiple";

function shuffle<T>(items: T[]) {
    const copy = [...items];
    for (let index = copy.length - 1; index > 0; index--) {
        const other = Math.floor(Math.random() * (index + 1));
        [copy[index], copy[other]] = [copy[other], copy[index]];
    }
    return copy;
}

function normalize(value: string) {
    return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[’'`-]/g, " ").replace(/[^\p{L}\p{N}]/gu, "").toLocaleLowerCase("fr-FR");
}

export default function QuizFrancePhysical() {
    const [searchParams] = useSearchParams();
    const featureType: FeatureType = searchParams.get("feature") === "rivers" ? "rivers" : "mountains";
    const mode: AnswerMode = searchParams.get("type") === "input" ? "input" : "multiple";
    const features: FrancePhysicalFeature[] = featureType === "mountains" ? FRENCH_MOUNTAIN_RANGES : FRENCH_RIVERS;
    const [order, setOrder] = useState<number[]>(() => shuffle(features.map((_, index) => index)));
    const [current, setCurrent] = useState(0);
    const [answer, setAnswer] = useState("");
    const [answers, setAnswers] = useState<FranceAnswer[]>([]);
    const [showCorrection, setShowCorrection] = useState(false);
    const [finished, setFinished] = useState(false);
    const inputRef = useRef<HTMLInputElement | null>(null);
    const nextButtonRef = useRef<HTMLButtonElement | null>(null);
    const { user } = useAuth();
    const feature = features[order[current]];
    const latestAnswer = answers[answers.length - 1];
    const options = useMemo(() => {
        if (!feature || mode !== "multiple") return [];
        const distractors = shuffle(features.filter(item => item.id !== feature.id)).slice(0, 3).map(item => item.name);
        return shuffle([feature.name, ...distractors]);
    }, [feature, features, mode]);

    const isMountains = featureType === "mountains";
    const quizTitle = isMountains ? "Chaînes de montagnes françaises" : "Les cinq grands fleuves français";
    const attemptSave = useQuizAttemptSave({
        enabled: finished && answers.length > 0,
        userId: user?.id,
        quizKey: isMountains ? "france_mountains" : "france_rivers",
        score: answers.filter(item => item.isCorrect).length,
        totalQuestions: answers.length,
        scopeKey: isMountains ? "reliefs-francais" : "cinq-grands-fleuves-francais",
        scopeLabel: isMountains ? "Massifs et chaînes de montagnes" : "Les cinq grands fleuves français",
    });

    useEffect(() => {
        if (showCorrection) nextButtonRef.current?.focus();
        else if (mode === "input") inputRef.current?.focus();
    }, [showCorrection, current, mode]);

    function submit(value: string) {
        if (!feature || showCorrection) return;
        const isCorrect = normalize(value) === normalize(feature.name);
        setAnswer(value);
        setAnswers(previous => [...previous, {
            question: isMountains ? "Relief montagneux mis en évidence" : "Grand fleuve mis en évidence",
            userAnswer: value,
            correctAnswer: feature.name,
            isCorrect,
        }]);
        setShowCorrection(true);
    }

    function next() {
        if (current === order.length - 1) {
            setFinished(true);
            return;
        }
        setCurrent(index => index + 1);
        setAnswer("");
        setShowCorrection(false);
    }

    function handleEnter(event: React.KeyboardEvent<HTMLElement>) {
        if (event.key !== "Enter" || event.repeat) return;
        if (showCorrection) {
            event.preventDefault();
            next();
        } else if (mode === "input") {
            event.preventDefault();
            submit(answer);
        }
    }

    function restart() {
        setOrder(shuffle(features.map((_, index) => index)));
        setCurrent(0);
        setAnswer("");
        setAnswers([]);
        setShowCorrection(false);
        setFinished(false);
    }

    if (!feature && !finished) return <p className="empty-state">Aucun élément géographique disponible.</p>;
    if (finished) return <FranceQuizResult title={quizTitle} answers={answers} onRestart={restart}
        saveStatus={attemptSave.status} saveError={attemptSave.errorMessage} onRetrySave={attemptSave.retry} />;

    return <main className="quizfr-wrapper france-game-card france-physical-game" onKeyDown={handleEnter}>
        <p className="section-kicker">France · {isMountains ? "Reliefs et chaînes" : "Fleuves"} · {mode === "multiple" ? "QCM" : "Saisie libre"}</p>
        <h1>{isMountains ? "Quel relief montagneux est mis en évidence ?" : "Quel fleuve est mis en évidence ?"}</h1>
        <div className="france-quiz-layout">
            <div className="france-map-panel france-physical-map-panel"><CarteFrancePhysique type={featureType} highlight={feature.id} /></div>
            <div className="france-answer-panel">
                {mode === "multiple" ? <div className="mc-choices france-mc-choices" aria-label={isMountains ? "Choisis le massif ou la chaîne" : "Choisis le grand fleuve"}>
                    {options.map(option => <button key={option} type="button"
                        className={`mc-btn${showCorrection && option === feature.name ? " correct" : showCorrection && latestAnswer?.userAnswer === option ? " wrong" : ""}`}
                        disabled={showCorrection} onClick={() => submit(option)}>{option}</button>)}
                </div> : <form className="quizfr-form" onSubmit={event => { event.preventDefault(); submit(answer); }}>
                    <label htmlFor="france-physical-answer">{isMountains ? "Quel est le nom de ce relief ?" : "Quel est le nom de ce grand fleuve ?"}</label>
                    <input id="france-physical-answer" ref={inputRef} value={answer} disabled={showCorrection} onChange={event => setAnswer(event.target.value)} autoComplete="off" />
                    {!showCorrection && <button type="submit">Valider</button>}
                </form>}
                {showCorrection && <p className={`quiz-correction ${latestAnswer?.isCorrect ? "correct" : "wrong"}`} role="status">
                    {latestAnswer?.isCorrect ? "Bonne réponse !" : <>La bonne réponse était <strong>{feature.name}</strong>.</>}
                </p>}
                {showCorrection && <button ref={nextButtonRef} type="button" className="primary-btn france-next" onClick={next}>{current === order.length - 1 ? "Voir le résultat" : "Suivant"}</button>}
                <div className="quizfr-progress">Question {current + 1} sur {order.length} · {answers.filter(item => item.isCorrect).length} bonne{answers.filter(item => item.isCorrect).length === 1 ? "" : "s"} réponse{answers.filter(item => item.isCorrect).length === 1 ? "" : "s"}</div>
            </div>
        </div>
    </main>;
}
