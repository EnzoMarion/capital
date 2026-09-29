import { Navigate, useSearchParams } from "react-router-dom";

export default function FranceQuizType() {
    const [params] = useSearchParams();
    const scope = params.get("scope") === "regions" ? "regions" : "depts";
    return <Navigate to={`/quiz-type?france=${scope}`} replace />;
}
