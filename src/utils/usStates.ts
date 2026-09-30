export type USState = {
    fips: string;
    code: string;
    name: string;
    aliases?: string[];
    flagName?: string;
    capital: string;
    capitalAliases?: string[];
};

export const US_STATES: USState[] = [
    { fips: "01", code: "AL", name: "Alabama", capital: "Montgomery" },
    { fips: "02", code: "AK", name: "Alaska", capital: "Juneau" },
    { fips: "04", code: "AZ", name: "Arizona", capital: "Phoenix" },
    { fips: "05", code: "AR", name: "Arkansas", capital: "Little Rock" },
    { fips: "06", code: "CA", name: "Californie", aliases: ["California"], capital: "Sacramento" },
    { fips: "08", code: "CO", name: "Colorado", capital: "Denver" },
    { fips: "09", code: "CT", name: "Connecticut", capital: "Hartford" },
    { fips: "10", code: "DE", name: "Delaware", capital: "Dover" },
    { fips: "12", code: "FL", name: "Floride", aliases: ["Florida"], capital: "Tallahassee" },
    { fips: "13", code: "GA", name: "Géorgie", aliases: ["Georgia"], flagName: "Georgia (U.S. state)", capital: "Atlanta" },
    { fips: "15", code: "HI", name: "Hawaï", aliases: ["Hawaii"], capital: "Honolulu" },
    { fips: "16", code: "ID", name: "Idaho", capital: "Boise" },
    { fips: "17", code: "IL", name: "Illinois", capital: "Springfield" },
    { fips: "18", code: "IN", name: "Indiana", capital: "Indianapolis" },
    { fips: "19", code: "IA", name: "Iowa", capital: "Des Moines" },
    { fips: "20", code: "KS", name: "Kansas", capital: "Topeka" },
    { fips: "21", code: "KY", name: "Kentucky", capital: "Frankfort" },
    { fips: "22", code: "LA", name: "Louisiane", aliases: ["Louisiana"], capital: "Baton Rouge" },
    { fips: "23", code: "ME", name: "Maine", capital: "Augusta" },
    { fips: "24", code: "MD", name: "Maryland", capital: "Annapolis" },
    { fips: "25", code: "MA", name: "Massachusetts", capital: "Boston" },
    { fips: "26", code: "MI", name: "Michigan", capital: "Lansing" },
    { fips: "27", code: "MN", name: "Minnesota", capital: "Saint Paul", capitalAliases: ["St Paul"] },
    { fips: "28", code: "MS", name: "Mississippi", capital: "Jackson" },
    { fips: "29", code: "MO", name: "Missouri", capital: "Jefferson City" },
    { fips: "30", code: "MT", name: "Montana", capital: "Helena" },
    { fips: "31", code: "NE", name: "Nebraska", capital: "Lincoln" },
    { fips: "32", code: "NV", name: "Nevada", capital: "Carson City" },
    { fips: "33", code: "NH", name: "New Hampshire", capital: "Concord" },
    { fips: "34", code: "NJ", name: "New Jersey", capital: "Trenton" },
    { fips: "35", code: "NM", name: "Nouveau-Mexique", aliases: ["New Mexico"], capital: "Santa Fe" },
    { fips: "36", code: "NY", name: "New York", capital: "Albany" },
    { fips: "37", code: "NC", name: "Caroline du Nord", aliases: ["North Carolina"], capital: "Raleigh" },
    { fips: "38", code: "ND", name: "Dakota du Nord", aliases: ["North Dakota"], capital: "Bismarck" },
    { fips: "39", code: "OH", name: "Ohio", capital: "Columbus" },
    { fips: "40", code: "OK", name: "Oklahoma", capital: "Oklahoma City" },
    { fips: "41", code: "OR", name: "Oregon", capital: "Salem" },
    { fips: "42", code: "PA", name: "Pennsylvanie", aliases: ["Pennsylvania"], capital: "Harrisburg" },
    { fips: "44", code: "RI", name: "Rhode Island", capital: "Providence" },
    { fips: "45", code: "SC", name: "Caroline du Sud", aliases: ["South Carolina"], capital: "Columbia" },
    { fips: "46", code: "SD", name: "Dakota du Sud", aliases: ["South Dakota"], capital: "Pierre" },
    { fips: "47", code: "TN", name: "Tennessee", capital: "Nashville" },
    { fips: "48", code: "TX", name: "Texas", capital: "Austin" },
    { fips: "49", code: "UT", name: "Utah", capital: "Salt Lake City" },
    { fips: "50", code: "VT", name: "Vermont", capital: "Montpelier" },
    { fips: "51", code: "VA", name: "Virginie", aliases: ["Virginia"], capital: "Richmond" },
    { fips: "53", code: "WA", name: "Washington", capital: "Olympia" },
    { fips: "54", code: "WV", name: "Virginie-Occidentale", aliases: ["West Virginia"], capital: "Charleston" },
    { fips: "55", code: "WI", name: "Wisconsin", capital: "Madison" },
    { fips: "56", code: "WY", name: "Wyoming", capital: "Cheyenne" },
];

export function normalizeUSAnswer(value: string) {
    return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLocaleLowerCase("fr").replace(/[^\p{L}\p{N}]/gu, "");
}

export function stateAnswerIsCorrect(value: string, state: USState) {
    const answer = normalizeUSAnswer(value);
    return [state.name, state.code, ...(state.aliases ?? [])].some(alias => normalizeUSAnswer(alias) === answer);
}

export function capitalAnswerIsCorrect(value: string, state: USState) {
    const answer = normalizeUSAnswer(value);
    return [state.capital, ...(state.capitalAliases ?? [])].some(alias => normalizeUSAnswer(alias) === answer);
}
