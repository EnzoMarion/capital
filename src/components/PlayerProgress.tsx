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
const NATIVE_FRANCE_QUIZ_KEYS = ["france_departements", "france_identification", "france_regions", "france_mountains", "france_rivers"];
const NATIVE_SWISS_QUIZ_KEYS = ["switzerland_cantons", "switzerland_canton_flags", "switzerland_chief_towns", "personnalise_suisse"];
const NATIVE_USA_QUIZ_KEYS = ["usa_states", "usa_state_flags", "usa_state_capitals", "personnalise_usa"];

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

export default function PlayerProgress({ userId, onGlobalRate }: { userId: string; onGlobalRate?: (rate: number | null) => void }) {
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

    const totals = useMemo(() => {
        const attempts = stats.reduce((sum, item) => sum + item.attempt_count, 0);
        const bestScore = stats.reduce((sum, item) => sum + item.best_score, 0);
        const bestTotal = stats.reduce((sum, item) => sum + item.best_total, 0);
        return { attempts, bestTotal, successRate: bestTotal ? Math.floor(bestScore * 100 / bestTotal) : null };
    }, [stats]);
    useEffect(() => {
        onGlobalRate?.(loadingStats || statsError ? null : totals.successRate);
    }, [loadingStats, onGlobalRate, statsError, totals.successRate]);
    const franceStats = stats
        .filter(item => item.quiz_key.startsWith("france_") || item.quiz_key === "personnalise_france")
        .sort((a, b) => (QUIZ_STAT_LABELS[a.quiz_key] ?? a.quiz_key).localeCompare(QUIZ_STAT_LABELS[b.quiz_key] ?? b.quiz_key, "fr"));
    const franceRecords: { quizKey: string; stat: MyQuizStat | null }[] = [
        ...franceStats.map(stat => ({ quizKey: stat.quiz_key, stat })),
        ...NATIVE_FRANCE_QUIZ_KEYS
            .filter(quizKey => !franceStats.some(stat => stat.quiz_key === quizKey))
            .map(quizKey => ({ quizKey, stat: null })),
    ].sort((a, b) => (QUIZ_STAT_LABELS[a.quizKey] ?? a.quizKey).localeCompare(QUIZ_STAT_LABELS[b.quizKey] ?? b.quizKey, "fr"));
    const swissStats = stats.filter(item => NATIVE_SWISS_QUIZ_KEYS.includes(item.quiz_key));
    const swissRecords: { quizKey: string; stat: MyQuizStat | null }[] = [
        ...swissStats.map(stat => ({ quizKey: stat.quiz_key, stat })),
        ...NATIVE_SWISS_QUIZ_KEYS
            .filter(quizKey => !swissStats.some(stat => stat.quiz_key === quizKey))
            .map(quizKey => ({ quizKey, stat: null })),
    ];
    const usaStats = stats.filter(item => NATIVE_USA_QUIZ_KEYS.includes(item.quiz_key));
    const usaRecords: { quizKey: string; stat: MyQuizStat | null }[] = [
        ...usaStats.map(stat => ({ quizKey: stat.quiz_key, stat })),
        ...NATIVE_USA_QUIZ_KEYS
            .filter(quizKey => !usaStats.some(stat => stat.quiz_key === quizKey))
            .map(quizKey => ({ quizKey, stat: null })),
    ];
    const goals = [...stats]
        .filter(item => item.quiz_key !== "capitales_monde" && !item.quiz_key.startsWith("france_") && !item.quiz_key.startsWith("switzerland_") && !item.quiz_key.startsWith("usa_") && !item.quiz_key.startsWith("personnalise_"))
        .sort((a, b) => b.best_percent - a.best_percent || b.attempt_count - a.attempt_count);
    const answersByCountry = useMemo(
        () => new Map<string, boolean>(countryProgress.map(answer => [answer.country_code, answer.is_correct] as const)),
        [countryProgress],
    );

    return (
        <section className="player-progress" aria-labelledby="player-progress-summary-title">
            <details className="player-progress-accordion">
                <summary className="player-progress-summary">
                    <div className="player-progress-heading">
                        <div><p className="section-kicker">Espace personnel</p><h2 id="player-progress-summary-title">Mes records et objectifs</h2></div>
                    </div>
                    <div className="player-global-rate">
                        <div><small>Réussite globale · tous les modes</small><strong>{loadingStats ? "…" : statsError || totals.successRate === null ? "—" : `${totals.successRate}%`}</strong></div>
                        <span>{loadingStats ? "Chargement" : statsError ? "Indisponible" : totals.attempts ? `${totals.attempts} partie${totals.attempts === 1 ? "" : "s"}` : "Aucune partie"}</span>
                        <i aria-hidden="true" />
                    </div>
                </summary>
                <div className="player-progress-details">
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
                        : franceRecords.length > 0 ? (
                            <div className="player-goals-grid">
                                {franceRecords.map(({ quizKey, stat }) => stat
                                    ? <QuizRecordCard key={`${stat.quiz_key}:${stat.scope_key}`} stat={stat} />
                                    : <article className="player-goal-card player-france-mode-empty" key={quizKey}>
                                        <div className="player-goal-card-top"><strong>{QUIZ_STAT_LABELS[quizKey] ?? quizKey}</strong><span>—</span></div>
                                        <p>Pas encore joué</p>
                                        <small>Joue une partie pour enregistrer ton record.</small>
                                    </article>)}
                            </div>
                        ) : null}
            </section>

            <section className="player-swiss-records" aria-labelledby="swiss-records-title">
                <h3 id="swiss-records-title">Quiz de Suisse</h3>
                {loadingStats ? <div className="player-progress-loading" aria-label="Chargement des records Suisse"><span /><span /><span /></div>
                    : statsError ? <p className="player-progress-message">Impossible de charger les records Suisse pour le moment.</p>
                        : <div className="player-goals-grid">
                            {swissRecords.map(({ quizKey, stat }) => stat
                                ? <QuizRecordCard key={`${stat.quiz_key}:${stat.scope_key}`} stat={stat} />
                                : <article className="player-goal-card player-france-mode-empty" key={quizKey}>
                                    <div className="player-goal-card-top"><strong>{QUIZ_STAT_LABELS[quizKey] ?? quizKey}</strong><span>—</span></div>
                                    <p>Pas encore joué</p>
                                    <small>Joue une partie pour enregistrer ton record.</small>
                                </article>)}
                        </div>}
            </section>

            <section className="player-usa-records" aria-labelledby="usa-records-title">
                <h3 id="usa-records-title">Quiz des États-Unis</h3>
                {loadingStats ? <div className="player-progress-loading" aria-label="Chargement des records États-Unis"><span /><span /><span /></div>
                    : statsError ? <p className="player-progress-message">Impossible de charger les records des États-Unis pour le moment.</p>
                        : <div className="player-goals-grid">
                            {usaRecords.map(({ quizKey, stat }) => stat
                                ? <QuizRecordCard key={`${stat.quiz_key}:${stat.scope_key}`} stat={stat} />
                                : <article className="player-goal-card player-france-mode-empty" key={quizKey}>
                                    <div className="player-goal-card-top"><strong>{QUIZ_STAT_LABELS[quizKey] ?? quizKey}</strong><span>—</span></div>
                                    <p>Pas encore joué</p>
                                    <small>Joue une partie pour enregistrer ton record.</small>
                                </article>)}
                        </div>}
            </section>

            {!loadingStats && !statsError && goals.length > 0 && (
                        <section className="player-other-records" aria-labelledby="other-records-title">
                            <h3 id="other-records-title">Autres records</h3>
                            <div className="player-goals-grid">
                                {goals.map(stat => <QuizRecordCard key={`${stat.quiz_key}:${stat.scope_key}`} stat={stat} />)}
                            </div>
                        </section>
                    )}
                </div>
            </details>
        </section>
    );
}
