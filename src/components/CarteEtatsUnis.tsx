import { useEffect, useMemo, useState } from "react";
import { US_STATES } from "../utils/usStates";

const geoUrl = "https://cdn.jsdelivr.net/npm/us-atlas@3/states-10m.json";
type Point = [number, number];
type StateGeometry = { id?: number | string; type: "Polygon" | "MultiPolygon"; arcs: number[][] | number[][][] };
type Topology = {
    transform: { scale: Point; translate: Point };
    arcs: Point[][];
    objects: { states: { geometries: StateGeometry[] } };
};
type StatePath = { fips: string; path: string };
type ProjectedState = { fips: string; polygons: Point[][][]; region: "main" | "alaska" | "hawaii" };

let mapPromise: Promise<Topology> | null = null;
let pathsCache: StatePath[] | null = null;

function loadTopology() {
    if (!mapPromise) {
        mapPromise = fetch(geoUrl).then(response => {
            if (!response.ok) throw new Error("US map unavailable");
            return response.json() as Promise<Topology>;
        }).catch(error => {
            mapPromise = null;
            throw error;
        });
    }
    return mapPromise;
}

function fipsCode(id: StateGeometry["id"]) {
    return String(id ?? "").padStart(2, "0");
}

function decodeArc(topology: Topology, arcIndex: number): Point[] {
    const reversed = arcIndex < 0;
    const index = reversed ? ~arcIndex : arcIndex;
    let x = 0;
    let y = 0;
    const points = (topology.arcs[index] ?? []).map(([dx, dy]) => {
        x += dx;
        y += dy;
        return [x * topology.transform.scale[0] + topology.transform.translate[0], y * topology.transform.scale[1] + topology.transform.translate[1]] as Point;
    });
    return reversed ? points.reverse() : points;
}

function joinRing(topology: Topology, arcs: number[]) {
    return arcs.flatMap((arc, index) => {
        const points = decodeArc(topology, arc);
        return index ? points.slice(1) : points;
    });
}

function geometryPolygons(topology: Topology, geometry: StateGeometry): Point[][][] {
    const polygonArcs = geometry.type === "Polygon"
        ? [geometry.arcs as number[][]]
        : geometry.arcs as number[][][];
    return polygonArcs.map(polygon => polygon.map(ring => joinRing(topology, ring)));
}

function mapRegion(fips: string): ProjectedState["region"] {
    return fips === "02" ? "alaska" : fips === "15" ? "hawaii" : "main";
}

function projectStates(topology: Topology): StatePath[] {
    if (pathsCache) return pathsCache;
    const expectedFips = new Set(US_STATES.map(state => state.fips));
    const states = topology.objects.states.geometries
        .filter(geometry => expectedFips.has(fipsCode(geometry.id)))
        .map(geometry => {
            const fips = fipsCode(geometry.id);
            return { fips, polygons: geometryPolygons(topology, geometry), region: mapRegion(fips) };
        });

    const layouts: Record<ProjectedState["region"], { x: number; y: number; width: number; height: number }> = {
        main: { x: 85, y: 25, width: 785, height: 450 },
        alaska: { x: 12, y: 380, width: 245, height: 180 },
        hawaii: { x: 265, y: 475, width: 160, height: 85 },
    };
    const cosineByRegion = { main: Math.cos(38 * Math.PI / 180), alaska: Math.cos(58 * Math.PI / 180), hawaii: Math.cos(20 * Math.PI / 180) };
    const result: StatePath[] = [];

    for (const region of ["main", "alaska", "hawaii"] as const) {
        const group = states.filter(state => state.region === region);
        const coords = group.flatMap(state => state.polygons.flatMap(polygon => polygon.flatMap(ring => ring.map(([lon, lat]) => [lon * cosineByRegion[region], -lat] as Point))));
        if (!coords.length) continue;
        const minX = Math.min(...coords.map(([x]) => x));
        const maxX = Math.max(...coords.map(([x]) => x));
        const minY = Math.min(...coords.map(([, y]) => y));
        const maxY = Math.max(...coords.map(([, y]) => y));
        const layout = layouts[region];
        const padding = region === "main" ? 4 : 5;
        const scale = Math.min((layout.width - padding * 2) / (maxX - minX), (layout.height - padding * 2) / (maxY - minY));
        const offsetX = layout.x + (layout.width - (maxX - minX) * scale) / 2;
        const offsetY = layout.y + (layout.height - (maxY - minY) * scale) / 2;
        for (const state of group) {
            const path = state.polygons.map(polygon => polygon.map(ring => {
                const points = ring.map(([lon, lat], index) => {
                    const x = (lon * cosineByRegion[region] - minX) * scale + offsetX;
                    const y = (-lat - minY) * scale + offsetY;
                    return `${index ? "L" : "M"}${x.toFixed(2)},${y.toFixed(2)}`;
                });
                return `${points.join(" ")} Z`;
            }).join(" ")).join(" ");
            result.push({ fips: state.fips, path });
        }
    }
    pathsCache = result;
    return result;
}

