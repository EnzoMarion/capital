import { Link, Navigate, Route, Routes, useLocation, useNavigate } from "react-router-dom";
import { lazy, Suspense, useEffect } from "react";
import type { ReactNode } from "react";
import Home from "./pages/Home";
import QuizTypeSelect from "./pages/QuizTypeSelect";
import SelectMode from "./pages/SelectMode";
import Quiz from "./pages/Quiz";
import { AuthProvider } from "./context/AuthContext";
import AuthStatusIcon from "./components/AuthStatusIcon";
import BackButton from "./components/BackButton";
import Login from "./pages/Login";
import QuizEuType from "./pages/QuizEuType";
import QuizFlagsType from "./pages/QuizFlagsType";
import CreateQuiz from "./pages/CreateQuiz";
import EditQuiz from "./pages/EditQuiz";
import RevisionList from "./pages/RevisionList";
import QuizFranceDepts from "./pages/QuizFranceDepts";
import QuizFranceRegions from "./pages/QuizFranceRegions";
import FranceQuizType from "./pages/FranceQuizType";
import QuizSwissCantons from "./pages/QuizSwissCantons";
import { useAuth } from "./context/AuthContext";

const QuizFrancePhysical = lazy(() => import("./pages/QuizFrancePhysical"));
const RevisionFrance = lazy(() => import("./pages/RevisionFrance"));
const QuizUSStates = lazy(() => import("./pages/QuizUSStates"));
const RevisionRegional = lazy(() => import("./pages/RevisionRegional"));

function AuthRequired({ children }: { children: ReactNode }) {
    const { user, loading } = useAuth();
    const location = useLocation();
    if (loading) return <p className="loading-state">Vérification de la session…</p>;
    if (!user) return <Navigate to="/login" replace state={{ from: location }} />;
    return children;
}

function QuizRoute() {
    const location = useLocation();
    const isPersonalQuiz = new URLSearchParams(location.search).has("quiz_id");
    return isPersonalQuiz ? <AuthRequired><Quiz /></AuthRequired> : <Quiz />;
}

function AppHeader() {
    const location = useLocation();
    const { user } = useAuth();
    return (
        <header className="app-header">
            <Link to="/" className="brand-link" aria-label="Atlas, accueil">
                <span className="brand-mark" aria-hidden="true">
                    <img
                        className="brand-avatar"
                        src={user?.avatarUrl || "/atlas-icon.svg"}
                        alt=""
                        onError={event => {
                            if (event.currentTarget.dataset.fallback) return;
                            event.currentTarget.dataset.fallback = "true";
                            event.currentTarget.src = "/atlas-icon.svg";
                        }}
                    />
                </span>
                <span className="brand-name">Atlas</span>
            </Link>
            <div className="app-actions">
                {location.pathname !== "/" && location.pathname !== "/login" && <BackButton />}
                <AuthStatusIcon />
            </div>
        </header>
    );
}

function NotFound() {
    const navigate = useNavigate();
    return <main className="empty-state not-found"><p className="section-kicker">404</p><h1>Cette page n’existe pas</h1><button className="primary-btn" onClick={() => navigate("/")}>Retour à l’accueil</button></main>;
}

function ScrollMotion() {
    const location = useLocation();

    useEffect(() => {
        if (location.pathname === "/" && location.hash) {
            const anchor = decodeURIComponent(location.hash.slice(1));
            requestAnimationFrame(() => document.getElementById(anchor)?.scrollIntoView({ behavior: "smooth", block: "start" }));
        }
        const elements = Array.from(document.querySelectorAll<HTMLElement>([
            ".home-hero", ".home-section-heading", ".mode-card", ".home-extras", ".player-progress",
            ".mode-select-wrapper", ".answer-mode-page", ".config-form", ".login-card", ".quiz-content-inner",
            ".quizfr-wrapper", ".quiz-result-wrapper", ".revision-wrapper", ".quizzes-list",
            ".quiz-create-form", ".not-found",
        ].join(",")));
        elements.forEach(element => element.classList.add("scroll-reveal"));
        document.documentElement.classList.add("motion-ready");

        if (window.matchMedia("(prefers-reduced-motion: reduce)").matches || !("IntersectionObserver" in window)) {
            elements.forEach(element => element.classList.add("is-visible"));
            return;
        }

        const observer = new IntersectionObserver(entries => {
            entries.forEach(entry => {
                if (!entry.isIntersecting) return;
                entry.target.classList.add("is-visible");
                observer.unobserve(entry.target);
            });
        }, { threshold: 0.08, rootMargin: "0px 0px -35px 0px" });
        elements.forEach(element => observer.observe(element));
        return () => observer.disconnect();
    }, [location.pathname, location.search, location.hash]);

    return null;
}

function App() {
    return (
        <AuthProvider>
            <ScrollMotion />
            <AppHeader />
            <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/quiz-type" element={<QuizTypeSelect />} />
                <Route path="/modes" element={<SelectMode />} />
                <Route path="/quiz" element={<QuizRoute />} />
                <Route path="/login" element={<Login />} />
                <Route path="/quiz-eu-type" element={<QuizEuType />} />
                <Route path="/quiz-flags-type" element={<QuizFlagsType />} />
                <Route path="/create-quiz" element={<AuthRequired><CreateQuiz /></AuthRequired>} />
                <Route path="/my-quizzes" element={<AuthRequired><Navigate to="/#mes-quiz" replace /></AuthRequired>} />
                <Route path="/edit-quiz/:id" element={<AuthRequired><EditQuiz /></AuthRequired>} />
                <Route path="/revision" element={<RevisionList />} />
                <Route path="/revision-france" element={<Suspense fallback={<p className="loading-state">Chargement des fiches…</p>}><RevisionFrance /></Suspense>} />
                <Route path="/revision-switzerland" element={<Suspense fallback={<p className="loading-state">Chargement des fiches…</p>}><RevisionRegional region="switzerland" /></Suspense>} />
                <Route path="/revision-usa" element={<Suspense fallback={<p className="loading-state">Chargement des fiches…</p>}><RevisionRegional region="usa" /></Suspense>} />
                <Route path="/quiz-france-type" element={<FranceQuizType />} />
                <Route path="/quiz-france-depts" element={<QuizFranceDepts />} />
                <Route path="/quiz-france-regions" element={<QuizFranceRegions />} />
                <Route path="/quiz-france-physical" element={<Suspense fallback={<p className="loading-state">Chargement du quiz…</p>}><QuizFrancePhysical /></Suspense>} />
                <Route path="/quiz-swiss-cantons" element={<QuizSwissCantons />} />
                <Route path="/quiz-us-states" element={<Suspense fallback={<p className="loading-state">Chargement du quiz…</p>}><QuizUSStates /></Suspense>} />
                <Route path="/404" element={<NotFound />} />
                <Route path="*" element={<Navigate to="/404" replace />} />
            </Routes>
        </AuthProvider>
    );
}

export default App;
