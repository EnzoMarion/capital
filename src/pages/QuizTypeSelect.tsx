import { useNavigate, useLocation } from "react-router-dom";
import AnswerModeChoices from "../components/AnswerModeChoices";

export default function QuizTypeSelect() {
    const navigate = useNavigate();
    const location = useLocation();

    function selectType(type: "input" | "multiple") {
        const params = new URLSearchParams(location.search);
        params.set("type", type);
        navigate(`/modes?${params.toString()}`);
    }

    return (
        <main className="answer-mode-page">
            <h1>Quel mode de réponse ?</h1>
            <AnswerModeChoices onSelect={selectType} />
        </main>
    );
}
