import { useNavigate, useLocation } from "react-router-dom";

export default function BackButton() {
    const navigate = useNavigate();
    const location = useLocation();
    return (
        <button className="backbar" type="button" onClick={() => {
            if (location.key === "default") navigate("/");
            else navigate(-1);
        }}>
            <span className="backbar-content"><span className="backbar-txt">Retour</span></span>
        </button>
    );
}
