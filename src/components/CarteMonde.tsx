import { ComposableMap, Geographies, Geography, Marker } from "react-simple-maps";
const geoUrl = "https://unpkg.com/world-atlas@2.0.2/countries-50m.json";

type TopoCountry = {
    rsmKey: string;
    id: string;
    properties: { name: string; [key: string]: unknown; };
};

const MICROSTATE_CENTERS: Record<string, { label: string; coordinates: [number, number] }> = {
    "020": { label: "Andorre", coordinates: [1.58, 42.55] },
    "674": { label: "Saint-Marin", coordinates: [12.46, 43.94] },
    "492": { label: "Monaco", coordinates: [7.42, 43.74] },
    "438": { label: "Liechtenstein", coordinates: [9.55, 47.14] },
    "336": { label: "Vatican", coordinates: [12.45, 41.9] },
    "442": { label: "Luxembourg", coordinates: [6.13, 49.8] },
    "470": { label: "Malte", coordinates: [14.4, 35.9] },
};

export function CarteMonde({ codeISO, region = "world", selectedCode, answerCode, onSelect, focusCode }: { codeISO: string; region?: "world" | "europe"; selectedCode?: string | null; answerCode?: string; onSelect?: (code: string) => void; focusCode?: string }) {
    const europeOnly = region === "europe";
    const targetCode = codeISO.trim().padStart(3, "0");
    const correctCode = answerCode?.trim().padStart(3, "0");
    const pickedCode = selectedCode?.trim().padStart(3, "0");
    const focus = focusCode ? MICROSTATE_CENTERS[focusCode.trim().padStart(3, "0")] : undefined;
    return (
        <div className={`carte-fullscreen-stack${onSelect ? " world-map-interactive" : ""}`}>
            <ComposableMap
                projection={europeOnly || focus ? "geoMercator" : "geoEqualEarth"}
                projectionConfig={focus ? { center: [8, 44], scale: 1900 } : europeOnly ? { center: [18, 53], scale: 540 } : { scale: 155 }}
                width={1000}
                height={europeOnly || focus ? 650 : 420}
                className={`carte-map ${europeOnly || focus ? "europe-map" : "world-map"}`}
            >
                <title>{europeOnly ? "Carte de l’Europe" : "Carte du monde"}</title>
                <Geographies geography={geoUrl}>
                    {({ geographies }: { geographies: TopoCountry[] }) =>
                        geographies.map((geo) => {
                            const isTarget = Boolean(codeISO) && geo.id === targetCode;
                            const isAnswer = Boolean(correctCode) && geo.id === correctCode;
                            const isPicked = Boolean(pickedCode) && geo.id === pickedCode;
                            return (
                                <Geography
                                    key={`${geo.id}-${geo.rsmKey || ''}`}
                                    geography={geo}
                                    onClick={onSelect ? () => onSelect(geo.id) : undefined}
                                    onKeyDown={onSelect ? event => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); onSelect(geo.id); } } : undefined}
                                    role={onSelect ? "button" : undefined}
                                    aria-label={onSelect ? `Choisir ${geo.properties.name}` : undefined}
                                    tabIndex={onSelect ? 0 : undefined}
                                    fill={isPicked ? "#F7C948" : isAnswer ? "#52d49a" : isTarget ? onSelect ? "#52d49a" : "#F7C948" : europeOnly || focus ? "#D9D7F7" : "#D6D6DA"}
                                    stroke={europeOnly ? "#fffefa" : "#444"}
                                    style={{
                                        default: { outline: "none", cursor: onSelect ? "pointer" : "default", stroke: isPicked ? "#5145ba" : europeOnly ? "#fffefa" : "#444", strokeWidth: isPicked ? 2 : 0.6 },
                                        hover: {
                                            outline: "none",
                                            filter: isTarget
                                                ? "drop-shadow(0 0 8px #F7C948aa)"
                                                : "drop-shadow(0 0 7px #646cff88)",
                                        },
                                        pressed: { outline: "none" }
                                    }}
                                />
                            );
                        })
                    }
                </Geographies>
                {focus && Object.entries(MICROSTATE_CENTERS).map(([code, microstate]) => {
                    const isPicked = pickedCode === code;
                    const isAnswer = correctCode === code;
                    return <Marker key={code} coordinates={microstate.coordinates}>
                        <g role={onSelect ? "button" : undefined} tabIndex={onSelect ? 0 : undefined} aria-label={onSelect ? `Choisir ${microstate.label}` : undefined} onClick={onSelect ? () => onSelect(code) : undefined} onKeyDown={onSelect ? event => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); onSelect(code); } } : undefined} style={{ cursor: onSelect ? "pointer" : "default" }}>
                            <circle r="14" fill={isPicked ? "rgba(247,201,72,.38)" : isAnswer ? "rgba(82,212,154,.42)" : "rgba(100,108,255,.2)"} stroke={isPicked ? "#f7c948" : isAnswer ? "#52d49a" : "#5145ba"} strokeWidth="2" />
                            <circle r="4" fill={isPicked ? "#f7c948" : isAnswer ? "#52d49a" : "#c4b9ff"} stroke="#31275f" strokeWidth="1.5" />
                        </g>
                    </Marker>;
                })}
            </ComposableMap>
        </div>
    );
}
