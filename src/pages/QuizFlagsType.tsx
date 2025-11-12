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

export default function QuizFlagsType() {
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

    function startQuiz(type: "multiple" | "input") {
        const params = new URLSearchParams(location.search);
        params.set("flags", "1");
        params.set("type", type);
        if (selectedContinents.length > 0) {
            params.set("continents", selectedContinents.join(","));
        }
        if (withTerritories) params.set("territories", "1");
        if (onlyTerritories) params.set("only_territories", "1");
        params.set("num", String(numQuestions));
        navigate(`/quiz?${params.toString()}`);
    }

    return (
        <form style={{ maxWidth: 500, margin: "3em auto" }} onSubmit={e => e.preventDefault()}>
            <h2>Mode Drapeaux</h2>
            <div style={{ marginBottom:25, fontWeight:600 }}>Choisis un ou plusieurs continents :</div>
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
            <label style={{ display: "flex", alignItems: "center", marginBottom: "2em", fontWeight: 500 }}>
                <input
                    type="checkbox"
                    checked={withTerritories}
                    onChange={e => setWithTerritories(e.target.checked)}
                    style={{ marginRight: "0.6em" }}
                    disabled={onlyTerritories}
                />
                Afficher aussi les territoires/appartenances spéciales
            </label>
            <label style={{ display: "flex", alignItems: "center", marginBottom:"2em", fontWeight: 500 }}>
                <input
                    type="checkbox"
                    checked={onlyTerritories}
                    onChange={e => setOnlyTerritories(e.target.checked)}
                    style={{ marginRight: "0.6em" }}
                />
                Réviser uniquement les territoires/appartenances spéciales
            </label>
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
            </div>
            <div style={{display:"flex",gap:"2em",marginTop:"2em", justifyContent:"center"}}>
                <button type="button"
                        style={{padding:"15px 32px",fontWeight:600,background:"#646cff",color:"#fff",border:"none",borderRadius:7,fontSize:"1.14em"}}
                        onClick={() => startQuiz("multiple")}
                >
                    QCM (type=multiple)
                </button>
                <button type="button"
                        style={{padding:"15px 32px",fontWeight:600,background:"#1bc47d",color:"#fff",border:"none",borderRadius:7,fontSize:"1.14em"}}
                        onClick={() => startQuiz("input")}
                >
                    Saisie (type=input)
                </button>
            </div>
        </form>
    );
}
