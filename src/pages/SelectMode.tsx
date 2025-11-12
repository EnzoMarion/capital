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
export default function SelectMode() {
    const [selectedContinents, setSelectedContinents] = useState<string[]>([]);
    const [withTerritories, setWithTerritories] = useState(false);
    const navigate = useNavigate();
    const location = useLocation();

    function handleContinentChange(code: string, checked: boolean) {
        setSelectedContinents(cs =>
            checked ? [...cs, code] : cs.filter(c => c !== code)
        );
    }
    function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        const params = new URLSearchParams(location.search); // récupère &type=multiple
        if (selectedContinents.length > 0) {
            params.set("continents", selectedContinents.join(","));
        }
        if (withTerritories) {
            params.set("territories", "1");
        }
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
                        />
                        <span style={{ marginLeft: 7 }}>{cont.label}</span>
                    </label>
                ))}
            </div>
            <label style={{ display: "flex", alignItems: "center", marginBottom: "2em", fontWeight: 500 }}>
                <input
                    type="checkbox"
                    checked={withTerritories}
                    onChange={e => setWithTerritories(e.target.checked)}
                    style={{ marginRight: "0.6em" }}
                />
                Afficher aussi les territoires/appartenances spéciales (Mayotte, Groenland…)
            </label>
            <button type="submit" style={{ marginTop: "1.3em" }}>
                Commencer le quiz
            </button>
        </form>
    );
}
