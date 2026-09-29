import { useEffect, useMemo, useState } from "react";
import { fetchCountries, type Country } from "../api/countries";
import {
    fetchMyCountryProgress,
    fetchMyQuizStats,
    QUIZ_STAT_LABELS,
    type CountryProgressResult,
    type MyQuizStat,
} from "../api/quizAttempts";

const CONTINENTS = [
    { code: "Europe", label: "Europe" },
    { code: "Asia", label: "Asie" },
    { code: "Africa", label: "Afrique" },
    { code: "North America", label: "Amérique du Nord" },
    { code: "South America", label: "Amérique du Sud" },
    { code: "Oceania", label: "Océanie" },
];

function nextTarget(bestPercent: number) {
    if (bestPercent >= 100) return 100;
    if (bestPercent <= 0) return 70;
    return Math.min(100, (Math.floor(bestPercent / 5) + 1) * 5);
}

function progressFor(countries: Country[], answers: Map<string, boolean>, includeTerritories: boolean) {
    const eligible = countries.filter(country =>
        country.name && country.capital && country.code && (includeTerritories || !country.parent_code),
    );
    const successful = eligible.filter(country => answers.get(country.code) === true).length;
    return {
        successful,
        total: eligible.length,
        percent: eligible.length ? Math.floor((successful / eligible.length) * 100) : 0,
    };
}

function QuizRecordCard({ stat }: { stat: MyQuizStat }) {
    const errors = Math.max(0, stat.best_total - stat.best_score);
    const target = nextTarget(errors === 0 ? stat.best_percent : Math.min(stat.best_percent, 99));
    const percentile = stat.quiz_key !== "personnalise" && stat.player_count > 5
        ? Math.floor((stat.players_below / (stat.player_count - 1)) * 100)
        : null;

    return <article className="player-goal-card">
        <div className="player-goal-card-top"><strong>{QUIZ_STAT_LABELS[stat.quiz_key] ?? stat.quiz_key}</strong><span>{stat.best_percent}%</span></div>
        <small className="player-scope-label">{stat.scope_label}</small>
        <div className="player-goal-track"><span style={{ width: `${stat.best_percent}%` }} /></div>
        <p>{errors === 0 ? "Record parfait" : `Prochain objectif : ${target}%`}</p>
        <small>{stat.best_score}/{stat.best_total} bonnes réponses · {errors} erreur{errors === 1 ? "" : "s"} · {stat.attempt_count} partie{stat.attempt_count === 1 ? "" : "s"}</small>
        <small>{percentile !== null
            ? `Meilleur que ${percentile}% des joueurs`
            : stat.quiz_key === "personnalise"
                ? "Record personnel sur ce quiz personnalisé"
                : "Comparaison disponible après 6 joueurs"}</small>
    </article>;
}

