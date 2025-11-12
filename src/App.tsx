import { Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import QuizTypeSelect from "./pages/QuizTypeSelect";
import SelectMode from "./pages/SelectMode";
import Quiz from "./pages/Quiz";

function App() {
    return (
        <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/quiz-type" element={<QuizTypeSelect />} />
            <Route path="/select-mode" element={<SelectMode />} />
            <Route path="/quiz" element={<Quiz />} />
        </Routes>
    );
}

export default App;
