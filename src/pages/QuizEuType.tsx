import { useNavigate } from "react-router-dom";
export default function QuizEuType() {
    const navigate = useNavigate();
    return (
        <div style={{display:"flex",flexDirection:"column",alignItems:"center",marginTop:80}}>
            <h2>Mode Union Européenne</h2>
            <button style={{margin:"1em",padding:"1em 2.2em",fontWeight:600}} onClick={() => navigate("/quiz?eu=1&type=input")}>Saisie (année)</button>
            <button style={{margin:"1em",padding:"1em 2.2em",fontWeight:600}} onClick={() => navigate("/quiz?eu=1&type=multiple")}>QCM (année)</button>
        </div>
    );
}
