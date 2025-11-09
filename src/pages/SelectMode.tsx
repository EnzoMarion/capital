import { useState } from "react";
import { useNavigate } from "react-router-dom";

const CONTINENTS = [
    "Africa",
    "North America",
    "South America",
    "Asia",
    "Europe",
    "Oceania"
] as const;
type Continent = typeof CONTINENTS[number];

const LABELS: Record<Continent, string> = {
    Africa: "Afrique",
    "North America": "Amérique du Nord",
    "South America": "Amérique du Sud",
    Asia: "Asie",
    Europe: "Europe",
    Oceania: "Océanie"
};

export default function SelectMode() {
    const [selected, setSelected] = useState<Continent>(CONTINENTS[0]);
    const navigate = useNavigate();

    function handleStart() {
        navigate(`/quiz?continent=${encodeURIComponent(selected)}`);
    }

    return (
        <div className="flex flex-col items-center mt-12">
            <h2 className="text-xl font-bold mb-4">Choisis ton continent :</h2>
            <select
                className="mb-4 p-2 rounded border"
                value={selected}
                onChange={e => setSelected(e.target.value as Continent)}
            >
                {CONTINENTS.map(cont => (
                    <option key={cont} value={cont}>{LABELS[cont]}</option>
                ))}
            </select>
            <button
                className="px-4 py-2 bg-blue-600 text-white rounded"
                onClick={handleStart}
            >
                Commencer le quiz
            </button>
            <a href="/" className="mt-6 px-4 py-2 bg-gray-300 text-black rounded">Retour à l'accueil</a>
        </div>
    );
}
