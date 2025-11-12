import { Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import QuizTypeSelect from "./pages/QuizTypeSelect";
import SelectMode from "./pages/SelectMode";
import Quiz from "./pages/Quiz";
import { AuthProvider } from "./context/AuthContext";
import AuthStatusIcon from "./components/AuthStatusIcon.tsx";
import Login from "./pages/Login.tsx";
import QuizEuType from "./pages/QuizEuType.tsx";
import QuizFlagsType from "./pages/QuizFlagsType.tsx";

function App() {
    return (
        <AuthProvider>
            <AuthStatusIcon />
                <Routes>
                    <Route path="/" element={<Home />} />
                    <Route path="/quiz-type" element={<QuizTypeSelect />} />
                    <Route path="/modes" element={<SelectMode />} />
                    <Route path="/quiz" element={<Quiz />} />
                    <Route path="/login" element={<Login />} />
                    <Route path="/quiz-eu-type" element={<QuizEuType />} />
                    <Route path="/quiz-flags-type" element={<QuizFlagsType />} />
                </Routes>
        </AuthProvider>
    );
}

export default App;
