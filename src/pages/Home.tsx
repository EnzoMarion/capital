import { useNavigate } from "react-router-dom";
export default function Home() {
    const navigate = useNavigate();
    return (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginTop: 50 }}>
            <h1>Accueil</h1>
            <div style={{display:'flex',gap:"2em",marginTop:'2em'}}>
                <button onClick={() => navigate("/quiz-type")}>Mode Capitales</button>
                <button onClick={() => navigate("/quiz-eu-type")}>Mode UE (Année d'entrée)</button>
                <button onClick={() => navigate("/quiz-flags-type")}>Mode Drapeaux</button>
            </div>
        </div>
    );
}
