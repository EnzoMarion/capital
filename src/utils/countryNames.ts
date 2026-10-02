const countryNameVariants: Record<string, string[]> = {
    "068": ["Bolivia", "État plurinational de Bolivie", "Plurinational State of Bolivia"],
    "070": ["Bosnia and Herzegovina"],
    "104": ["Myanmar", "Birmanie"],
    "112": ["Biélorussie", "Belarus"],
    "132": ["Cap-Vert", "Cabo Verde", "Cape Verde"],
    "140": ["République centrafricaine", "RCA", "Central African Republic"],
    "158": ["Taïwan", "Taiwan"],
    "178": ["République du Congo", "Congo-Brazzaville"],
    "180": ["République démocratique du Congo", "RDC", "Congo-Kinshasa"],
    "203": ["République tchèque", "Tchéquie", "Czechia", "Czech Republic"],
    "222": ["Salvador", "El Salvador"],
    "270": ["The Gambia", "Gambia"],
    "275": ["État de Palestine", "State of Palestine"],
    "384": ["Côte d’Ivoire", "Ivory Coast"],
    "408": ["Corée du Nord", "Corée populaire démocratique", "North Korea"],
    "410": ["Corée du Sud", "Republic of Korea", "South Korea"],
    "418": ["Laos", "République démocratique populaire lao", "Lao PDR"],
    "498": ["Moldavie", "République de Moldova", "Republic of Moldova"],
    "528": ["Netherlands", "Nederland"],
    "583": ["Micronésie", "États fédérés de Micronésie", "Federated States of Micronesia"],
    "626": ["Timor oriental", "East Timor"],
    "643": ["Fédération de Russie", "Russian Federation"],
    "704": ["Viêt Nam", "Vietnam"],
    "748": ["Eswatini", "Swaziland"],
    "760": ["République arabe syrienne", "Syrian Arab Republic"],
    "784": ["EAU", "Émirats", "UAE", "United Arab Emirates"],
    "792": ["Türkiye", "Turquie", "Turkey"],
    "807": ["Macédoine du Nord", "République de Macédoine du Nord", "North Macedonia", "Macedonia"],
    "826": ["Royaume-Uni", "UK", "United Kingdom"],
    "834": ["Tanzanie", "République-unie de Tanzanie", "United Republic of Tanzania"],
    "840": ["États-Unis", "USA", "United States", "United States of America"],
    "862": ["République bolivarienne du Venezuela", "Bolivarian Republic of Venezuela"],
    "887": ["Yemen", "Yémen"],
};

export function getCountryNameVariants(country: { code: string; name: string }) {
    const code = String(country.code).trim().padStart(3, "0");
    return [country.name, ...(countryNameVariants[code] ?? [])];
}

export function normalizeCountryName(value: string) {
    return value.normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLocaleLowerCase("fr-FR")
        .replace(/[^\p{L}\p{N}]+/gu, " ")
        .trim();
}