export default function PlayerProgress({ userId }: { userId: string }) {
    const [stats, setStats] = useState<MyQuizStat[]>([]);
    const [loadingStats, setLoadingStats] = useState(true);
    const [statsError, setStatsError] = useState(false);
    const [countries, setCountries] = useState<Country[]>([]);
    const [countryProgress, setCountryProgress] = useState<CountryProgressResult[]>([]);
    const [loadingProgress, setLoadingProgress] = useState(true);
    const [progressError, setProgressError] = useState(false);

    useEffect(() => {
        let active = true;
        void fetchMyQuizStats().then(data => {
            if (active) setStats(data);
        }).catch(() => {
            if (active) setStatsError(true);
        }).finally(() => {
            if (active) setLoadingStats(false);
        });
        return () => { active = false; };
    }, [userId]);

    useEffect(() => {
        let active = true;
        void Promise.all([fetchCountries(), fetchMyCountryProgress(userId)])
            .then(([countryData, answers]) => {
                if (!active) return;
                setCountries(countryData);
                setCountryProgress(answers);
            }).catch(() => {
                if (active) setProgressError(true);
            }).finally(() => {
                if (active) setLoadingProgress(false);
            });
        return () => { active = false; };
    }, [userId]);

    const totals = useMemo(() => ({
        attempts: stats.reduce((sum, item) => sum + item.attempt_count, 0),
    }), [stats]);
    const franceStats = stats
        .filter(item => item.quiz_key.startsWith("france_") || item.quiz_key === "personnalise_france")
        .sort((a, b) => (QUIZ_STAT_LABELS[a.quiz_key] ?? a.quiz_key).localeCompare(QUIZ_STAT_LABELS[b.quiz_key] ?? b.quiz_key, "fr"));
    const goals = [...stats]
        .filter(item => item.quiz_key !== "capitales_monde" && !item.quiz_key.startsWith("france_") && item.quiz_key !== "personnalise_france")
        .sort((a, b) => b.best_percent - a.best_percent || b.attempt_count - a.attempt_count);
    const answersByCountry = useMemo(
        () => new Map<string, boolean>(countryProgress.map(answer => [answer.country_code, answer.is_correct] as const)),
        [countryProgress],
    );

    return (
        <section className="player-progress" aria-labelledby="player-progress-title">
            <div className="player-progress-heading">
                <div><p className="section-kicker">Espace personnel</p><h2 id="player-progress-title">Mes records et objectifs</h2></div>
                {!loadingStats && !statsError && <span className="player-attempt-count">{totals.attempts} partie{totals.attempts === 1 ? "" : "s"} jouée{totals.attempts === 1 ? "" : "s"}</span>}
            </div>

            <section className="player-continent-section" aria-labelledby="continent-progress-title">
                <div className="player-continent-heading">
                    <h3 id="continent-progress-title">Capitales par continent</h3>
                    <p>Pays réussis / pays à réviser · dernière réponse par pays</p>
                </div>
                {loadingProgress ? <div className="player-progress-loading" aria-label="Chargement de la progression"><span /><span /><span /></div>
                    : progressError ? <p className="player-continent-message">Colle le SQL de suivi par continent dans le SQL Editor de Supabase pour l’activer.</p>
                        : (
                            <div className="player-continent-grid">
                                {CONTINENTS.map(continent => {
                                    const inContinent = countries.filter(country => country.continent === continent.code);
                                    const withoutTerritories = progressFor(inContinent, answersByCountry, false);
                                    const withTerritories = progressFor(inContinent, answersByCountry, true);
                                    return <article className="player-continent-card" key={continent.code}>
                                        <h4>{continent.label}</h4>
                                        {[{ label: "Sans territoires", ...withoutTerritories }, { label: "Avec territoires", ...withTerritories }].map(progress => (
                                            <div className="player-continent-mode" key={progress.label}>
                                                <div className="player-continent-mode-label"><span>{progress.label}</span><strong>{progress.percent}%</strong></div>
                                                <div className="player-continent-track"><span style={{ width: `${progress.percent}%` }} /></div>
                                                <small>{progress.successful}/{progress.total} réussis</small>
                                            </div>
                                        ))}
                                    </article>;
                                })}
                            </div>
                        )}
            </section>

            <section className="player-france-records" aria-labelledby="france-records-title">
                <h3 id="france-records-title">Quiz de France</h3>
                {loadingStats ? <div className="player-progress-loading" aria-label="Chargement des records France"><span /><span /><span /></div>
                    : statsError ? <p className="player-progress-message">Impossible de charger les records France pour le moment.</p>
                        : franceStats.length > 0 ? (
                            <div className="player-goals-grid">
                                {franceStats.map(stat => <QuizRecordCard key={`${stat.quiz_key}:${stat.scope_key}`} stat={stat} />)}
                            </div>
                        ) : <p className="player-france-empty">Joue un quiz de France pour afficher tes records ici.</p>}
            </section>

            {!loadingStats && !statsError && goals.length > 0 && (
                        <section className="player-other-records" aria-labelledby="other-records-title">
                            <h3 id="other-records-title">Autres records</h3>
                            <div className="player-goals-grid">
                                {goals.map(stat => <QuizRecordCard key={`${stat.quiz_key}:${stat.scope_key}`} stat={stat} />)}
                            </div>
                        </section>
                    )}
        </section>
    );
}
