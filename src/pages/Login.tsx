import { useState } from "react";
import { Link, useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { login, resetPassword, signup, updatePassword } from "../api/auth";
import { useAuth } from "../context/AuthContext";

type AuthMode = "login" | "register" | "reset" | "update";

function friendlyError(message: string) {
    const normalized = message.toLowerCase();
    if (normalized.includes("invalid login credentials")) return "Adresse e-mail ou mot de passe incorrect.";
    if (normalized.includes("user already registered")) return "Cette adresse a déjà un compte. Connecte-toi plutôt.";
    if (normalized.includes("password should be at least")) return "Choisis un mot de passe plus long (au moins 6 caractères).";
    if (normalized.includes("email not confirmed")) return "Confirme ton adresse e-mail depuis le message reçu avant de te connecter.";
    if (normalized.includes("rate limit")) return "Trop de tentatives. Attends un peu avant de réessayer.";
    return "La demande n’a pas abouti. Vérifie les informations et réessaie.";
}

export default function Login() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [mode, setMode] = useState<AuthMode>(() => window.location.hash.includes("type=recovery") ? "update" : "login");
    const [message, setMessage] = useState<string | null>(null);
    const [error, setError] = useState(false);
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const { setUser } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const [searchParams] = useSearchParams();

    function returnAfterLogin() {
        const from = (location.state as { from?: { pathname?: string; search?: string } } | null)?.from;
        navigate(from?.pathname ? `${from.pathname}${from.search ?? ""}` : "/", { replace: true });
    }

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        setLoading(true);
        setMessage(null);
        setError(false);
        try {
            if (mode === "reset") {
                const { error: resetError } = await resetPassword(email.trim());
                if (resetError) throw resetError;
                setMessage("Si un compte existe avec cette adresse, tu recevras un lien de réinitialisation.");
                return;
            }
            if (mode === "update") {
                const { error: updateError } = await updatePassword(password);
                if (updateError) throw updateError;
                setMessage("Ton mot de passe a été mis à jour. Tu peux continuer à utiliser ton compte.");
                setMode("login");
                setPassword("");
                return;
            }
            if (mode === "register") {
                const { data, error: signupError } = await signup(email.trim(), password);
                if (signupError) throw signupError;
                if (data.session && data.user?.email && data.user.id) {
                    setUser({ email: data.user.email, id: data.user.id });
                    returnAfterLogin();
                    return;
                }
                setMessage("Compte créé. Consulte tes e-mails pour confirmer ton adresse, puis connecte-toi.");
                setMode("login");
                setPassword("");
                return;
            }

            const { data, error: loginError } = await login(email.trim(), password);
            if (loginError) throw loginError;
            if (data.user?.email && data.user.id) setUser({ email: data.user.email, id: data.user.id });
            returnAfterLogin();
        } catch (err) {
            setError(true);
            setMessage(friendlyError(err instanceof Error ? err.message : "Erreur inconnue"));
        } finally {
            setLoading(false);
        }
    }

    const resetSent = searchParams.get("password-reset") === "sent";

    return (
        <main className="login-card">
            <p className="section-kicker">Ton espace</p>
            <h1 className="login-heading">{mode === "reset" ? "Réinitialiser le mot de passe" : mode === "update" ? "Choisis un nouveau mot de passe" : "Ravi de te revoir"}</h1>
            <p className="login-intro">{mode === "reset" ? "Entre ton adresse et nous t’enverrons un lien de réinitialisation." : mode === "update" ? "Choisis un mot de passe d’au moins 6 caractères." : "Connecte-toi pour retrouver tes quiz personnalisés."}</p>

            {(mode === "login" || mode === "register") && (
                <div className="auth-tabs" role="tablist" aria-label="Connexion ou création de compte">
                    <button type="button" role="tab" aria-selected={mode === "login"} className={mode === "login" ? "active" : ""} onClick={() => { setMode("login"); setMessage(null); }}>Connexion</button>
                    <button type="button" role="tab" aria-selected={mode === "register"} className={mode === "register" ? "active" : ""} onClick={() => { setMode("register"); setMessage(null); }}>Créer un compte</button>
                </div>
            )}

            <form className="login-form" onSubmit={handleSubmit}>
                {mode !== "update" && <label>
                    Adresse e-mail
                    <input type="email" name="email" autoComplete="email" required value={email} onChange={e => setEmail(e.target.value)} placeholder="toi@exemple.fr" />
                </label>}
                {mode !== "reset" && (
                    <label>
                        Mot de passe
                        <span className="password-field">
                            <input type={showPassword ? "text" : "password"} name="password" autoComplete={mode === "register" || mode === "update" ? "new-password" : "current-password"} minLength={6} required value={password} onChange={e => setPassword(e.target.value)} placeholder="6 caractères minimum" />
                            <button className="password-toggle" type="button" onClick={() => setShowPassword(show => !show)} aria-label={showPassword ? "Masquer le mot de passe" : "Afficher le mot de passe"}>{showPassword ? "Masquer" : "Afficher"}</button>
                        </span>
                    </label>
                )}
                <button className="primary-btn login-submit" type="submit" disabled={loading}>
                    {loading ? "Patiente un instant…" : mode === "reset" ? "Envoyer le lien" : mode === "update" ? "Enregistrer le mot de passe" : mode === "register" ? "Créer mon compte" : "Se connecter"}
                </button>
            </form>

            {mode === "login" && <button className="text-action" type="button" onClick={() => { setMode("reset"); setMessage(null); }}>Mot de passe oublié ?</button>}
            {mode === "reset" && <button className="text-action" type="button" onClick={() => { setMode("login"); setMessage(null); }}>← Retour à la connexion</button>}
            {(message || resetSent) && <p className={`auth-message${error ? " error" : ""}`} role={error ? "alert" : "status"}>{message || "Si tu avais demandé un nouveau mot de passe, consulte ta boîte e-mail."}</p>}
            <div className="login-footer"><Link to="/">Retour à l’accueil</Link></div>
        </main>
    );
}
