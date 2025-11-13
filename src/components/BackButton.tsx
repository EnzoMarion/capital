import { useNavigate, useLocation } from "react-router-dom";

export default function BackButton() {
    const navigate = useNavigate();
    const location = useLocation();

    // Cache sur Home
    if (location.pathname === "/") return null;

    return (
        <aside
            className="backbar"
            onClick={() => navigate(-1)}
            tabIndex={0}
            aria-label="Retour à la page précédente"
            role="button"
            onKeyDown={e => (e.key === "Enter" || e.key === " ") && navigate(-1)}
        >
            <div className="backbar-content">
                <span className="backbar-txt">Retour</span>
            </div>
        </aside>
    );
}
