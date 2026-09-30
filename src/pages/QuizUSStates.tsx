import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useQuizAttemptSave } from "../api/quizAttempts";
import { CarteEtatsUnis } from "../components/CarteEtatsUnis";
import { USStateFlag } from "../components/TerritoryFlag";
import { US_STATES, capitalAnswerIsCorrect, stateAnswerIsCorrect } from "../utils/usStates";
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

export default function QuizUSStates() {
    const [searchParams] = useSearchParams();
    const requestedMode = searchParams.get("type");
    const capitalMode = searchParams.get("game") === "capitals";
    const flagMode = searchParams.get("game") === "flags";
    const mode: AnswerMode = requestedMode === "input" ? "input" : requestedMode === "map" && !capitalMode && !flagMode ? "map" : "multiple";
    const [order, setOrder] = useState<number[]>(() => shuffle(US_STATES.map((_, index) => index)));
    const [current, setCurrent] = useState(0);
    const [answer, setAnswer] = useState("");
    const [selectedMapFips, setSelectedMapFips] = useState<string | null>(null);
    const [answers, setAnswers] = useState<FranceAnswer[]>([]);
    const [showCorrection, setShowCorrection] = useState(false);
    const [finished, setFinished] = useState(false);
    const inputRef = useRef<HTMLInputElement | null>(null);
    const nextButtonRef = useRef<HTMLButtonElement | null>(null);
    const { user } = useAuth();

    const state = US_STATES[order[current]];
    const latestAnswer = answers[answers.length - 1];
    const options = useMemo(() => {
        if (!state) return [];
        const otherStates = shuffle(US_STATES.filter(item => item.fips !== state.fips)).slice(0, 3);
        return shuffle([state, ...otherStates]);
    }, [state]);
    const answerFor = (item: typeof US_STATES[number]) => capitalMode ? item.capital : item.name;
    const quizKey = flagMode ? "usa_state_flags" : capitalMode ? "usa_state_capitals" : "usa_states";
    const attemptSave = useQuizAttemptSave({
        enabled: finished && answers.length > 0,
        userId: user?.id,
        quizKey,
        score: answers.filter(item => item.isCorrect).length,
        totalQuestions: answers.length,
        scopeKey: flagMode ? "50-drapeaux" : capitalMode ? "50-capitales" : "50-etats",
        scopeLabel: flagMode ? "Les drapeaux des 50 États" : capitalMode ? "Les 50 capitales des États" : "Les 50 États",
    });

    useEffect(() => {
        if (showCorrection) nextButtonRef.current?.focus();
        else if (mode === "input") inputRef.current?.focus();
    }, [showCorrection, current, mode]);

    function submit(value: string) {
        if (!state || showCorrection) return;
        setAnswer(value);
        const correctAnswer = answerFor(state);
        setAnswers(previous => [...previous, {
            question: flagMode ? `Drapeau de l’État ${state.name}` : capitalMode ? `Capitale de l’État « ${state.name} »` : `État ${state.code}`,
            userAnswer: value,
            correctAnswer,
            isCorrect: capitalMode ? capitalAnswerIsCorrect(value, state) : stateAnswerIsCorrect(value, state),
        }]);
        setShowCorrection(true);
    }

    function submitMapAnswer() {
        if (!state || !selectedMapFips || showCorrection) return;
        const selected = US_STATES.find(item => item.fips === selectedMapFips);
        const selectedName = selected?.name ?? selectedMapFips;
        setAnswer(selectedName);
        setAnswers(previous => [...previous, {
            question: `Localiser ${state.name}`,
            userAnswer: selectedName,
            correctAnswer: state.name,
            isCorrect: selectedMapFips === state.fips,
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
        setSelectedMapFips(null);
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
        } else if (mode === "map" && selectedMapFips) {
            const focusedMapFips = (event.target as HTMLElement).dataset.mapCode;
            if (focusedMapFips && focusedMapFips !== selectedMapFips) return;
            event.preventDefault();
            submitMapAnswer();
        }
    }

    function restart() {
        setOrder(shuffle(US_STATES.map((_, index) => index)));
        setCurrent(0);
        setAnswer("");
        setSelectedMapFips(null);
        setAnswers([]);
        setShowCorrection(false);
        setFinished(false);
    }

    if (!state && !finished) return <p className="empty-state">Aucun État disponible.</p>;
    if (finished) return <FranceQuizResult title={flagMode ? "Drapeaux des États américains" : capitalMode ? "Capitales des États-Unis" : "États des États-Unis"} answers={answers} onRestart={restart}
        saveStatus={attemptSave.status} saveError={attemptSave.errorMessage} onRetrySave={attemptSave.retry} />;

    if (mode === "map") {
        const revealCorrect = showCorrection && !latestAnswer?.isCorrect;
        return <main className="map-guess-screen us-map-guess-screen" onKeyDown={handleEnter}>
            <div className="map-guess-heading">
                <p className="section-kicker">États-Unis · Carte muette</p>
                <h1>Localise cet État</h1>
                <p><strong>{state.name}</strong></p>
            </div>
            <div className="map-guess-us-map">
                <CarteEtatsUnis answerHighlight={revealCorrect ? state.fips : undefined}
                    selectedFips={selectedMapFips} onSelect={showCorrection ? undefined : setSelectedMapFips} />
            </div>
            <div className="map-guess-controls">
                <span className="map-guess-picked" aria-live="polite">{selectedMapFips ? "Zone présélectionnée" : "Touchez un État pour le sélectionner"}</span>
                <button type="button" className="map-guess-clear" disabled={!selectedMapFips || showCorrection} onClick={() => setSelectedMapFips(null)}>Effacer</button>
                {!showCorrection
                    ? <button type="button" className="primary-btn" disabled={!selectedMapFips} onClick={submitMapAnswer}>Valider</button>
                    : <button ref={nextButtonRef} type="button" className="primary-btn" onClick={next}>{current === order.length - 1 ? "Voir le résultat" : "Suivant"}</button>}
            </div>
            {showCorrection && <p className={`quiz-correction ${latestAnswer?.isCorrect ? "correct" : "wrong"}`} role="status">
                {latestAnswer?.isCorrect ? "Bonne réponse !" : <>C’était <strong>{state.name}</strong>.</>}
            </p>}
            <div className="map-guess-progress">Question {current + 1} sur {order.length} · {answers.filter(item => item.isCorrect).length} bonnes réponses</div>
        </main>;
    }

    return <main className={`quizfr-wrapper france-game-card us-game-card${flagMode ? " territory-flag-quiz-card" : ""}`} onKeyDown={handleEnter}>
        <p className="section-kicker">États-Unis · {flagMode ? "Drapeaux des États" : capitalMode ? "Capitales des États" : "États"} · {mode === "multiple" ? "QCM" : "Saisie libre"}</p>
        <h1>{flagMode ? "Quel État est représenté par ce drapeau ?" : capitalMode ? "Quelle est la capitale de cet État ?" : "Quel État est mis en évidence ?"}</h1>
        <div className={`france-quiz-layout us-quiz-layout${flagMode ? " territory-flag-quiz-layout" : ""}`}>
            {!flagMode && <div className="france-map-panel"><CarteEtatsUnis highlight={state.fips} /></div>}
            <div className="france-answer-panel">
                {flagMode && <div className="territory-flag-prompt"><USStateFlag key={state.fips} state={state} /></div>}
                {capitalMode && <p className="quizfr-question"><strong>{state.name}</strong></p>}
                {mode === "multiple" ? <div className="mc-choices france-mc-choices" aria-label={capitalMode ? "Choisis la capitale de cet État" : "Choisis l’État"}>
                    {options.map(option => <button key={option.fips} type="button"
                        className={`mc-btn${showCorrection && option.fips === state.fips ? " correct" : showCorrection && latestAnswer?.userAnswer === answerFor(option) ? " wrong" : ""}`}
                        disabled={showCorrection} onClick={() => submit(answerFor(option))}>{answerFor(option)}</button>)}
                </div> : <form className="quizfr-form" onSubmit={event => { event.preventDefault(); submit(answer); }}>
                    <label htmlFor="us-state-answer">{capitalMode ? `Capitale de l’État « ${state.name} »` : "Quel est le nom de cet État ?"}</label>
                    <input id="us-state-answer" ref={inputRef} value={answer} onChange={event => setAnswer(event.target.value)} disabled={showCorrection} autoComplete="off" />
                    {!showCorrection && <button type="submit">Valider</button>}
                </form>}
                {showCorrection && <p className={`quiz-correction ${latestAnswer?.isCorrect ? "correct" : "wrong"}`} role="status">
                    {latestAnswer?.isCorrect ? "Bonne réponse !" : <>La bonne réponse était <strong>{answerFor(state)}</strong>.</>}
                </p>}
                {showCorrection && <button ref={nextButtonRef} type="button" className="primary-btn france-next" onClick={next}>{current === order.length - 1 ? "Voir le résultat" : "Suivant"}</button>}
                <div className="quizfr-progress">Question {current + 1} sur {order.length} · {answers.filter(item => item.isCorrect).length} bonnes réponses</div>
            </div>
        </div>
    </main>;
}
