import { Link } from "react-router-dom";
import type { QuizAttemptSaveStatus } from "../api/quizAttempts";
import QuizAttemptStatus from "../components/QuizAttemptStatus";

export type FranceAnswer = {
    question: string;
    userAnswer: string;
    correctAnswer: string;
    isCorrect: boolean;
};

export default function FranceQuizResult({ title, answers, onRestart, saveStatus, saveError, onRetrySave }: {
    title: string;
    answers: FranceAnswer[];
    onRestart: () => void;
    saveStatus: QuizAttemptSaveStatus;
    saveError: string | null;
    onRetrySave: () => void;
}) {
    const score = answers.filter(answer => answer.isCorrect).length;
    const percent = answers.length ? Math.floor((score / answers.length) * 100) : 0;
    const errors = answers.filter(answer => !answer.isCorrect);

    return (
        <main className="quiz-result-wrapper france-result-wrapper">
            <section className="recap-card">
                <p className="section-kicker">Résultats</p>
                <h2>{title}</h2>
                <div className="recap-score">{percent} %</div>
                <QuizAttemptStatus status={saveStatus} errorMessage={saveError} onRetry={onRetrySave} />
                <div className="recap-progress">{score} bonnes réponses sur {answers.length}</div>
                <p className="recap-error-count">{errors.length} erreur{errors.length === 1 ? "" : "s"}</p>
                {errors.length ? (
                    <div className="france-recap-errors">
                        <h3>À revoir</h3>
                        <div className="france-recap-list">
                            {errors.map((item, index) => (
                                <article className="france-recap-item" key={`${item.question}-${index}`}>
                                    <strong>{item.question}</strong>
                                    <span>Ta réponse : <em>{item.userAnswer || "(vide)"}</em></span>
                                    <span>Bonne réponse : <b>{item.correctAnswer}</b></span>
                                </article>
                            ))}
                        </div>
                    </div>
                ) : <p className="recap-success-msg">Tout juste ! Toutes les réponses sont correctes.</p>}
                <div className="recap-actions">
                    <button type="button" onClick={onRestart}>Rejouer</button>
                    <Link to="/">Retour à l’accueil</Link>
                </div>
            </section>
        </main>
    );
}
