import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Home() {
    const { user } = useAuth();
    const navigate = useNavigate();
    return (
        <div className="home-wrapper">
            <h1>Monde</h1>
            <div className="home-buttons">
                <button onClick={() => navigate("/quiz-type")}>Mode Capitales</button>
                <button onClick={() => navigate("/quiz-eu-type")}>Mode UE (Année d'entrée)</button>
                <button onClick={() => navigate("/quiz-flags-type")}>Mode Drapeaux</button>
                <button onClick={() => navigate("/revision")} className="revision-btn">Mode Révision</button>
            </div>
            <div className="home-extras">
                {user ? (
                    <>
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
                    </>
                ) : (
                    <div className="home-connect-warning">
                        Il faut être connecté pour accéder à vos quiz personnalisés.
                    </div>
                )}
            </div>
            <h1 style={{marginTop: "2.6rem", marginBottom: ".55em"}}>France</h1>
            <div className="home-buttons">
                <button onClick={() => navigate("/quiz-france-depts")}>Mode Départements</button>
                <button onClick={() => navigate("/quiz-france-regions")}>Mode Régions</button>
            </div>
        </div>
    );
}
