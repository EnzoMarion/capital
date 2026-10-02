import { Link, Navigate, Route, Routes, useLocation, useNavigate } from "react-router-dom";
import { lazy, Suspense, useEffect } from "react";
import type { ReactNode } from "react";
import Home from "./pages/Home";
import { AuthProvider } from "./context/AuthContext";
import AuthStatusIcon from "./components/AuthStatusIcon";
import BackButton from "./components/BackButton";
import { useAuth } from "./context/useAuth";
const QuizTypeSelect = lazy(() => import("./pages/QuizTypeSelect"));
const SelectMode = lazy(() => import("./pages/SelectMode"));
const Quiz = lazy(() => import("./pages/Quiz"));
const Login = lazy(() => import("./pages/Login"));
const QuizEuType = lazy(() => import("./pages/QuizEuType"));
const QuizFlagsType = lazy(() => import("./pages/QuizFlagsType"));
const CreateQuiz = lazy(() => import("./pages/CreateQuiz"));
const EditQuiz = lazy(() => import("./pages/EditQuiz"));
const RevisionList = lazy(() => import("./pages/RevisionList"));
const QuizFranceDepts = lazy(() => import("./pages/QuizFranceDepts"));
const QuizFranceRegions = lazy(() => import("./pages/QuizFranceRegions"));
const FranceQuizType = lazy(() => import("./pages/FranceQuizType"));
const QuizSwissCantons = lazy(() => import("./pages/QuizSwissCantons"));
const PrivacyPolicy = lazy(() => import("./pages/PrivacyPolicy"));
const LegalNotice = lazy(() => import("./pages/LegalNotice"));
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
            <Link to="/" className="brand-link" aria-label="Atlas, accueil" onClick={event => {
                if (location.pathname !== "/" || location.hash) return;
                event.preventDefault();
                window.scrollTo({ top: 0, left: 0, behavior: "smooth" });
            }}>
                <span className="brand-mark" aria-hidden="true">
                    <img
                        className="brand-avatar"
                        src={user?.avatarUrl || "/atlas-icon.svg"}
                        referrerPolicy="no-referrer"
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

const PAGE_METADATA: Record<string, { title: string; description: string }> = {
    "/": { title: "Atlas — Quiz de géographie gratuit en français", description: "Apprends et révise les capitales, pays, drapeaux, départements et régions avec les quiz gratuits Atlas." },
    "/quiz-type": { title: "Quiz de géographie — Atlas", description: "Choisis un quiz de géographie du monde, de France, de Suisse ou des États-Unis." },
    "/modes": { title: "Modes de quiz de géographie — Atlas", description: "Entraîne-toi en QCM, en saisie libre ou avec une carte muette interactive." },
    "/quiz-france-type": { title: "Quiz de géographie française — Atlas", description: "Révise les départements, les régions, les montagnes et les fleuves de France." },
    "/quiz-france-depts": { title: "Quiz des départements français — Atlas", description: "Retrouve les départements français et leurs chefs-lieux grâce à des quiz et une carte muette." },
    "/quiz-france-regions": { title: "Quiz des régions françaises — Atlas", description: "Apprends à reconnaître les régions françaises et leurs préfectures." },
    "/quiz-france-physical": { title: "Relief et cours d’eau de France — Atlas", description: "Révise les grands repères physiques de la France avec des quiz de géographie." },
    "/quiz-swiss-cantons": { title: "Quiz des cantons suisses — Atlas", description: "Apprends les 26 cantons suisses, leurs chefs-lieux et leurs drapeaux." },
    "/quiz-us-states": { title: "Quiz des États des États-Unis — Atlas", description: "Révise les 50 États américains, leurs capitales et leurs drapeaux." },
    "/quiz-eu-type": { title: "Quiz sur l’Union européenne — Atlas", description: "Teste tes connaissances sur les pays et les capitales de l’Union européenne." },
    "/quiz-flags-type": { title: "Quiz des drapeaux du monde — Atlas", description: "Apprends à reconnaître les drapeaux des pays du monde." },
    "/revision": { title: "Fiches de géographie — Atlas", description: "Retrouve les fiches de révision des pays et des capitales." },
    "/revision-france": { title: "Révisions de géographie française — Atlas", description: "Révise les départements, régions et repères physiques de la France." },
    "/revision-switzerland": { title: "Révisions des cantons suisses — Atlas", description: "Retrouve les fiches de révision des cantons suisses et de leurs chefs-lieux." },
    "/revision-usa": { title: "Révisions des États américains — Atlas", description: "Retrouve les fiches de révision des États et capitales des États-Unis." },
    "/confidentialite": { title: "Confidentialité et données personnelles — Atlas", description: "Découvre quelles données Atlas utilise, pourquoi, combien de temps et comment exercer tes droits." },
    "/mentions-legales": { title: "Mentions légales — Atlas", description: "Éditeur, publication et hébergement du site Atlas." },
};

