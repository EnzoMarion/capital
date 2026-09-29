import { useEffect, useMemo, useState } from "react";
import { supabase } from "../api/supabase";

type Department = { code: string; nom: string; cheflieu: string; region: string | null };

function departmentRank(code: string) {
    const normalized = code.trim().toUpperCase();
    if (normalized === "2A") return 20.1;
    if (normalized === "2B") return 20.2;
    const numericCode = Number(normalized);
    return Number.isFinite(numericCode) ? numericCode : Number.MAX_SAFE_INTEGER;
}

function normalize(value: string) {
    return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLocaleLowerCase("fr-FR");
}

export default function RevisionFrance() {
    const [departments, setDepartments] = useState<Department[]>([]);
    const [search, setSearch] = useState("");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        let active = true;
        void (async () => {
            try {
                const { data, error: queryError } = await supabase.from("fr_departements").select("code, nom, cheflieu, region").order("code");
                if (!active) return;
                if (queryError) setError("Les fiches France n’ont pas pu être chargées.");
                else setDepartments(((data ?? []) as Department[]).sort((a, b) =>
                    departmentRank(a.code) - departmentRank(b.code) || a.code.localeCompare(b.code, "fr")
                ));
                setLoading(false);
            } catch {
                if (active) { setError("Connexion impossible aux fiches France."); setLoading(false); }
            }
        })();
        return () => { active = false; };
    }, []);

    const filtered = useMemo(() => {
        const needle = normalize(search.trim());
        if (!needle) return departments;
        return departments.filter(item => normalize(`${item.code} ${item.nom} ${item.cheflieu} ${item.region ?? ""}`).includes(needle));
    }, [departments, search]);

    if (loading) return <p className="loading-state">Chargement des fiches France…</p>;
    if (error) return <p className="empty-state error" role="alert">{error}</p>;

    return (
        <main className="revision-wrapper france-revision">
            <p className="section-kicker">Entraînement libre</p>
            <h1 className="revision-title">Fiches de révision · France</h1>
            <p className="france-revision-intro">Retrouve les départements, leurs codes, préfectures et régions. Recherche par nom, ville ou code.</p>
            <label className="sr-only" htmlFor="france-revision-search">Rechercher une fiche</label>
            <input id="france-revision-search" className="revision-search" placeholder="Ex. Gironde, Bordeaux, 33…" value={search} onChange={event => setSearch(event.target.value)} />
            <p className="france-revision-count">{filtered.length} fiche{filtered.length > 1 ? "s" : ""}</p>
            <div className="france-revision-grid">
                {filtered.map(item => (
                    <article className="france-revision-card" key={item.code}>
                        <span className="france-revision-code">{item.code}</span>
                        <div><h2>{item.nom}</h2><p><span>Préfecture</span><strong>{item.cheflieu}</strong></p><p><span>Région</span><strong>{item.region || "Non renseignée"}</strong></p></div>
                    </article>
                ))}
            </div>
            {!filtered.length && <p className="empty-state">Aucune fiche ne correspond à cette recherche.</p>}
        </main>
    );
}
