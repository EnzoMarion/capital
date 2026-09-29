export type TerritoryMode = "countries" | "with-territories" | "territories-only";

const MODES: { value: TerritoryMode; label: string; help?: string }[] = [
    { value: "countries", label: "Pays uniquement" },
    {
        value: "with-territories",
        label: "Pays + territoires",
        help: "Les pays indépendants et les territoires qui dépendent d’un autre pays, comme Mayotte (France) ou le Groenland (Danemark).",
    },
    {
        value: "territories-only",
        label: "Territoires uniquement",
        help: "Les territoires et dépendances rattachés à un autre pays, comme Mayotte (France) ou le Groenland (Danemark), sans les pays indépendants.",
    },
];

export default function TerritoryModePicker({ value, onChange }: {
    value: TerritoryMode;
    onChange: (mode: TerritoryMode) => void;
}) {
    return (
        <fieldset className="territory-mode-picker">
            <legend>Mode de jeu</legend>
            <div className="territory-mode-options">
                {MODES.map(mode => (
                    <div className={`territory-mode-option ${value === mode.value ? "selected" : ""}`} key={mode.value}>
                        <label className="territory-mode-choice">
                            <input
                                type="radio"
                                name="territory-mode"
                                value={mode.value}
                                checked={value === mode.value}
                                onChange={() => onChange(mode.value)}
                            />
                            <span className="territory-mode-label">{mode.label}</span>
                        </label>
                        {mode.help && (
                            <span className="territory-mode-help" tabIndex={0} aria-label={`À propos de ${mode.label}`}>
                                ?<span role="tooltip">{mode.help}</span>
                            </span>
                        )}
                    </div>
                ))}
            </div>
        </fieldset>
    );
}
