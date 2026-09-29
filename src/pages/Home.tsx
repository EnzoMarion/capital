import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import PlayerProgress from "../components/PlayerProgress";
import MyQuizzes from "./MyQuizzes";

const worldModes = [
    { icon: "🌍", title: "Capitales du monde", text: "Retrouve les capitales sur une carte ou à partir du nom du pays.", route: "/quiz-type" },
    { icon: "🇪🇺", title: "Union européenne", text: "Mémorise les années d’adhésion des pays membres.", route: "/quiz-type?eu=1" },
    { icon: "🏳️", title: "Drapeaux", text: "Reconnais les pays à partir de leurs drapeaux.", route: "/quiz-type?flags=1" },
    { icon: "📚", title: "Fiches de révision", text: "Parcours les pays, leurs capitales et les années d’adhésion.", route: "/revision" },
];

const franceModes = [
    { icon: "🗺️", title: "Départements", text: "Place les départements et retrouve leurs préfectures.", route: "/quiz-type?france=depts" },
    { icon: "📍", title: "Régions", text: "À quelle région appartient le département affiché ?", route: "/quiz-type?france=regions" },
    { icon: "🧠", title: "Révision France", text: "Revois les codes, préfectures et régions à ton rythme.", route: "/revision-france" },
];

function ModeCard({ icon, title, text, route }: (typeof worldModes)[number]) {
    const navigate = useNavigate();
    return (
        <button className="mode-card" onClick={() => navigate(route)}>
            <span className="mode-card-top">
                <span className="mode-icon" aria-hidden="true">{icon}</span>
                <span className="mode-card-copy">
                    <span className="mode-card-type">GÉOGRAPHIE</span>
                    <h3>{title}</h3>
                </span>
                <span className="mode-card-mark" aria-hidden="true">↗</span>
            </span>
            <p>{text}</p>
            <span className="mode-card-footer"><span>Jouer</span></span>
        </button>
    );
}

export default function Home() {
    const { user, loading } = useAuth();
    const navigate = useNavigate();

    return (
        <main className="home-wrapper home-game-dashboard">
            <section className="home-hero">
                <p className="hero-kicker"><span aria-hidden="true">✦</span> ATLAS · GÉOGRAPHIE</p>
                <h1>Le monde et la France, à portée de carte.</h1>
                <p>Retrouve les capitales, découvre les drapeaux et révise les départements et régions de France.</p>
                <span className="hero-orbit hero-orbit-one" aria-hidden="true" />
                <span className="hero-orbit hero-orbit-two" aria-hidden="true" />
            </section>

            {user && <PlayerProgress userId={user.id} />}

            <section className="home-section" aria-labelledby="world-heading">
                <div className="home-section-heading">
                    <div><p className="section-kicker">01 · Exploration</p><h2 id="world-heading">Le monde</h2></div>
                </div>
                <div className="home-grid">{worldModes.map(mode => <ModeCard key={mode.route} {...mode} />)}</div>
            </section>

            <section className="home-section" aria-labelledby="france-heading">
                <div className="home-section-heading">
                    <div><p className="section-kicker">02 · Territoire français</p><h2 id="france-heading">La France</h2></div>
                </div>
                <div className="home-grid">{franceModes.map(mode => <ModeCard key={mode.route} {...mode} />)}</div>
            </section>

            <section id="mes-quiz" className="home-section home-custom-quizzes" aria-labelledby="custom-quizzes-heading">
                <div className="home-section-heading">
                    <div><p className="section-kicker">03 · À toi de jouer</p><h2 id="custom-quizzes-heading">Mes quiz personnalisés</h2></div>
                    {user && <button className="create-quiz-btn" onClick={() => navigate("/create-quiz")}>＋ Créer un quiz</button>}
                </div>
                {user ? <MyQuizzes embedded /> : !loading ? (
                    <p className="home-connect-warning">Connecte-toi pour créer et retrouver tes quiz personnels.</p>
                ) : null}
            </section>
        </main>
    );
}
