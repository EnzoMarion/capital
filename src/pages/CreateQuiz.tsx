import { useState, useEffect } from "react";
import { supabase } from "../api/supabase";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { fetchCountries, type Country } from "../api/countries";

const QUESTION_TYPES = [
    { key: "capitale", label: "Capitale" },
    { key: "drapeau", label: "Drapeau" },
    { key: "annee_eu", label: "Année UE" }
];
const CONTINENTS = [
    "Europe", "Asia", "Africa", "North America", "South America", "Oceania"
];

export default function CreateQuiz() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [selectedQuestions, setSelectedQuestions] = useState<any[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [allCountries, setAllCountries] = useState<Country[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [continentFilter, setContinentFilter] = useState<string[]>([]);
    const [search, setSearch] = useState("");

    useEffect(() => {
        fetchCountries()
            .then(data => setAllCountries(data))
            .catch(() => setAllCountries([]))
            .finally(() => setLoading(false));
    }, []);

    function toggleQuestion(country_code: string, country_name: string, type: string) {
        const index = selectedQuestions.findIndex(
            q => q.country_code === country_code && q.question_type === type
        );
        if (index >= 0) {
            setSelectedQuestions(sq => sq.filter((_, i) => i !== index));
        } else {
            setSelectedQuestions(sq => [...sq, { country_code, question_type: type, country_name }]);
        }
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (!user || !selectedQuestions.length) return;
        const settings = { questions: selectedQuestions, mode: "custom_sequence" };
        const { error } = await supabase.from("quizzes").insert([
            { user_id: user.id, title, description, settings }
        ]);
        if (!error) navigate("/my-quizzes");
        else setError("Erreur création quiz");
    }

    // Filtrage côté dashboard
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
        <form className="quiz-card input-mode" onSubmit={handleSubmit} style={{ maxWidth: 800, margin: "auto" }}>
            <h2 className="quiz-create-h2">Créer un quiz personnalisé</h2>
            <div className="quiz-create-titlebox">
                <input
                    required
                    value={title}
                    onChange={e => setTitle(e.target.value)}
                    placeholder="Titre du quiz"
                />
                <input
                    value={description}
                    onChange={e => setDescription(e.target.value)}
                    placeholder="Description (optionnelle)"
                />
            </div>
            <div className="quiz-create-toolbar">
                <span style={{ fontWeight: 500 }}>Filtrer :</span>
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
                        <tr><td colSpan={1+QUESTION_TYPES.length} style={{textAlign:'center'}}>Chargement…</td></tr>
                    ) : filtered.length === 0 ? (
                        <tr><td colSpan={1+QUESTION_TYPES.length} style={{textAlign:'center'}}>Aucun pays</td></tr>
                    ) : filtered.map(c => (
                        <tr key={`${c.code}-${c.name}`}>
                            <td>{c.name}</td>
                            {QUESTION_TYPES.map(qt => (
                                <td key={`${c.code}-${c.name}-${qt.key}`}>
                                    <input
                                        type="checkbox"
                                        checked={!!selectedQuestions.find(q => q.country_code === c.code && q.question_type === qt.key)}
                                        onChange={() => toggleQuestion(c.code, c.name, qt.key)}
                                    />
                                </td>
                            ))}
                        </tr>
                    ))}
                    </tbody>
                </table>
            </div>
            <div style={{color:'#ff5555',marginTop:8}}>{error}</div>
            <button type="submit" className="quiz-create-btn">Créer mon quiz vraiment personnalisé !</button>
        </form>
    );
}
