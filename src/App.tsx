import { Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import QuizTypeSelect from "./pages/QuizTypeSelect";
import SelectMode from "./pages/SelectMode";
import Quiz from "./pages/Quiz";
import { AuthProvider } from "./context/AuthContext";
import AuthStatusIcon from "./components/AuthStatusIcon.tsx";
import BackButton from "./components/BackButton";
import Login from "./pages/Login.tsx";
import QuizEuType from "./pages/QuizEuType.tsx";
import QuizFlagsType from "./pages/QuizFlagsType.tsx";
import CreateQuiz from "./pages/CreateQuiz";
import MyQuizzes from "./pages/MyQuizzes";
import EditQuiz from "./pages/EditQuiz";
import RevisionList from "./pages/RevisionList";
import QuizFranceDepts from "./pages/QuizFranceDepts.tsx";

function App() {
    return (
        <AuthProvider>
            <AuthStatusIcon />
            <BackButton />
                <Routes>
                    <Route path="/" element={<Home />} />
                    <Route path="/quiz-type" element={<QuizTypeSelect />} />
                    <Route path="/modes" element={<SelectMode />} />
                    <Route path="/quiz" element={<Quiz />} />
                    <Route path="/login" element={<Login />} />
                    <Route path="/quiz-eu-type" element={<QuizEuType />} />
                    <Route path="/quiz-flags-type" element={<QuizFlagsType />} />
                    <Route path="/create-quiz" element={<CreateQuiz />} />
                    <Route path="/my-quizzes" element={<MyQuizzes />} />
                    <Route path="/edit-quiz/:id" element={<EditQuiz />} />
                    <Route path="/revision" element={<RevisionList />} />
                    <Route path="/quiz-france-depts" element={<QuizFranceDepts />} />
                </Routes>
        </AuthProvider>
    );
}

export default App;
