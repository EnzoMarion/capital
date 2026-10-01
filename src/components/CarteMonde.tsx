import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { ComposableMap, Geographies, Geography, Marker } from "react-simple-maps";

// 110m keeps path data small; dedicated clickable pins preserve tiny states.
const geoUrl = "https://unpkg.com/world-atlas@2.0.2/countries-110m.json";

type TopoCountry = {
    rsmKey: string;
    id: string;
    properties: { name: string; [key: string]: unknown };
    geometry?: { coordinates?: unknown };
};
type Coordinate = [number, number];

function GeographyReady({ geographies, onReady }: { geographies: TopoCountry[]; onReady: (items: TopoCountry[]) => void }) {
    useEffect(() => { onReady(geographies); }, [geographies, onReady]);
    return null;
}

const SMALL_COUNTRIES: Record<string, { label: string; coordinates: Coordinate }> = {
    "020": { label: "Andorre", coordinates: [1.58, 42.55] },
    "674": { label: "Saint-Marin", coordinates: [12.46, 43.94] },
    "492": { label: "Monaco", coordinates: [7.42, 43.74] },
    "438": { label: "Liechtenstein", coordinates: [9.55, 47.14] },
    "336": { label: "Vatican", coordinates: [12.45, 41.9] },
    "442": { label: "Luxembourg", coordinates: [6.13, 49.8] },
    "470": { label: "Malte", coordinates: [14.4, 35.9] },
    "702": { label: "Singapour", coordinates: [103.82, 1.35] },
    "048": { label: "Bahreïn", coordinates: [50.55, 26.07] },
    "462": { label: "Maldives", coordinates: [73.22, 3.2] },
    "690": { label: "Seychelles", coordinates: [55.45, -4.62] },
    "480": { label: "Maurice", coordinates: [57.55, -20.2] },
    "174": { label: "Comores", coordinates: [43.33, -11.65] },
    "520": { label: "Nauru", coordinates: [166.93, -0.52] },
    "798": { label: "Tuvalu", coordinates: [179.2, -8.52] },
    "585": { label: "Palaos", coordinates: [134.58, 7.5] },
    "296": { label: "Kiribati", coordinates: [-157.36, 1.87] },
    "584": { label: "Îles Marshall", coordinates: [171.18, 7.1] },
    "583": { label: "Micronésie", coordinates: [158.2, 6.9] },
    "776": { label: "Tonga", coordinates: [-175.2, -21.18] },
    "882": { label: "Samoa", coordinates: [-172.1, -13.76] },
    "028": { label: "Antigua-et-Barbuda", coordinates: [-61.8, 17.06] },
    "044": { label: "Bahamas", coordinates: [-77.4, 25.03] },
    "052": { label: "Barbade", coordinates: [-59.55, 13.19] },
    "212": { label: "Dominique", coordinates: [-61.37, 15.41] },
    "308": { label: "Grenade", coordinates: [-61.68, 12.12] },
    "659": { label: "Saint-Christophe-et-Niévès", coordinates: [-62.73, 17.34] },
    "662": { label: "Sainte-Lucie", coordinates: [-60.98, 13.91] },
    "670": { label: "Saint-Vincent-et-les-Grenadines", coordinates: [-61.2, 13.25] },
};

function centerOf(geometry: TopoCountry["geometry"]): Coordinate | undefined {
    const longitudes: number[] = [];
    const latitudes: number[] = [];
    const visit = (value: unknown) => {
        if (!Array.isArray(value)) return;
        if (typeof value[0] === "number" && typeof value[1] === "number") {
            longitudes.push(value[0]);
            latitudes.push(value[1]);
            return;
        }
        value.forEach(visit);
    };
    visit(geometry?.coordinates);
    if (!longitudes.length) return undefined;
    const radians = longitudes.map(value => value * Math.PI / 180);
    const longitude = Math.atan2(radians.reduce((sum, value) => sum + Math.sin(value), 0), radians.reduce((sum, value) => sum + Math.cos(value), 0)) * 180 / Math.PI;
    return [longitude, latitudes.reduce((sum, value) => sum + value, 0) / latitudes.length];
}

