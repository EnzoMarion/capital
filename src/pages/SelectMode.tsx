import { useNavigate, useLocation } from "react-router-dom";
import { useState } from "react";
const CONTINENTS = [
    { code: "Europe", label: "Europe" },
    { code: "Asia", label: "Asie" },
    { code: "Africa", label: "Afrique" },
    { code: "North America", label: "Amérique du Nord" },
    { code: "South America", label: "Amérique du Sud" },
    { code: "Oceania", label: "Océanie" },
];
const QUESTION_COUNTS = [10, 25, 50];
export default function SelectMode() {
    const [selectedContinents, setSelectedContinents] = useState<string[]>([]);
    const [withTerritories, setWithTerritories] = useState(false);
    const [onlyTerritories, setOnlyTerritories] = useState(false);
    const [numQuestions, setNumQuestions] = useState<number>(99999); // Défault = tout
    const navigate = useNavigate();
    const location = useLocation();

    function handleContinentChange(code: string, checked: boolean) {
        setSelectedContinents(cs =>
            checked ? [...cs, code] : cs.filter(c => c !== code)
        );
    }

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        const params = new URLSearchParams(location.search);
        if (selectedContinents.length > 0) {
            params.set("continents", selectedContinents.join(","));
        }
        if (withTerritories) {
            params.set("territories", "1");
        }
        if (onlyTerritories) {
            params.set("only_territories", "1");
        }
        params.set("num", String(numQuestions));
        navigate("/quiz?" + params.toString());
    }

    return (
        <form onSubmit={handleSubmit} style={{ maxWidth: 500, margin: "3em auto" }}>
            <h2>Choisis un ou plusieurs continents :</h2>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "1em 1.4em", marginBottom: "2em" }}>
                {CONTINENTS.map(cont => (
                    <label key={cont.code} style={{ display: "flex", alignItems: "center" }}>
                        <input
                            type="checkbox"
                            checked={selectedContinents.includes(cont.code)}
                            onChange={e => handleContinentChange(cont.code, e.target.checked)}
                            disabled={onlyTerritories}
                        />
                        <span style={{ marginLeft: 7 }}>{cont.label}</span>
                    </label>
                ))}
            </div>

            <div style={{marginBottom: "1.2em"}}>
                <label style={{ display: "flex", alignItems: "center", fontWeight: 500, marginBottom: ".7em" }}>
                    <input
                        type="checkbox"
                        checked={withTerritories}
                        onChange={e => setWithTerritories(e.target.checked)}
                        disabled={onlyTerritories}
                        style={{ marginRight: 8 }}
                    />
                    Afficher aussi les territoires/appartenances spéciales (Mayotte, Groenland…)
                </label>
                <label style={{ display: "flex", alignItems: "center", fontWeight: 500 }}>
                    <input
                        type="checkbox"
                        checked={onlyTerritories}
                        onChange={e => setOnlyTerritories(e.target.checked)}
                        style={{ marginRight: 8 }}
                    />
                    Réviser uniquement les territoires/appartenances spéciales (mode entraînement détaillé)
                </label>
            </div>

            <div style={{marginBottom: "2em"}}>
                <label style={{ fontWeight: 500 }}>Nombre de questions du quiz :</label>
                <select
                    value={numQuestions}
                    onChange={e => setNumQuestions(Number(e.target.value))}
                    style={{ marginLeft: 14, fontSize: "1em", padding: "0.25em 1em" }}
                >
                    <option value={99999}>Tout / maximum possible</option>
                    {QUESTION_COUNTS.map(n => (
                        <option key={n} value={n}>{n}</option>
                    ))}
                </select>
                <div style={{fontSize: ".9em", marginTop: "0.3em", color: "#666"}}>
                    (Si la sélection contient moins de pays/territoires que le choix, tout sera pris)
                </div>
            </div>

            <button type="submit" style={{ marginTop: "1.3em" }}>
                Commencer le quiz
            </button>
        </form>
    );
}
