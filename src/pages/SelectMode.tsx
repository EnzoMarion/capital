import { useNavigate, useLocation } from "react-router-dom";
import { useState } from "react";
import TerritoryModePicker, { type TerritoryMode } from "../components/TerritoryModePicker";

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
    const [territoryMode, setTerritoryMode] = useState<TerritoryMode>("countries");
    const [numQuestions, setNumQuestions] = useState<number>(99999);
    const navigate = useNavigate();
    const location = useLocation();
    const sourceParams = new URLSearchParams(location.search);
    const franceMode = sourceParams.get("france");
    const isFranceQuiz = franceMode === "depts" || franceMode === "regions";
    const isEuMode = sourceParams.get("eu") === "1";

    function handleContinentChange(code: string, checked: boolean) {
        setSelectedContinents(cs => checked ? [...cs, code] : cs.filter(c => c !== code));
    }

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (isFranceQuiz) {
            const type = sourceParams.get("type") === "input" ? "input" : "multiple";
            navigate(`/quiz-france-${franceMode}?type=${type}`);
            return;
        }

        const params = new URLSearchParams(location.search);
        params.delete("france");
        params.delete("continents");
        params.delete("territories");
        params.delete("only_territories");
        if (selectedContinents.length > 0) params.set("continents", selectedContinents.join(","));
        if (!isEuMode && territoryMode === "with-territories") params.set("territories", "1");
        if (!isEuMode && territoryMode === "territories-only") params.set("only_territories", "1");
        params.set("num", String(numQuestions));
        navigate(`/quiz?${params.toString()}`);
    }

    return (
        <form onSubmit={handleSubmit} className={`config-form ${isFranceQuiz ? "config-form-ready" : ""}`}>
            <p className="section-kicker">Paramètres du quiz</p>
            <h2>{isFranceQuiz
                ? franceMode === "depts" ? "Départements français" : "Régions françaises"
                : isEuMode ? "Choisis les pays de l’Union européenne à réviser :" : "Choisis un ou plusieurs continents :"}</h2>

            {isFranceQuiz ? (
                <p className="config-ready-copy">Ton mode de réponse est choisi. La partie complète est prête.</p>
            ) : (
                <>
                    <div className="config-checkboxes">
                        {CONTINENTS.map(cont => (
                            <label key={cont.code} className="config-checkbox-label">
                                <input
                                    type="checkbox"
                                    checked={selectedContinents.includes(cont.code)}
                                    onChange={e => handleContinentChange(cont.code, e.target.checked)}
                                    disabled={territoryMode === "territories-only"}
                                />
                                <span>{cont.label}</span>
                            </label>
                        ))}
                    </div>

                    {!isEuMode && <TerritoryModePicker value={territoryMode} onChange={setTerritoryMode} />}

                    <div className="config-select-wrapper">
                        <label className="config-select-label">Nombre de questions :</label>
                        <select
                            value={numQuestions}
                            onChange={e => setNumQuestions(Number(e.target.value))}
                            className="config-select"
                        >
                            <option value={99999}>Tout / maximum possible</option>
                            {QUESTION_COUNTS.map(n => <option key={n} value={n}>{n}</option>)}
                        </select>
                    </div>
                </>
            )}

            <button type="submit" className="config-submit-btn">
                {isFranceQuiz ? "Commencer le quiz" : "Continuer"}
            </button>
        </form>
    );
}
