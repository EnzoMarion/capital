import { ComposableMap, Geographies, Geography } from "react-simple-maps";
const geoUrl = "https://unpkg.com/world-atlas@2.0.2/countries-110m.json";

type TopoCountry = {
    id: string;
    properties: { name: string; [key: string]: unknown; };
};

export function CarteMonde({ codeISO }: { codeISO: string }) {
    return (
        <div className="carte-fullscreen-stack">
            <ComposableMap
                projectionConfig={{ scale: 160 }}
                width={1100}
                height={400}
                className="carte-map"
            >
                <Geographies geography={geoUrl}>
                    {({ geographies }: { geographies: TopoCountry[] }) =>
                        geographies.map((geo) => {
                            const isTarget = geo.id === codeISO.trim();
                            return (
                                <Geography
                                    key={geo.id}
                                    geography={geo}
                                    fill={isTarget ? "#ff7300" : "#D6D6DA"}
                                    stroke="#444"
                                    style={{
                                        default: { outline: "none" },
                                        hover: {
                                            outline: "none",
                                            filter: isTarget
                                                ? "drop-shadow(0 0 8px #ff7300aa)"
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
