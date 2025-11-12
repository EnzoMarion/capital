import { useEffect, useState, useRef } from "react";
import { fetchCountries } from "../api/countries";
import type { Country } from "../api/countries";
import { useLocation, useNavigate } from "react-router-dom";
import { CarteMonde } from "../components/CarteMonde";
import MultipleChoice, {type MultipleChoiceOption } from "../components/MultipleChoice";

function shuffle<T>(array: T[]): T[] {
    const arr = array.slice();
    for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
}
function clean(s: string) {
    return s
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/['’`\-\\. ]/g, "")
        .toLowerCase();
}
type Answer = {
    country: Country;
    user: string;
    isCorrect: boolean;
};

export default function Quiz() {
    const [countries, setCountries] = useState<Country[]>([]);
    const [current, setCurrent] = useState(0);
    const [userAnswer, setUserAnswer] = useState("");
    const [score, setScore] = useState(0);
    const [finished, setFinished] = useState(false);
    const [showCorrection, setShowCorrection] = useState(false);
    const [answers, setAnswers] = useState<Answer[]>([]);
    const [lastAnswerCorrect, setLastAnswerCorrect] = useState<boolean>(false);
    const [mcOptions, setMCOptions] = useState<MultipleChoiceOption[]>([]);

    const location = useLocation();
    const navigate = useNavigate();
    const nextButtonRef = useRef<HTMLButtonElement | null>(null);
    const inputRef = useRef<HTMLInputElement | null>(null);

    // Détection du mode depuis l’URL query : ?type=multiple ou ?type=input
    const typeParam = new URLSearchParams(location.search).get("type");
    const multipleChoiceMode = typeParam === "multiple";

    function getMCOptions(correctCapital: string, countries: Country[]): MultipleChoiceOption[] {
        const capitals = countries
            .filter(c => c.capital && c.capital !== correctCapital)
            .map(c => c.capital);
        const randomChoices = shuffle(capitals).slice(0, 3);
        const allChoices = shuffle([
            ...randomChoices,
            correctCapital
        ]);
        return allChoices.map(cap => ({ label: cap, value: cap }));
    }

    // Génère les choix UNIQUEMENT quand une nouvelle question est posée :
    useEffect(() => {
        if (
            multipleChoiceMode &&
            countries.length > 0 &&
            current < countries.length
        ) {
            setMCOptions(getMCOptions(countries[current].capital, countries));
        }
        // PAS de showCorrection/dependance ici
    }, [multipleChoiceMode, countries, current]);

    useEffect(() => {
        const query = new URLSearchParams(location.search);
        const continentsParam = query.get("continents");
        const selectedContinents = continentsParam
            ? continentsParam.split(",")
            : [];
        const showTerritories = query.get("territories") === "1";
        fetchCountries(selectedContinents.length ? selectedContinents : undefined)
            .then(data => {
                const filtered = data.filter(c =>
                    !!c.capital && !!c.name && !!c.code &&
                    (showTerritories || !c.parent_code)
                );
                setCountries(shuffle(filtered));
            })
            .catch(e => {
                console.error(e);
                setCountries([]);
            });
    }, [location.search]);

    useEffect(() => {
        if (showCorrection) {
            nextButtonRef.current?.focus();
        } else if (!multipleChoiceMode) {
            inputRef.current?.focus();
        }
    }, [showCorrection, current, finished, multipleChoiceMode]);

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (showCorrection) return;
        const correct = clean(countries[current]?.capital || "") === clean(userAnswer);
        setLastAnswerCorrect(correct);
        setAnswers(ans => [
            ...ans,
            {
                country: countries[current],
                user: userAnswer,
                isCorrect: correct
            }
        ]);
        if (correct) setScore(s => s + 1);
        setShowCorrection(true);
    }

    function handleNext() {
        setShowCorrection(false);
        setLastAnswerCorrect(false);
        setUserAnswer("");
        if (current < countries.length - 1) {
            setCurrent(i => i + 1);
        } else {
            setFinished(true);
        }
        setTimeout(() => {
            if (!multipleChoiceMode) inputRef.current?.focus();
        }, 0);
    }

    function handleKeyDown(e: React.KeyboardEvent) {
        if (showCorrection && (e.key === "Enter" || e.key === " ")) {
            e.preventDefault();
            handleNext();
        }
    }

    if (countries.length === 0) return <p>Chargement…</p>;

    if (finished) {
        const wrongAnswers = answers.filter(a => !a.isCorrect);
        const percent = Math.round((score / countries.length) * 100);
        return (
            <div className="quiz-result-wrapper">
                <div className="recap-card">
                    <h2>Quiz terminé !</h2>
                    <div className="recap-score">{percent} % de réussite</div>
                    <div className="recap-progress">
                        <span>{score} bonnes réponses</span>
                        <span> / </span>
                        <span>{countries.length} questions</span>
                    </div>
                    {wrongAnswers.length > 0 ? (
                        <div>
                            <h3>Récapitulatif des erreurs :</h3>
                            <table className="recap-table">
                                <thead>
                                <tr>
                                    <th>Pays</th>
                                    <th>Ta réponse</th>
                                    <th>Bonne réponse</th>
                                </tr>
                                </thead>
                                <tbody>
                                {wrongAnswers.map((a, idx) => (
                                    <tr key={idx}>
                                        <td>{a.country.name}</td>
                                        <td style={{ color: "#ff5555" }}>{a.user || <i>(vide)</i>}</td>
                                        <td style={{ fontWeight: 600 }}>{a.country.capital}</td>
                                    </tr>
                                ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <div className="recap-success-msg">Aucune erreur, bravo!</div>
                    )}
                    <div className="recap-actions">
                        <button onClick={() => { setFinished(false); setCurrent(0); setScore(0); setUserAnswer(""); setAnswers([]); setLastAnswerCorrect(false); }}>Recommencer</button>
                        <button onClick={() => navigate("/modes")}>Changer la sélection</button>
                        <a href="/">Accueil</a>
                    </div>
                </div>
            </div>
        );
    }

    const country = countries[current];
    const showAnswer =
        showCorrection && answers.length > 0 ? answers[answers.length - 1].user : undefined;

    return (
        <div className="quiz-main-wrapper">
            <div className="quiz-content-inner">
                {country?.code && (
                    <div className="quiz-map-wrapper">
                        <CarteMonde codeISO={country.code} />
                    </div>
                )}
                <form
                    className="quiz-card"
                    onSubmit={multipleChoiceMode ? e => e.preventDefault() : handleSubmit}
                    onKeyDown={handleKeyDown}
                    autoComplete="off"
                >
                    <h2>Devine la capitale de</h2>
                    <div className="quiz-country">{country?.name}</div>
                    <div className="quiz-form" style={{ width: "100%", justifyContent: "center" }}>
                        {multipleChoiceMode ? (
                            <MultipleChoice
                                options={mcOptions}
                                onSelect={option => {
                                    if (showCorrection) return; // NE MODIFIE PAS mcOptions en mode correction
                                    const correct = clean(option.value) === clean(country.capital || "");
                                    setLastAnswerCorrect(correct);
                                    setAnswers(ans => [
                                        ...ans,
                                        {
                                            country: country,
                                            user: option.value,
                                            isCorrect: correct,
                                        }
                                    ]);
                                    if (correct) setScore(s => s + 1);
                                    setShowCorrection(true);
                                }}
                                disabled={showCorrection && lastAnswerCorrect}
                                selected={showAnswer}
                                showCorrection={showCorrection}
                                correct={country.capital}
                            />
                        ) : (
                            <>
                                <input
                                    ref={inputRef}
                                    type="text"
                                    value={userAnswer}
                                    onChange={e => setUserAnswer(e.target.value)}
                                    autoFocus
                                    className="quiz-input"
                                    placeholder="Écris la capitale"
                                    disabled={showCorrection}
                                />
                                {showCorrection ? null : (
                                    <button className="quiz-btn" type="submit" style={{ marginLeft: 0 }}>
                                        Valider
                                    </button>
                                )}
                            </>
                        )}
                        {showCorrection && (
                            <button
                                ref={nextButtonRef}
                                className="quiz-btn-next"
                                type="button"
                                style={{ marginLeft: 0, marginTop: multipleChoiceMode ? "1.4em" : "0" }}
                                onClick={handleNext}
                                tabIndex={0}
                            >
                                {current === countries.length - 1 ? "Voir le résultat" : "Suivant"}
                            </button>
                        )}
                    </div>
                    <div className="quiz-index">{current + 1} / {countries.length}</div>
                    {showCorrection && (
                        <div className={`quiz-correction ${lastAnswerCorrect ? "correct" : "wrong"}`}>
                            {lastAnswerCorrect
                                ? "Bonne réponse ! 👏"
                                : <>Mauvaise réponse.<br />La bonne réponse était <b>{country.capital}</b></>
                            }
                        </div>
                    )}
                </form>
            </div>
        </div>
    );
}
