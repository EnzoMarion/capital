import { useNavigate } from "react-router-dom";

export default function QuizEuType() {
    const navigate = useNavigate();
    return (
        <div className="mode-select-wrapper">
            <h2>Mode Union Européenne</h2>
            <button className="mode-btn" onClick={() => navigate("/quiz?eu=1&type=input")}>Saisie (année)</button>
            <button className="mode-btn" onClick={() => navigate("/quiz?eu=1&type=multiple")}>QCM (année)</button>
        </div>
    );
}
