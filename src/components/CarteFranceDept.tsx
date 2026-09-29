import { useEffect, useMemo, useState } from "react";
import type { Feature, FeatureCollection, Geometry, Position } from "geojson";

const geoUrl = `${import.meta.env.BASE_URL}france-departements.geojson`;
type DepartmentProperties = { code?: string; nom?: string };
type DepartmentFeature = Feature<Geometry, DepartmentProperties>;
type DepartmentCollection = FeatureCollection<Geometry, DepartmentProperties>;
type DepartmentPath = { code: string; name: string; path: string };
type Point = [number, number];

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

export function CarteFranceDept({ highlight }: { highlight?: string }) {
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

    const mapTitle = highlight ? `Département ${highlight} mis en évidence` : "Carte des départements français";

    return (
        <div className="carte-fr-dept-stack" role="img" aria-label={mapTitle}>
            {loading && <div className="map-loading">Chargement de la carte de France…</div>}
            {error && <div className="map-error" role="alert">La carte de France n’a pas pu être chargée.</div>}
            {!loading && !error && paths.length > 0 && (
                <svg className="france-map-svg" viewBox="0 0 720 660" preserveAspectRatio="xMidYMid meet" aria-hidden="true">
                    <title>{mapTitle}</title>
                    {paths.map(feature => {
                        const selected = normalizeCode(feature.code) === normalizeCode(highlight);
                        return <path key={feature.code} d={feature.path} className={`fr-dept-shape${selected ? " fr-dept-selected" : ""}`} fillRule="evenodd">
                            <title>{feature.name} ({feature.code})</title>
                        </path>;
                    })}
                </svg>
            )}
            <small className="map-credit">Contours GeoJSON · Grégoire David</small>
        </div>
    );
}
