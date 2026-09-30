import { useEffect, useState, useRef } from "react";
import { fetchCountries } from "../api/countries";
import type { Country } from "../api/countries";
import { useLocation } from "react-router-dom";
import { CarteMonde } from "../components/CarteMonde";
import { CarteFranceDept } from "../components/CarteFranceDept";
import MultipleChoice, { type MultipleChoiceOption } from "../components/MultipleChoice";
import { capitalVariantsMap } from "../utils/capitalVariants";
import { isoNumToAlpha2 } from "../utils/isoNumToAlpha2";
import { supabase } from "../api/supabase";
import { useAuth } from "../context/AuthContext";
import { getCustomAnswerValue, getCustomQuestionMode, type CustomQuestionType } from "../utils/customQuizModes";
import { isOverseasDepartment, normalizeDepartmentCode } from "../utils/franceGeography";
import { recordCountryProgress, useQuizAttemptSave } from "../api/quizAttempts";
import QuizAttemptStatus from "../components/QuizAttemptStatus";

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
    country?: Country;
    department?: FranceDepartment;
    user: string;
    isCorrect: boolean;
    questionType: CustomQuestionType;
    mapAnswerLabel?: string;
};

type CustomQuestion = {
    country_code?: string;
    country_name?: string;
    department_code?: string;
    department_name?: string;
    question_type: CustomQuestionType;
};

type FranceDepartment = { code: string; nom: string; cheflieu: string; region: string | null };
const CONTINENT_LABELS: Record<string, string> = {
    Europe: "Europe",
    Asia: "Asie",
    Africa: "Afrique",
    "North America": "Amérique du Nord",
    "South America": "Amérique du Sud",
    Oceania: "Océanie",
};

function customAnswerValue(questionType: CustomQuestionType, subject: Country | FranceDepartment) {
    const mode = getCustomQuestionMode(questionType);
    return mode ? getCustomAnswerValue(mode, subject) : "";
}

function customPrompt(questionType: CustomQuestionType) {
    return getCustomQuestionMode(questionType)?.prompt ?? "Réponds à la question :";
}

