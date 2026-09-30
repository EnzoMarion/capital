import { useEffect, useMemo, useState } from "react";
import type { Feature, FeatureCollection, Geometry, Position } from "geojson";

const geoUrl = `${import.meta.env.BASE_URL}france-departements.geojson`;
type DepartmentProperties = { code?: string; nom?: string };
type DepartmentFeature = Feature<Geometry, DepartmentProperties>;
type DepartmentCollection = FeatureCollection<Geometry, DepartmentProperties>;
type DepartmentPath = { code: string; name: string; path: string };
type OverseasDepartment = { code: string; name: string; paths: string[] };
type Point = [number, number];

const OVERSEAS_DEPARTMENTS: OverseasDepartment[] = [
    { code: "971", name: "Guadeloupe", paths: ["M28 19 34 10 41 14 43 24 38 34 35 47 29 58 23 53 24 41 19 32Z", "M49 28 56 22 66 24 74 29 73 37 67 40 60 36 54 40 48 36Z", "M77 54 83 51 88 55 86 61 80 62 76 59Z", "M93 34 100 31 103 35 99 39 94 38Z"] },
    { code: "972", name: "Martinique", paths: ["M56 7 64 11 66 18 72 23 69 32 74 39 70 48 65 52 66 62 59 70 55 80 49 77 45 69 47 59 42 51 44 42 40 35 45 27 43 19 49 15Z"] },
    { code: "973", name: "Guyane", paths: ["M20 25 32 19 47 21 57 17 72 21 83 18 96 23 101 34 96 43 99 55 92 66 81 69 72 78 59 74 48 80 35 72 25 69 20 58 14 50 17 39Z"] },
    { code: "974", name: "La Réunion", paths: ["M39 40 42 29 51 22 62 20 73 25 81 34 83 45 78 56 70 64 59 69 49 65 40 58 36 49Z"] },
    { code: "976", name: "Mayotte", paths: ["M44 25 53 20 62 24 68 31 65 39 59 45 51 48 44 43 40 35Z", "M72 50 79 47 84 51 82 58 76 60 71 56Z"] },
];

let departmentMapPromise: Promise<DepartmentCollection> | null = null;
let departmentPathsCache: DepartmentPath[] | null = null;

function loadDepartmentMap() {
    if (!departmentMapPromise) {
        departmentMapPromise = fetch(geoUrl).then(response => {
            if (!response.ok) throw new Error("Map unavailable");
            return response.json() as Promise<DepartmentCollection>;
        }).catch(error => {
            departmentMapPromise = null;
            throw error;
        });
    }
    return departmentMapPromise;
}

function ringsFromGeometry(geometry: Geometry | null): Position[][] {
    if (!geometry) return [];
    if (geometry.type === "Polygon") return geometry.coordinates;
    if (geometry.type === "MultiPolygon") return geometry.coordinates.flat();
    return [];
}

function project([longitude, latitude]: Position): Point {
    const radians = Math.PI / 180;
    const clampedLatitude = Math.max(-85, Math.min(85, latitude)) * radians;
    return [longitude * radians, -Math.log(Math.tan(Math.PI / 4 + clampedLatitude / 2))];
}

function pathForFeature(feature: DepartmentFeature, scale: number, minX: number, minY: number, offsetX: number, offsetY: number) {
    return ringsFromGeometry(feature.geometry)
        .map(ring => ring.map((position, index) => {
            const [x, y] = project(position);
            const px = ((x - minX) * scale + offsetX).toFixed(2);
            const py = ((y - minY) * scale + offsetY).toFixed(2);
            return `${index === 0 ? "M" : "L"}${px},${py}`;
        }).join(" ") + " Z")
        .join(" ");
}

function normalizeCode(code: string | undefined) {
    return code?.trim().padStart(2, "0") ?? "";
}

