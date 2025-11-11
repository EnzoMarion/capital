import { useState } from "react";
import { useNavigate } from "react-router-dom";

const CONTINENTS = [
    "Africa",
    "North America",
    "South America",
    "Asia",
    "Europe",
    "Oceania",
    "Pacific",
    "Antarctica",
    "Other"
] as const;
type Continent = typeof CONTINENTS[number];

const LABELS: Record<Continent, string> = {
    Africa: "Afrique",
    "North America": "Amérique du Nord",
    "South America": "Amérique du Sud",
    Asia: "Asie",
    Europe: "Europe",
    Oceania: "Océanie",
    Pacific: "Pacifique",
    Antarctica: "Antarctique",
    Other: "Autre"
};

export default function SelectMode() {
    const [selected, setSelected] = useState<Continent[]>([]);
    const navigate = useNavigate();

    function handleChange(cont: Continent) {
        setSelected(sel =>
            sel.includes(cont)
                ? sel.filter(c => c !== cont)
                : [...sel, cont]
        );
    }

    function handleStart() {
        if (selected.length === 0) return;
        // Passe la liste des continents comme query param séparé par des virgules
        navigate(`/quiz?continents=${selected.map(encodeURIComponent).join(",")}`);
    }

    function handleSelectAll() {
        setSelected([...CONTINENTS]);
    }

    function handleClear() {
        setSelected([]);
    }

    return (
        <div className="flex flex-col items-center mt-12">
            <h2 className="text-xl font-bold mb-4">Choisis tes continents :</h2>
            <div className="mb-4 flex flex-wrap gap-x-8 gap-y-2 justify-center">
                {CONTINENTS.map(cont => (
                    <label key={cont} className="flex items-center gap-2 cursor-pointer">
                        <input
                            type="checkbox"
                            checked={selected.includes(cont)}
                            onChange={() => handleChange(cont)}
                        />
                        {LABELS[cont]}
                    </label>
                ))}
            </div>
            <div className="flex gap-3 mb-4">
                <button className="px-3 py-1 bg-gray-100 rounded" type="button" onClick={handleSelectAll}>Tout sélectionner</button>
                <button className="px-3 py-1 bg-gray-100 rounded" type="button" onClick={handleClear}>Tout désélectionner</button>
            </div>
            <button
                className="px-4 py-2 bg-blue-600 text-white rounded"
                onClick={handleStart}
                disabled={selected.length === 0}
            >
                Commencer le quiz
            </button>
            <a href="/" className="mt-6 px-4 py-2 bg-gray-300 text-black rounded">Retour à l'accueil</a>
        </div>
    );
}
