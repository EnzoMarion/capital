import { ComposableMap, Geographies, Geography } from "react-simple-maps";
import type { Geometry } from "geojson";

const geoUrl = "https://france-geojson.gregoiredavid.fr/repo/departements.geojson";

type GeographyFeature = {
    type: "Feature";
    properties: {
        code: string;
        nom: string;
    };
    geometry: Geometry;
    rsmKey: string;
};

type Props = {
    highlight?: string;
};

export function CarteFranceDept({ highlight }: Props) {
    return (
        <div className="carte-fr-dept-stack">
            <ComposableMap
                projection="geoMercator"
                projectionConfig={{ scale: 1800, center: [2.35, 47] }}
                width={440}
                height={540}
            >
                <Geographies geography={geoUrl}>
                    {({ geographies }) =>
                        geographies.map((geo) => {
                            const feat = geo as GeographyFeature;
                            const code = feat.properties.code;
                            const isSelected = code === highlight;
                            return (
                                <Geography
                                    key={feat.rsmKey}
                                    geography={feat}
                                    className={
                                        "fr-dept-shape" +
                                        (isSelected ? " fr-dept-selected" : "")
                                    }
                                />
                            );
                        })
                    }
                </Geographies>
            </ComposableMap>
        </div>
    );
}
