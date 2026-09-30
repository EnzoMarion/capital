import { useEffect, useId, useMemo, useState } from "react";
import type { Feature, FeatureCollection, Geometry, Position } from "geojson";
import { FRENCH_MOUNTAIN_RANGES, FRENCH_RIVERS, type FrancePhysicalFeature } from "../utils/francePhysicalGeography";

const geoUrl = `${import.meta.env.BASE_URL}france-departements.geojson`;
type DepartmentProperties = { code?: string; nom?: string };
type DepartmentFeature = Feature<Geometry, DepartmentProperties>;
type DepartmentCollection = FeatureCollection<Geometry, DepartmentProperties>;
type Point = [number, number];
type ProjectedDepartment = { code: string; path: string };
type MapType = "mountains" | "rivers";

let mapPromise: Promise<DepartmentCollection> | null = null;
let projectedDepartments: ProjectedDepartment[] | null = null;
let mapBounds: { minX: number; minY: number; scale: number; offsetX: number; offsetY: number } | null = null;

function loadMap() {
    if (!mapPromise) {
        mapPromise = fetch(geoUrl).then(response => {
            if (!response.ok) throw new Error("Map unavailable");
            return response.json() as Promise<DepartmentCollection>;
        }).catch(error => {
            mapPromise = null;
            throw error;
        });
    }
    return mapPromise;
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

function transform([longitude, latitude]: Position) {
    if (!mapBounds) return [0, 0] as Point;
    const [x, y] = project([longitude, latitude]);
    return [((x - mapBounds.minX) * mapBounds.scale + mapBounds.offsetX), ((y - mapBounds.minY) * mapBounds.scale + mapBounds.offsetY)] as Point;
}

function featurePath(feature: DepartmentFeature) {
    return ringsFromGeometry(feature.geometry).map(ring => ring.map((position, index) => {
        const [x, y] = transform(position);
        return `${index === 0 ? "M" : "L"}${x.toFixed(2)},${y.toFixed(2)}`;
    }).join(" ") + " Z").join(" ");
}

function linePath(feature: FrancePhysicalFeature) {
    return smoothPath(feature.coordinates, false);
}

function outlinePath(coordinates: Position[]) {
    return smoothPath(coordinates, true);
}

function smoothPath(coordinates: Position[], closed: boolean) {
    const points = coordinates.map(transform);
    if (points.length < 3) return "";

    const point = ([x, y]: Point) => `${x.toFixed(2)},${y.toFixed(2)}`;
    let path = `M${point(points[0])}`;
    const segmentCount = closed ? points.length : points.length - 1;

    for (let index = 0; index < segmentCount; index++) {
        const start = points[index];
        const end = points[(index + 1) % points.length];
        const previous = points[closed ? (index - 1 + points.length) % points.length : Math.max(0, index - 1)];
        const next = points[closed ? (index + 2) % points.length : Math.min(points.length - 1, index + 2)];
        const control1: Point = [start[0] + (end[0] - previous[0]) / 6, start[1] + (end[1] - previous[1]) / 6];
        const control2: Point = [end[0] - (next[0] - start[0]) / 6, end[1] - (next[1] - start[1]) / 6];
        path += ` C${point(control1)} ${point(control2)} ${point(end)}`;
    }

    return closed ? `${path} Z` : path;
}

function prepareDepartments(collection: DepartmentCollection) {
    if (projectedDepartments && mapBounds) return projectedDepartments;
    const features = collection.features.filter((feature): feature is DepartmentFeature => Boolean(feature.geometry));
    const points = features.flatMap(feature => ringsFromGeometry(feature.geometry).flatMap(ring => ring.map(project)));
    if (!points.length) return [];

    const minX = Math.min(...points.map(([x]) => x));
    const maxX = Math.max(...points.map(([x]) => x));
    const minY = Math.min(...points.map(([, y]) => y));
    const maxY = Math.max(...points.map(([, y]) => y));
    const width = 720;
    const height = 660;
    const padding = 16;
    const scale = Math.min((width - padding * 2) / (maxX - minX), (height - padding * 2) / (maxY - minY));
    mapBounds = {
        minX,
        minY,
        scale,
        offsetX: (width - (maxX - minX) * scale) / 2,
        offsetY: (height - (maxY - minY) * scale) / 2,
    };
    projectedDepartments = features.map(feature => ({ code: String(feature.properties?.code ?? ""), path: featurePath(feature) }));
    return projectedDepartments;
}

export function CarteFrancePhysique({ type, highlight }: { type: MapType; highlight?: string }) {
    const clipId = `france-physical-${useId().replace(/:/g, "")}`;
    const [collection, setCollection] = useState<DepartmentCollection | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);
    const features = type === "mountains" ? FRENCH_MOUNTAIN_RANGES : FRENCH_RIVERS;
    const featureLabel = type === "mountains" ? "massifs et chaînes de montagnes" : "fleuves";

    useEffect(() => {
        let active = true;
        loadMap().then(data => {
            if (!active) return;
            setCollection(data);
            setLoading(false);
        }).catch(() => {
            if (!active) return;
            setError(true);
            setLoading(false);
        });
        return () => { active = false; };
    }, []);

    const departments = useMemo(() => collection ? prepareDepartments(collection) : [], [collection]);
    const activeFeature = features.find(feature => feature.id === highlight);
    const mapTitle = highlight
        ? `Carte de France avec les principaux ${featureLabel}; un élément est mis en évidence`
        : `Carte de France avec les principaux ${featureLabel}`;

    return <div className="france-physical-map-stack" role="img" aria-label={mapTitle}>
        {loading && <div className="map-loading">Chargement de la carte physique de France…</div>}
        {error && <div className="map-error" role="alert">La carte physique de France n’a pas pu être chargée.</div>}
        {!loading && !error && departments.length > 0 && <>
            <svg className="france-physical-map-svg" viewBox="0 0 720 660" preserveAspectRatio="xMidYMid meet" aria-hidden="true">
                <title>{mapTitle}</title>
                <defs>
                    <clipPath id={clipId}>
                        {departments.map(department => <path key={department.code} d={department.path} fillRule="evenodd" />)}
                    </clipPath>
                </defs>
                {departments.map(department => <path key={department.code} className="physical-department-shape" d={department.path} fillRule="evenodd" />)}
                <g clipPath={`url(#${clipId})`}>
                    {FRENCH_MOUNTAIN_RANGES.map(feature => feature.outline && <path key={feature.id} className="physical-mountain-area" d={outlinePath(feature.outline)} />)}
                    {FRENCH_RIVERS.map(feature => <path key={feature.id} className="physical-river-path" d={linePath(feature)} />)}
                    {activeFeature && (type === "mountains" && activeFeature.outline
                        ? <path className="physical-highlight physical-highlight-mountain" d={outlinePath(activeFeature.outline)} />
                        : <path className="physical-highlight physical-highlight-river" d={linePath(activeFeature)} />)}
                </g>
                {departments.map(department => <path key={`outline-${department.code}`} className="physical-department-outline" d={department.path} fill="none" />)}
            </svg>
            <div className="france-physical-map-legend" aria-hidden="true">
                <span><i className="physical-legend-mountain" /> Massifs</span>
                <span><i className="physical-legend-river" /> Fleuves</span>
            </div>
            <small className="map-credit">Contours départementaux : GeoJSON de Grégoire David · emprises géographiques indicatives</small>
        </>}
    </div>;
}
