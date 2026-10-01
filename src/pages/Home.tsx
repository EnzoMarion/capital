import { useState, type CSSProperties } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/useAuth";
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
    { icon: String.fromCodePoint(0x1f30a), title: "Fleuves", text: "Identifie les cinq grands fleuves français sur une carte.", route: "/quiz-type?france=rivers" },
    { icon: "🧠", title: "Révision France", text: "Revois les codes, préfectures et régions à ton rythme.", route: "/revision-france" },
];

const swissModes = [
    { icon: "switzerland", title: "Cantons suisses", text: "Retrouve les 26 cantons en QCM, saisie libre ou carte muette.", route: "/quiz-type?switzerland=cantons" },
    { icon: "🚩", title: "Drapeaux des cantons", text: "Identifie les cantons suisses à partir de leurs drapeaux.", route: "/quiz-type?switzerland=flags" },
    { icon: "📍", title: "Chefs-lieux suisses", text: "Retrouve la ville principale à partir du canton affiché.", route: "/quiz-type?switzerland=chief-towns" },
    { icon: "📚", title: "Révision Suisse", text: "Consulte les cantons, leurs drapeaux et leurs chefs-lieux.", route: "/revision-switzerland" },
];

const usModes = [
    { icon: "usa", title: "États des États-Unis", text: "Identifie les 50 États en QCM, saisie libre ou sur une carte muette.", route: "/quiz-type?usa=states" },
    { icon: "🚩", title: "Drapeaux des États", text: "Identifie les États américains à partir de leurs drapeaux.", route: "/quiz-type?usa=flags" },
    { icon: "capitol", title: "Capitales des États", text: "Retrouve la capitale à partir de l’État affiché.", route: "/quiz-type?usa=capitals" },
    { icon: "📚", title: "Révision États-Unis", text: "Consulte les États, leurs drapeaux et leurs capitales.", route: "/revision-usa" },
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

function USAFlagIcon() {
    return <svg className="us-flag-icon" viewBox="0 0 38 26" aria-hidden="true" focusable="false">
        <rect width="38" height="26" rx="3" fill="#fff" />
        {[0, 4, 8, 12, 16, 20, 24].map(y => <rect key={y} y={y} width="38" height="2" fill="#c43b4a" />)}
        <rect width="17" height="14" rx="1" fill="#244477" />
        {[[3, 3], [8, 3], [13, 3], [5.5, 6.5], [10.5, 6.5], [3, 10], [8, 10], [13, 10]].map(([x, y], index) => <circle key={index} cx={x} cy={y} r=".8" fill="#fff" />)}
        <rect x=".5" y=".5" width="37" height="25" rx="2.5" fill="none" stroke="rgba(255,255,255,.35)" />
    </svg>;
}

function ModeCard({ icon, title, text, route }: (typeof worldModes)[number]) {
    const navigate = useNavigate();
    return (
        <button className="mode-card" onClick={() => navigate(route)}>
            <span className="mode-card-top">
                <span className="mode-icon" aria-hidden="true">{icon === "eu" ? <FlagIcon country="eu" /> : icon === "switzerland" ? <SwissFlagIcon /> : icon === "usa" ? <USAFlagIcon /> : icon === "capitol" ? String.fromCodePoint(0x1f3db, 0xfe0f) : icon}</span>
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
    const [globalRate, setGlobalRate] = useState<number | null>(null);

    return (
        <main className="home-wrapper home-game-dashboard">
            <section className="home-hero">
                <div className="home-hero-copy">
                    <p className="hero-kicker"><span aria-hidden="true">✦</span> ATLAS · GÉOGRAPHIE</p>
                    <h1>Voyage d’un continent à l’autre, carte après carte.</h1>
                    <p>Capitales, drapeaux, régions et États : teste tes connaissances sur le monde, la France, la Suisse et les États-Unis.</p>
                </div>
                <div className="hero-atlas-orbit" role="img" aria-label={user ? `Réussite globale : ${globalRate === null ? "chargement" : `${globalRate} %`}` : "Explore les cartes du monde"}>
                    <span className="hero-orbit hero-orbit-one" aria-hidden="true" />
                    <span className="hero-orbit hero-orbit-two" aria-hidden="true" />
                    <div className="hero-atlas-orbit-core" style={{ "--hero-rate": `${globalRate ?? 0}%` } as CSSProperties}>
                        <strong>{user ? globalRate === null ? "…" : `${globalRate}%` : "ATLAS"}</strong>
                        <small>{user ? "réussite globale" : "à explorer"}</small>
                    </div>
                </div>
            </section>

            {user && <PlayerProgress userId={user.id} onGlobalRate={setGlobalRate} />}

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

            <section className="home-section" aria-labelledby="usa-heading">
                <div className="home-section-heading">
                    <div><p className="section-kicker">04 · États-Unis</p><h2 id="usa-heading">Les États-Unis <span className="heading-us-flag" role="img" aria-label="Drapeau américain"><USAFlagIcon /></span></h2></div>
                </div>
                <div className="home-grid">{usModes.map(mode => <ModeCard key={mode.route} {...mode} />)}</div>
            </section>
            <section id="mes-quiz" className="home-section home-custom-quizzes" aria-labelledby="custom-quizzes-heading">
                <div className="home-section-heading">
                    <div><p className="section-kicker">05 · À toi de jouer</p><h2 id="custom-quizzes-heading">Mes quiz personnalisés</h2></div>
                    {user && <button className="create-quiz-btn" onClick={() => navigate("/create-quiz")}>＋ Créer un quiz</button>}
                </div>
                {user ? <MyQuizzes embedded /> : !loading ? (
                    <p className="home-connect-warning">Les quiz publics sont accessibles sans compte. Connecte-toi pour créer et retrouver tes quiz personnalisés et enregistrer ta progression. <button type="button" className="text-action" onClick={() => navigate("/login")}>Se connecter</button></p>
                ) : null}
            </section>
        </main>
    );
}
