import { useNavigate, useLocation } from "react-router-dom";
import AnswerModeChoices, { type AnswerMode } from "../components/AnswerModeChoices";

export default function QuizTypeSelect() {
    const navigate = useNavigate();
    const location = useLocation();
    const params = new URLSearchParams(location.search);
    const personalQuizId = params.get("quiz_id");
    const franceMode = params.get("france");
    const switzerlandMode = params.get("switzerland");
    const showMap = !personalQuizId && (switzerlandMode === "cantons" || ["regions", "departments", "depts", "1"].includes(franceMode ?? ""));

    function selectType(type: AnswerMode) {
        const selectedType = type === "map" && !showMap ? "multiple" : type;
        params.set("type", selectedType);
        if (personalQuizId || params.get("eu") === "1") {
            navigate(`/quiz?${params.toString()}`);
            return;
        }
        if (franceMode === "mountains" || franceMode === "rivers") {
            const feature = franceMode === "rivers" ? "rivers" : "mountains";
            navigate(`/quiz-france-physical?type=${selectedType}&feature=${feature}`);
            return;
        }
        if (franceMode) {
            const route = franceMode === "regions" ? "/quiz-france-regions" : "/quiz-france-depts";
            const gameParam = franceMode === "departments" || franceMode === "depts" || franceMode === "1" ? "&game=department" : "";
            navigate(`${route}?type=${selectedType}${gameParam}`);
            return;
        }
        if (switzerlandMode === "cantons" || switzerlandMode === "chief-towns") {
            const gameParam = switzerlandMode === "chief-towns" ? "&game=chief-towns" : "";
            navigate(`/quiz-swiss-cantons?type=${selectedType}${gameParam}`);
            return;
        }
        navigate(`/modes?${params.toString()}`);
    }

    return (
        <main className="answer-mode-page">
            <h1>Quel mode de réponse ?</h1>
            <AnswerModeChoices onSelect={selectType} showMap={showMap} />
        </main>
    );
}
