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
    const [numQuestions, setNumQuestions] = useState<number>(99999);
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
        <form onSubmit={handleSubmit} className="config-form">
            <h2>Choisis un ou plusieurs continents :</h2>
            <div className="config-checkboxes">
                {CONTINENTS.map(cont => (
                    <label key={cont.code} className="config-checkbox-label">
                        <input
                            type="checkbox"
                            checked={selectedContinents.includes(cont.code)}
                            onChange={e => handleContinentChange(cont.code, e.target.checked)}
                            disabled={onlyTerritories}
                        />
                        <span>{cont.label}</span>
                    </label>
                ))}
            </div>

            <div className="config-options-group">
                <label className="config-option-label">
                    <input
                        type="checkbox"
                        checked={withTerritories}
                        onChange={e => setWithTerritories(e.target.checked)}
                        disabled={onlyTerritories}
                    />
                    Afficher aussi les territoires/appartenances spéciales (Mayotte, Groenland…)
                </label>
                <label className="config-option-label">
                    <input
                        type="checkbox"
                        checked={onlyTerritories}
                        onChange={e => setOnlyTerritories(e.target.checked)}
                    />
                    Réviser uniquement les territoires/appartenances spéciales (mode entraînement détaillé)
                </label>
            </div>

            <div className="config-select-wrapper">
                <label className="config-select-label">Nombre de questions du quiz :</label>
                <select
                    value={numQuestions}
                    onChange={e => setNumQuestions(Number(e.target.value))}
                    className="config-select"
                >
                    <option value={99999}>Tout / maximum possible</option>
                    {QUESTION_COUNTS.map(n => (
                        <option key={n} value={n}>{n}</option>
                    ))}
                </select>
                <div className="config-select-hint">
                    (Si la sélection contient moins de pays/territoires que le choix, tout sera pris)
                </div>
            </div>

            <button type="submit" className="config-submit-btn">
                Commencer le quiz
            </button>
        </form>
    );
}