function setMeta(attribute: "name" | "property", key: string, content: string) {
    let element = document.head.querySelector<HTMLMetaElement>(`meta[${attribute}="${key}"]`);
    if (!element) {
        element = document.createElement("meta");
        element.setAttribute(attribute, key);
        document.head.appendChild(element);
    }
    element.content = content;
}

function RouteMetadata() {
    const location = useLocation();
    useEffect(() => {
        const meta = PAGE_METADATA[location.pathname] ?? { title: "Atlas — Quiz de géographie", description: "Des quiz gratuits pour apprendre la géographie du monde et de la France." };
        const privateRoute = ["/login", "/create-quiz", "/edit-quiz/", "/my-quizzes", "/quiz", "/404"].some(path => location.pathname === path || (path.endsWith("/") && location.pathname.startsWith(path)));
        const canonical = `https://capital-black.vercel.app${location.pathname === "/" ? "/" : location.pathname}`;
        document.title = meta.title;
        setMeta("name", "description", meta.description);
        setMeta("name", "robots", privateRoute ? "noindex,follow" : "index,follow");
        setMeta("property", "og:title", meta.title);
        setMeta("property", "og:description", meta.description);
        setMeta("property", "og:url", canonical);
        setMeta("name", "twitter:title", meta.title);
        setMeta("name", "twitter:description", meta.description);
        let canonicalLink = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
        if (!canonicalLink) {
            canonicalLink = document.createElement("link");
            canonicalLink.rel = "canonical";
            document.head.appendChild(canonicalLink);
        }
        canonicalLink.href = canonical;
    }, [location.pathname]);
    return null;
}

function ScrollMotion() {
    const location = useLocation();

    useEffect(() => {
        if (location.pathname === "/" && location.hash) {
            const anchor = decodeURIComponent(location.hash.slice(1));
            requestAnimationFrame(() => document.getElementById(anchor)?.scrollIntoView({ behavior: "smooth", block: "start" }));
        } else if (!location.hash) {
            window.scrollTo(0, 0);
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
            <RouteMetadata />
            <AppHeader />
            <Suspense fallback={<p className="loading-state" role="status">Chargement d’Atlas…</p>}>
            <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/quiz-type" element={<QuizTypeSelect />} />
                <Route path="/modes" element={<SelectMode />} />
                <Route path="/quiz" element={<QuizRoute />} />
                <Route path="/login" element={<Login />} />
                <Route path="/confidentialite" element={<PrivacyPolicy />} />
                <Route path="/mentions-legales" element={<LegalNotice />} />
                <Route path="/quiz-eu-type" element={<QuizEuType />} />
                <Route path="/quiz-flags-type" element={<QuizFlagsType />} />
                <Route path="/create-quiz" element={<AuthRequired><CreateQuiz /></AuthRequired>} />
                <Route path="/my-quizzes" element={<AuthRequired><Navigate to="/#mes-quiz" replace /></AuthRequired>} />
                <Route path="/edit-quiz/:id" element={<AuthRequired><EditQuiz /></AuthRequired>} />
                <Route path="/revision" element={<RevisionList />} />
                <Route path="/revision-france" element={<RevisionFrance />} />
                <Route path="/revision-switzerland" element={<RevisionRegional region="switzerland" />} />
                <Route path="/revision-usa" element={<RevisionRegional region="usa" />} />
                <Route path="/quiz-france-type" element={<FranceQuizType />} />
                <Route path="/quiz-france-depts" element={<QuizFranceDepts />} />
                <Route path="/quiz-france-regions" element={<QuizFranceRegions />} />
                <Route path="/quiz-france-physical" element={<QuizFrancePhysical />} />
                <Route path="/quiz-swiss-cantons" element={<QuizSwissCantons />} />
                <Route path="/quiz-us-states" element={<QuizUSStates />} />
                <Route path="/404" element={<NotFound />} />
                <Route path="*" element={<Navigate to="/404" replace />} />
            </Routes>
            </Suspense>
            <footer className="site-privacy-footer"><Link to="/confidentialite">Confidentialité</Link><span aria-hidden="true">·</span><Link to="/mentions-legales">Mentions légales</Link></footer>
        </AuthProvider>
    );
}

export default App;
