import { useEffect, useState, useRef } from "react";
import { fetchCountries } from "../api/countries";
import type { Country } from "../api/countries";
import { useLocation, useNavigate } from "react-router-dom";
import { CarteMonde } from "../components/CarteMonde";

function shuffle(array: Country[]) {
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
        .replace(/['’`\-\. ]/g, "")
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
    const [lastAnswerCorrect, setLastAnswerCorrect] = useState<boolean | null>(null);

    const location = useLocation();
    const navigate = useNavigate();
    const nextButtonRef = useRef<HTMLButtonElement | null>(null);
    const inputRef = useRef<HTMLInputElement | null>(null);

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
        } else {
            inputRef.current?.focus();
        }
    }, [showCorrection, current, finished]);

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

    function handleNext(e?: any) {
        if (e) e.preventDefault();
        // On ne touche pas à answers ici !
        setCurrent(i => i + 1);
        setShowCorrection(false);
        setLastAnswerCorrect(null);
        setUserAnswer(""); // RAZ réponse, input unlocked
        // focus pour nouvelle réponse
        setTimeout(() => {
            inputRef.current?.focus();
        }, 0);
        // Si fini
        if (current + 1 >= countries.length) setFinished(true);
    }

    function handleKeyDown(e: React.KeyboardEvent) {
        // Uniquement sur bouton suivant visible
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
                        <div className="recap-success-msg">Aucune erreur, bravo !</div>
                    )}
                    <div className="recap-actions">
                        <button onClick={() => { setFinished(false); setCurrent(0); setScore(0); setUserAnswer(""); setAnswers([]); setLastAnswerCorrect(null); }}>Recommencer</button>
                        <button onClick={() => navigate("/modes")}>Changer la sélection</button>
                        <a href="/">Accueil</a>
                    </div>
                </div>
            </div>
        );
    }

    const country = countries[current];
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
                    onSubmit={handleSubmit}
                    onKeyDown={handleKeyDown}
                    autoComplete="off"
                >
                    <h2>Devine la capitale de</h2>
                    <div className="quiz-country">{country?.name}</div>
                    <div className="quiz-form" style={{ width: "100%", justifyContent: "center" }}>
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
                        {showCorrection ? (
                            <button
                                ref={nextButtonRef}
                                className="quiz-btn-next"
                                type="button"
                                style={{ marginLeft: 0 }}
                                onClick={handleNext}
                                tabIndex={0}
                            >
                                {current === countries.length - 1 ? "Voir le résultat" : "Suivant"}
                            </button>
                        ) : (
                            <button className="quiz-btn" type="submit" style={{ marginLeft: 0 }}>
                                Valider
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
