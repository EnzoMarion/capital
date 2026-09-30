import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useQuizAttemptSave } from "../api/quizAttempts";
import { CarteSuisseCantons } from "../components/CarteSuisseCantons";
import { SWISS_CANTONS, cantonAnswerIsCorrect } from "../utils/swissCantons";
import FranceQuizResult, { type FranceAnswer } from "./FranceQuizResult";

type AnswerMode = "input" | "multiple" | "map";

function shuffle<T>(items: T[]): T[] {
    const copy = [...items];
    for (let index = copy.length - 1; index > 0; index--) {
        const other = Math.floor(Math.random() * (index + 1));
        [copy[index], copy[other]] = [copy[other], copy[index]];
    }
    return copy;
}

export default function QuizSwissCantons() {
    const [searchParams] = useSearchParams();
    const requestedMode = searchParams.get("type");
    const mode: AnswerMode = requestedMode === "input" || requestedMode === "map" ? requestedMode : "multiple";
    const [order, setOrder] = useState<number[]>(() => shuffle(SWISS_CANTONS.map((_, index) => index)));
    const [current, setCurrent] = useState(0);
    const [answer, setAnswer] = useState("");
    const [selectedMapCode, setSelectedMapCode] = useState<string | null>(null);
    const [answers, setAnswers] = useState<FranceAnswer[]>([]);
    const [showCorrection, setShowCorrection] = useState(false);
    const [finished, setFinished] = useState(false);
    const inputRef = useRef<HTMLInputElement | null>(null);
    const nextButtonRef = useRef<HTMLButtonElement | null>(null);
    const { user } = useAuth();

    const canton = SWISS_CANTONS[order[current]];
    const latestAnswer = answers[answers.length - 1];
    const options = useMemo(() => {
        if (!canton) return [];
        const others = shuffle(SWISS_CANTONS.filter(item => item.code !== canton.code)).slice(0, 3);
        return shuffle([canton, ...others]);
    }, [canton]);
    const attemptSave = useQuizAttemptSave({
        enabled: finished && answers.length > 0,
        userId: user?.id,
        quizKey: "switzerland_cantons",
        score: answers.filter(item => item.isCorrect).length,
        totalQuestions: answers.length,
        scopeKey: "26-cantons",
        scopeLabel: "Les 26 cantons",
    });

    useEffect(() => {
        if (showCorrection) nextButtonRef.current?.focus();
        else if (mode === "input") inputRef.current?.focus();
    }, [showCorrection, current, mode]);

    function submit(value: string) {
        if (!canton || showCorrection) return;
        setAnswer(value);
        setAnswers(previous => [...previous, {
            question: `Canton ${canton.code}`,
            userAnswer: value,
            correctAnswer: canton.name,
            isCorrect: cantonAnswerIsCorrect(value, canton),
        }]);
        setShowCorrection(true);
    }

    function submitMapAnswer() {
        if (!canton || !selectedMapCode || showCorrection) return;
        const selected = SWISS_CANTONS.find(item => item.code === selectedMapCode);
        setAnswer(selected?.name ?? selectedMapCode);
        setAnswers(previous => [...previous, {
            question: `Localiser ${canton.name}`,
            userAnswer: selected?.name ?? selectedMapCode,
            correctAnswer: canton.name,
            isCorrect: selectedMapCode === canton.code,
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
        setSelectedMapCode(null);
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
        } else if (mode === "map" && selectedMapCode) {
            const focusedMapCode = (event.target as HTMLElement).dataset.mapCode;
            if (focusedMapCode && focusedMapCode !== selectedMapCode) return;
            event.preventDefault();
            submitMapAnswer();
        }
    }

    function restart() {
        setOrder(shuffle(SWISS_CANTONS.map((_, index) => index)));
        setCurrent(0);
        setAnswer("");
        setSelectedMapCode(null);
        setAnswers([]);
        setShowCorrection(false);
        setFinished(false);
    }

    if (!canton && !finished) return <p className="empty-state">Aucun canton disponible.</p>;
    if (finished) return <FranceQuizResult title="Cantons suisses" answers={answers} onRestart={restart}
        saveStatus={attemptSave.status} saveError={attemptSave.errorMessage} onRetrySave={attemptSave.retry} />;

    if (mode === "map") {
        const revealCorrect = showCorrection && !latestAnswer?.isCorrect;
        return <main className="map-guess-screen swiss-map-guess-screen" onKeyDown={handleEnter}>
            <div className="map-guess-heading">
                <p className="section-kicker">Suisse · Carte muette</p>
                <h1>Localise ce canton</h1>
                <p><strong>{canton.name}</strong></p>
            </div>
            <div className="map-guess-swiss-map">
                <CarteSuisseCantons answerHighlight={revealCorrect ? canton.code : undefined}
                    selectedCode={selectedMapCode} onSelect={showCorrection ? undefined : setSelectedMapCode} />
            </div>
            <div className="map-guess-controls">
                <span className="map-guess-picked" aria-live="polite">{selectedMapCode ? "Zone présélectionnée" : "Touchez un canton pour le sélectionner"}</span>
                <button type="button" className="map-guess-clear" disabled={!selectedMapCode || showCorrection} onClick={() => setSelectedMapCode(null)}>Effacer</button>
                {!showCorrection
                    ? <button type="button" className="primary-btn" disabled={!selectedMapCode} onClick={submitMapAnswer}>Valider</button>
                    : <button ref={nextButtonRef} type="button" className="primary-btn" onClick={next}>{current === order.length - 1 ? "Voir le résultat" : "Suivant"}</button>}
            </div>
            {showCorrection && <p className={`quiz-correction ${latestAnswer?.isCorrect ? "correct" : "wrong"}`} role="status">
                {latestAnswer?.isCorrect ? "Bonne réponse !" : <>C’était <strong>{canton.name}</strong>.</>}
            </p>}
            <div className="map-guess-progress">Question {current + 1} sur {order.length} · {answers.filter(item => item.isCorrect).length} bonne{answers.filter(item => item.isCorrect) .length === 1 ? "" : "s"} réponse{answers.filter(item => item.isCorrect).length === 1 ? "" : "s"}</div>
        </main>;
    }

    return <main className="quizfr-wrapper france-game-card swiss-game-card" onKeyDown={handleEnter}>
        <p className="section-kicker">Suisse · Cantons · {mode === "multiple" ? "QCM" : "Saisie libre"}</p>
        <h1>Quel canton est mis en évidence ?</h1>
        <div className="france-quiz-layout swiss-quiz-layout">
            <div className="france-map-panel"><CarteSuisseCantons highlight={canton.code} /></div>
            <div className="france-answer-panel">
                {mode === "multiple" ? <div className="mc-choices france-mc-choices" aria-label="Choisis le canton">
                    {options.map(option => <button key={option.code} type="button"
                        className={`mc-btn${showCorrection && option.code === canton.code ? " correct" : showCorrection && latestAnswer?.userAnswer === option.name ? " wrong" : ""}`}
                        disabled={showCorrection} onClick={() => submit(option.name)}>{option.name}</button>)}
                </div> : <form className="quizfr-form" onSubmit={event => { event.preventDefault(); submit(answer); }}>
                    <label htmlFor="swiss-canton-answer">Quel est le nom de ce canton ?</label>
                    <input id="swiss-canton-answer" ref={inputRef} value={answer} onChange={event => setAnswer(event.target.value)} disabled={showCorrection} autoComplete="off" />
                    {!showCorrection && <button type="submit">Valider</button>}
                </form>}
                {showCorrection && <p className={`quiz-correction ${latestAnswer?.isCorrect ? "correct" : "wrong"}`} role="status">
                    {latestAnswer?.isCorrect ? "Bonne réponse !" : <>La bonne réponse était <strong>{canton.name}</strong>.</>}
                </p>}
                {showCorrection && <button ref={nextButtonRef} type="button" className="primary-btn france-next" onClick={next}>{current === order.length - 1 ? "Voir le résultat" : "Suivant"}</button>}
                <div className="quizfr-progress">Question {current + 1} sur {order.length} · {answers.filter(item => item.isCorrect).length} bonnes réponses</div>
            </div>
        </div>
    </main>;
}
