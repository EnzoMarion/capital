export const CUSTOM_QUESTION_MODES = [
    { key: "capitale", label: "Capitale", group: "pays", answerField: "capital", answerFormat: "text", prompt: "Devine la capitale de :", placeholder: "Écris la capitale", inputType: "text", inputMin: undefined, showSubject: true },
    { key: "drapeau", label: "Drapeau", group: "pays", answerField: "name", answerFormat: "text", prompt: "Quel est ce pays ?", placeholder: "Écris le nom du pays", inputType: "text", inputMin: undefined, showSubject: false },
    { key: "annee_eu", label: "Année UE", group: "pays", answerField: "ue_date", answerFormat: "year", prompt: "Année d’adhésion à l’Union européenne :", placeholder: "Écris l’année (ex. : 2004)", inputType: "number", inputMin: 1950, showSubject: true },
    { key: "fr_departement", label: "Département", group: "france", answerField: "nom", answerFormat: "text", prompt: "Quel est ce département ?", placeholder: "Écris le nom du département", inputType: "text", inputMin: undefined, showSubject: false },
    { key: "fr_prefecture", label: "Préfecture", group: "france", answerField: "cheflieu", answerFormat: "text", prompt: "Retrouve la préfecture de ce département :", placeholder: "Écris le nom de la préfecture", inputType: "text", inputMin: undefined, showSubject: true },
    { key: "fr_region", label: "Région", group: "france", answerField: "region", answerFormat: "text", prompt: "À quelle région appartient ce département ?", placeholder: "Écris le nom de la région", inputType: "text", inputMin: undefined, showSubject: true },
    { key: "sw_canton", label: "Canton suisse", group: "suisse", answerField: "name", answerFormat: "text", prompt: "Quel canton est mis en évidence ?", placeholder: "Écris le nom du canton", inputType: "text", inputMin: undefined, showSubject: false },
    { key: "sw_chief_town", label: "Chef-lieu", group: "suisse", answerField: "chiefTown", answerFormat: "text", prompt: "Quelle est la ville principale de ce canton ?", placeholder: "Écris le nom du chef-lieu", inputType: "text", inputMin: undefined, showSubject: true },
] as const;

export type CustomQuestionType = typeof CUSTOM_QUESTION_MODES[number]["key"];
export type CustomQuestion = {
    question_type: CustomQuestionType;
    country_code?: string;
    country_name?: string;
    department_code?: string;
    department_name?: string;
    canton_code?: string;
    canton_name?: string;
};

export const COUNTRY_QUESTION_MODES = CUSTOM_QUESTION_MODES.filter(mode => mode.group === "pays");
export const FRANCE_QUESTION_MODES = CUSTOM_QUESTION_MODES.filter(mode => mode.group === "france");
export const SWISS_QUESTION_MODES = CUSTOM_QUESTION_MODES.filter(mode => mode.group === "suisse");

export function getCustomQuestionMode(key: string) {
    return CUSTOM_QUESTION_MODES.find(mode => mode.key === key);
}

export function getCustomAnswerValue(mode: typeof CUSTOM_QUESTION_MODES[number], subject: object) {
    const value = (subject as unknown as Record<string, unknown>)[mode.answerField];
    if (mode.answerFormat === "year") return typeof value === "string" ? value.slice(0, 4) : "";
    return typeof value === "string" ? value : "";
}
