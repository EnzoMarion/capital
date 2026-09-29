type AnswerMode = "input" | "multiple";

export default function AnswerModeChoices({ onSelect }: { onSelect: (mode: AnswerMode) => void }) {
    return (
        <div className="answer-mode-grid" aria-label="Choisis un mode de réponse">
            <button type="button" className="answer-mode-card" onClick={() => onSelect("multiple")}>
                <svg className="answer-mode-icon" viewBox="0 0 48 48" aria-hidden="true">
                    <rect x="6" y="8" width="36" height="32" rx="8" />
                    <path d="M16 19h2m6 0h2m6 0h2M15 28h18M15 34h11" />
                </svg>
                <strong>QCM</strong>
                <span>Choisis parmi plusieurs réponses</span>
            </button>
            <button type="button" className="answer-mode-card" onClick={() => onSelect("input")}>
                <svg className="answer-mode-icon" viewBox="0 0 48 48" aria-hidden="true">
                    <path d="M9 36h8l21-21a5.7 5.7 0 0 0-8-8L9 28v8Z" />
                    <path d="m27 10 8 8M8 42h32" />
                </svg>
                <strong>Saisie libre</strong>
                <span>Écris la réponse sans choix proposés</span>
            </button>
        </div>
    );
}
