import { useEffect, useState } from "react";
import { fetchCountries } from "../api/countries";
import type { Country } from "../api/countries";
import { useLocation, useNavigate } from "react-router-dom";
import { CarteMonde } from "../components/CarteMonde";

function shuffle(array: Country[]) {
    const arr = array.slice();
    for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
}

export default function Quiz() {
    const [countries, setCountries] = useState<Country[]>([]);
    const [current, setCurrent] = useState(0);
    const [userAnswer, setUserAnswer] = useState("");
    const [score, setScore] = useState(0);
    const [finished, setFinished] = useState(false);

    const location = useLocation();
    const navigate = useNavigate();

    useEffect(() => {
        const query = new URLSearchParams(location.search);
        const continentsParam = query.get("continents");
        const selectedContinents = continentsParam
            ? continentsParam.split(",")
            : [];
        fetchCountries(selectedContinents.length ? selectedContinents : undefined)
            .then(data => {
                const filtered = data.filter(c => !!c.capital && !!c.name && !!c.code);
                setCountries(shuffle(filtered));
            })
            .catch(e => {
                console.error(e);
                setCountries([]);
            });
    }, [location.search]);

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        function clean(s: string) {
            return s
                .normalize("NFD") // enlève les accents
                .replace(/[\u0300-\u036f]/g, "") // retire diacritiques
                .replace(/['’`\-\\. ]/g, "") // retire apostrophes, tirets, points, espaces
                .toLowerCase();
        }
        if (
            clean(countries[current]?.capital || "") === clean(userAnswer)
        ) {
            setScore(s => s + 1);
        }
        if (current < countries.length - 1) {
            setCurrent(i => i + 1);
            setUserAnswer("");
        } else {
            setFinished(true);
        }
    }

    if (countries.length === 0) return <p>Chargement des pays...</p>;

    if (finished) return (
        <div className="flex flex-col items-center mt-10">
            <h2 className="text-xl font-bold">Quiz terminé !</h2>
            <p className="mb-4">Score : {score} / {countries.length}</p>
            <button className="px-4 py-2 bg-blue-600 text-white rounded" onClick={() => {
                setFinished(false); setCurrent(0); setScore(0); setUserAnswer("");
            }}>Recommencer</button>
            <button className="mt-4 px-4 py-2 bg-gray-300 text-black rounded" onClick={() => navigate("/modes")}>Changer la sélection</button>
            <a href="/" className="mt-2 px-4 py-2 bg-gray-200 text-black rounded">Accueil</a>
        </div>
    );

    const country = countries[current];
    return (
        <div className="flex flex-col items-center mt-10">
            {country?.code && (
                <div className="mb-6 w-full max-w-xl">
                    <CarteMonde codeISO={country.code} />
                </div>
            )}
            <h2 className="text-xl font-bold mb-4">Devine la capitale de :</h2>
            <div className="font-bold text-lg mb-4">{country?.name}</div>
            <form onSubmit={handleSubmit} className="mb-2">
                <input
                    type="text"
                    value={userAnswer}
                    onChange={e => setUserAnswer(e.target.value)}
                    autoFocus
                    className="border p-2 rounded mr-2"
                    placeholder="Écris la capitale"
                />
                <button type="submit" className="bg-blue-600 text-white p-2 rounded">Valider</button>
            </form>
            <div className="mt-4 text-sm">Pays {current + 1} sur {countries.length}</div>
            <button className="mt-4 px-4 py-2 bg-gray-300 text-black rounded" onClick={() => navigate("/modes")}>Changer la sélection</button>
            <a href="/" className="mt-2 px-4 py-2 bg-gray-200 text-black rounded">Accueil</a>
        </div>
    );
}
