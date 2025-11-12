import { useEffect, useState, useRef } from "react";
import { fetchCountries } from "../api/countries";
import type { Country } from "../api/countries";
import { useLocation, useNavigate } from "react-router-dom";
import { CarteMonde } from "../components/CarteMonde";
import MultipleChoice, { type MultipleChoiceOption } from "../components/MultipleChoice";
import { capitalVariantsMap } from "../utils/capitalVariants";

function shuffle<T>(array: T[]): T[] {
    const arr = array.slice();
    for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
}
function uniq(arr: string[]): string[] {
    return [...new Set(arr)];
}
function clean(s: string) {
    return s
        .normalize("NFD")
        .replace(/[^0-9a-zA-Z]/g, "")
        .toLowerCase();
}
function answerOk(userInput: string, country: Country) {
    const accepted = [country.capital, ...(country.capital_variants ?? [])]
        .filter(Boolean)
        .map(clean);
    return accepted.includes(clean(userInput));
}
function answerYearOk(userInput: string, country: Country) {
    if (!country.ue_date) return false;
    const expect = country.ue_date.slice(0, 4);
    return clean(userInput) === clean(expect);
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

    // Récupère la config depuis l'URL
    const query = new URLSearchParams(location.search);
    const typeParam = query.get("type");
    const multipleChoiceMode = typeParam === "multiple";
    const euMode = query.get("eu") === "1";
    const onlyTerritories = query.get("only_territories") === "1";
    const showTerritories = query.get("territories") === "1";
    const numQuestions = Number(query.get("num") ?? 99999);
    const continentsParam = query.get("continents");
    const selectedContinents = continentsParam ? continentsParam.split(",") : [];

    useEffect(() => {
        fetchCountries(selectedContinents.length ? selectedContinents : undefined)
            .then(data => {
                // Injecte capital_variants avant le filtrage !
                for(const country of data) {
                    const v = capitalVariantsMap[country.code];
                    if(v) country.capital_variants = v;
                }
                let filtered = euMode
                    ? data.filter(c => c.ue_date && c.ue_date.match(/^\d{4}/))
                    : data.filter(c => !!c.capital && !!c.name && !!c.code);
                if (!euMode) {
                    // Filtre classique territoires
                    if (onlyTerritories) {
                        filtered = filtered.filter(c => c.status === "part_of_country");
                    } else if (!showTerritories) {
                        filtered = filtered.filter(c => !c.parent_code);
                    }
                }
                filtered = shuffle(filtered);
                if (numQuestions !== 99999 && numQuestions < filtered.length) {
                    filtered = filtered.slice(0, numQuestions);
                }
                setCountries(filtered);
            })
            .catch(e => {
                console.error(e);
                setCountries([]);
            });
    }, [location.search]);

    // QCM options : 4 uniques, dont la bonne réponse
    function getMCOptions(correct: string, allVals: string[]): MultipleChoiceOption[] {
        const uniqueVals = uniq(allVals.filter(v => v && v !== correct));
        const randomWrong = shuffle(uniqueVals).slice(0, 3);
        const choices = shuffle([correct, ...randomWrong]);
        return choices.map(y => ({ label: y, value: y }));
    }
    useEffect(() => {
        if (!countries.length || current >= countries.length) return;
        if (multipleChoiceMode) {
            if (euMode) {
                const year = countries[current]?.ue_date?.slice(0,4);
                const allYears = uniq(countries.map(c => c.ue_date?.slice(0,4)).filter(Boolean));
                setMCOptions(getMCOptions(year, allYears));
            } else {
                const correctCapital = countries[current]?.capital;
                const allCapitals = uniq(countries.map(c => c.capital).filter(Boolean));
                setMCOptions(getMCOptions(correctCapital, allCapitals));
            }
        }
    }, [multipleChoiceMode, euMode, countries, current]);

    useEffect(() => {
        if (showCorrection) {
            nextButtonRef.current?.focus();
        } else {
            inputRef.current?.focus();
        }
    }, [showCorrection, current, finished]);

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (showCorrection) return;
        let correct = false;
        if (euMode) {
            correct = answerYearOk(userAnswer, countries[current]);
        } else {
            correct = answerOk(userAnswer, countries[current]);
        }
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
            inputRef.current?.focus();
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
                                    <th>{euMode ? "Année" : "Bonne réponse"}</th>
                                </tr>
                                </thead>
                                <tbody>
                                {wrongAnswers.map((a, idx) => (
                                    <tr key={idx}>
                                        <td>{a.country.name}</td>
                                        <td style={{ color: "#ff5555" }}>{a.user || <i>(vide)</i>}</td>
                                        <td style={{ fontWeight: 600 }}>{euMode ? (a.country.ue_date?.slice(0,4)||"?") : a.country.capital}</td>
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
                        <button onClick={() => navigate(euMode ? "/quiz-eu-type" : "/modes")}>Changer le mode</button>
                        <a href="/">Accueil</a>
                    </div>
                </div>
            </div>
        );
    }

    const country = countries[current];
    const showAnswer = showCorrection && answers.length > 0 ? answers[answers.length - 1].user : undefined;

    return (
        <div className="quiz-main-wrapper">
            <div className="quiz-content-inner">
                {/* Affiche la carte du pays SAUF en mode Année UE */}
                {country?.code && !euMode && (
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
                    <h2>{euMode ? "Année d'adhésion à l'Union Européenne :" : "Devine la capitale de"}</h2>
                    <div className="quiz-country">{country?.name}</div>
                    <div className="quiz-form" style={{ width: "100%", justifyContent: "center" }}>
                        {euMode ? (
                            multipleChoiceMode ? (
                                <MultipleChoice
                                    options={mcOptions}
                                    onSelect={option => {
                                        if (showCorrection) return;
                                        const correct = country.ue_date && clean(option.value) === clean(country.ue_date.slice(0,4));
                                        setLastAnswerCorrect(!!correct);
                                        setAnswers(ans => [
                                            ...ans,
                                            {
                                                country: country,
                                                user: option.value,
                                                isCorrect: !!correct,
                                            }
                                        ]);
                                        if (correct) setScore(s => s + 1);
                                        setShowCorrection(true);
                                    }}
                                    disabled={showCorrection && lastAnswerCorrect}
                                    selected={showAnswer}
                                    showCorrection={showCorrection}
                                    correct={country.ue_date ? country.ue_date.slice(0,4) : undefined}
                                />
                            ) : (
                                <>
                                    <input
                                        ref={inputRef}
                                        type="number"
                                        inputMode="numeric"
                                        value={userAnswer}
                                        onChange={e => setUserAnswer(e.target.value)}
                                        autoFocus
                                        className="quiz-input"
                                        placeholder="Écris l'année (ex : 2004)"
                                        disabled={showCorrection}
                                        min={1950}
                                    />
                                    {showCorrection ? null : (
                                        <button className="quiz-btn" type="submit" style={{ marginLeft: 0 }}>
                                            Valider
                                        </button>
                                    )}
                                </>
                            )
                        ) : (
                            multipleChoiceMode ? (
                                <MultipleChoice
                                    options={mcOptions}
                                    onSelect={option => {
                                        if (showCorrection) return;
                                        const correct = answerOk(option.value, country);
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
                            )
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
                                : (euMode
                                        ? <>Mauvaise réponse.<br />La bonne année était <b>{country.ue_date ? country.ue_date.slice(0,4) : "?"}</b></>
                                        : <>Mauvaise réponse.<br />La bonne réponse était <b>{country.capital}</b></>
                                )}
                        </div>
                    )}
                </form>
            </div>
        </div>
    );
}
