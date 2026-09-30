import { useMemo, useState } from "react";
import { SwissCantonFlag, USStateFlag } from "../components/TerritoryFlag";
import { SWISS_CANTONS, type SwissCanton } from "../utils/swissCantons";
import { US_STATES, type USState } from "../utils/usStates";

type Region = "switzerland" | "usa";

function normalize(value: string) {
    return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLocaleLowerCase("fr");
}

function SwissRevisionCard({ canton }: { canton: SwissCanton }) {
    return <article className="france-revision-card regional-revision-card" key={canton.code}>
        <span className="france-revision-code">{canton.code}</span>
        <div className="regional-revision-copy">
            <h2>{canton.name}</h2>
            <p><span>Chef-lieu</span><strong>{canton.chiefTown}</strong></p>
        </div>
        <SwissCantonFlag canton={canton} loading="lazy" />
    </article>;
}

function USRevisionCard({ state }: { state: USState }) {
    return <article className="france-revision-card regional-revision-card" key={state.fips}>
        <span className="france-revision-code">{state.code}</span>
        <div className="regional-revision-copy">
            <h2>{state.name}</h2>
            <p><span>Capitale</span><strong>{state.capital}</strong></p>
        </div>
        <USStateFlag state={state} loading="lazy" />
    </article>;
}

export default function RevisionRegional({ region }: { region: Region }) {
    const [search, setSearch] = useState("");
    const isSwiss = region === "switzerland";
    const needle = normalize(search.trim());
    const filteredCantons = useMemo(() => SWISS_CANTONS.filter(item =>
        !needle || normalize(`${item.code} ${item.name} ${item.aliases.join(" ")} ${item.chiefTown} ${item.chiefTownAliases.join(" ")}`).includes(needle),
    ), [needle]);
    const filteredStates = useMemo(() => US_STATES.filter(item =>
        !needle || normalize(`${item.code} ${item.name} ${item.aliases?.join(" ") ?? ""} ${item.capital}`).includes(needle),
    ), [needle]);
    const count = isSwiss ? filteredCantons.length : filteredStates.length;
    const noun = isSwiss ? "canton" : "État";

    return <main className="revision-wrapper france-revision regional-revision">
        <p className="section-kicker">Entraînement libre</p>
        <h1 className="revision-title">Fiches de révision · {isSwiss ? "Suisse" : "États-Unis"}</h1>
        <p className="france-revision-intro">{isSwiss
            ? "Révise les cantons suisses, leurs drapeaux et leurs chefs-lieux."
            : "Révise les États américains, leurs drapeaux et leurs capitales."}</p>
        <label className="sr-only" htmlFor="regional-revision-search">Rechercher une fiche</label>
        <input id="regional-revision-search" className="revision-search"
            placeholder={isSwiss ? "Ex. Vaud, Lausanne, ZH…" : "Ex. Californie, Sacramento, CA…"}
            value={search} onChange={event => setSearch(event.target.value)} />
        <p className="france-revision-count">{count} fiche{count === 1 ? "" : "s"}</p>

        <details className="france-revision-accordion" open>
            <summary>
                <span><small>Fiches</small><strong>{isSwiss ? "Cantons suisses" : "États américains"}</strong></span>
                <span className="france-revision-accordion-count">{count} {noun}{count === 1 ? "" : "s"}<i aria-hidden="true" /></span>
            </summary>
            <div className="france-revision-accordion-content">
                {count ? <div className="france-revision-grid">
                    {isSwiss
                        ? filteredCantons.map(canton => <SwissRevisionCard key={canton.code} canton={canton} />)
                        : filteredStates.map(state => <USRevisionCard key={state.fips} state={state} />)}
                </div> : <p className="france-revision-empty">Aucune fiche ne correspond à cette recherche.</p>}
            </div>
        </details>
    </main>;
}