export default function Quiz() {
    const [countries, setCountries] = useState<Country[]>([]);
    const [current, setCurrent] = useState(0);
    const [userAnswer, setUserAnswer] = useState("");
    const [selectedMapCode, setSelectedMapCode] = useState<string | null>(null);
    const [score, setScore] = useState(0);
    const [finished, setFinished] = useState(false);
    const [showCorrection, setShowCorrection] = useState(false);
    const [answers, setAnswers] = useState<Answer[]>([]);
    const [lastAnswerCorrect, setLastAnswerCorrect] = useState<boolean>(false);
    const [countryProgressSaveError, setCountryProgressSaveError] = useState(false);
    const [mcOptions, setMCOptions] = useState<MultipleChoiceOption[]>([]);
    const [quizLoaded, setQuizLoaded] = useState(false);
    const [countriesLoading, setCountriesLoading] = useState(true);
    const [loadError, setLoadError] = useState<string | null>(null);
    const [customQuestions, setCustomQuestions] = useState<CustomQuestion[] | null>(null);
    const [customQuizTitle, setCustomQuizTitle] = useState("");
    const [allCountries, setAllCountries] = useState<Country[]>([]);
    const [allDepartments, setAllDepartments] = useState<FranceDepartment[]>([]);

    const location = useLocation();
    const { user } = useAuth();
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

    const isFranceOnlyCustomQuiz = Boolean(customQuestions?.length && customQuestions.every(question => getCustomQuestionMode(question.question_type)?.group === "france"));
    const personalQuizKey = customQuestions ? isFranceOnlyCustomQuiz ? "personnalise_france" : "personnalise" : euMode ? "union_europeenne" : flagsMode ? "drapeaux" : "capitales_monde";
    const personalQuizTotal = customQuestions ? customQuestions.length : countries.length;
    const orderedContinents = [...selectedContinents].sort();
    const personalQuizScopeParts = [
        orderedContinents.length ? orderedContinents.map(code => CONTINENT_LABELS[code] ?? code).join(", ") : "Tous les continents",
        ...(onlyTerritories ? ["Territoires uniquement"] : showTerritories ? ["Avec territoires"] : []),
        ...(numQuestions === 99999 ? [] : [`${numQuestions} questions`]),
    ];
    const personalQuizScopeKey = customQuestions
        ? `quiz:${quizId ?? "personnalise"}`
        : `continents:${orderedContinents.join(",") || "tous"}|territoires:${onlyTerritories ? "uniquement" : showTerritories ? "inclus" : "exclus"}|questions:${numQuestions}`;
    const personalQuizScopeLabel = customQuestions
        ? customQuizTitle || "Quiz personnalisé"
        : personalQuizScopeParts.join(" · ");
    const attemptSave = useQuizAttemptSave({
        enabled: finished && personalQuizTotal > 0,
        userId: user?.id,
        quizKey: personalQuizKey,
        score,
        totalQuestions: personalQuizTotal,
        scopeKey: personalQuizScopeKey,
        scopeLabel: personalQuizScopeLabel,
    });
    const countryProgressSaveKey = useRef<string | null>(null);

    useEffect(() => {
        if (!finished || !user?.id || customQuestions || flagsMode || euMode) return;
        const progressAnswers = answers.flatMap(answer =>
            answer.country && answer.questionType === "capitale"
                ? [{ countryCode: answer.country.code, isCorrect: answer.isCorrect }]
                : [],
        );
        if (!progressAnswers.length) return;

        const saveKey = JSON.stringify([user.id, progressAnswers]);
        if (countryProgressSaveKey.current === saveKey) return;
        countryProgressSaveKey.current = saveKey;
        void recordCountryProgress(user.id, progressAnswers)
            .then(() => setCountryProgressSaveError(false))
            .catch((error: unknown) => {
                console.error("Échec de l’enregistrement de la progression par pays.", error);
                countryProgressSaveKey.current = null;
                setCountryProgressSaveError(true);
            });
    }, [answers, customQuestions, euMode, finished, flagsMode, user?.id]);

    // Config quiz : charge custom sequence OU standard via url
    useEffect(() => {
        let active = true;
        if (!quizId) {
            // Mode standard via URL
            setFlagsMode(query.get("flags") === "1");
            setEuMode(query.get("eu") === "1");
            setTypeParam(query.get("type") === "input" ? "input" : "multiple");
            setOnlyTerritories(query.get("only_territories") === "1");
            setShowTerritories(query.get("territories") === "1");
            setNumQuestions(Number(query.get("num") ?? 99999));
            const continentsParam = query.get("continents");
            setSelectedContinents(continentsParam ? continentsParam.split(",") : []);
            setQuizLoaded(true);
            setCustomQuestions(null);
            setCustomQuizTitle("");
            setCountriesLoading(true);
            setLoadError(null);
            return () => { active = false; };
        }
        if (!user) {
            setLoadError("Connecte-toi pour accéder à ce quiz personnalisé.");
            return () => { active = false; };
        }
        setQuizLoaded(false);
        setCountriesLoading(true);
        setAllCountries([]);
        setAllDepartments([]);
        setLoadError(null);
        void (async () => {
            try {
                const { data, error } = await supabase.from("quizzes").select("title, settings").eq("id", quizId).eq("user_id", user.id).single();
                if (!active) return;
                if (error) {
                    setLoadError("Impossible de charger ce quiz. Vérifie ta connexion et réessaie.");
                    return;
                }
                let settings = data?.settings;
                if (typeof settings === "string") {
                    try { settings = JSON.parse(settings); } catch { settings = null; }
                }
                if (!settings || typeof settings !== "object") {
                    setLoadError("Ce quiz est introuvable ou ses paramètres sont incomplets.");
                    return;
                }
                if (settings.mode === "custom_sequence" && Array.isArray(settings.questions)) {
                    setCustomQuizTitle(data.title || "Quiz personnalisé");
                    const questions = settings.questions as CustomQuestion[];
                    setCustomQuestions(questions);
                    const requestedType = query.get("type");
                    setTypeParam(requestedType === "input" || requestedType === "multiple"
                        ? requestedType
                        : "multiple");
                    try {
                        const needsCountries = questions.some(question => getCustomQuestionMode(question.question_type)?.group === "pays");
                        const needsFrance = questions.some(question => getCustomQuestionMode(question.question_type)?.group === "france");
                        if (needsCountries) {
                            const pays = await fetchCountries();
                            if (!active) return;
                            for (const country of pays) country.capital_variants = capitalVariantsMap[country.code] ?? country.capital_variants;
                            setAllCountries(pays);
                        }
                        if (needsFrance) {
                            const { data: franceData, error: franceError } = await supabase.from("fr_departements").select("code, nom, cheflieu, region");
                            if (!active) return;
                            if (franceError) throw franceError;
                            setAllDepartments((franceData ?? []) as FranceDepartment[]);
                        }
                        setQuizLoaded(true);
                        setCountriesLoading(false);
                    } catch {
                        if (active) setLoadError("Les données de ce quiz n’ont pas pu être chargées.");
                    }
                } else {
                    setCustomQuizTitle("");
                    setFlagsMode(settings.mode === "flags");
                    setEuMode(settings.mode === "eu");
                    setTypeParam(settings.inputType === "input" ? "input" : "multiple");
                    setOnlyTerritories(!!settings.onlyTerritories);
                    setShowTerritories(!!settings.withTerritories);
                    setNumQuestions(Number(settings.numQuestions ?? 99999));
                    setSelectedContinents(Array.isArray(settings.continents) ? settings.continents : []);
                    setCustomQuestions(null);
                    setQuizLoaded(true);
                }
            } catch {
                if (active) setLoadError("Impossible de charger ce quiz. Vérifie ta connexion et réessaie.");
            }
        })();
        return () => { active = false; };
    }, [location.search, quizId, user]);

    // Pour les quiz classiques, charge les pays filtrés
    useEffect(() => {
        let active = true;
        if (!quizLoaded || customQuestions) return () => { active = false; };
        setCountriesLoading(true);
        setLoadError(null);
        fetchCountries(selectedContinents.length ? selectedContinents : undefined)
            .then(data => {
                if (!active) return;
                for (const country of data) {
                    country.capital_variants = capitalVariantsMap[country.code] ?? country.capital_variants;
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
                setCountriesLoading(false);
            })
            .catch(() => {
                if (active) { setCountries([]); setCountriesLoading(false); setLoadError("Impossible de charger les pays. Vérifie ta connexion et réessaie."); }
            });
        return () => { active = false; };
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
        if (!customQuestions || current >= customQuestions.length || typeParam !== "multiple") return;
        const question = customQuestions[current];
        const mode = getCustomQuestionMode(question.question_type);
        if (!mode) return;
        const subjects: Array<Country | FranceDepartment> = mode.group === "france" ? allDepartments : allCountries;
        const selectedSubject = mode.group === "france"
            ? allDepartments.find(department => department.code === question.department_code)
            : allCountries.find(country => country.code === question.country_code);
        if (!selectedSubject) return;
        const correctAnswer = customAnswerValue(question.question_type, selectedSubject);
        const overseasRegionQuestion = question.question_type === "fr_region" && isOverseasDepartment(question.department_code);
        const choiceSubjects = overseasRegionQuestion
            ? allDepartments.filter(department => isOverseasDepartment(department.code))
            : subjects;
        const choices = choiceSubjects.map(subject => customAnswerValue(question.question_type, subject)).filter(Boolean);
        setMCOptions(getMCOptions(correctAnswer, choices));
    }, [customQuestions, allCountries, allDepartments, current, typeParam]);

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

    function submitCustomAnswer(value: string) {
        if (showCorrection || !customQuestions) return;
        const question = customQuestions[current];
        if (!question) return;
        const mode = getCustomQuestionMode(question.question_type);
        if (!mode) return;

        if (mode.group === "france") {
            const department = allDepartments.find(item => item.code === question.department_code);
            if (!department) return;
            const expected = customAnswerValue(question.question_type, department);
            const correct = clean(value) === clean(expected);
            setAnswers(previous => [...previous, { department, user: value, isCorrect: correct, questionType: question.question_type }]);
            setLastAnswerCorrect(correct);
            if (correct) setScore(previous => previous + 1);
            setShowCorrection(true);
            return;
        }

        const country = allCountries.find(item => item.code === question.country_code);
        if (!country) return;
        const expected = customAnswerValue(question.question_type, country);
        const correct = question.question_type === "capitale" ? answerOk(value, country) : clean(value) === clean(expected);
        setAnswers(previous => [...previous, { country, user: value, isCorrect: correct, questionType: question.question_type }]);
        setLastAnswerCorrect(correct);
        if (correct) setScore(previous => previous + 1);
        setShowCorrection(true);
    }

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (showCorrection) return;
        if (customQuestions) {
            submitCustomAnswer(userAnswer);
            return;
        }
        const country = countries[current];
        if (!country) return;
        let correct = false;
        if (euMode) correct = answerYearOk(userAnswer, country);
        else if (flagsMode) correct = answerCountryOk(userAnswer, country);
        else correct = answerOk(userAnswer, country);
        setLastAnswerCorrect(correct);
        setAnswers(previous => [...previous, { country, user: userAnswer, isCorrect: correct, questionType: euMode ? "annee_eu" : flagsMode ? "drapeau" : "capitale" }]);
        if (correct) setScore(previous => previous + 1);
        setShowCorrection(true);
    }

    function handleMapSubmit() {
        if (!selectedMapCode || showCorrection) return;
        const selectedCode = selectedMapCode.trim().padStart(3, "0");
        if (customQuestions) {
            const mode = getCustomQuestionMode(questionType);
            if (mode?.group === "france" && department) {
                const picked = allDepartments.find(item => normalizeDepartmentCode(item.code) === normalizeDepartmentCode(selectedMapCode));
                const isCorrect = questionType === "fr_region"
                    ? Boolean(picked?.region && picked.region === department.region)
                    : normalizeDepartmentCode(selectedMapCode) === normalizeDepartmentCode(department.code);
                const expectedLabel = questionType === "fr_region" ? department.region ?? "" : department.nom;
                setAnswers(previous => [...previous, { department, user: picked?.nom ?? selectedMapCode, isCorrect, questionType, mapAnswerLabel: expectedLabel }]);
                setLastAnswerCorrect(isCorrect);
                if (isCorrect) setScore(previous => previous + 1);
                setShowCorrection(true);
                return;
            }
            if (country) {
                const isCorrect = selectedCode === country.code.trim().padStart(3, "0");
                const picked = allCountries.find(item => item.code.trim().padStart(3, "0") === selectedCode);
                setAnswers(previous => [...previous, { country, user: picked?.name ?? selectedMapCode, isCorrect, questionType, mapAnswerLabel: country.name }]);
                setLastAnswerCorrect(isCorrect);
                if (isCorrect) setScore(previous => previous + 1);
                setShowCorrection(true);
                return;
            }
        }
        if (!country) return;
        const isCorrect = selectedCode === country.code.trim().padStart(3, "0");
        const picked = countries.find(item => item.code.trim().padStart(3, "0") === selectedCode);
        setAnswers(previous => [...previous, { country, user: picked?.name ?? selectedMapCode, isCorrect, questionType: euMode ? "annee_eu" : flagsMode ? "drapeau" : "capitale", mapAnswerLabel: country.name }]);
        setLastAnswerCorrect(isCorrect);
        if (isCorrect) setScore(previous => previous + 1);
        setShowCorrection(true);
    }

    function handleNext() {
        setShowCorrection(false);
        setLastAnswerCorrect(false);
        setUserAnswer("");
        setSelectedMapCode(null);
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

    if (loadError) return <p className="empty-state error" role="alert">{loadError}</p>;
    const customNeedsCountries = customQuestions?.some(question => getCustomQuestionMode(question.question_type)?.group === "pays") ?? false;
    const customNeedsFrance = customQuestions?.some(question => getCustomQuestionMode(question.question_type)?.group === "france") ?? false;
    if (!quizLoaded || countriesLoading || (customQuestions && customNeedsCountries && !allCountries.length) || (customQuestions && customNeedsFrance && !allDepartments.length)) return <p className="loading-state">Chargement du quiz…</p>;

    const finishedLength = customQuestions ? customQuestions.length : countries.length;
    if (finishedLength === 0) return <p className="empty-state">Aucune question disponible avec ces critères. Essaie une autre sélection.</p>;

    if (finished) {
        const wrongAnswers = answers.filter(a => !a.isCorrect);
        const percent = Math.floor((score / finishedLength) * 100);
        return (
            <div className="quiz-result-wrapper">
                <div className="recap-card">
                    <h2>Quiz terminé !</h2>
                    <div className="recap-score">{percent} % de réussite</div>
                    <div className="recap-progress">
                        <span>{score} bonnes réponses</span>
                        <span> / </span>
                        <span>{finishedLength} questions</span>
                        <span> · {wrongAnswers.length} erreur{wrongAnswers.length === 1 ? "" : "s"}</span>
                    </div>
                    <QuizAttemptStatus status={attemptSave.status} errorMessage={attemptSave.errorMessage} onRetry={attemptSave.retry} />
                    {countryProgressSaveError && <p className="quiz-save-status quiz-save-status-error" role="alert">Active le suivi par continent avec le SQL fourni pour enregistrer cette progression.</p>}
                    {wrongAnswers.length > 0 ? (
                        <div>
                            <h3>Récapitulatif des erreurs :</h3>
                            <table className="recap-table">
                                <thead>
                                <tr>
                                    <th>Type</th>
                                    <th>Élément</th>
                                    <th>Ta réponse</th>
                                    <th>Correction</th>
                                </tr>
                                </thead>
                                <tbody>
                                {wrongAnswers.map((a, idx) => {
                                    const subjectName = a.country?.name ?? `${a.department?.code ?? ""} ${a.department?.nom ?? ""}`;
                    const correctAnswer = a.mapAnswerLabel ?? (a.country ? customAnswerValue(a.questionType, a.country)
                                        : a.department ? customAnswerValue(a.questionType, a.department) : "");
                                    return <tr key={idx}>
                                        <td>{getCustomQuestionMode(a.questionType)?.label ?? "Question"}</td>
                                        <td>{subjectName}</td>
                                        <td className="recap-wrong-answer">{a.user || <i>(vide)</i>}</td>
                                        <td className="recap-correct-answer">{correctAnswer}</td>
                                    </tr>;
                                })}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <div className="recap-success-msg">Aucune erreur, bravo!</div>
                    )}
                    <div className="recap-actions">
                        <button onClick={() => { setFinished(false); setCurrent(0); setScore(0); setUserAnswer(""); setSelectedMapCode(null); setAnswers([]); setLastAnswerCorrect(false); }}>Recommencer</button>
                        <a href="/">Accueil</a>
                    </div>
                </div>
            </div>
        );
    }

    // Quelle question on affiche ?
    let questionType: CustomQuestion["question_type"] = "capitale";
    let country: Country | undefined;
    let department: FranceDepartment | undefined;
    if (customQuestions) {
        const q = customQuestions[current];
        questionType = q.question_type;
        if (getCustomQuestionMode(questionType)?.group === "france") department = allDepartments.find(item => item.code === q.department_code);
        else country = allCountries.find(item => item.code === q.country_code);
    } else {
        country = countries[current];
    }
    const customSubject = department ?? country;
    const customQuestionMode = customQuestions ? getCustomQuestionMode(questionType) : undefined;
    const correctChoice = customQuestions && customSubject
        ? customAnswerValue(questionType, customSubject)
        : country ? (euMode ? country.ue_date?.slice(0, 4) : flagsMode ? country.name : country.capital) : undefined;
    const departmentHighlights = department && customQuestions && questionType === "fr_region" && department.region
        ? allDepartments.filter(item => item.region === department.region).map(item => item.code)
        : department?.code;
    const hideFranceMapAnswer = customQuestions && (questionType === "fr_departement" || questionType === "fr_region");
    const isMapMode = false;
    const isEuropeanQuestion = customQuestions ? questionType === "annee_eu" : euMode;
    const revealedMapCode = isMapMode && showCorrection && !lastAnswerCorrect ? country?.code ?? "" : "";

    return (
        <div className={`quiz-main-wrapper ${customQuestions ? "custom-quiz-play-wrapper" : ""} ${isMapMode ? "map-guess-world-screen" : ""}`}>
            <div className={`quiz-content-inner ${customQuestions ? "custom-quiz-layout" : ""} ${isMapMode ? "map-guess-world-layout" : ""}`}>
                {(!isMapMode && country && ((customQuestions && questionType === "drapeau") || (!customQuestions && flagsMode))) && (
                    <div className={`flag-wrapper ${customQuestions ? "custom-quiz-visual france-map-panel" : ""}`}>
                        <Flag code={country.code} />
                    </div>
                )}
                {department && (
                    <div className="quiz-map-wrapper france-custom-map france-map-panel">
                        <CarteFranceDept highlight={isMapMode ? undefined : departmentHighlights} answerHighlight={isMapMode && showCorrection && !lastAnswerCorrect ? departmentHighlights : undefined} hideHighlightName={hideFranceMapAnswer || isMapMode} selectedCode={selectedMapCode} onSelect={isMapMode && !showCorrection ? setSelectedMapCode : undefined} />
                    </div>
                )}
                {country && isEuropeanQuestion && (
                    <div className={`quiz-map-wrapper ${customQuestions ? "custom-quiz-map-panel france-map-panel" : ""}`}>
                        <CarteMonde codeISO={isMapMode ? revealedMapCode : country.code} region="europe" selectedCode={selectedMapCode} answerCode={revealedMapCode} onSelect={isMapMode && !showCorrection ? setSelectedMapCode : undefined} focusCode={isMapMode ? country.code : undefined} />
                    </div>
                )}
                {country && !isEuropeanQuestion && (isMapMode || ((customQuestions && questionType === "capitale") || (!customQuestions && !euMode && !flagsMode))) && (
                    <div className={`quiz-map-wrapper ${customQuestions ? "custom-quiz-map-panel france-map-panel" : ""}`}>
                        <CarteMonde codeISO={isMapMode ? "" : country.code} selectedCode={selectedMapCode} answerCode={revealedMapCode} onSelect={isMapMode && !showCorrection ? setSelectedMapCode : undefined} focusCode={isMapMode ? country.code : undefined} />
                    </div>
                )}
                <form
                    className={`quiz-card ${typeParam === "input" ? "input-mode" : ""} ${isMapMode ? "map-guess-answer-card" : ""} ${customQuestions ? "custom-quiz-answer france-answer-panel" : ""}`}
                    onSubmit={typeParam !== "input" ? e => e.preventDefault() : handleSubmit}
                    onKeyDown={handleKeyDown}
                    autoComplete="off"
                >
                    <h2>
                        {isMapMode
                            ? customQuestions ? "Localise l’élément affiché sur la carte :" : "Localise ce pays sur la carte :"
                            : customQuestions
                            ? customPrompt(questionType)
                            : euMode ? "Année d'adhésion à l'Union Européenne :"
                                : flagsMode ? "Quel est ce pays ?"
                                    : "Devine la capitale de"}
                    </h2>
                    <div className={`quiz-country ${isMapMode || ((customQuestions && customQuestionMode?.showSubject) || (!customQuestions && !flagsMode && !euMode)) ? "quiz-country-target" : ""}`}>
                        {isMapMode
                            ? department?.nom ?? country?.name
                            : customQuestions
                            ? customQuestionMode?.showSubject ? department?.nom ?? country?.name : null
                            : flagsMode ? null : country?.name}
                    </div>
                    <div className="quiz-form">
                        {isMapMode ? (
                            <div className="map-guess-controls map-guess-world-controls">
                                <span className="map-guess-picked" aria-live="polite">{selectedMapCode ? "Zone présélectionnée" : "Sélectionne une zone sur la carte"}</span>
                                <button type="button" className="map-guess-clear" disabled={!selectedMapCode || showCorrection} onClick={() => setSelectedMapCode(null)}>Effacer</button>
                                {!showCorrection ? <button type="button" className="primary-btn" disabled={!selectedMapCode} onClick={handleMapSubmit}>Valider</button> : <button ref={nextButtonRef} type="button" className="primary-btn" onClick={handleNext}>{current === finishedLength - 1 ? "Voir le résultat" : "Suivant"}</button>}
                            </div>
                        ) : typeParam === "multiple" || typeParam === "map"
                            ? (
                                <MultipleChoice
                                    options={mcOptions}
                                    onSelect={option => {
                                        if (showCorrection) return;
                                        if (customQuestions) {
                                            submitCustomAnswer(option.value);
                                            return;
                                        }
                                        if (!country) return;
                                        let correct = false;
                                        if (euMode) correct = answerYearOk(option.value, country);
                                        else if (flagsMode) correct = answerCountryOk(option.value, country);
                                        else correct = answerOk(option.value, country);
                                        setLastAnswerCorrect(correct);
                                        setAnswers(previous => [...previous, { country, user: option.value, isCorrect: correct, questionType: euMode ? "annee_eu" : flagsMode ? "drapeau" : "capitale" }]);
                                        if (correct) setScore(previous => previous + 1);
                                        setShowCorrection(true);
                                    }}
                                    disabled={showCorrection && lastAnswerCorrect}
                                    selected={showCorrection ? answers[answers.length - 1]?.user : undefined}
                                    showCorrection={showCorrection}
                                    correct={correctChoice}
                                />
                            )
                            : (
                                <>
                                    <input
                                        ref={inputRef}
                                        type={customQuestionMode?.inputType ?? (euMode ? "number" : "text")}
                                        inputMode={customQuestionMode?.inputType === "number" || (!customQuestionMode && euMode) ? "numeric" : "text"}
                                        value={userAnswer}
                                        onChange={e => setUserAnswer(e.target.value)}
                                        autoFocus
                                        className="quiz-input"
                                        placeholder={customQuestionMode?.placeholder ?? (euMode ? "Écris l'année (ex : 2004)" : flagsMode ? "Écris le nom du pays" : "Écris la capitale")}
                                        disabled={showCorrection}
                                        min={customQuestionMode?.inputMin ?? (!customQuestionMode && euMode ? 1950 : undefined)}
                                    />
                                    {showCorrection ? null : (
                                        <button className="quiz-btn" type="submit">
                                            Valider
                                        </button>
                                    )}
                                </>
                            )
                        }
                        {showCorrection && !isMapMode && (
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
                                        ? <>Mauvaise réponse.<br />La bonne réponse était <b>{isMapMode ? (department?.region ?? department?.nom ?? country?.name) : correctChoice}</b></>
                                        : (isMapMode
                                                ? <>Mauvaise réponse.<br />La bonne zone était <b>{country?.name}</b></>
                                                : euMode
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
