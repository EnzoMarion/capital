import { useNavigate, useLocation } from "react-router-dom";
export default function QuizTypeSelect() {
    const navigate = useNavigate();
    const location = useLocation();
    function selectType(type: "input" | "multiple") {
        const params = new URLSearchParams(location.search);
        params.set("type", type);
        navigate(`/modes?${params.toString()}`);
    }
    return (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginTop: 60 }}>
            <h1>Quel mode de réponse ?</h1>
            <button style={{margin: "1em"}} onClick={() => selectType("input")}>Saisie libre (écrire la capitale)</button>
            <button style={{margin: "1em"}} onClick={() => selectType("multiple")}>Choix multiple (QCM)</button>
        </div>
    );
}
