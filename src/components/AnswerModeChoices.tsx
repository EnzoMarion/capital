export type AnswerMode = "input" | "multiple" | "map";

export default function AnswerModeChoices({ onSelect, showMap = false }: { onSelect: (mode: AnswerMode) => void; showMap?: boolean }) {
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
            {showMap && <button type="button" className="answer-mode-card" onClick={() => onSelect("map")}>
                <svg className="answer-mode-icon" viewBox="0 0 48 48" aria-hidden="true">
                    <path d="m5 12 12-5 14 5 12-5v29l-12 5-14-5-12 5V12Z" />
                    <path d="M17 7v29m14-24v29M25 17l5 5-5 5-5-5 5-5Z" />
                </svg>
                <strong>Carte muette</strong>
                <span>Localise l’élément sur une carte, puis valide</span>
            </button>}
        </div>
    );
}
