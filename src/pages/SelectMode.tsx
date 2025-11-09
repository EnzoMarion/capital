import { useState } from "react";
import { useNavigate } from "react-router-dom";

const CONTINENTS = [
    "Africa",
    "North America",
    "South America",
    "Asia",
    "Europe",
    "Oceania"
];

export default function SelectMode() {
    const [selected, setSelected] = useState<string>("Europe");
    const navigate = useNavigate();

    function handleStart() {
        // Passe en paramètre le continent sélectionné
        navigate(`/quiz?continent=${encodeURIComponent(selected)}`);
    }

    return (
        <div className="flex flex-col items-center mt-12">
            <h2 className="text-xl font-bold mb-4">Choisis ton continent :</h2>
            <select
                className="mb-4 p-2 rounded border"
                value={selected}
                onChange={e => setSelected(e.target.value)}
            >
                {CONTINENTS.map(cont => (
                    <option key={cont} value={cont}>{cont}</option>
                ))}
            </select>
            <button className="px-4 py-2 bg-blue-600 text-white rounded" onClick={handleStart}>
                Commencer le quiz
            </button>
            <a href="/" className="mt-6 px-4 py-2 bg-gray-300 text-black rounded">Retour accueil</a>
        </div>
    );
}
