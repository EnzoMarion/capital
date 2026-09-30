export type SwissCanton = {
    id: number;
    code: string;
    name: string;
    aliases: string[];
};

export const SWISS_CANTONS: SwissCanton[] = [
    { id: 1, code: "ZH", name: "Zurich", aliases: ["Zürich", "Zurigo"] },
    { id: 2, code: "BE", name: "Berne", aliases: ["Bern"] },
    { id: 3, code: "LU", name: "Lucerne", aliases: ["Luzern"] },
    { id: 4, code: "UR", name: "Uri", aliases: [] },
    { id: 5, code: "SZ", name: "Schwyz", aliases: [] },
    { id: 6, code: "OW", name: "Obwald", aliases: ["Obwalden"] },
    { id: 7, code: "NW", name: "Nidwald", aliases: ["Nidwalden"] },
    { id: 8, code: "GL", name: "Glaris", aliases: ["Glarus"] },
    { id: 9, code: "ZG", name: "Zoug", aliases: ["Zug"] },
    { id: 10, code: "FR", name: "Fribourg", aliases: ["Freiburg"] },
    { id: 11, code: "SO", name: "Soleure", aliases: ["Solothurn"] },
    { id: 12, code: "BS", name: "Bâle-Ville", aliases: ["Bale Ville", "Basel-Stadt", "Basel Stadt"] },
    { id: 13, code: "BL", name: "Bâle-Campagne", aliases: ["Bale Campagne", "Basel-Landschaft", "Basel Landschaft"] },
    { id: 14, code: "SH", name: "Schaffhouse", aliases: ["Schaffhausen"] },
    { id: 15, code: "AR", name: "Appenzell Rhodes-Extérieures", aliases: ["Appenzell Rhodes Exterieures", "Appenzell Ausserrhoden"] },
    { id: 16, code: "AI", name: "Appenzell Rhodes-Intérieures", aliases: ["Appenzell Rhodes Interieures", "Appenzell Innerrhoden"] },
    { id: 17, code: "SG", name: "Saint-Gall", aliases: ["Saint Gall", "St Gallen", "Sankt Gallen"] },
    { id: 18, code: "GR", name: "Grisons", aliases: ["Graubünden", "Graubunden"] },
    { id: 19, code: "AG", name: "Argovie", aliases: ["Aargau"] },
    { id: 20, code: "TG", name: "Thurgovie", aliases: ["Thurgau"] },
    { id: 21, code: "TI", name: "Tessin", aliases: ["Ticino"] },
    { id: 22, code: "VD", name: "Vaud", aliases: [] },
    { id: 23, code: "VS", name: "Valais", aliases: ["Wallis"] },
    { id: 24, code: "NE", name: "Neuchâtel", aliases: ["Neuchatel"] },
    { id: 25, code: "GE", name: "Genève", aliases: ["Geneve", "Genf"] },
    { id: 26, code: "JU", name: "Jura", aliases: [] },
];

export function normalizeCantonAnswer(value: string) {
    return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLocaleLowerCase("fr-CH").replace(/[^\p{L}\p{N}]/gu, "");
}

export function cantonAnswerIsCorrect(value: string, canton: SwissCanton) {
    const answer = normalizeCantonAnswer(value);
    return [canton.name, canton.code, ...canton.aliases].some(alias => normalizeCantonAnswer(alias) === answer);
}
