import type { QuizAttemptSaveStatus } from "../api/quizAttempts";

export default function QuizAttemptStatus({ status, errorMessage, onRetry }: {
    status: QuizAttemptSaveStatus;
    errorMessage?: string | null;
    onRetry: () => void;
}) {
    if (status === "idle") return null;
    if (status === "saving") return <p className="quiz-save-status" role="status">Enregistrement de ta partie…</p>;
    if (status === "saved") return <p className="quiz-save-status quiz-save-status-success" role="status">Partie enregistrée dans tes records.</p>;
    if (status === "signed_out") return <p className="quiz-save-status">Connecte-toi pour enregistrer cette partie dans tes records.</p>;
    return (
        <div className="quiz-save-status quiz-save-status-error" role="alert">
            <span>Cette partie n’a pas pu être enregistrée. Vérifie que les migrations du suivi des scores sont appliquées dans Supabase.</span>
            {errorMessage && <code>{errorMessage}</code>}
            <button type="button" onClick={onRetry}>Réessayer</button>
        </div>
    );
}
