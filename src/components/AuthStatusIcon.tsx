import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { logout } from "../api/auth";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { downloadMyData, deleteMyAccount } from "../api/personalData";
import { supabase } from "../api/supabase";

export default function AuthStatusIcon() {
    const { user, setUser, loading } = useAuth();
    const [open, setOpen] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [signingOut, setSigningOut] = useState(false);
    const [exportingData, setExportingData] = useState(false);
    const [deletingAccount, setDeletingAccount] = useState(false);
    const [privacyActionMessage, setPrivacyActionMessage] = useState<string | null>(null);
    const navigate = useNavigate();
    const location = useLocation();

    useEffect(() => {
        if (!open) return;
        const closeOnEscape = (event: KeyboardEvent) => { if (event.key === "Escape") setOpen(false); };
        window.addEventListener("keydown", closeOnEscape);
        return () => window.removeEventListener("keydown", closeOnEscape);
    }, [open]);

    if (location.pathname === "/login" || loading) return null;

    if (!user) return (
        <div className="auth-icon-wrapper">
            <button
                aria-label="Se connecter ou créer un compte"
                className="auth-icon-btn"
                onClick={() => navigate("/login")}
            >
                <svg width="28" height="28" viewBox="0 0 20 20" fill="#999">
                    <circle cx="10" cy="7" r="4"/>
                    <rect x="4" y="14" width="12" height="5" rx="4"/>
                </svg><span>Se connecter</span>
            </button>
        </div>
    );

    return (
        <>
            <div className="auth-icon-wrapper">
                <button
                    aria-label="Profil utilisateur"
                    onClick={() => { setError(null); setPrivacyActionMessage(null); setOpen(true); }}
                    className="auth-icon-btn"
                >
                    <svg width="22" height="22" viewBox="0 0 20 20" fill="#176b55">
                        <circle cx="10" cy="7" r="4"/>
                        <rect x="4" y="14" width="12" height="5" rx="4"/>
                    </svg><span>Compte</span>
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
                        onKeyDown={e => e.key === "Escape" && setOpen(false)}
                        aria-labelledby="account-title"
                    >
                        <svg width="44" height="44" viewBox="0 0 20 20" fill="#646cff" className="auth-modal-avatar">
                            <circle cx="10" cy="7" r="4"/>
                            <rect x="4" y="14" width="12" height="5" rx="4"/>
                        </svg>
                        <div id="account-title" className="auth-modal-email">{user.email}</div>
                        {error && <p className="auth-message error" role="alert">{error}</p>}
                        <div className="account-privacy-actions">
                            <button
                                type="button"
                                className="account-privacy-export"
                                disabled={exportingData || deletingAccount}
                                onClick={async () => {
                                    setPrivacyActionMessage(null);
                                    setExportingData(true);
                                    try {
                                        await downloadMyData(user);
                                        setPrivacyActionMessage("Ton export de données est téléchargé.");
                                    } catch {
                                        setPrivacyActionMessage("L’export n’a pas abouti. Réessaie ou contacte l’assistance.");
                                    } finally {
                                        setExportingData(false);
                                    }
                                }}
                            >
                                {exportingData ? "Préparation de l’export…" : "Télécharger mes données"}
                            </button>
                            <button
                                type="button"
                                className="account-privacy-delete"
                                disabled={exportingData || deletingAccount}
                                onClick={async () => {
                                    if (!window.confirm("Supprimer définitivement ton compte Atlas, tes quiz, tes scores et tes données de progression ? Cette action est irréversible.")) return;
                                    setPrivacyActionMessage(null);
                                    setDeletingAccount(true);
                                    try {
                                        await deleteMyAccount();
                                        await supabase.auth.signOut({ scope: "local" });
                                        setOpen(false);
                                        setUser(null);
                                        navigate("/login?account-deleted=1", { replace: true });
                                    } catch {
                                        setPrivacyActionMessage("La suppression n’a pas abouti. Vérifie que la fonction Supabase de suppression du compte est déployée, puis réessaie.");
                                    } finally {
                                        setDeletingAccount(false);
                                    }
                                }}
                            >
                                {deletingAccount ? "Suppression du compte…" : "Supprimer mon compte"}
                            </button>
                            {privacyActionMessage && <p className="auth-message" role="status">{privacyActionMessage}</p>}
                            <Link className="account-privacy-link" to="/confidentialite" onClick={() => setOpen(false)}>Lire la politique de confidentialité</Link>
                        </div>
                        <button
                            className="auth-modal-logout"
                            disabled={signingOut}
                            onClick={async () => {
                                setError(null);
                                setSigningOut(true);
                                try {
                                    const { error: logoutError } = await logout();
                                    if (logoutError) throw logoutError;
                                    setOpen(false);
                                    setUser(null);
                                    navigate("/");
                                } catch {
                                    setError("La déconnexion a échoué. Réessaie.");
                                } finally {
                                    setSigningOut(false);
                                }
                            }}
                        >
                            {signingOut ? "Déconnexion…" : "Déconnexion"}
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
