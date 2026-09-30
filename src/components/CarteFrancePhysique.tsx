import { useEffect, useMemo, useState } from "react";
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
    return feature.coordinates.map((position, index) => {
        const [x, y] = transform(position);
        return `${index === 0 ? "M" : "L"}${x.toFixed(2)},${y.toFixed(2)}`;
    }).join(" ");
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
                {departments.map(department => <path key={department.code} className="physical-department-shape" d={department.path} fillRule="evenodd" />)}
                {FRENCH_RIVERS.map(feature => <path key={feature.id} className="physical-river-path" d={linePath(feature)} />)}
                {FRENCH_MOUNTAIN_RANGES.map(feature => <path key={feature.id} className="physical-mountain-path" d={linePath(feature)} />)}
                {activeFeature && <path className={type === "mountains" ? "physical-highlight physical-highlight-mountain" : "physical-highlight physical-highlight-river"} d={linePath(activeFeature)} />}
            </svg>
            <div className="france-physical-map-legend" aria-hidden="true">
                <span><i className="physical-legend-mountain" /> Reliefs</span>
                <span><i className="physical-legend-river" /> Fleuves</span>
            </div>
            <small className="map-credit">Contours départementaux : GeoJSON de Grégoire David · tracés principaux schématiques</small>
        </>}
    </div>;
}
