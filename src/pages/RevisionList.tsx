import { useEffect, useState } from "react";
import { fetchCountries, type Country } from "../api/countries";
import { isoNumToAlpha2 } from "../utils/isoNumToAlpha2";

const CATEGORIES = [
    { label: "Europe", value: "Europe" },
    { label: "Amérique du Nord", value: "North America" },
    { label: "Amérique du Sud", value: "South America" },
    { label: "Asie", value: "Asia" },
    { label: "Afrique", value: "Africa" },
    { label: "Océanie", value: "Oceania" },
    { label: "Territoire", value: "Territory" }
];

function getCategory(country: Country) {
    if (country.status === "part_of_country" || country.status === "territory") return "Territoire";
    if (country.continent === "North America") return "Amérique du Nord";
    if (country.continent === "South America") return "Amérique du Sud";
    if (country.continent === "Europe") return "Europe";
    if (country.continent === "Asia") return "Asie";
    if (country.continent === "Africa") return "Afrique";
    if (country.continent === "Oceania") return "Océanie";
    return "Autre";
}

export default function RevisionList() {
    const [countries, setCountries] = useState<Country[]>([]);
    const [search, setSearch] = useState("");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [open, setOpen] = useState<Record<string, boolean>>(() => {
        const o: Record<string, boolean> = {};
        for (const cat of CATEGORIES) o[cat.label] = false; // Tous fermés
        return o;
    });


    useEffect(() => {
        let active = true;
        fetchCountries().then(data => {
            if (active) setCountries(data);
        }).catch(() => {
            if (active) setError("La liste des pays n’a pas pu être chargée.");
        }).finally(() => {
            if (active) setLoading(false);
        });
        return () => { active = false; };
    }, []);

    const filteredByCat: Record<string, Country[]> = {};
    for (const cat of CATEGORIES) filteredByCat[cat.label] = [];

    countries.forEach(c => {
        const cat = getCategory(c);
        if (!filteredByCat[cat]) filteredByCat[cat] = [];
        filteredByCat[cat].push(c);
    });

    function toggleAccordion(cat: string) {
        setOpen(o => ({ ...o, [cat]: !o[cat] }));
    }

    const normalizedSearch = search.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLocaleLowerCase("fr-FR");

    if (loading) return <p className="loading-state">Chargement des fiches de révision…</p>;
    if (error) return <p className="empty-state error" role="alert">{error}</p>;
    if (!countries.length) return <p className="empty-state">Aucune fiche de révision n’est disponible.</p>;

    return (
        <div className="revision-wrapper">
            <h2 className="revision-title">Mode Révision : par catégorie</h2>
            <input
                className="revision-search"
                placeholder="Rechercher un pays ou une capitale…"
                value={search}
                onChange={e => setSearch(e.target.value)}
                autoFocus
            />
            {CATEGORIES.map(cat => {
                const countriesInCat = (filteredByCat[cat.label] || []).filter(c =>
                    c.name.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLocaleLowerCase("fr-FR").includes(normalizedSearch) ||
                    (c.capital && c.capital.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLocaleLowerCase("fr-FR").includes(normalizedSearch))
                );
                if (countriesInCat.length === 0) return null;
                return (
                    <div key={cat.label} className="revision-section">
                        <button
                            type="button"
                            className={"accordion-title" + (open[cat.label] ? " open" : "")}
                            onClick={() => toggleAccordion(cat.label)}
                        >
                            {cat.label}
                            <span className="revision-section-count">
                                ({countriesInCat.length}) {open[cat.label] ? "▼" : "►"}
                            </span>
                        </button>
                        {open[cat.label] && (
                            <div className="revision-grid">
                                {countriesInCat.map(country => {
                                    const alpha2 = isoNumToAlpha2[String(country.code).padStart(3, "0")];
                                    return (
                                        <div className="revision-card" key={country.code + country.name}>
                                            <div className="revision-flag">
                                                {alpha2 && alpha2 !== "??" ? (
                                                    <img
                                                        src={`https://flagcdn.com/${alpha2.toLowerCase()}.svg`}
                                                        alt={country.name}
                                                        className="revision-flag-img"
                                                        referrerPolicy="no-referrer"
                                                    />
                                                ) : (
                                                    <span className="flag-fallback">❓</span>
                                                )}
                                            </div>
                                            <div className="revision-info">
                                                <div className="revision-country">{country.name}</div>
                                                <div className="revision-capital">
                                                    <span className="label">Capitale :</span> {country.capital}
                                                </div>
                                                {country.ue_date && (
                                                    <div className="revision-ue">
                                                        <span className="label">Année UE :</span> {country.ue_date.slice(0,4)}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                );
            })}
        </div>
    );
}
