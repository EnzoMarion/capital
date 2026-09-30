import { useEffect, useMemo, useState } from "react";
import { fetchCountries, type Country } from "../api/countries";
import { supabase } from "../api/supabase";
import {
    COUNTRY_QUESTION_MODES,
    FRANCE_QUESTION_MODES,
    SWISS_QUESTION_MODES,
    USA_QUESTION_MODES,
    getCustomAnswerValue,
    type CustomQuestion,
    type CustomQuestionType,
} from "../utils/customQuizModes";
import { SWISS_CANTONS } from "../utils/swissCantons";
import { US_STATES } from "../utils/usStates";

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
    const filteredSwissCantons = useMemo(() => {
        const needle = normalize(search.trim());
        return SWISS_CANTONS.filter(canton => !needle || normalize(`${canton.code} ${canton.name} ${canton.aliases.join(" ")}`).includes(needle));
    }, [search]);

    function isSelected(type: CustomQuestionType, code: string, group: "pays" | "france" | "suisse" | "usa") {
        return selectedQuestions.some(question => question.question_type === type &&
            (group === "pays" ? question.country_code === code : group === "france" ? question.department_code === code : group === "suisse" ? question.canton_code === code : question.state_code === code));
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

    function toggleSwissCanton(canton: (typeof SWISS_CANTONS)[number], type: CustomQuestionType) {
        setSelectedQuestions(previous => {
            if (previous.some(question => question.question_type === type && question.canton_code === canton.code)) {
                return previous.filter(question => !(question.question_type === type && question.canton_code === canton.code));
            }
            return [...previous, { canton_code: canton.code, canton_name: canton.name, question_type: type }];
        });
    }

    function toggleUSState(state: (typeof US_STATES)[number], type: CustomQuestionType) {
        setSelectedQuestions(previous => {
            if (previous.some(question => question.question_type === type && question.state_code === state.code)) {
                return previous.filter(question => !(question.question_type === type && question.state_code === state.code));
            }
            return [...previous, { state_code: state.code, state_name: state.name, question_type: type }];
        });
    }

    const filteredUSStates = useMemo(() => {
        const needle = normalize(search.trim());
        return US_STATES.filter(state => !needle || normalize(`${state.code} ${state.name} ${state.capital} ${(state.aliases ?? []).join(" ")}`).includes(needle));
    }, [search]);

    return (
        <div className="custom-quiz-builder">
            <header className="custom-builder-heading">
                <p className="section-kicker">Collection personnalisée</p>
                <h1>Créer un quiz personnalisé</h1>
            <p>Choisis les questions à inclure. Tu choisiras le mode de réponse au lancement.</p>
            <p className="custom-data-minimization-note">N’ajoute pas de nom, de coordonnées ou d’autres informations personnelles dans le titre ou la description.</p>
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

            <details className="custom-question-group custom-question-accordion">
                <summary className="custom-group-heading"><div><p className="section-kicker">01 · Monde</p><h2>Questions par pays</h2></div><span className="custom-group-summary-meta"><span>{filteredCountries.length} pays</span><i aria-hidden="true" /></span></summary>
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
            </details>

            <details className="custom-question-group custom-question-accordion">
                <summary className="custom-group-heading"><div><p className="section-kicker">02 · France</p><h2>Questions par département</h2></div><span className="custom-group-summary-meta"><span>{filteredDepartments.length} départements</span><i aria-hidden="true" /></span></summary>
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
            </details>

            <details className="custom-question-group custom-question-accordion">
                <summary className="custom-group-heading"><div><p className="section-kicker">03 · Suisse</p><h2>Questions par canton</h2></div><span className="custom-group-summary-meta"><span>{filteredSwissCantons.length} cantons</span><i aria-hidden="true" /></span></summary>
                <div className="quiz-create-section custom-table-scroll">
                    <table className="quiz-create-table custom-question-table">
                        <thead><tr><th>Canton</th>{SWISS_QUESTION_MODES.map(mode => <th key={mode.key}>{mode.label}</th>)}</tr></thead>
                        <tbody>
                            {filteredSwissCantons.length === 0 ? <tr><td colSpan={SWISS_QUESTION_MODES.length + 1} className="quiz-create-empty">Aucun canton correspondant</td></tr>
                                : filteredSwissCantons.map(canton => <tr key={canton.code}>
                                    <td><strong>{canton.code}</strong> · {canton.name}</td>
                                    {SWISS_QUESTION_MODES.map(mode => <td key={mode.key}>
                                        <input type="checkbox" className="quiz-create-checkbox" aria-label={`${mode.label} · ${canton.name}`} checked={isSelected(mode.key, canton.code, "suisse")} onChange={() => toggleSwissCanton(canton, mode.key)} />
                                    </td>)}
                                </tr>)}
                        </tbody>
                    </table>
                </div>
            </details>

            <details className="custom-question-group custom-question-accordion">
                <summary className="custom-group-heading"><div><p className="section-kicker">04 · États-Unis</p><h2>Questions par État</h2></div><span className="custom-group-summary-meta"><span>{filteredUSStates.length} États</span><i aria-hidden="true" /></span></summary>
                <div className="quiz-create-section custom-table-scroll">
                    <table className="quiz-create-table custom-question-table">
                        <thead><tr><th>État</th>{USA_QUESTION_MODES.map(mode => <th key={mode.key}>{mode.label}</th>)}</tr></thead>
                        <tbody>
                            {filteredUSStates.length === 0 ? <tr><td colSpan={USA_QUESTION_MODES.length + 1} className="quiz-create-empty">Aucun État correspondant</td></tr>
                                : filteredUSStates.map(state => <tr key={state.code}>
                                    <td><strong>{state.code}</strong> · {state.name}</td>
                                    {USA_QUESTION_MODES.map(mode => <td key={mode.key}>
                                        <input type="checkbox" className="quiz-create-checkbox" aria-label={`${mode.label} · ${state.name}`} checked={isSelected(mode.key, state.code, "usa")} onChange={() => toggleUSState(state, mode.key)} />
                                    </td>)}
                                </tr>)}
                        </tbody>
                    </table>
                </div>
            </details>
        </div>
    );
}