export function CarteMonde({ codeISO, region = "world", selectedCode, answerCode, onSelect, focusCode, large = false }: {
    codeISO: string;
    region?: "world" | "europe";
    selectedCode?: string | null;
    answerCode?: string;
    onSelect?: (code: string) => void;
    focusCode?: string;
    large?: boolean;
}) {
    const europeOnly = region === "europe";
    const targetCode = codeISO.trim().padStart(3, "0");
    const correctCode = answerCode?.trim().padStart(3, "0");
    const pickedCode = selectedCode?.trim().padStart(3, "0");
    const focusedCode = focusCode?.trim().padStart(3, "0") ?? (codeISO ? targetCode : undefined);
    const smallTarget = focusedCode ? SMALL_COUNTRIES[focusedCode] : undefined;
    const [geographies, setGeographies] = useState<TopoCountry[]>([]);
    const geographiesReady = useRef(false);
    const saveGeographies = useCallback((items: TopoCountry[]) => {
        if (items.length > 0 && !geographiesReady.current) {
            geographiesReady.current = true;
            setGeographies(items);
        }
    }, []);
    const center = useMemo(() => {
        if (smallTarget) return smallTarget.coordinates;
        const match = geographies.find(geo => geo.id === focusedCode);
        return match ? centerOf(match.geometry) : undefined;
    }, [focusedCode, geographies, smallTarget]);
    const [manualRotation, setManualRotation] = useState<Coordinate | null>(null);
    const [zoom, setZoom] = useState(1);
    const lastPaintAt = useRef(0);
    const coastFrame = useRef(0);
    const globeFrame = useRef<HTMLDivElement | null>(null);
    const rotation = manualRotation ?? (center ? [-center[0], -center[1]] as Coordinate : [0, 0]);

    useEffect(() => () => cancelAnimationFrame(coastFrame.current), []);
    useEffect(() => {
        const element = globeFrame.current;
        if (!element) return;
        const stopPageScroll = (event: WheelEvent) => {
            event.preventDefault();
            event.stopPropagation();
            setZoom(value => Math.max(1, Math.min(2.2, value * Math.exp(-event.deltaY * .0015))));
        };
        element.addEventListener("wheel", stopPageScroll, { passive: false });
        return () => element.removeEventListener("wheel", stopPageScroll);
    }, []);

    useEffect(() => {
        setManualRotation(null);
        setZoom(smallTarget ? 1.65 : 1);
    }, [focusedCode, smallTarget]);

    if (europeOnly) {
        return <div className="carte-fullscreen-stack">
            <ComposableMap projection="geoMercator" projectionConfig={{ center: [18, 53], scale: 540 }} width={1000} height={650} className="carte-map europe-map">
                <title>Carte de l’Europe</title>
                <Geographies geography={geoUrl}>
                    {({ geographies }: { geographies: TopoCountry[] }) => geographies.map(geo => <Geography key={geo.rsmKey} geography={geo} fill={geo.id === targetCode ? "#F7C948" : "#D9D7F7"} stroke="#fffefa" />)}
                </Geographies>
            </ComposableMap>
        </div>;
    }

    const markerCodes = Object.keys(SMALL_COUNTRIES).filter(code => onSelect || code === targetCode || code === correctCode || code === pickedCode);
    const scale = 175 * zoom;
    return <div ref={globeFrame} className={`carte-fullscreen-stack atlas-globe-frame${onSelect ? " world-map-interactive" : ""}${large ? " atlas-globe-large" : ""}`} style={{ "--globe-zoom": zoom } as CSSProperties}>
        <ComposableMap
            projection="geoOrthographic"
            projectionConfig={{ rotate: [rotation[0], rotation[1], 0], scale }}
            width={350}
            height={350}
            className="carte-map atlas-globe"
            onPointerDown={event => {
                const startX = event.clientX;
                const startY = event.clientY;
                const [startLon, startLat] = rotation;
                let lastX = startX;
                let lastY = startY;
                let lastTime = performance.now();
                let velocityX = 0;
                let velocityY = 0;
                lastPaintAt.current = 0;
                cancelAnimationFrame(coastFrame.current);
                const move = (moveEvent: PointerEvent) => {
                    const now = performance.now();
                    const elapsed = Math.max(1, now - lastTime);
                    velocityX = (moveEvent.clientX - lastX) / elapsed;
                    velocityY = (moveEvent.clientY - lastY) / elapsed;
                    lastX = moveEvent.clientX;
                    lastY = moveEvent.clientY;
                    lastTime = now;
                    if (now - lastPaintAt.current < 16) return;
                    lastPaintAt.current = now;
                    setManualRotation([startLon + (moveEvent.clientX - startX) * .34, Math.max(-85, Math.min(85, startLat + (moveEvent.clientY - startY) * .34))]);
                };
                const up = () => {
                    window.removeEventListener("pointermove", move);
                    window.removeEventListener("pointerup", up);
                    const coastLon = Math.max(-3.5, Math.min(3.5, velocityX * .34 * 16));
                    const coastLat = Math.max(-3.5, Math.min(3.5, velocityY * .34 * 16));
                    let momentum = 1;
                    let previousFrame = performance.now();
                    const coast = (time: number) => {
                        const frameTime = Math.min(32, time - previousFrame);
                        previousFrame = time;
                        momentum *= Math.pow(.92, frameTime / 16);
                        if (momentum < .06) return;
                        setManualRotation(current => {
                            const [lon, lat] = current ?? [startLon + (lastX - startX) * .34, startLat + (lastY - startY) * .34];
                            return [lon + coastLon * momentum * frameTime / 16, Math.max(-85, Math.min(85, lat + coastLat * momentum * frameTime / 16))];
                        });
                        coastFrame.current = requestAnimationFrame(coast);
                    };
                    if (Math.abs(coastLon) + Math.abs(coastLat) > .25) coastFrame.current = requestAnimationFrame(coast);
                };
                window.addEventListener("pointermove", move);
                window.addEventListener("pointerup", up, { once: true });
            }}
        >
            <title>Globe interactif : fais glisser pour tourner, utilise la molette pour zoomer</title>
            <Geographies geography={geoUrl}>
                {({ geographies }: { geographies: TopoCountry[] }) => {
                    return <>
                        <GeographyReady geographies={geographies} onReady={saveGeographies} />
                        {geographies.map(geo => {
                            const isTarget = Boolean(codeISO) && geo.id === targetCode;
                            const isAnswer = Boolean(correctCode) && geo.id === correctCode;
                            const isPicked = Boolean(pickedCode) && geo.id === pickedCode;
                            return <Geography key={geo.rsmKey} geography={geo}
                                onClick={onSelect ? () => onSelect(geo.id) : undefined}
                                role={onSelect ? "button" : undefined} tabIndex={onSelect ? 0 : undefined}
                                aria-label={onSelect ? `Choisir ${geo.properties.name}` : undefined}
                                fill={isPicked ? "#F7C948" : isAnswer ? "#52d49a" : isTarget ? onSelect ? "#52d49a" : "#F7C948" : "#bfc9df"}
                                stroke="#465575"
                                style={{ default: { outline: "none", cursor: onSelect ? "pointer" : "grab", strokeWidth: isPicked ? 1.5 : .45 }, hover: { filter: "drop-shadow(0 0 5px #a995ff)" }, pressed: { outline: "none" } }}
                            />;
                        })}
                        {markerCodes.map(code => {
                            const item = SMALL_COUNTRIES[code];
                            const isTarget = code === targetCode || code === focusedCode;
                            const isPicked = code === pickedCode;
                            const isAnswer = code === correctCode;
                            return <Marker key={code} coordinates={item.coordinates}>
                                <g role={onSelect ? "button" : undefined} tabIndex={onSelect ? 0 : undefined} aria-label={onSelect ? `Choisir ${item.label}` : undefined}
                                    onClick={onSelect ? () => onSelect(code) : undefined}
                                    onKeyDown={onSelect ? event => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); onSelect(code); } } : undefined}
                                    style={{ cursor: onSelect ? "pointer" : "default" }}>
                                    <circle r={isTarget || isPicked || isAnswer ? 8 : 3.5} fill={isPicked ? "#f7c948" : isAnswer ? "#52d49a" : isTarget ? "#f7c948" : "#7c6bd8"} stroke="#14132a" strokeWidth="1.5" />
                                </g>
                            </Marker>;
                        })}
                    </>;
                }}
            </Geographies>
        </ComposableMap>
    </div>;
}
