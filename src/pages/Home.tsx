import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import PlayerProgress from "../components/PlayerProgress";
import MyQuizzes from "./MyQuizzes";

const worldModes = [
    { icon: "🧭", title: "Capitales du monde", text: "Retrouve les capitales à partir du nom du pays.", route: "/quiz-type" },
    { icon: "eu", title: "Union européenne", text: "Mémorise les années d’adhésion des pays membres.", route: "/quiz-type?eu=1" },
    { icon: "🏳️", title: "Drapeaux", text: "Reconnais les pays à partir de leurs drapeaux.", route: "/quiz-type?flags=1" },
    { icon: "📚", title: "Fiches de révision", text: "Parcours les pays, leurs capitales et les années d’adhésion.", route: "/revision" },
];

const franceModes = [
    { icon: "🗺️", title: "Départements", text: "Retrouve le département colorié sur la carte.", route: "/quiz-type?france=departments" },
    { icon: "📍", title: "Préfectures", text: "Retrouve la préfecture du département affiché.", route: "/quiz-type?france=prefectures" },
    { icon: "🧭", title: "Régions", text: "Identifie la région colorée sur la carte de France.", route: "/quiz-type?france=regions" },
    { icon: String.fromCodePoint(0x1f3d4, 0xfe0f), title: "Chaînes de montagnes", text: "Identifie les principaux reliefs sur une carte physique de France.", route: "/quiz-type?france=mountains" },
    { icon: String.fromCodePoint(0x1f30a), title: "Fleuves", text: "Retrouve les principaux fleuves sur une carte de France.", route: "/quiz-type?france=rivers" },
    { icon: "🧠", title: "Révision France", text: "Revois les codes, préfectures et régions à ton rythme.", route: "/revision-france" },
];

const swissModes = [
    { icon: "switzerland", title: "Cantons suisses", text: "Retrouve les 26 cantons en QCM, saisie libre ou carte muette.", route: "/quiz-type?switzerland=cantons" },
    { icon: "📍", title: "Chefs-lieux suisses", text: "Retrouve la ville principale à partir du canton affiché.", route: "/quiz-type?switzerland=chief-towns" },
];

function FlagIcon({ country }: { country: "france" | "eu" }) {
    if (country === "france") {
        return <svg viewBox="0 0 30 20" aria-hidden="true" focusable="false">
            <rect width="30" height="20" rx="2" fill="#fff" />
            <path d="M2 0h8v20H2a2 2 0 0 1-2-2V2a2 2 0 0 1 2-2" fill="#0055A4" />
            <path d="M20 0h8a2 2 0 0 1 2 2v16a2 2 0 0 1-2 2h-8z" fill="#EF4135" />
            <rect x=".5" y=".5" width="29" height="19" rx="1.5" fill="none" stroke="rgba(255,255,255,.35)" />
        </svg>;
    }

    const stars = [[30, 9], [35.5, 10.5], [39.5, 14.5], [41, 20], [39.5, 25.5], [35.5, 29.5], [30, 31], [24.5, 29.5], [20.5, 25.5], [19, 20], [20.5, 14.5], [24.5, 10.5]];
    return <svg viewBox="0 0 60 40" aria-hidden="true" focusable="false">
        <rect width="60" height="40" rx="4" fill="#003399" />
        {stars.map(([x, y], index) => <path key={index} d="M0-2.2 0.6-.7 2.2-.7.9.3 1.4 1.9 0 .9-1.4 1.9-.9.3-2.2-.7-.6-.7z" transform={`translate(${x} ${y})`} fill="#ffdf00" />)}
        <rect x=".5" y=".5" width="59" height="39" rx="3.5" fill="none" stroke="rgba(255,255,255,.35)" />
    </svg>;
}

function SwissFlagIcon() {
    return <svg className="swiss-flag-icon" viewBox="0 0 32 32" aria-hidden="true" focusable="false">
        <rect width="32" height="32" rx="5" fill="#d52b1e" />
        <path d="M13 6h6v7h7v6h-7v7h-6v-7H6v-6h7V6Z" fill="#fff" />
    </svg>;
}

function ModeCard({ icon, title, text, route }: (typeof worldModes)[number]) {
    const navigate = useNavigate();
    return (
        <button className="mode-card" onClick={() => navigate(route)}>
            <span className="mode-card-top">
                <span className="mode-icon" aria-hidden="true">{icon === "eu" ? <FlagIcon country="eu" /> : icon === "switzerland" ? <SwissFlagIcon /> : icon}</span>
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
                <h1>Le monde, la France et la Suisse, à portée de carte.</h1>
                <p>Retrouve les capitales, découvre les drapeaux et révise les territoires, régions et cantons.</p>
                <span className="hero-orbit hero-orbit-one" aria-hidden="true" />
                <span className="hero-orbit hero-orbit-two" aria-hidden="true" />
            </section>

            {user && <PlayerProgress userId={user.id} />}

            <section className="home-section" aria-labelledby="world-heading">
                <div className="home-section-heading">
                    <div><p className="section-kicker">01 · Exploration</p><h2 id="world-heading">Le Monde <span aria-hidden="true">🌍</span></h2></div>
                </div>
                <div className="home-grid">{worldModes.map(mode => <ModeCard key={mode.route} {...mode} />)}</div>
            </section>

            <section className="home-section" aria-labelledby="france-heading">
                <div className="home-section-heading">
                    <div><p className="section-kicker">02 · Territoire français</p><h2 id="france-heading">La France <span className="heading-flag" role="img" aria-label="Drapeau français"><FlagIcon country="france" /></span></h2></div>
                </div>
                <div className="home-grid">{franceModes.map(mode => <ModeCard key={mode.route} {...mode} />)}</div>
            </section>

            <section className="home-section" aria-labelledby="switzerland-heading">
                <div className="home-section-heading">
                    <div><p className="section-kicker">03 · Cantons suisses</p><h2 id="switzerland-heading">La Suisse <span className="heading-swiss-flag" role="img" aria-label="Drapeau suisse"><SwissFlagIcon /></span></h2></div>
                </div>
                <div className="home-grid">{swissModes.map(mode => <ModeCard key={mode.route} {...mode} />)}</div>
            </section>

            <section id="mes-quiz" className="home-section home-custom-quizzes" aria-labelledby="custom-quizzes-heading">
                <div className="home-section-heading">
                    <div><p className="section-kicker">04 · À toi de jouer</p><h2 id="custom-quizzes-heading">Mes quiz personnalisés</h2></div>
                    {user && <button className="create-quiz-btn" onClick={() => navigate("/create-quiz")}>＋ Créer un quiz</button>}
                </div>
                {user ? <MyQuizzes embedded /> : !loading ? (
                    <p className="home-connect-warning">Connecte-toi pour créer et retrouver tes quiz personnels.</p>
                ) : null}
            </section>
        </main>
    );
}