export function CarteEtatsUnis({ highlight, answerHighlight, selectedFips, onSelect }: {
    highlight?: string;
    answerHighlight?: string;
    selectedFips?: string | null;
    onSelect?: (fips: string) => void;
}) {
    const [topology, setTopology] = useState<Topology | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);

    useEffect(() => {
        let active = true;
        loadTopology().then(data => {
            if (!active) return;
            setTopology(data);
            setLoading(false);
        }).catch(() => {
            if (!active) return;
            setError(true);
            setLoading(false);
        });
        return () => { active = false; };
    }, []);

    const paths = useMemo(() => topology ? projectStates(topology) : [], [topology]);
    const target = fipsCode(highlight);
    const correction = fipsCode(answerHighlight);
    const picked = fipsCode(selectedFips ?? undefined);
    const mapTitle = onSelect ? "Carte muette des 50 États des États-Unis" : "Carte des États-Unis";

    return <div className={`us-map-stack${onSelect ? " us-map-interactive" : ""}`} role={onSelect ? "group" : "img"} aria-label={mapTitle}>
        {loading && <div className="map-loading">Chargement de la carte des États-Unis…</div>}
        {error && <div className="map-error" role="alert">La carte des États-Unis n’a pas pu être chargée. Vérifie ta connexion puis recharge la page.</div>}
        {!loading && !error && paths.length > 0 && <svg className="us-map-svg" viewBox="0 0 900 570" preserveAspectRatio="xMidYMid meet" aria-hidden={!onSelect}>
            <title>{mapTitle}</title>
            {paths.map(state => {
                const isTarget = target === state.fips;
                const isAnswer = correction === state.fips;
                const isPicked = picked === state.fips;
                const stateName = US_STATES.find(item => item.fips === state.fips)?.name ?? "État";
                return <path key={state.fips} d={state.path} data-map-code={state.fips}
                    role={onSelect ? "button" : undefined} tabIndex={onSelect ? 0 : undefined}
                    aria-label={onSelect ? "Choisir cette zone" : undefined}
                    onClick={onSelect ? () => onSelect(state.fips) : undefined}
                    onKeyDown={onSelect ? event => {
                        if (event.key === "Enter" || event.key === " ") {
                            event.preventDefault();
                            onSelect(state.fips);
                        }
                    } : undefined}
                    className={`us-state-shape${isTarget ? " us-state-target" : ""}${isAnswer ? " us-state-answer" : ""}${isPicked ? " us-state-pick" : ""}`} fillRule="evenodd">
                    <title>{onSelect ? isPicked ? "Zone présélectionnée" : "État" : stateName}</title>
                </path>;
            })}
        </svg>}
        <small className="us-map-credit">Contours : us-atlas · U.S. Census Bureau</small>
    </div>;
}
