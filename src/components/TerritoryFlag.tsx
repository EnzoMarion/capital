import { useState } from "react";
import type { SwissCanton } from "../utils/swissCantons";
import type { USState } from "../utils/usStates";

type FlagTerritory = { kind: "canton"; item: SwissCanton } | { kind: "us-state"; item: USState };

const SWISS_FLAG_NAMES: Record<string, string[]> = {
    ZH: ["Zurich", "Zürich"], BE: ["Bern"], LU: ["Lucerne", "Luzern"], UR: ["Uri"], SZ: ["Schwyz"],
    OW: ["Obwalden"], NW: ["Nidwalden"], GL: ["Glarus"], ZG: ["Zug"], FR: ["Fribourg", "Freiburg"],
    SO: ["Solothurn"], BS: ["Basel-Stadt", "Basel-City"], BL: ["Basel-Landschaft", "Basel-Country"],
    SH: ["Schaffhausen"], AR: ["Appenzell Ausserrhoden", "Appenzell Outer Rhodes"],
    AI: ["Appenzell Innerrhoden", "Appenzell Inner Rhodes"], SG: ["St. Gallen", "Sankt Gallen"],
    GR: ["Graubünden", "Grisons"], AG: ["Aargau"], TG: ["Thurgau"], TI: ["Ticino"], VD: ["Vaud"],
    VS: ["Valais", "Wallis"], NE: ["Neuchâtel", "Neuchatel"], GE: ["Geneva", "Genève"], JU: ["Jura"],
};

function wikiFileUrl(title: string) {
    return `https://commons.wikimedia.org/wiki/Special:FilePath/${encodeURIComponent(title.replace(/ /g, "_"))}`;
}

function candidatesFor({ kind, item }: FlagTerritory) {
    if (kind === "canton" && item.code === "BS") {
        return [`${import.meta.env.BASE_URL}flags/swiss-basel-stadt.svg`];
    }

    if (kind === "us-state") {
        if (item.flagName) {
            const stateName = item.aliases?.[0] ?? item.name;
            return [
                `Flag of ${item.flagName}.svg`,
                `Flag of the State of ${stateName}.svg`,
                `${stateName} state flag.svg`,
            ].flatMap(title => [title, title.replace(/\.svg$/, ".png")]).map(wikiFileUrl);
        }
        const name = item.aliases?.[0] ?? item.name;
        return [`Flag of ${name}.svg`, `Flag of the State of ${name}.svg`, `State flag of ${name}.svg`]
            .flatMap(title => [title, title.replace(/\.svg$/, ".png")]).map(wikiFileUrl);
    }

    const names = SWISS_FLAG_NAMES[item.code] ?? [item.name];
    const titles = names.flatMap(name => [
        `Flag of Canton ${name}.svg`,
        `Flag of Canton of ${name}.svg`,
        `Flag of the Canton of ${name}.svg`,
        `Flag of the canton of ${name}.svg`,
        `Flag of the Canton ${name}.svg`,
        `Flag of ${name}.svg`,
    ]);
    if (item.code === "BS") titles.unshift(
        "Flag of Basel-Stadt.svg",
        "Flag of Basel.svg",
        "Flag of Basel City.svg",
        "Flag of Canton Basel-Stadt.svg",
        "Flag of Canton of Basel-Stadt.svg",
        "Flag of Canton Basel City.svg",
        "Flag of Basel-Stadt (canton).svg",
        "Coat of arms of Basel-Stadt.svg",
    );
    return titles.flatMap(title => [title, title.replace(/\.svg$/, ".png")]).map(wikiFileUrl);
}

function TerritoryFlagImage({ territory, loading = "eager" }: { territory: FlagTerritory; loading?: "eager" | "lazy" }) {
    const sources = candidatesFor(territory);
    const [sourceIndex, setSourceIndex] = useState(0);
    const source = sources[sourceIndex];
    if (!source) return <div className="territory-flag-unavailable" role="img" aria-label="Drapeau indisponible">Drapeau indisponible</div>;

    return <img className="territory-flag-img" src={source} alt="Drapeau à identifier" loading={loading}
        decoding="async" onError={() => setSourceIndex(index => index + 1)} />;
}

export function SwissCantonFlag({ canton, loading }: { canton: SwissCanton; loading?: "eager" | "lazy" }) {
    return <TerritoryFlagImage territory={{ kind: "canton", item: canton }} loading={loading} />;
}

export function USStateFlag({ state, loading }: { state: USState; loading?: "eager" | "lazy" }) {
    return <TerritoryFlagImage territory={{ kind: "us-state", item: state }} loading={loading} />;
}
