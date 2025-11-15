import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { supabase } from "../api/supabase";
import { fetchCountries, type Country } from "../api/countries";

type CustomQuestion = {
    country_code: string;
    country_name: string;
    question_type: "capitale" | "drapeau" | "annee_eu";
};

const QUESTION_TYPES = [
    { key: "capitale", label: "Capitale" },
    { key: "drapeau", label: "Drapeau" },
    { key: "annee_eu", label: "Année UE" }
];
const CONTINENTS = [
    "Europe", "Asia", "Africa", "North America", "South America", "Oceania"
];

export default function EditQuiz() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const { id } = useParams<{ id: string }>();
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [inputType, setInputType] = useState<"multiple" | "input">("multiple");
    const [selectedQuestions, setSelectedQuestions] = useState<CustomQuestion[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [allCountries, setAllCountries] = useState<Country[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [continentFilter, setContinentFilter] = useState<string[]>([]);
    const [search, setSearch] = useState("");

    // Chargement pays
    useEffect(() => {
        fetchCountries()
            .then(data => setAllCountries(data))
            .catch(() => setAllCountries([]))
            .finally(() => setLoading(false));
    }, []);

    // Chargement quiz à éditer
    useEffect(() => {
        if (!user || !id) return;
        supabase.from("quizzes").select("*").eq("id", id).single()
            .then(({ data, error }) => {
                if (error) setError("Erreur de chargement du quiz.");
                if (data) {
                    setTitle(data.title || "");
                    setDescription(data.description || "");
                    let settingsObj = data.settings;
                    if (typeof settingsObj === "string") {
                        try {
                            settingsObj = JSON.parse(settingsObj);
                        } catch {
                            // ignore parse error; settingsObj remains as is
                        }
                    }
                    setInputType(settingsObj?.inputType === "input" ? "input" : "multiple");
                    setSelectedQuestions(Array.isArray(settingsObj.questions) ? settingsObj.questions : []);
                }
            });
    }, [user, id]);

    function toggleQuestion(country_code: string, country_name: string, type: CustomQuestion["question_type"]) {
        const index = selectedQuestions.findIndex(
            q => q.country_code === country_code && q.question_type === type
        );
        if (index >= 0) {
            setSelectedQuestions(sq => sq.filter((_, i) => i !== index));
        } else {
            setSelectedQuestions(sq => [...sq, { country_code, question_type: type, country_name }]);
        }
    }

    async function handleDeleteQuiz() {
        setError(null);
        if (!id) return;
        if (!window.confirm("Supprimer définitivement ce quiz ?")) return;

        let parsedId: string | number = id;
        if (!isNaN(Number(id))) parsedId = Number(id);

        // Debug: On vérifie d'abord si le quiz existe pour ce user
        const { data: quizExists, error: existErr } = await supabase.from("quizzes")
            .select("id, user_id")
            .eq("id", parsedId);

        if (existErr) {
            setError("Erreur lecture quiz : " + existErr.message);
            return;
        }
        if (!quizExists || quizExists.length === 0) {
            setError("Ce quiz n'existe pas ou n'est pas à vous.");
            return;
        }

        // Action delete réelle
        const { error: deleteError } = await supabase.from("quizzes")
            .delete()
            .eq("id", parsedId);
        if (deleteError) {
            setError("Erreur suppression quiz : " + deleteError.message);
        } else {
            navigate("/my-quizzes");
        }
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setError(null);
        if (!user || !selectedQuestions.length || !id) {
            setError("Formulaire incomplet.");
            return;
        }
        const settings = {
            questions: selectedQuestions,
            mode: "custom_sequence",
            inputType,
        };
        let parsedId: string | number = id;
        if (!isNaN(Number(id))) parsedId = Number(id);

        const { error: updateError } = await supabase.from("quizzes")
            .update({ title, description, settings })
            .eq("id", parsedId);
        if (!updateError) {
            navigate("/my-quizzes");
        } else {
            setError("Erreur modification quiz : " + updateError.message);
        }
    }

    // Filtrage dashboard
    let filtered = allCountries;
    if (continentFilter.length > 0) {
        filtered = filtered.filter(c => continentFilter.includes(c.continent));
    }
    if (search.length > 0) {
        filtered = filtered.filter(c =>
            c.name.toLowerCase().includes(search.toLowerCase())
        );
    }

    return (
        <form className="quiz-card input-mode quiz-create-form" onSubmit={handleSubmit}>
            <h2 className="quiz-create-h2">Modifier mon quiz</h2>
            <div className="quiz-create-titlebox">
                <input
                    required
                    className="quiz-create-title"
                    value={title}
                    onChange={e => setTitle(e.target.value)}
                    placeholder="Titre du quiz"
                />
                <input
                    className="quiz-create-desc"
                    value={description}
                    onChange={e => setDescription(e.target.value)}
                    placeholder="Description (optionnelle)"
                />
            </div>
            <div className="quiz-create-typebox">
                <span>Type de réponse :</span>
                <label>
                    <input type="radio" name="quiz-type"
                           checked={inputType === "multiple"}
                           onChange={() => setInputType("multiple")}
                    />
                    QCM
                </label>
                <label>
                    <input type="radio" name="quiz-type"
                           checked={inputType === "input"}
                           onChange={() => setInputType("input")}
                    />
                    Saisie
                </label>
            </div>
            <div className="quiz-create-toolbar">
                <span>Filtrer :</span>
                <div className="quiz-create-filters">
                    {CONTINENTS.map(c => (
                        <label key={c}>
                            <input type="checkbox" checked={continentFilter.includes(c)} onChange={(e) => {
                                setContinentFilter(cf => e.target.checked ? [...cf, c] : cf.filter(cc => cc !== c));
                            }}/>
                            {c}
                        </label>
                    ))}
                </div>
                <input
                    type="text"
                    className="quiz-create-search"
                    placeholder="Recherche pays…"
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                />
            </div>
            <div className="quiz-create-section">
                <table className="quiz-create-table">
                    <thead>
                    <tr>
                        <th>Pays</th>
                        {QUESTION_TYPES.map(qt => (
                            <th key={qt.key}>{qt.label}</th>
                        ))}
                    </tr>
                    </thead>
                    <tbody>
                    {loading ? (
                        <tr><td colSpan={1+QUESTION_TYPES.length} className="quiz-create-loading">Chargement…</td></tr>
                    ) : filtered.length === 0 ? (
                        <tr><td colSpan={1+QUESTION_TYPES.length} className="quiz-create-empty">Aucun pays</td></tr>
                    ) : filtered.map(c => (
                        <tr key={`${c.code}-${c.name}`}>
                            <td>{c.name}</td>
                            {QUESTION_TYPES.map(qt => (
                                <td key={`${c.code}-${c.name}-${qt.key}`}>
                                    <input
                                        type="checkbox"
                                        className="quiz-create-checkbox"
                                        checked={!!selectedQuestions.find(q => q.country_code === c.code && q.question_type === qt.key)}
                                        onChange={() => toggleQuestion(c.code, c.name, qt.key as CustomQuestion["question_type"])}
                                        disabled={qt.key === "annee_eu" && !c.ue_date}
                                    />
                                </td>
                            ))}
                        </tr>
                    ))}
                    </tbody>
                </table>
            </div>
            <div className="quiz-create-error">{error}</div>
            <div style={{display:"flex",gap:15,marginTop:18,justifyContent:"space-between"}}>
                <button type="button"
                        className="quiz-delete-btn"
                        style={{background:"#e74c3c",color:"#fff"}}
                        onClick={handleDeleteQuiz}>
                    Supprimer ce quiz
                </button>
                <button type="submit" className="quiz-create-btn">
                    Sauvegarder les modifications
                </button>
            </div>
        </form>
    );
}
