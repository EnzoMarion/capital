import { useNavigate } from "react-router-dom";
export default function Home() {
    const navigate = useNavigate();
    return (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginTop: 50 }}>
            <h1>Accueil</h1>
            <button onClick={() => navigate("/quiz-type")}>Mode Capitales</button>
            {/* Autres modes plus tard */}
        </div>
    );
}
