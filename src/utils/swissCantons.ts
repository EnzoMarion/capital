export type SwissCanton = {
    id: number;
    code: string;
    name: string;
    aliases: string[];
    chiefTown: string;
    chiefTownAliases: string[];
};

export const SWISS_CANTONS: SwissCanton[] = [
    { id: 1, code: "ZH", name: "Zurich", aliases: ["Zürich", "Zurigo"], chiefTown: "Zurich", chiefTownAliases: ["Zürich", "Zurigo"] },
    { id: 2, code: "BE", name: "Berne", aliases: ["Bern"], chiefTown: "Berne", chiefTownAliases: ["Bern"] },
    { id: 3, code: "LU", name: "Lucerne", aliases: ["Luzern"], chiefTown: "Lucerne", chiefTownAliases: ["Luzern"] },
    { id: 4, code: "UR", name: "Uri", aliases: [], chiefTown: "Altdorf", chiefTownAliases: [] },
    { id: 5, code: "SZ", name: "Schwyz", aliases: [], chiefTown: "Schwytz", chiefTownAliases: ["Schwyz"] },
    { id: 6, code: "OW", name: "Obwald", aliases: ["Obwalden"], chiefTown: "Sarnen", chiefTownAliases: [] },
    { id: 7, code: "NW", name: "Nidwald", aliases: ["Nidwalden"], chiefTown: "Stans", chiefTownAliases: [] },
    { id: 8, code: "GL", name: "Glaris", aliases: ["Glarus"], chiefTown: "Glaris", chiefTownAliases: ["Glarus"] },
    { id: 9, code: "ZG", name: "Zoug", aliases: ["Zug"], chiefTown: "Zoug", chiefTownAliases: ["Zug"] },
    { id: 10, code: "FR", name: "Fribourg", aliases: ["Freiburg"], chiefTown: "Fribourg", chiefTownAliases: ["Freiburg"] },
    { id: 11, code: "SO", name: "Soleure", aliases: ["Solothurn"], chiefTown: "Soleure", chiefTownAliases: ["Solothurn"] },
    { id: 12, code: "BS", name: "Bâle-Ville", aliases: ["Bale Ville", "Basel-Stadt", "Basel Stadt"], chiefTown: "Bâle", chiefTownAliases: ["Bale", "Basel"] },
    { id: 13, code: "BL", name: "Bâle-Campagne", aliases: ["Bale Campagne", "Basel-Landschaft", "Basel Landschaft"], chiefTown: "Liestal", chiefTownAliases: [] },
    { id: 14, code: "SH", name: "Schaffhouse", aliases: ["Schaffhausen"], chiefTown: "Schaffhouse", chiefTownAliases: ["Schaffhausen"] },
    { id: 15, code: "AR", name: "Appenzell Rhodes-Extérieures", aliases: ["Appenzell Rhodes Exterieures", "Appenzell Ausserrhoden"], chiefTown: "Herisau", chiefTownAliases: [] },
    { id: 16, code: "AI", name: "Appenzell Rhodes-Intérieures", aliases: ["Appenzell Rhodes Interieures", "Appenzell Innerrhoden"], chiefTown: "Appenzell", chiefTownAliases: [] },
    { id: 17, code: "SG", name: "Saint-Gall", aliases: ["Saint Gall", "St Gallen", "Sankt Gallen"], chiefTown: "Saint-Gall", chiefTownAliases: ["Saint Gall", "St. Gallen", "St Gallen", "Sankt Gallen"] },
    { id: 18, code: "GR", name: "Grisons", aliases: ["Graubünden", "Graubunden"], chiefTown: "Coire", chiefTownAliases: ["Chur"] },
    { id: 19, code: "AG", name: "Argovie", aliases: ["Aargau"], chiefTown: "Aarau", chiefTownAliases: [] },
    { id: 20, code: "TG", name: "Thurgovie", aliases: ["Thurgau"], chiefTown: "Frauenfeld", chiefTownAliases: [] },
    { id: 21, code: "TI", name: "Tessin", aliases: ["Ticino"], chiefTown: "Bellinzone", chiefTownAliases: ["Bellinzona"] },
    { id: 22, code: "VD", name: "Vaud", aliases: [], chiefTown: "Lausanne", chiefTownAliases: [] },
    { id: 23, code: "VS", name: "Valais", aliases: ["Wallis"], chiefTown: "Sion", chiefTownAliases: [] },
    { id: 24, code: "NE", name: "Neuchâtel", aliases: ["Neuchatel"], chiefTown: "Neuchâtel", chiefTownAliases: ["Neuchatel"] },
    { id: 25, code: "GE", name: "Genève", aliases: ["Geneve", "Genf"], chiefTown: "Genève", chiefTownAliases: ["Geneve", "Genf"] },
    { id: 26, code: "JU", name: "Jura", aliases: [], chiefTown: "Delémont", chiefTownAliases: ["Delemont"] },
];

export function normalizeCantonAnswer(value: string) {
    return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLocaleLowerCase("fr-CH").replace(/[^\p{L}\p{N}]/gu, "");
}

export function cantonAnswerIsCorrect(value: string, canton: SwissCanton) {
    const answer = normalizeCantonAnswer(value);
    return [canton.name, canton.code, ...canton.aliases].some(alias => normalizeCantonAnswer(alias) === answer);
}

export function chiefTownAnswerIsCorrect(value: string, canton: SwissCanton) {
    const answer = normalizeCantonAnswer(value);
    return [canton.chiefTown, ...canton.chiefTownAliases].some(alias => normalizeCantonAnswer(alias) === answer);
}
