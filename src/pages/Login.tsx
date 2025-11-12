import { useState } from "react";
import { signup, login, getUser } from "../api/auth";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";

export default function Login() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [mode, setMode] = useState<"login" | "register">("login");
    const [message, setMessage] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const { setUser } = useAuth();
    const navigate = useNavigate();

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setLoading(true);
        setMessage(null);
        try {
            if (mode === "register") {
                const { error } = await signup(email, password);
                if (error) setMessage("Erreur: " + error.message);
                else setMessage("Compte créé ! Vérifie tes mails 🚀");
            } else {
                const { error } = await login(email, password);
                if (error) setMessage("Erreur: " + error.message);
                else {
                    // Recharge le user et mets à jour le contexte pour affichage instantané
                    const { data } = await getUser();
                    if (data?.user) setUser({ email: data.user.email, id: data.user.id });
                    setMessage("Connexion réussie !");
                    setTimeout(() => navigate("/"), 800); // Redirige sur accueil si tu veux
                }
            }
        } catch (e) {
            setMessage("Erreur interne");
        }
        setLoading(false);
    }

    return (
        <div className="flex flex-col items-center mt-10">
            <h1 className="text-xl font-semibold mb-2">Connexion / Inscription</h1>
            <form onSubmit={handleSubmit} className="flex flex-col gap-3 w-72">
                <input
                    type="email"
                    placeholder="Email"
                    required
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    className="border p-2 rounded"
                />
                <input
                    type="password"
                    placeholder="Mot de passe"
                    required
                    minLength={6}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    className="border p-2 rounded"
                />
                <button type="submit" disabled={loading} className="bg-blue-600 text-white rounded p-2">
                    {mode === "register" ? "Créer un compte" : "Se connecter"}
                </button>
                <button
                    type="button"
                    disabled={loading}
                    className="text-blue-600 underline text-sm"
                    onClick={() => setMode(mode === "register" ? "login" : "register")}
                >
                    {mode === "register"
                        ? "Déjà un compte ? Connexion"
                        : "Pas de compte ? Inscription"}
                </button>
            </form>
            {message && <p className="mt-4 text-center">{message}</p>}
            <a href="/" className="mt-6 px-4 py-2 bg-gray-300 text-black rounded">Retour accueil</a>
        </div>
    );
}