export function CarteFranceDept({ highlight, answerHighlight, hideHighlightName = false, selectedCode, onSelect }: { highlight?: string | string[]; answerHighlight?: string | string[]; hideHighlightName?: boolean; selectedCode?: string | null; onSelect?: (code: string) => void }) {
    const [collection, setCollection] = useState<DepartmentCollection | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);

    useEffect(() => {
        let active = true;
        loadDepartmentMap()
            .then(data => {
                if (!active) return;
                setCollection(data);
                setLoading(false);
            })
            .catch(() => {
                if (!active) return;
                setError(true);
                setLoading(false);
            });
        return () => { active = false; };
    }, []);

    const paths = useMemo<DepartmentPath[]>(() => {
        if (!collection) return [];
        if (departmentPathsCache) return departmentPathsCache;
        const features = collection.features.filter((feature): feature is DepartmentFeature => Boolean(feature.geometry));
        const projected = features.flatMap(feature => ringsFromGeometry(feature.geometry).flatMap(ring => ring.map(project)));
        if (!projected.length) return [];

        const minX = Math.min(...projected.map(([x]) => x));
        const maxX = Math.max(...projected.map(([x]) => x));
        const minY = Math.min(...projected.map(([, y]) => y));
        const maxY = Math.max(...projected.map(([, y]) => y));
        const width = 720;
        const height = 660;
        const padding = 16;
        const scale = Math.min((width - padding * 2) / (maxX - minX), (height - padding * 2) / (maxY - minY));
        const offsetX = (width - (maxX - minX) * scale) / 2;
        const offsetY = (height - (maxY - minY) * scale) / 2;

        departmentPathsCache = features.map(feature => ({
            code: String(feature.properties?.code ?? ""),
            name: feature.properties?.nom ?? "Département",
            path: pathForFeature(feature, scale, minX, minY, offsetX, offsetY),
        })).filter(feature => feature.path.length > 0);
        return departmentPathsCache;
    }, [collection]);

    const highlightedCodes = useMemo(() => new Set((Array.isArray(highlight) ? highlight : highlight ? [highlight] : []).map(normalizeCode)), [highlight]);
    const answerCodes = useMemo(() => new Set((Array.isArray(answerHighlight) ? answerHighlight : answerHighlight ? [answerHighlight] : []).map(normalizeCode)), [answerHighlight]);
    const pickedCode = normalizeCode(selectedCode ?? undefined);
    const mapTitle = highlightedCodes.size
        ? hideHighlightName ? "Carte de France métropolitaine et d’outre-mer avec une zone mise en évidence" : `Carte des départements français avec ${highlightedCodes.size} zone${highlightedCodes.size > 1 ? "s" : ""} mise${highlightedCodes.size > 1 ? "s" : ""} en évidence`
        : "Carte de France métropolitaine et des cinq régions d’outre-mer";

    return (
        <div className={`carte-fr-dept-stack${onSelect ? " france-map-interactive" : ""}`} role={onSelect ? "group" : "img"} aria-label={mapTitle}>
            {loading && <div className="map-loading">Chargement de la carte de France…</div>}
            {error && <div className="map-error" role="alert">La carte de France n’a pas pu être chargée.</div>}
            {!loading && !error && paths.length > 0 && <>
                <svg className="france-map-svg" viewBox="0 0 720 660" preserveAspectRatio="xMidYMid meet" aria-hidden={!onSelect}>
                    <title>{mapTitle}</title>
                    {paths.map(feature => {
                        const selected = highlightedCodes.has(normalizeCode(feature.code));
                        const isAnswer = answerCodes.has(normalizeCode(feature.code));
                        const picked = pickedCode === normalizeCode(feature.code);
                        return <path key={feature.code} d={feature.path} data-map-code={feature.code} role={onSelect ? "button" : undefined} tabIndex={onSelect ? 0 : undefined} aria-label={onSelect ? `Choisir ${feature.name}, ${feature.code}` : undefined} onClick={onSelect ? () => onSelect(feature.code) : undefined} onKeyDown={onSelect ? event => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); onSelect(feature.code); } } : undefined} className={`fr-dept-shape${selected ? " fr-dept-selected" : ""}${isAnswer ? " fr-dept-answer" : ""}${picked ? " fr-dept-pick" : ""}`} fillRule="evenodd">
                            <title>{onSelect && hideHighlightName ? (picked ? "Selected area" : "Area") : selected && hideHighlightName ? "Highlighted area" : `${feature.name} (${feature.code})`}</title>
                        </path>;
                    })}
                </svg>
                <div className="france-overseas-insets" aria-hidden={!onSelect}>
                    <small className="france-overseas-heading">Outre-mer · zones agrandies</small>
                    {OVERSEAS_DEPARTMENTS.map((region, index) => {
                        const selected = highlightedCodes.has(region.code);
                        const isAnswer = answerCodes.has(region.code);
                        const picked = pickedCode === region.code;
                        return <div className={`france-overseas-inset${selected ? " selected" : ""}${picked ? " picked" : ""}`} key={region.code} data-map-code={region.code} role={onSelect ? "button" : undefined} tabIndex={onSelect ? 0 : undefined} aria-label={onSelect ? `Choisir ${region.name}, ${region.code}` : undefined} onClick={onSelect ? () => onSelect(region.code) : undefined} onKeyDown={onSelect ? event => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); onSelect(region.code); } } : undefined}>
                            <svg viewBox="0 0 120 90" preserveAspectRatio="xMidYMid meet">
                                <title>{onSelect && hideHighlightName ? (picked ? "Selected area" : "Territory") : selected && hideHighlightName ? "Highlighted territory" : `${region.name} (${region.code})`}</title>
                                {region.paths.map((path, pathIndex) => <path key={pathIndex} d={path} className={`fr-dept-shape${selected ? " fr-dept-selected" : ""}${isAnswer ? " fr-dept-answer" : ""}${picked ? " fr-dept-pick" : ""}`} />)}
                            </svg>
                            {!hideHighlightName && <span><strong>{region.code}</strong><small>{region.name}</small></span>}
                        </div>;
                    })}
                </div>
            </>}
            <small className="map-credit">Métropole : GeoJSON de Grégoire David · Outre-mer : schématique</small>
        </div>
    );
}
