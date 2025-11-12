import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { logout } from "../api/auth";
import { useNavigate, useLocation } from "react-router-dom";

export default function AuthStatusIcon() {
    const { user, setUser } = useAuth();
    const [open, setOpen] = useState(false);
    const navigate = useNavigate();
    const location = useLocation();

    // Cache tout sur la page /login
    if (location.pathname === "/login") return null;

    if (!user) return (
        <div style={{ position: "fixed", top: 14, right: 14, zIndex: 999 }}>
            {/* Icône gris fade/simple (exemple) */}
            <button
                aria-label="Aller à la connexion"
                style={{ background: "none", border: "none", cursor: "pointer", padding: 0 }}
                onClick={() => navigate("/login")}
            >
                <svg width="28" height="28" viewBox="0 0 20 20" fill="#999" style={{display: 'block'}}><circle cx="10" cy="7" r="4"/><rect x="4" y="14" width="12" height="5" rx="4"/></svg>
            </button>
        </div>
    );

    return (
        <>
            <div style={{ position: "fixed", top: 14, right: 14, zIndex: 999 }}>
                <button
                    aria-label="Profil utilisateur"
                    onClick={() => setOpen(true)}
                    style={{ background: "none", border: "none", cursor: "pointer", padding: 0 }}
                >
                    <svg width="28" height="28" viewBox="0 0 20 20" fill="#646cff">
                        <circle cx="10" cy="7" r="4"/>
                        <rect x="4" y="14" width="12" height="5" rx="4"/>
                    </svg>
                </button>
            </div>

            {open && (
                <div style={{
                    position: "fixed", left: 0, top: 0, right: 0, bottom: 0, zIndex: 1200, background: "rgba(32,42,60,0.18)", display: "flex", alignItems: "center", justifyContent: "center"
                }}
                     onClick={() => setOpen(false)}
                     aria-modal="true" role="dialog"
                >
                    <div
                        onClick={e => e.stopPropagation()}
                        style={{ background: "#fff", color: "#111", padding: "2.2em 2.3em", borderRadius: 14, minWidth: 300, boxShadow: "0 6px 30px #232a3440", display: "flex", flexDirection: "column", alignItems: "center" }}
                    >
                        <svg width="44" height="44" viewBox="0 0 20 20" fill="#646cff" style={{marginBottom:20}}><circle cx="10" cy="7" r="4"/><rect x="4" y="14" width="12" height="5" rx="4"/></svg>
                        <div style={{marginBottom: 16, fontWeight: 700, color: "#303068", fontSize: "1.14em"}}>{user.email}</div>
                        <button
                            style={{ background: "#df4444", color: "#fff", borderRadius: 8, border: "none", padding: "0.7em 1.5em", fontWeight: 500, cursor: "pointer", fontSize: "1em", marginBottom: 14 }}
                            onClick={async () => {
                                await logout();
                                setOpen(false);
                                setUser(null);
                                navigate("/");
                            }}
                        >
                            Déconnexion
                        </button>
                        <button onClick={() => setOpen(false)} style={{ background: "none", color: "#646cff", border: "none", textDecoration: "underline", marginTop: 6, fontSize: ".97em", cursor: "pointer" }}>Fermer</button>
                    </div>
                </div>
            )}
        </>
    );
}
