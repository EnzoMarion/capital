import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { logout } from "../api/auth";
import { useNavigate, useLocation } from "react-router-dom";

export default function AuthStatusIcon() {
    const { user, setUser } = useAuth();
    const [open, setOpen] = useState(false);
    const navigate = useNavigate();
    const location = useLocation();

    if (location.pathname === "/login") return null;

    if (!user) return (
        <div className="auth-icon-wrapper">
            <button
                aria-label="Aller à la connexion"
                className="auth-icon-btn"
                onClick={() => navigate("/login")}
            >
                <svg width="28" height="28" viewBox="0 0 20 20" fill="#999">
                    <circle cx="10" cy="7" r="4"/>
                    <rect x="4" y="14" width="12" height="5" rx="4"/>
                </svg>
            </button>
        </div>
    );

    return (
        <>
            <div className="auth-icon-wrapper">
                <button
                    aria-label="Profil utilisateur"
                    onClick={() => setOpen(true)}
                    className="auth-icon-btn"
                >
                    <svg width="38" height="30" viewBox="0 0 20 20" fill="#646cff">
                        <circle cx="10" cy="7" r="4"/>
                        <rect x="4" y="14" width="12" height="5" rx="4"/>
                    </svg>
                </button>
            </div>

            {open && (
                <div
                    className="auth-modal-overlay"
                    onClick={() => setOpen(false)}
                    aria-modal="true"
                    role="dialog"
                >
                    <div
                        onClick={e => e.stopPropagation()}
                        className="auth-modal-content"
                    >
                        <svg width="44" height="44" viewBox="0 0 20 20" fill="#646cff" className="auth-modal-avatar">
                            <circle cx="10" cy="7" r="4"/>
                            <rect x="4" y="14" width="12" height="5" rx="4"/>
                        </svg>
                        <div className="auth-modal-email">{user.email}</div>
                        <button
                            className="auth-modal-logout"
                            onClick={async () => {
                                await logout();
                                setOpen(false);
                                setUser(null);
                                navigate("/");
                            }}
                        >
                            Déconnexion
                        </button>
                        <button
                            onClick={() => setOpen(false)}
                            className="auth-modal-close"
                        >
                            Fermer
                        </button>
                    </div>
                </div>
            )}
        </>
    );
}
