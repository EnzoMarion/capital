import { useEffect, useState, useRef } from "react";
import { fetchCountries } from "../api/countries";
import type { Country } from "../api/countries";
import { useLocation, useNavigate } from "react-router-dom";
import { CarteMonde } from "../components/CarteMonde";
import MultipleChoice, { type MultipleChoiceOption } from "../components/MultipleChoice";
import { capitalVariantsMap } from "../utils/capitalVariants";
import { isoNumToAlpha2 } from "../utils/isoNumToAlpha2";
import { supabase } from "../api/supabase";

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
function answerCountryOk(userInput: string, country: Country) {
    return clean(userInput) === clean(country.name);
}
type Answer = {
    country: Country;
    user: string;
    isCorrect: boolean;
};

type CustomQuestion = {
    country_code: string;
    country_name: string;
    question_type: "capitale" | "drapeau" | "annee_eu";
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
    const [quizLoaded, setQuizLoaded] = useState(false);
    const [customQuestions, setCustomQuestions] = useState<CustomQuestion[] | null>(null);
    const [allCountries, setAllCountries] = useState<Country[]>([]);

    const location = useLocation();
    useNavigate();
    const nextButtonRef = useRef<HTMLButtonElement | null>(null);
    const inputRef = useRef<HTMLInputElement | null>(null);

    const query = new URLSearchParams(location.search);
    const quizId = query.get("quiz_id");

    const [flagsMode, setFlagsMode] = useState(false);
    const [euMode, setEuMode] = useState(false);
    const [typeParam, setTypeParam] = useState<string>("multiple");
    const [onlyTerritories, setOnlyTerritories] = useState(false);
    const [showTerritories, setShowTerritories] = useState(false);
    const [selectedContinents, setSelectedContinents] = useState<string[]>([]);
    const [numQuestions, setNumQuestions] = useState<number>(99999);

    // Config quiz : charge custom sequence OU standard via url
    useEffect(() => {
        if (!quizId) {
            // Mode standard via URL
            setFlagsMode(query.get("flags") === "1");
            setEuMode(query.get("eu") === "1");
            setTypeParam(query.get("type") || "multiple");
            setOnlyTerritories(query.get("only_territories") === "1");
            setShowTerritories(query.get("territories") === "1");
            setNumQuestions(Number(query.get("num") ?? 99999));
            const continentsParam = query.get("continents");
            setSelectedContinents(continentsParam ? continentsParam.split(",") : []);
            setQuizLoaded(true);
            setCustomQuestions(null);
            return;
        }
        setQuizLoaded(false);
        supabase.from("quizzes").select("settings").eq("id", quizId).single()
            .then(async ({ data }) => {
                if (data && data.settings) {
                    if (data.settings.mode === "custom_sequence" && Array.isArray(data.settings.questions)) {
                        setCustomQuestions(data.settings.questions);
                        setTypeParam(data.settings.inputType || "multiple"); // <-- respecte le type (QCM/saisie)
                        const pays = await fetchCountries();
                        setAllCountries(pays);
                        setQuizLoaded(true);
                    } else {
                        setFlagsMode(data.settings.mode === "flags");
                        setEuMode(data.settings.mode === "eu");
                        setTypeParam(data.settings.inputType || "multiple");
                        setOnlyTerritories(!!data.settings.onlyTerritories);
                        setShowTerritories(!!data.settings.withTerritories);
                        setNumQuestions(Number(data.settings.numQuestions ?? 99999));
                        setSelectedContinents(data.settings.continents ?? []);
                        setCustomQuestions(null);
                        setQuizLoaded(true);
                    }
                }
            });
    }, [location.search, quizId]);

    // Pour les quiz classiques, charge les pays filtrés
    useEffect(() => {
        if (!quizLoaded || customQuestions) return;
        fetchCountries(selectedContinents.length ? selectedContinents : undefined)
            .then(data => {
                for (const country of data) {
                    const v = capitalVariantsMap[country.code];
                    if (v) country.capital_variants = v;
                }
                let filtered = euMode
                    ? data.filter(c => c.ue_date && c.ue_date.match(/^\d{4}/))
                    : data.filter(c => !!c.capital && !!c.name && !!c.code);

                if (!euMode) {
                    if (onlyTerritories) filtered = filtered.filter(c => c.status === "part_of_country");
                    else if (!showTerritories) filtered = filtered.filter(c => !c.parent_code);
                }
                if (flagsMode) {
                    filtered = filtered.filter(c => {
                        const alpha2 = isoNumToAlpha2[String(c.code).padStart(3, "0")];
                        return alpha2 && alpha2 !== "??";
                    });
                }
                filtered = shuffle(filtered);
                if (numQuestions !== 99999 && numQuestions < filtered.length) {
                    filtered = filtered.slice(0, numQuestions);
                }
                setCountries(filtered);
            })
            .catch(() => setCountries([]));
    }, [selectedContinents, showTerritories, onlyTerritories, euMode, flagsMode, numQuestions, quizLoaded, customQuestions]);

    // Gestion MCQ pour mode classique
    useEffect(() => {
        if (!countries.length || current >= countries.length || customQuestions) return;
        if (typeParam === "multiple") {
            if (euMode) {
                const year = countries[current]?.ue_date?.slice(0,4);
                const allYears = uniq(countries.map(c => c.ue_date?.slice(0,4)).filter(Boolean));
                setMCOptions(getMCOptions(year, allYears));
            } else if (flagsMode) {
                const correctCountry = countries[current]?.name;
                const allCountries = uniq(countries.map(c => c.name).filter(Boolean));
                setMCOptions(getMCOptions(correctCountry, allCountries));
            } else {
                const correctCapital = countries[current]?.capital;
                const allCapitals = uniq(countries.map(c => c.capital).filter(Boolean));
                setMCOptions(getMCOptions(correctCapital, allCapitals));
            }
        }
    }, [typeParam, flagsMode, euMode, countries, current, customQuestions]);

    // Gestion MCQ pour mode custom_sequence
    useEffect(() => {
        if (!customQuestions || !allCountries.length || current >= customQuestions.length) return;
        const q = customQuestions[current];
        const country = allCountries.find(c => c.code === q.country_code);
        if (!country) return;
        if (q.question_type === "capitale" && typeParam === "multiple") {
            const correctCapital = country.capital;
            const allCapitals = uniq(allCountries.map(c => c.capital).filter(Boolean));
            setMCOptions(getMCOptions(correctCapital, allCapitals));
        } else if (q.question_type === "drapeau" && typeParam === "multiple") {
            const correctCountry = country.name;
            const allNames = uniq(allCountries.map(c => c.name).filter(Boolean));
            setMCOptions(getMCOptions(correctCountry, allNames));
        } else if (q.question_type === "annee_eu" && typeParam === "multiple") {
            const year = country.ue_date?.slice(0,4) || "?";
            const allYears = uniq(allCountries.map(c => c.ue_date?.slice(0,4)).filter(Boolean));
            setMCOptions(getMCOptions(year, allYears));
        }
    }, [customQuestions, allCountries, current, typeParam]);

    function getMCOptions(correct: string, allVals: string[]): MultipleChoiceOption[] {
        const uniqueVals = uniq(allVals.filter(v => v && v !== correct));
        const randomWrong = shuffle(uniqueVals).slice(0, 3);
        const choices = shuffle([correct, ...randomWrong]);
        return choices.map(y => ({ label: y, value: y }));
    }

    useEffect(() => {
        if (showCorrection) nextButtonRef.current?.focus();
        else inputRef.current?.focus();
    }, [showCorrection, current, finished]);

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (showCorrection) return;
        let correct = false;
        if (customQuestions && allCountries.length) {
            const customQ = customQuestions[current];
            const country = allCountries.find(c => c.code === customQ.country_code);
            if (!country) return;
            switch (customQ.question_type) {
                case "capitale":
                    correct = answerOk(userAnswer, country);
                    break;
                case "drapeau":
                    correct = answerCountryOk(userAnswer, country);
                    break;
                case "annee_eu":
                    correct = answerYearOk(userAnswer, country);
                    break;
            }
            setLastAnswerCorrect(correct);
            setAnswers(ans => [
                ...ans,
                { country, user: userAnswer, isCorrect: correct }
            ]);
            if (correct) setScore(s => s + 1);
            setShowCorrection(true);
        } else {
            let correct = false;
            if (euMode) correct = answerYearOk(userAnswer, countries[current]);
            else if (flagsMode) correct = answerCountryOk(userAnswer, countries[current]);
            else correct = answerOk(userAnswer, countries[current]);
            setLastAnswerCorrect(correct);
            setAnswers(ans => [
                ...ans,
                { country: countries[current], user: userAnswer, isCorrect: correct }
            ]);
            if (correct) setScore(s => s + 1);
            setShowCorrection(true);
        }
    }

    function handleNext() {
        setShowCorrection(false);
        setLastAnswerCorrect(false);
        setUserAnswer("");
        const len = customQuestions ? customQuestions.length : countries.length;
        if (current < len - 1) setCurrent(i => i + 1);
        else setFinished(true);
        setTimeout(() => { inputRef.current?.focus(); }, 0);
    }

    function handleKeyDown(e: React.KeyboardEvent) {
        if (showCorrection && (e.key === "Enter" || e.key === " ")) {
            e.preventDefault();
            handleNext();
        }
    }

    function Flag({code}: {code: string | number}) {
        const alpha2 = isoNumToAlpha2[String(code).padStart(3, '0')];
        if (!alpha2 || alpha2 === "??") {
            return <span className="flag-fallback">❓</span>;
        }
        return (
            <img
                src={`https://flagcdn.com/${alpha2.toLowerCase()}.svg`}
                alt="drapeau"
                className="flag-img"
                onError={e => { (e.currentTarget as HTMLImageElement).replaceWith(document.createTextNode("❓")); }}
            />
        );
    }

    if (!quizLoaded || (customQuestions && !allCountries.length)) return <p>Chargement…</p>;

    const finishedLength = customQuestions ? customQuestions.length : countries.length;

    if (finished) {
        const wrongAnswers = answers.filter(a => !a.isCorrect);
        const percent = Math.round((score / finishedLength) * 100);
        return (
            <div className="quiz-result-wrapper">
                <div className="recap-card">
                    <h2>Quiz terminé !</h2>
                    <div className="recap-score">{percent} % de réussite</div>
                    <div className="recap-progress">
                        <span>{score} bonnes réponses</span>
                        <span> / </span>
                        <span>{finishedLength} questions</span>
                    </div>
                    {wrongAnswers.length > 0 ? (
                        <div>
                            <h3>Récapitulatif des erreurs :</h3>
                            <table className="recap-table">
                                <thead>
                                <tr>
                                    <th>Drapeau</th>
                                    <th>Pays</th>
                                    <th>Ta réponse</th>
                                    <th>Bonne réponse</th>
                                </tr>
                                </thead>
                                <tbody>
                                {wrongAnswers.map((a, idx) => (
                                    <tr key={idx}>
                                        <td><Flag code={a.country.code} /></td>
                                        <td>{a.country.name}</td>
                                        <td className="recap-wrong-answer">{a.user || <i>(vide)</i>}</td>
                                        <td className="recap-correct-answer">
                                            {a.country.capital}
                                        </td>
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
                        <a href="/">Accueil</a>
                    </div>
                </div>
            </div>
        );
    }

    // Quelle question on affiche ?
    let questionType = "capitale", country: Country | undefined;
    if (customQuestions) {
        const q = customQuestions[current];
        country = allCountries.find(c => c.code === q.country_code);
        questionType = q.question_type;
    } else {
        country = countries[current];
    }

    return (
        <div className="quiz-main-wrapper">
            <div className="quiz-content-inner">
                {(country && ((customQuestions && questionType === "drapeau") || (!customQuestions && flagsMode))) && (
                    <div className="flag-wrapper">
                        <Flag code={country.code} />
                    </div>
                )}
                {country && !customQuestions && !euMode && !flagsMode && (
                    <div className="quiz-map-wrapper">
                        <CarteMonde codeISO={country.code} />
                    </div>
                )}
                <form
                    className={`quiz-card ${typeParam === "input" ? "input-mode" : ""}`}
                    onSubmit={typeParam === "multiple" ? e => e.preventDefault() : handleSubmit}
                    onKeyDown={handleKeyDown}
                    autoComplete="off"
                >
                    <h2>
                        {customQuestions
                            ? questionType === "capitale"
                                ? `Devine la capitale de:`
                                : questionType === "annee_eu"
                                    ? `Année d'adhésion à l'Union Européenne : `
                                    : `Quel est ce pays ?`
                            : euMode ? "Année d'adhésion à l'Union Européenne :"
                                : flagsMode ? "Quel est ce pays ?"
                                    : "Devine la capitale de"}
                    </h2>
                    <div className="quiz-country">
                        {(!customQuestions && !flagsMode) || (customQuestions && questionType !== "drapeau") ? country?.name : null}
                    </div>
                    <div className="quiz-form">
                        {typeParam === "multiple"
                            ? (
                                <MultipleChoice
                                    options={mcOptions}
                                    onSelect={option => {
                                        if (showCorrection || !country) return;
                                        let correct = false;
                                        if (customQuestions) {
                                            if (questionType === "capitale") correct = answerOk(option.value, country);
                                            if (questionType === "drapeau") correct = answerCountryOk(option.value, country);
                                            if (questionType === "annee_eu") correct = answerYearOk(option.value, country);
                                            setLastAnswerCorrect(correct);
                                            setAnswers(ans => [
                                                ...ans,
                                                { country, user: option.value, isCorrect: correct }
                                            ]);
                                            if (correct) setScore(s => s + 1);
                                            setShowCorrection(true);
                                            return;
                                        } else {
                                            if (euMode) correct = answerYearOk(option.value, country);
                                            else if (flagsMode) correct = answerCountryOk(option.value, country);
                                            else correct = answerOk(option.value, country);
                                            setLastAnswerCorrect(correct);
                                            setAnswers(ans => [
                                                ...ans,
                                                { country, user: option.value, isCorrect: correct }
                                            ]);
                                            if (correct) setScore(s => s + 1);
                                            setShowCorrection(true);
                                            return;
                                        }
                                    }}
                                    disabled={showCorrection && lastAnswerCorrect}
                                    selected={showCorrection ? answers[answers.length - 1]?.user : undefined}
                                    showCorrection={showCorrection}
                                    correct={country ? (
                                        questionType === "capitale" ? country.capital :
                                            questionType === "drapeau" ? country.name :
                                                questionType === "annee_eu" ? country.ue_date?.slice(0, 4) : undefined
                                    ) : undefined}
                                />
                            )
                            : (
                                <>
                                    <input
                                        ref={inputRef}
                                        type={questionType === "annee_eu" ? "number" : "text"}
                                        inputMode={questionType === "annee_eu" ? "numeric" : "text"}
                                        value={userAnswer}
                                        onChange={e => setUserAnswer(e.target.value)}
                                        autoFocus
                                        className="quiz-input"
                                        placeholder={
                                            questionType === "annee_eu" ? "Écris l'année (ex : 2004)" :
                                                questionType === "drapeau" ? "Écris le nom du pays" :
                                                    "Écris la capitale"
                                        }
                                        disabled={showCorrection}
                                        min={questionType === "annee_eu" ? 1950 : undefined}
                                    />
                                    {showCorrection ? null : (
                                        <button className="quiz-btn" type="submit">
                                            Valider
                                        </button>
                                    )}
                                </>
                            )
                        }
                        {showCorrection && (
                            <button
                                ref={nextButtonRef}
                                className="quiz-btn-next"
                                type="button"
                                onClick={handleNext}
                                tabIndex={0}
                            >
                                {current === finishedLength - 1 ? "Voir le résultat" : "Suivant"}
                            </button>
                        )}
                    </div>
                    <div className="quiz-index">{current + 1} / {finishedLength}</div>
                    {showCorrection && (
                        <div className={`quiz-correction ${lastAnswerCorrect ? "correct" : "wrong"}`}>
                            {lastAnswerCorrect
                                ? "Bonne réponse ! 👏"
                                : (
                                    customQuestions
                                        ? questionType === "annee_eu"
                                            ? <>Mauvaise réponse.<br />La bonne année était <b>{country?.ue_date?.slice(0, 4) || "?"}</b></>
                                            : questionType === "drapeau"
                                                ? <>Mauvaise réponse.<br />La bonne réponse était <b>{country?.name}</b></>
                                                : <>Mauvaise réponse.<br />La bonne réponse était <b>{country?.capital}</b></>
                                        : (euMode
                                                ? <>Mauvaise réponse.<br />La bonne année était <b>{country?.ue_date ? country.ue_date.slice(0, 4) : "?"}</b></>
                                                : flagsMode
                                                    ? <>Mauvaise réponse.<br />La bonne réponse était <b>{country?.name}</b></>
                                                    : <>Mauvaise réponse.<br />La bonne réponse était <b>{country?.capital}</b></>
                                        )
                                )}
                        </div>
                    )}
                </form>
            </div>
        </div>
    );
}
