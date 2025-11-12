export type MultipleChoiceOption = {
    label: string;
    value: string;
};

type MultipleChoiceProps = {
    options: MultipleChoiceOption[];
    onSelect: (option: MultipleChoiceOption) => void;
    disabled?: boolean;
    selected?: string | null;
    showCorrection?: boolean;
    correct?: string;
    className?: string;
};

export default function MultipleChoice({
                                           options,
                                           onSelect,
                                           disabled,
                                           selected,
                                           showCorrection,
                                           correct,
                                           className = "",
                                       }: MultipleChoiceProps) {
    return (
        <div className={`mc-choices ${className}`}>
            {options.map((o) => {
                let state = "";
                if (showCorrection) {
                    if (o.value === correct) state = "correct";
                    if (selected === o.value && o.value !== correct) state = "wrong";
                }
                return (
                    <button
                        key={o.value}
                        disabled={disabled || (!!showCorrection && state !== "correct" && state !== "wrong")}
                        className={`mc-btn ${state}` + (selected === o.value ? " selected" : "")}
                        onClick={() => onSelect(o)}
                        type="button"
                    >
                        {o.label}
                    </button>
                );
            })}
        </div>
    );
}
