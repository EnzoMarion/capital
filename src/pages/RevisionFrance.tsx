import { lazy, Suspense, useEffect, useMemo, useState } from "react";
import { supabase } from "../api/supabase";
import type { FrancePhysicalFeature } from "../utils/francePhysicalGeography";

const CarteFrancePhysique = lazy(() => import("../components/CarteFrancePhysique").then(module => ({ default: module.CarteFrancePhysique })));

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
    const [mountains, setMountains] = useState<FrancePhysicalFeature[]>([]);
    const [rivers, setRivers] = useState<FrancePhysicalFeature[]>([]);
    const [mountainsOpen, setMountainsOpen] = useState(false);
    const [riversOpen, setRiversOpen] = useState(false);
    const [selectedMountainId, setSelectedMountainId] = useState<string | null>(null);
    const [selectedRiverId, setSelectedRiverId] = useState<string | null>(null);

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

    useEffect(() => {
        let active = true;
        void import("../utils/francePhysicalGeography").then(data => {
            if (!active) return;
            setMountains(data.FRENCH_MOUNTAIN_RANGES);
            setRivers(data.FRENCH_RIVERS);
        });
        return () => { active = false; };
    }, []);

    const filtered = useMemo(() => {
        const needle = normalize(search.trim());
        if (!needle) return departments;
        return departments.filter(item => normalize(`${item.code} ${item.nom} ${item.cheflieu} ${item.region ?? ""}`).includes(needle));
    }, [departments, search]);
    const filteredMountains = useMemo(() => {
        const needle = normalize(search.trim());
        return mountains.filter(item => !needle || normalize(item.name).includes(needle));
    }, [mountains, search]);
    const filteredRivers = useMemo(() => {
        const needle = normalize(search.trim());
        return rivers.filter(item => !needle || normalize(item.name).includes(needle));
    }, [rivers, search]);

    if (loading) return <p className="loading-state">Chargement des fiches France…</p>;

    return (
        <main className="revision-wrapper france-revision">
            <p className="section-kicker">Entraînement libre</p>
            <h1 className="revision-title">Fiches de révision · France</h1>
            <p className="france-revision-intro">Révise les départements, les reliefs et les fleuves français. Recherche par nom, ville ou code.</p>
            <label className="sr-only" htmlFor="france-revision-search">Rechercher une fiche</label>
            <input id="france-revision-search" className="revision-search" placeholder="Ex. Gironde, Bordeaux, Loire, Alpes…" value={search} onChange={event => setSearch(event.target.value)} />
            <p className="france-revision-count">{filtered.length + filteredMountains.length + filteredRivers.length} fiche{filtered.length + filteredMountains.length + filteredRivers.length > 1 ? "s" : ""}</p>

            <details className="france-revision-accordion">
                <summary><span><small>01 · Territoire</small><strong>Départements</strong></span><span className="france-revision-accordion-count">{filtered.length} fiches<i aria-hidden="true" /></span></summary>
                <div className="france-revision-accordion-content">
                    {error ? <p className="france-revision-error" role="alert">{error}</p> : filtered.length ? <div className="france-revision-grid">
                        {filtered.map(item => <article className="france-revision-card" key={item.code}>
                            <span className="france-revision-code">{item.code}</span>
                            <div><h2>{item.nom}</h2><p><span>Préfecture</span><strong>{item.cheflieu}</strong></p><p><span>Région</span><strong>{item.region || "Non renseignée"}</strong></p></div>
                        </article>)}
                    </div> : <p className="france-revision-empty">Aucun département ne correspond à cette recherche.</p>}
                </div>
            </details>

            <details className="france-revision-accordion" onToggle={event => setMountainsOpen(event.currentTarget.open)}>
                <summary><span><small>02 · Relief</small><strong>Montagnes et massifs</strong></span><span className="france-revision-accordion-count">{filteredMountains.length} fiches<i aria-hidden="true" /></span></summary>
                <div className="france-revision-accordion-content">
                    {mountainsOpen && filteredMountains.length > 0 && <div className="france-map-panel france-physical-map-panel"><Suspense fallback={<p className="loading-state">Chargement de la carte…</p>}><CarteFrancePhysique type="mountains" highlight={filteredMountains.some(item => item.id === selectedMountainId) ? selectedMountainId ?? undefined : undefined} /></Suspense></div>}
                    {filteredMountains.length ? <div className="france-revision-grid">
                        {filteredMountains.map(item => <button type="button" className="france-revision-card france-revision-selectable-card" key={item.id}
                            aria-pressed={selectedMountainId === item.id} title={`Afficher ${item.name} sur la carte`}
                            onClick={() => setSelectedMountainId(current => current === item.id ? null : item.id)}>
                            <span className="france-revision-code" aria-hidden="true">⛰</span>
                            <span className="france-revision-card-copy"><strong>{item.name}</strong><span>Massif ou chaîne de montagnes</span></span>
                        </button>)}
                    </div> : <p className="france-revision-empty">Aucun massif ne correspond à cette recherche.</p>}
                </div>
            </details>

            <details className="france-revision-accordion" onToggle={event => setRiversOpen(event.currentTarget.open)}>
                <summary><span><small>03 · Hydrographie</small><strong>Fleuves</strong></span><span className="france-revision-accordion-count">{filteredRivers.length} fiches<i aria-hidden="true" /></span></summary>
                <div className="france-revision-accordion-content">
                    {riversOpen && filteredRivers.length > 0 && <div className="france-map-panel france-physical-map-panel"><Suspense fallback={<p className="loading-state">Chargement de la carte…</p>}><CarteFrancePhysique type="rivers" highlight={filteredRivers.some(item => item.id === selectedRiverId) ? selectedRiverId ?? undefined : undefined} /></Suspense></div>}
                    {filteredRivers.length ? <div className="france-revision-grid">
                        {filteredRivers.map(item => <button type="button" className="france-revision-card france-revision-selectable-card" key={item.id}
                            aria-pressed={selectedRiverId === item.id} title={`Afficher ${item.name} sur la carte`}
                            onClick={() => setSelectedRiverId(current => current === item.id ? null : item.id)}>
                            <span className="france-revision-code" aria-hidden="true">🌊</span>
                            <span className="france-revision-card-copy"><strong>{item.name}</strong><span>Fleuve français</span></span>
                        </button>)}
                    </div> : <p className="france-revision-empty">Aucun fleuve ne correspond à cette recherche.</p>}
                </div>
            </details>
        </main>
    );
}
