import { useEffect, useMemo, useState } from "react";
import { fetchCountries, type Country } from "../api/countries";
import { supabase } from "../api/supabase";
import {
    COUNTRY_QUESTION_MODES,
    FRANCE_QUESTION_MODES,
    getCustomAnswerValue,
    type CustomQuestion,
    type CustomQuestionType,
} from "../utils/customQuizModes";

type Department = { code: string; nom: string; cheflieu: string; region: string | null };
const CONTINENTS = [
    { code: "Europe", label: "Europe" },
    { code: "Asia", label: "Asie" },
    { code: "Africa", label: "Afrique" },
    { code: "North America", label: "Amérique du Nord" },
    { code: "South America", label: "Amérique du Sud" },
    { code: "Oceania", label: "Océanie" },
];

function normalize(value: string) {
    return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLocaleLowerCase("fr-FR");
}

export default function CustomQuizBuilder({
    title, setTitle, description, setDescription, selectedQuestions, setSelectedQuestions,
}: {
    title: string;
    setTitle: (value: string) => void;
    description: string;
    setDescription: (value: string) => void;
    selectedQuestions: CustomQuestion[];
    setSelectedQuestions: (update: (previous: CustomQuestion[]) => CustomQuestion[]) => void;
}) {
    const [countries, setCountries] = useState<Country[]>([]);
    const [departments, setDepartments] = useState<Department[]>([]);
    const [loading, setLoading] = useState(true);
    const [sourceError, setSourceError] = useState<string | null>(null);
    const [continentFilter, setContinentFilter] = useState<string[]>([]);
    const [search, setSearch] = useState("");

    useEffect(() => {
        let active = true;
        void (async () => {
            const [countryResult, departmentResult] = await Promise.all([
                fetchCountries().then(data => ({ data, error: null as string | null })).catch(() => ({ data: [] as Country[], error: "Les pays n’ont pas pu être chargés." })),
                supabase.from("fr_departements").select("code, nom, cheflieu, region").order("code"),
            ]);
            if (!active) return;
            setCountries(countryResult.data);
            if (departmentResult.error) setSourceError("Les départements français n’ont pas pu être chargés. Les questions monde restent disponibles.");
            else setDepartments((departmentResult.data ?? []) as Department[]);
            if (countryResult.error) setSourceError(countryResult.error);
            setLoading(false);
        })().catch(() => {
            if (active) { setSourceError("Les questions disponibles n’ont pas pu être chargées."); setLoading(false); }
        });
        return () => { active = false; };
    }, []);

    const filteredCountries = useMemo(() => {
        const needle = normalize(search.trim());
        return countries.filter(country =>
            (!continentFilter.length || continentFilter.includes(country.continent)) &&
            (!needle || normalize(`${country.name} ${country.capital ?? ""}`).includes(needle))
        );
    }, [countries, continentFilter, search]);
    const filteredDepartments = useMemo(() => {
        const needle = normalize(search.trim());
        return departments.filter(department => !needle || normalize(`${department.code} ${department.nom} ${department.cheflieu} ${department.region ?? ""}`).includes(needle));
    }, [departments, search]);

    function isSelected(type: CustomQuestionType, code: string, group: "pays" | "france") {
        return selectedQuestions.some(question => question.question_type === type &&
            (group === "pays" ? question.country_code === code : question.department_code === code));
    }

    function toggleCountry(country: Country, type: CustomQuestionType) {
        setSelectedQuestions(previous => {
            if (previous.some(question => question.question_type === type && question.country_code === country.code)) {
                return previous.filter(question => !(question.question_type === type && question.country_code === country.code));
            }
            return [...previous, { country_code: country.code, country_name: country.name, question_type: type }];
        });
    }

    function toggleDepartment(department: Department, type: CustomQuestionType) {
        setSelectedQuestions(previous => {
            if (previous.some(question => question.question_type === type && question.department_code === department.code)) {
                return previous.filter(question => !(question.question_type === type && question.department_code === department.code));
            }
            return [...previous, { department_code: department.code, department_name: department.nom, question_type: type }];
        });
    }

    return (
        <div className="custom-quiz-builder">
            <header className="custom-builder-heading">
                <p className="section-kicker">Collection personnalisée</p>
                <h1>Créer un quiz personnalisé</h1>
            <p>Choisis les questions à inclure. Tu choisiras le mode de réponse au lancement.</p>
            </header>

            <section className="custom-builder-details" aria-label="Informations du quiz">
                <label className="custom-builder-field"><span>Titre du quiz</span>
                    <input required value={title} onChange={event => setTitle(event.target.value)} placeholder="Ex. Mes capitales préférées" />
                </label>
                <label className="custom-builder-field"><span>Description <small>(facultative)</small></span>
                    <input value={description} onChange={event => setDescription(event.target.value)} placeholder="Quelques mots pour décrire ce quiz" />
                </label>
            </section>

            <div className="custom-builder-toolbar">
                <label><span className="sr-only">Rechercher un pays ou département</span>
                    <input type="search" value={search} onChange={event => setSearch(event.target.value)} placeholder="Rechercher un pays, une préfecture ou un département…" />
                </label>
                <span className="custom-selected-count">{selectedQuestions.length} question{selectedQuestions.length === 1 ? "" : "s"} sélectionnée{selectedQuestions.length === 1 ? "" : "s"}</span>
            </div>

            {sourceError && <p className="custom-source-error" role="status">{sourceError}</p>}

            <section className="custom-question-group" aria-labelledby="custom-world-title">
                <div className="custom-group-heading"><div><p className="section-kicker">01 · Monde</p><h2 id="custom-world-title">Questions par pays</h2></div><span>{filteredCountries.length} pays</span></div>
                <div className="custom-continent-filters" aria-label="Filtrer par continent">
                    {CONTINENTS.map(continent => <label key={continent.code} className={continentFilter.includes(continent.code) ? "selected" : ""}><input type="checkbox" checked={continentFilter.includes(continent.code)} onChange={event => setContinentFilter(current => event.target.checked ? [...current, continent.code] : current.filter(value => value !== continent.code))} />{continent.label}</label>)}
                </div>
                <div className="quiz-create-section custom-table-scroll">
                    <table className="quiz-create-table custom-question-table">
                        <thead><tr><th>Pays</th>{COUNTRY_QUESTION_MODES.map(mode => <th key={mode.key}>{mode.label}</th>)}</tr></thead>
                        <tbody>
                            {loading ? <tr><td colSpan={COUNTRY_QUESTION_MODES.length + 1} className="quiz-create-loading">Chargement des pays…</td></tr>
                                : filteredCountries.length === 0 ? <tr><td colSpan={COUNTRY_QUESTION_MODES.length + 1} className="quiz-create-empty">Aucun pays correspondant</td></tr>
                                    : filteredCountries.map(country => <tr key={`${country.code}-${country.name}`}>
                                        <td>{country.name}</td>
                                        {COUNTRY_QUESTION_MODES.map(mode => <td key={mode.key}>
                                            <input type="checkbox" className="quiz-create-checkbox" aria-label={`${mode.label} · ${country.name}`} checked={isSelected(mode.key, country.code, "pays")} onChange={() => toggleCountry(country, mode.key)} disabled={!getCustomAnswerValue(mode, country)} />
                                        </td>)}
                                    </tr>)}
                        </tbody>
                    </table>
                </div>
            </section>

            <section className="custom-question-group" aria-labelledby="custom-france-title">
                <div className="custom-group-heading"><div><p className="section-kicker">02 · France</p><h2 id="custom-france-title">Questions par département</h2></div><span>{filteredDepartments.length} départements</span></div>
                <div className="quiz-create-section custom-table-scroll">
                    <table className="quiz-create-table custom-question-table">
                        <thead><tr><th>Département</th>{FRANCE_QUESTION_MODES.map(mode => <th key={mode.key}>{mode.label}</th>)}</tr></thead>
                        <tbody>
                            {loading ? <tr><td colSpan={FRANCE_QUESTION_MODES.length + 1} className="quiz-create-loading">Chargement des départements…</td></tr>
                                : filteredDepartments.length === 0 ? <tr><td colSpan={FRANCE_QUESTION_MODES.length + 1} className="quiz-create-empty">Aucun département correspondant</td></tr>
                                    : filteredDepartments.map(department => <tr key={department.code}>
                                        <td><strong>{department.code}</strong> · {department.nom}</td>
                                        {FRANCE_QUESTION_MODES.map(mode => <td key={mode.key}>
                                            <input type="checkbox" className="quiz-create-checkbox" aria-label={`${mode.label} · ${department.nom}`} checked={isSelected(mode.key, department.code, "france")} onChange={() => toggleDepartment(department, mode.key)} disabled={!getCustomAnswerValue(mode, department)} />
                                        </td>)}
                                    </tr>)}
                        </tbody>
                    </table>
                </div>
            </section>
        </div>
    );
}
