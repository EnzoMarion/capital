import { useEffect, useMemo, useState } from "react";
import type { Feature, FeatureCollection, Geometry, Position } from "geojson";

const geoUrl = `${import.meta.env.BASE_URL}switzerland-cantons.geojson`;
type CantonProperties = { code?: string; name?: string; cantonId?: number };
type CantonFeature = Feature<Geometry, CantonProperties>;
type CantonCollection = FeatureCollection<Geometry, CantonProperties>;
type CantonPath = { code: string; name: string; path: string };
type Point = [number, number];

let cantonMapPromise: Promise<CantonCollection> | null = null;
let cantonPathsCache: CantonPath[] | null = null;

function loadCantonMap() {
    if (!cantonMapPromise) {
        cantonMapPromise = fetch(geoUrl).then(response => {
            if (!response.ok) throw new Error("Map unavailable");
            return response.json() as Promise<CantonCollection>;
        }).catch(error => {
            cantonMapPromise = null;
            throw error;
        });
    }
    return cantonMapPromise;
}

function ringsFromGeometry(geometry: Geometry | null): Position[][] {
    if (!geometry) return [];
    if (geometry.type === "Polygon") return geometry.coordinates;
    if (geometry.type === "MultiPolygon") return geometry.coordinates.flat();
    return [];
}

function project([longitude, latitude]: Position): Point {
    const radians = Math.PI / 180;
    const safeLatitude = Math.max(-85, Math.min(85, latitude)) * radians;
    return [longitude * radians, -Math.log(Math.tan(Math.PI / 4 + safeLatitude / 2))];
}

function pathForFeature(feature: CantonFeature, scale: number, minX: number, minY: number, offsetX: number, offsetY: number) {
    return ringsFromGeometry(feature.geometry)
        .map(ring => ring.map((position, index) => {
            const [x, y] = project(position);
            return `${index === 0 ? "M" : "L"}${((x - minX) * scale + offsetX).toFixed(2)},${((y - minY) * scale + offsetY).toFixed(2)}`;
        }).join(" ") + " Z")
        .join(" ");
}

function normalizedCode(code: string | undefined) {
    return code?.trim().toUpperCase() ?? "";
}

export function CarteSuisseCantons({ highlight, answerHighlight, selectedCode, onSelect }: {
    highlight?: string;
    answerHighlight?: string;
    selectedCode?: string | null;
    onSelect?: (code: string) => void;
}) {
    const [collection, setCollection] = useState<CantonCollection | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);

    useEffect(() => {
        let active = true;
        loadCantonMap().then(data => {
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

    const paths = useMemo<CantonPath[]>(() => {
        if (!collection) return [];
        if (cantonPathsCache) return cantonPathsCache;
        const features = collection.features.filter((item): item is CantonFeature => Boolean(item.geometry));
        const points = features.flatMap(item => ringsFromGeometry(item.geometry).flatMap(ring => ring.map(project)));
        if (!points.length) return [];
        const minX = Math.min(...points.map(([x]) => x));
        const maxX = Math.max(...points.map(([x]) => x));
        const minY = Math.min(...points.map(([, y]) => y));
        const maxY = Math.max(...points.map(([, y]) => y));
        const width = 700;
        const height = 540;
        const padding = 18;
        const scale = Math.min((width - padding * 2) / (maxX - minX), (height - padding * 2) / (maxY - minY));
        const offsetX = (width - (maxX - minX) * scale) / 2;
        const offsetY = (height - (maxY - minY) * scale) / 2;
        cantonPathsCache = features.map(item => ({
            code: item.properties?.code ?? "",
            name: item.properties?.name ?? "Canton",
            path: pathForFeature(item, scale, minX, minY, offsetX, offsetY),
        })).filter(item => item.code && item.path);
        return cantonPathsCache;
    }, [collection]);

    const targetCode = normalizedCode(highlight);
    const correctCode = normalizedCode(answerHighlight);
    const pickedCode = normalizedCode(selectedCode ?? undefined);
    const mapTitle = onSelect ? "Carte muette des 26 cantons suisses" : "Carte des cantons suisses";

    return <div className={`carte-suisse-stack${onSelect ? " swiss-map-interactive" : ""}`} role={onSelect ? "group" : "img"} aria-label={mapTitle}>
        {loading && <div className="map-loading">Chargement de la carte suisse…</div>}
        {error && <div className="map-error" role="alert">La carte des cantons suisses n’a pas pu être chargée.</div>}
        {!loading && !error && paths.length > 0 && <svg className="swiss-map-svg" viewBox="0 0 700 540" preserveAspectRatio="xMidYMid meet" aria-hidden={Boolean(onSelect)}>
            <title>{mapTitle}</title>
            {paths.map(canton => {
                const isTarget = targetCode === normalizedCode(canton.code);
                const isAnswer = correctCode === normalizedCode(canton.code);
                const isPicked = pickedCode === normalizedCode(canton.code);
                return <path key={canton.code} d={canton.path} data-map-code={canton.code}
                    role={onSelect ? "button" : undefined} tabIndex={onSelect ? 0 : undefined}
                    aria-label={onSelect ? "Choisir cette zone" : undefined}
                    onClick={onSelect ? () => onSelect(canton.code) : undefined}
                    onKeyDown={onSelect ? event => {
                        if (event.key === "Enter" || event.key === " ") {
                            event.preventDefault();
                            onSelect(canton.code);
                        }
                    } : undefined}
                    className={`swiss-canton-shape${isTarget ? " swiss-canton-target" : ""}${isAnswer ? " swiss-canton-answer" : ""}${isPicked ? " swiss-canton-pick" : ""}`} fillRule="evenodd">
                    <title>{onSelect ? isPicked ? "Zone présélectionnée" : "Canton" : canton.name}</title>
                </path>;
            })}
        </svg>}
        <small className="swiss-map-credit">Données cartographiques : BFS/GEOSTAT via swisstopo</small>
    </div>;
}
