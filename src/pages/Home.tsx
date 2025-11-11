import { useNavigate } from "react-router-dom";

export default function Home() {
    const navigate = useNavigate();
    return (
        <div className="flex flex-col items-center mt-10">
            <h1 className="text-2xl font-bold mb-2">Accueil</h1>
            <p>Bienvenue sur ton site de révision des capitales !</p>
            <div className="flex gap-4 mt-5">
                <button
                    onClick={() => navigate("/modes")}
                    className="px-4 py-2 bg-blue-600 text-white rounded"
                >
                    Mode Capitales
                </button>
                <button
                    onClick={() => navigate("/")}
                    className="px-4 py-2 bg-green-600 text-white rounded"
                >
                    Mode Pays (à venir)
                </button>
            </div>
        </div>
    );
}
