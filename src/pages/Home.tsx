import { useNavigate } from "react-router-dom";

export default function Home() {
    const navigate = useNavigate();
    return (
        <div className="home-wrapper">
            <h1>Accueil</h1>
            <div className="home-buttons">
                <button onClick={() => navigate("/quiz-type")}>Mode Capitales</button>
                <button onClick={() => navigate("/quiz-eu-type")}>Mode UE (Année d'entrée)</button>
                <button onClick={() => navigate("/quiz-flags-type")}>Mode Drapeaux</button>
            </div>
            <div className="home-extras">
                <button
                    onClick={() => navigate("/create-quiz")}
                    className="create-quiz-btn"
                >
                    Créer un quiz personnalisé
                </button>
                <button
                    onClick={() => navigate("/my-quizzes")}
                    className="my-quizzes-btn"
                >
                    Mes quiz personnalisés
                </button>
            </div>
        </div>
    );
}
