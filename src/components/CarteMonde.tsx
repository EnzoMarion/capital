import { ComposableMap, Geographies, Geography } from "react-simple-maps";
const geoUrl = "https://unpkg.com/world-atlas@2.0.2/countries-110m.json";

type TopoCountry = {
    rsmKey: string;
    id: string;
    properties: { name: string; [key: string]: unknown; };
};

export function CarteMonde({ codeISO, region = "world" }: { codeISO: string; region?: "world" | "europe" }) {
    const europeOnly = region === "europe";
    return (
        <div className="carte-fullscreen-stack">
            <ComposableMap
                projection={europeOnly ? "geoMercator" : "geoEqualEarth"}
                projectionConfig={europeOnly ? { center: [18, 53], scale: 540 } : { scale: 155 }}
                width={1000}
                height={europeOnly ? 650 : 420}
                className={`carte-map ${europeOnly ? "europe-map" : "world-map"}`}
            >
                <title>{europeOnly ? "Carte de l’Europe" : "Carte du monde"}</title>
                <Geographies geography={geoUrl}>
                    {({ geographies }: { geographies: TopoCountry[] }) =>
                        geographies.map((geo) => {
                            const isTarget = geo.id === codeISO.trim();
                            return (
                                <Geography
                                    key={`${geo.id}-${geo.rsmKey || ''}`}
                                    geography={geo}
                                    fill={isTarget ? "#F7C948" : europeOnly ? "#D9D7F7" : "#D6D6DA"}
                                    stroke={europeOnly ? "#fffefa" : "#444"}
                                    style={{
                                        default: { outline: "none" },
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
            </ComposableMap>
        </div>
    );
}
