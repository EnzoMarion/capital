import { ComposableMap, Geographies, Geography } from "react-simple-maps";

const geoUrl = "https://unpkg.com/world-atlas@2.0.2/countries-110m.json";

type TopoCountry = {
    id: string;
    properties: {
        name: string;
        [key: string]: unknown;
    };
};

export function CarteMonde({ codeISO }: { codeISO: string }) {
    return (
        <ComposableMap projectionConfig={{ scale: 120 }} width={500} height={270}>
            <Geographies geography={geoUrl}>
                {({ geographies }: { geographies: TopoCountry[] }) => {
                    // Debug pour vérifier le mapping pays
                    console.log(
                        "Pays à surligner (code attendu) :", codeISO,
                        "| Ids liste :", geographies.map((g) => `${g.id}-${g.properties.name}`)
                    );
                    return geographies.map((geo) => {
                        const isTarget = geo.id === codeISO.trim();
                        return (
                            <Geography
                                key={geo.id}
                                geography={geo}
                                fill={isTarget ? "#ff7300" : "#D6D6DA"}
                                stroke="#555"
                                style={{
                                    default: { outline: "none" },
                                    hover: { outline: "none" },
                                    pressed: { outline: "none" }
                                }}
                            />
                        );
                    });
                }}
            </Geographies>
        </ComposableMap>
    );
}
