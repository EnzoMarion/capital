import { useCallback, useEffect, useMemo, useRef, useState, type MouseEvent as ReactMouseEvent, type PointerEvent as ReactPointerEvent } from "react";
import { geoContains, geoDistance, geoOrthographic, geoPath, geoCentroid, type GeoPermissibleObjects } from "d3-geo";
import { ComposableMap, Geographies, Geography } from "react-simple-maps";
import type { Feature, FeatureCollection, Geometry } from "geojson";
import bundledCountries from "react-svg-worldmap/dist/countries.geo.js";
import { isoNumToAlpha2 } from "../utils/isoNumToAlpha2";

const MIN_GLOBE_ZOOM = .65;
const MAX_GLOBE_ZOOM = 5.2;
type Coordinate = [number, number];
type WorldCountry = Feature<Geometry, { name?: string; [key: string]: unknown }>;
type BundledCountry = { N: string; I: string; C: number[][][][] };
const alpha2ToNumeric = new Map(Object.entries(isoNumToAlpha2).map(([numeric, alpha2]) => [alpha2, numeric]));
// Atlas splits the Dutch Caribbean into separate records with its own numeric IDs.
alpha2ToNumeric.set("CW", "530");
alpha2ToNumeric.set("SX", "531");
alpha2ToNumeric.set("BQ", "532");
const worldGeographies: WorldCountry[] = (bundledCountries.features as BundledCountry[]).flatMap(country => {
    const id = alpha2ToNumeric.get(country.I);
    if (!id) return [];
    return [{
        type: "Feature",
        id,
        properties: { name: country.N },
        geometry: { type: "MultiPolygon", coordinates: country.C } as Geometry,
    }];
});
const worldGeoCollection: FeatureCollection<Geometry, { name?: string; [key: string]: unknown }> = {
    type: "FeatureCollection",
    features: worldGeographies,
};

const SMALL_COUNTRIES: Record<string, { label: string; coordinates: Coordinate }> = {
    "010": { label: "Antarctique", coordinates: [0, -82] },
    "016": { label: "Samoa américaines", coordinates: [-170.70, -14.27] },
    "020": { label: "Andorre", coordinates: [1.58, 42.55] },
    "048": { label: "Bahreïn", coordinates: [50.59, 26.22] },
    "052": { label: "Barbade", coordinates: [-59.62, 13.10] },
    "060": { label: "Bermudes", coordinates: [-64.78, 32.29] },
    "074": { label: "Île Bouvet", coordinates: [3.36, -54.42] },
    "086": { label: "Territoire britannique de l'océan Indien", coordinates: [72.42, -7.31] },
    "092": { label: "Îles Vierges britanniques", coordinates: [-64.62, 18.42] },
    "132": { label: "Cap-Vert", coordinates: [-23.51, 14.92] },
    "136": { label: "Îles Caïmans", coordinates: [-81.38, 19.29] },
    "162": { label: "Île Christmas", coordinates: [105.67, -10.42] },
    "166": { label: "Îles Cocos", coordinates: [96.83, -12.19] },
    "174": { label: "Comores", coordinates: [43.25, -11.70] },
    "175": { label: "Mayotte", coordinates: [45.23, -12.78] },
    "184": { label: "Îles Cook", coordinates: [-159.78, -21.21] },
    "212": { label: "Dominique", coordinates: [-61.39, 15.30] },
    "238": { label: "Îles Malouines", coordinates: [-57.85, -51.70] },
    "234": { label: "Îles Féroé", coordinates: [-6.77, 62.01] },
    "239": { label: "Géorgie du Sud", coordinates: [-36.50, -54.28] },
    "248": { label: "Îles Åland", coordinates: [19.93, 60.10] },
    "254": { label: "Guyane française", coordinates: [-52.33, 4.93] },
    "258": { label: "Polynésie française", coordinates: [-149.57, -17.53] },
    "260": { label: "Terres australes françaises", coordinates: [70.22, -49.35] },
    "292": { label: "Gibraltar", coordinates: [-5.35, 36.14] },
    "296": { label: "Kiribati", coordinates: [173.00, 1.45] },
    "304": { label: "Groenland", coordinates: [-51.72, 64.18] },
    "308": { label: "Grenade", coordinates: [-61.75, 12.05] },
    "312": { label: "Guadeloupe", coordinates: [-61.73, 15.99] },
    "316": { label: "Guam", coordinates: [144.79, 13.47] },
    "334": { label: "Îles Heard-et-MacDonald", coordinates: [73.51, -53.10] },
    "674": { label: "Saint-Marin", coordinates: [12.46, 43.94] },
    "492": { label: "Monaco", coordinates: [7.42, 43.74] },
    "438": { label: "Liechtenstein", coordinates: [9.55, 47.14] },
    "336": { label: "Vatican", coordinates: [12.45, 41.9] },
    "442": { label: "Luxembourg", coordinates: [6.13, 49.8] },
    "470": { label: "Malte", coordinates: [14.4, 35.9] },
    "702": { label: "Singapour", coordinates: [103.82, 1.35] },
    "344": { label: "Hong Kong", coordinates: [114.17, 22.30] },
    "446": { label: "Macao", coordinates: [113.54, 22.20] },
    "462": { label: "Maldives", coordinates: [73.51, 4.17] },
    "474": { label: "Martinique", coordinates: [-61.06, 14.61] },
    "500": { label: "Montserrat", coordinates: [-62.21, 16.71] },
    "530": { label: "Curaçao", coordinates: [-68.93, 12.11] },
    "531": { label: "Sint Maarten", coordinates: [-63.05, 18.02] },
    "532": { label: "Bonaire", coordinates: [-68.27, 12.15] },
    "533": { label: "Aruba", coordinates: [-70.03, 12.52] },
    "534": { label: "Saba", coordinates: [-63.24, 17.63] },
    "535": { label: "Saint-Eustache", coordinates: [-62.98, 17.49] },
    "540": { label: "Nouvelle-Calédonie", coordinates: [166.45, -22.27] },
    "570": { label: "Niue", coordinates: [-169.92, -19.05] },
    "574": { label: "Île Norfolk", coordinates: [167.97, -29.05] },
    "580": { label: "Îles Mariannes du Nord", coordinates: [145.75, 15.19] },
    "581": { label: "Îles mineures éloignées des États-Unis", coordinates: [-162.10, 5.88] },
    "638": { label: "La Réunion", coordinates: [55.45, -20.87] },
    "652": { label: "Saint-Barthélemy", coordinates: [-62.85, 17.90] },
    "654": { label: "Sainte-Hélène", coordinates: [-5.72, -15.94] },
    "660": { label: "Anguilla", coordinates: [-63.06, 18.22] },
    "662": { label: "Sainte-Lucie", coordinates: [-60.98, 14.01] },
    "663": { label: "Saint-Martin", coordinates: [-63.08, 18.07] },
    "666": { label: "Saint-Pierre-et-Miquelon", coordinates: [-56.18, 46.78] },
    "678": { label: "Sao Tomé-et-Principe", coordinates: [6.73, 0.34] },
    "744": { label: "Svalbard", coordinates: [15.63, 78.22] },
    "772": { label: "Tokelau", coordinates: [-171.85, -9.38] },
    "796": { label: "Îles Turques-et-Caïques", coordinates: [-71.14, 21.46] },
    "831": { label: "Guernesey", coordinates: [-2.54, 49.45] },
    "832": { label: "Jersey", coordinates: [-2.10, 49.19] },
    "833": { label: "Île de Man", coordinates: [-4.48, 54.15] },
    "850": { label: "Îles Vierges américaines", coordinates: [-64.93, 18.34] },
    "876": { label: "Wallis-et-Futuna", coordinates: [-176.18, -13.28] },
    "690": { label: "Seychelles", coordinates: [55.45, -4.62] },
    "480": { label: "Maurice", coordinates: [57.55, -20.2] },
    "520": { label: "Nauru", coordinates: [166.93, -0.52] },
    "798": { label: "Tuvalu", coordinates: [179.2, -8.52] },
    "585": { label: "Palaos", coordinates: [134.58, 7.5] },
    "612": { label: "Pitcairn", coordinates: [-130.10, -25.07] },
    "630": { label: "Porto Rico", coordinates: [-66.10, 18.47] },
    "584": { label: "Îles Marshall", coordinates: [171.18, 7.1] },
    "583": { label: "Micronésie", coordinates: [158.2, 6.9] },
    "776": { label: "Tonga", coordinates: [-175.2, -21.18] },
    "882": { label: "Samoa", coordinates: [-172.1, -13.76] },
    "028": { label: "Antigua-et-Barbuda", coordinates: [-61.8, 17.06] },
    "044": { label: "Bahamas", coordinates: [-77.4, 25.03] },
    "659": { label: "Saint-Christophe-et-Niévès", coordinates: [-62.73, 17.34] },
    "670": { label: "Saint-Vincent-et-les-Grenadines", coordinates: [-61.2, 13.25] },
    "732": { label: "Sahara occidental", coordinates: [-13.20, 27.15] },
    "827": { label: "Pays de Galles", coordinates: [-3.18, 51.48] },
    "828": { label: "Irlande du Nord", coordinates: [-5.93, 54.60] },
    "900": { label: "Écosse", coordinates: [-3.19, 55.95] },
};

const countryCode = (country: WorldCountry) => String(country.id ?? "").padStart(3, "0");

export function CarteMonde({ codeISO, region = "world", selectedCode, answerCode, onSelect, focusCode, availableCodes, showLocationMarkers = false, large = false }: {
    codeISO: string;
    region?: "world" | "europe";
    selectedCode?: string | null;
    answerCode?: string;
    onSelect?: (code: string) => void;
    focusCode?: string;
    availableCodes?: string[];
    showLocationMarkers?: boolean;
    large?: boolean;
}) {
    const europeOnly = region === "europe";
    const targetCode = codeISO.trim().padStart(3, "0");
    const correctCode = answerCode?.trim().padStart(3, "0");
    const pickedCode = selectedCode?.trim().padStart(3, "0");
    const focusedCode = focusCode?.trim().padStart(3, "0") ?? (codeISO ? targetCode : undefined);
    const smallTarget = focusedCode ? SMALL_COUNTRIES[focusedCode] : undefined;
    const [geographies] = useState<WorldCountry[]>(worldGeographies);
    const selectableCodes = useMemo(() => availableCodes
        ? new Set(availableCodes.map(code => code.trim().padStart(3, "0")))
        : null, [availableCodes]);
    const [zoom, setZoom] = useState(smallTarget ? 1.65 : 1);
    const frameRef = useRef<HTMLDivElement | null>(null);
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const rotationRef = useRef<Coordinate>([0, 0]);
    const previousFocusKey = useRef("");
    const zoomRef = useRef(zoom);
    const renderFrameRef = useRef(0);
    const suppressClickUntil = useRef(0);

    const center = useMemo<Coordinate | undefined>(() => {
        if (smallTarget) return smallTarget.coordinates;
        const match = geographies.find(geo => countryCode(geo) === focusedCode);
        return match ? geoCentroid(match) as Coordinate : undefined;
    }, [focusedCode, geographies, smallTarget]);
    const focusKey = `${focusedCode ?? ""}:${center?.[0] ?? ""}:${center?.[1] ?? ""}`;

    const draw = useCallback(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const bounds = canvas.getBoundingClientRect();
        const size = Math.min(bounds.width, bounds.height);
        if (!size) return;
        const dpr = Math.min(window.devicePixelRatio || 1, 1.75);
        const pixelWidth = Math.round(bounds.width * dpr);
        const pixelHeight = Math.round(bounds.height * dpr);
        if (canvas.width !== pixelWidth || canvas.height !== pixelHeight) {
            canvas.width = pixelWidth;
            canvas.height = pixelHeight;
        }
        const context = canvas.getContext("2d", { alpha: true });
        if (!context) return;
        context.setTransform(dpr, 0, 0, dpr, 0, 0);
        context.clearRect(0, 0, bounds.width, bounds.height);
        const cx = bounds.width / 2;
        const cy = bounds.height / 2;
        const radius = size * .49;
        const globeRadius = radius * zoomRef.current;
        const sphere = context.createRadialGradient(cx - globeRadius * .34, cy - globeRadius * .42, globeRadius * .04, cx, cy, globeRadius);
        sphere.addColorStop(0, "#344970");
        sphere.addColorStop(.62, "#172545");
        sphere.addColorStop(1, "#0b1121");
        context.beginPath();
        context.arc(cx, cy, globeRadius, 0, Math.PI * 2);
        context.fillStyle = sphere;
        context.fill();
        context.save();
        context.beginPath();
        context.arc(cx, cy, radius, 0, Math.PI * 2);
        context.clip();

        const rotation = rotationRef.current;
        const projection = geoOrthographic()
            .translate([cx, cy])
            .scale(globeRadius)
            .rotate([rotation[0], rotation[1], 0])
            .clipAngle(90)
            .precision(.35);
        const path = geoPath(projection, context);
        for (const geo of geographies) {
            const id = countryCode(geo);
            const picked = id === pickedCode;
            const answer = id === correctCode;
            const target = id === targetCode;
            const isSelectable = !selectableCodes || selectableCodes.has(id);
            context.beginPath();
            path(geo as GeoPermissibleObjects);
            context.fillStyle = picked ? "#F7C948" : answer ? "#52d49a" : target ? (onSelect ? "#52d49a" : "#F7C948") : isSelectable ? "#bfc9df" : "#8792aa";
            context.fill();
            context.strokeStyle = "#465575";
            context.lineWidth = Math.max(.45, size * .0013);
            context.stroke();
        }

        const visibleCenter: Coordinate = [-rotation[0], -rotation[1]];
        const showAllMarkers = Boolean(onSelect || showLocationMarkers);
        const markerCodes = Object.keys(SMALL_COUNTRIES).filter(code =>
            (!showAllMarkers || !selectableCodes || selectableCodes.has(code))
            && (showAllMarkers || code === targetCode || code === correctCode || code === pickedCode),
        );
        for (const code of markerCodes) {
            const item = SMALL_COUNTRIES[code];
            if (geoDistance(visibleCenter, item.coordinates) > Math.PI / 2) continue;
            const point = projection(item.coordinates);
            if (!point) continue;
            const isTarget = code === targetCode || code === focusedCode;
            const isPicked = code === pickedCode;
            const isAnswer = code === correctCode;
            context.beginPath();
            context.arc(point[0], point[1], isTarget || isPicked || isAnswer ? Math.max(6, size * .022) : Math.max(3.5, size * .01), 0, Math.PI * 2);
            context.fillStyle = isPicked ? "#f7c948" : isAnswer ? "#52d49a" : isTarget ? "#f7c948" : "#7c6bd8";
            context.fill();
            context.lineWidth = Math.max(1, size * .004);
            context.strokeStyle = "#14132a";
            context.stroke();
        }
        context.restore();
    }, [correctCode, focusedCode, geographies, onSelect, pickedCode, selectableCodes, showLocationMarkers, targetCode]);

    // A queued animation frame must always use the latest country data. Without
    // this ref, the first frame can capture the empty list before fetch resolves
    // and leave the globe blank until the next pointer gesture.
    const drawRef = useRef(draw);
    drawRef.current = draw;

    const scheduleDraw = useCallback(() => {
        if (renderFrameRef.current) return;
        renderFrameRef.current = requestAnimationFrame(() => {
            renderFrameRef.current = 0;
            drawRef.current();
        });
    }, []);

    useEffect(() => {
        zoomRef.current = zoom;
        scheduleDraw();
    }, [draw, scheduleDraw, zoom, geographies]);

    useEffect(() => {
        if (previousFocusKey.current === focusKey) return;
        previousFocusKey.current = focusKey;
        rotationRef.current = center ? [-center[0], -center[1]] : [0, 0];
        zoomRef.current = smallTarget ? 1.65 : 1;
        setZoom(zoomRef.current);
        scheduleDraw();
    }, [center, focusKey, scheduleDraw, smallTarget]);

    const selectCountryAt = useCallback((clientX: number, clientY: number) => {
        if (!onSelect || performance.now() < suppressClickUntil.current) return;
        const canvas = canvasRef.current;
        if (!canvas) return;
        const rect = canvas.getBoundingClientRect();
        const x = clientX - rect.left;
        const y = clientY - rect.top;
        const centerX = rect.width / 2;
        const centerY = rect.height / 2;
        const radius = Math.min(rect.width, rect.height) * .49;
        const normalized = [(x - centerX) / radius, (y - centerY) / radius] as [number, number];
        if (normalized[0] ** 2 + normalized[1] ** 2 > 1) return;
        const projection = geoOrthographic().translate([centerX, centerY]).scale(radius * zoomRef.current).rotate([rotationRef.current[0], rotationRef.current[1], 0]).clipAngle(90);
        const coordinate = projection.invert?.([x, y]) as Coordinate | undefined;
        if (!coordinate) return;

        let nearestMarker: { code: string; distance: number } | undefined;
        for (const [code, item] of Object.entries(SMALL_COUNTRIES)) {
            if (selectableCodes && !selectableCodes.has(code)) continue;
            if (geoDistance([-rotationRef.current[0], -rotationRef.current[1]], item.coordinates) > Math.PI / 2) continue;
            const point = projection(item.coordinates);
            if (!point) continue;
            const markerDistance = Math.hypot(point[0] - x, point[1] - y);
            if (markerDistance <= Math.max(9, rect.width * .026) && (!nearestMarker || markerDistance < nearestMarker.distance)) nearestMarker = { code, distance: markerDistance };
        }
        if (nearestMarker) {
            onSelect(nearestMarker.code);
            return;
        }
        for (let index = geographies.length - 1; index >= 0; index -= 1) {
            const geo = geographies[index];
            const code = countryCode(geo);
            if (geoContains(geo as never, coordinate) && (!selectableCodes || selectableCodes.has(code))) {
                onSelect(code);
                return;
            }
        }
    }, [geographies, onSelect, selectableCodes]);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        let initialFrame = 0;
        let layoutAttempts = 0;
        const drawWhenLaidOut = () => {
            const bounds = canvas.getBoundingClientRect();
            if (bounds.width > 0 && bounds.height > 0) {
                drawRef.current();
                return;
            }
            if (layoutAttempts++ < 12) initialFrame = requestAnimationFrame(drawWhenLaidOut);
        };
        const observer = new ResizeObserver(() => {
            const bounds = canvas.getBoundingClientRect();
            if (bounds.width > 0 && bounds.height > 0) scheduleDraw();
        });
        if (frameRef.current) observer.observe(frameRef.current);
        observer.observe(canvas);
        initialFrame = requestAnimationFrame(drawWhenLaidOut);
        scheduleDraw();
        return () => {
            observer.disconnect();
            cancelAnimationFrame(initialFrame);
            cancelAnimationFrame(renderFrameRef.current);
        };
    }, [scheduleDraw]);

    useEffect(() => {
        const element = frameRef.current;
        if (!element) return;
        const stopPageScroll = (event: WheelEvent) => {
            event.preventDefault();
            event.stopPropagation();
            zoomRef.current = Math.max(MIN_GLOBE_ZOOM, Math.min(MAX_GLOBE_ZOOM, zoomRef.current * Math.exp(-event.deltaY * .0023)));
            setZoom(zoomRef.current);
            scheduleDraw();
        };
        type TouchGesture = { mode: "rotate"; startX: number; startY: number; startRotation: Coordinate; lastX: number; lastY: number; lastAt: number; velocityX: number; velocityY: number; dragged: boolean } | { mode: "pinch"; startDistance: number; startZoom: number };
        let touchGesture: TouchGesture | null = null;
        const distance = (a: Touch, b: Touch) => Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY);
        const startGesture = (event: TouchEvent) => {
            if (event.cancelable) event.preventDefault();
            if (event.touches.length > 1) {
                touchGesture = { mode: "pinch", startDistance: Math.max(1, distance(event.touches[0], event.touches[1])), startZoom: zoomRef.current };
                suppressClickUntil.current = performance.now() + 500;
            } else if (event.touches.length === 1) {
                const touch = event.touches[0];
                touchGesture = { mode: "rotate", startX: touch.clientX, startY: touch.clientY, startRotation: [...rotationRef.current], lastX: touch.clientX, lastY: touch.clientY, lastAt: performance.now(), velocityX: 0, velocityY: 0, dragged: false };
            }
        };
        const moveGesture = (event: TouchEvent) => {
            if (event.cancelable) event.preventDefault();
            event.stopPropagation();
            if (event.touches.length > 1) {
                if (touchGesture?.mode !== "pinch") {
                    touchGesture = { mode: "pinch", startDistance: Math.max(1, distance(event.touches[0], event.touches[1])), startZoom: zoomRef.current };
                    suppressClickUntil.current = performance.now() + 500;
                }
                zoomRef.current = Math.max(MIN_GLOBE_ZOOM, Math.min(MAX_GLOBE_ZOOM, touchGesture.startZoom * distance(event.touches[0], event.touches[1]) / touchGesture.startDistance));
                setZoom(zoomRef.current);
                scheduleDraw();
                return;
            }
            if (event.touches.length !== 1) return;
            const touch = event.touches[0];
            if (touchGesture?.mode === "pinch") {
                touchGesture = { mode: "rotate", startX: touch.clientX, startY: touch.clientY, startRotation: [...rotationRef.current], lastX: touch.clientX, lastY: touch.clientY, lastAt: performance.now(), velocityX: 0, velocityY: 0, dragged: true };
                return;
            }
            if (touchGesture?.mode !== "rotate") return;
            const now = performance.now();
            const elapsed = Math.max(1, now - touchGesture.lastAt);
            touchGesture.velocityX = (touch.clientX - touchGesture.lastX) / elapsed;
            touchGesture.velocityY = (touch.clientY - touchGesture.lastY) / elapsed;
            touchGesture.lastX = touch.clientX;
            touchGesture.lastY = touch.clientY;
            touchGesture.lastAt = now;
            if (Math.abs(touch.clientX - touchGesture.startX) + Math.abs(touch.clientY - touchGesture.startY) > 5) touchGesture.dragged = true;
            const size = Math.min(element.clientWidth, element.clientHeight);
            const degreesPerPixel = 180 / Math.max(130, size);
            rotationRef.current = [touchGesture.startRotation[0] + (touch.clientX - touchGesture.startX) * degreesPerPixel, Math.max(-85, Math.min(85, touchGesture.startRotation[1] - (touch.clientY - touchGesture.startY) * degreesPerPixel))];
            scheduleDraw();
        };
        const endGesture = (event: TouchEvent) => {
            if (event.cancelable) event.preventDefault();
            if (event.touches.length === 1) {
                const touch = event.touches[0];
                touchGesture = { mode: "rotate", startX: touch.clientX, startY: touch.clientY, startRotation: [...rotationRef.current], lastX: touch.clientX, lastY: touch.clientY, lastAt: performance.now(), velocityX: 0, velocityY: 0, dragged: true };
                return;
            }
            if (event.touches.length > 1 || touchGesture?.mode !== "rotate") {
                if (touchGesture?.mode === "pinch") suppressClickUntil.current = performance.now() + 450;
                touchGesture = null;
                return;
            }
            const gesture = touchGesture;
            touchGesture = null;
            const touch = event.changedTouches[0];
            if (event.type === "touchend" && !gesture.dragged && touch) {
                selectCountryAt(touch.clientX, touch.clientY);
                suppressClickUntil.current = performance.now() + 450;
                return;
            }
            if (gesture.dragged) suppressClickUntil.current = performance.now() + 450;
            const coastX = Math.max(-3.5, Math.min(3.5, gesture.velocityX * .34 * 16));
            const coastY = Math.max(-3.5, Math.min(3.5, gesture.velocityY * .34 * 16));
            if (Math.abs(coastX) + Math.abs(coastY) <= .25) return;
            let momentum = 1;
            let previousFrame = performance.now();
            const coast = (time: number) => {
                renderFrameRef.current = 0;
                const delta = Math.min(32, time - previousFrame);
                previousFrame = time;
                momentum *= Math.pow(.92, delta / 16);
                if (momentum < .06) return;
                rotationRef.current = [rotationRef.current[0] + coastX * momentum * delta / 16, Math.max(-85, Math.min(85, rotationRef.current[1] - coastY * momentum * delta / 16))];
                draw();
                renderFrameRef.current = requestAnimationFrame(coast);
            };
            renderFrameRef.current = requestAnimationFrame(coast);
        };
        element.addEventListener("wheel", stopPageScroll, { passive: false });
        element.addEventListener("touchstart", startGesture, { passive: false });
        element.addEventListener("touchmove", moveGesture, { passive: false });
        element.addEventListener("touchend", endGesture, { passive: false });
        element.addEventListener("touchcancel", endGesture, { passive: false });
        return () => {
            element.removeEventListener("wheel", stopPageScroll);
            element.removeEventListener("touchstart", startGesture);
            element.removeEventListener("touchmove", moveGesture);
            element.removeEventListener("touchend", endGesture);
            element.removeEventListener("touchcancel", endGesture);
        };
    }, [draw, scheduleDraw, selectCountryAt]);

    const handlePointerDown = (event: ReactPointerEvent<HTMLCanvasElement>) => {
        if (event.pointerType === "touch") return;
        if (event.pointerType === "mouse" && event.button !== 0) return;
        event.preventDefault();
        cancelAnimationFrame(renderFrameRef.current);
        renderFrameRef.current = 0;
        event.currentTarget.setPointerCapture(event.pointerId);
        const startX = event.clientX;
        const startY = event.clientY;
        const startRotation = [...rotationRef.current] as Coordinate;
        let lastX = startX;
        let lastY = startY;
        let lastAt = performance.now();
        let velocityX = 0;
        let velocityY = 0;
        let dragged = false;
        const move = (moveEvent: PointerEvent) => {
            const now = performance.now();
            const elapsed = Math.max(1, now - lastAt);
            velocityX = (moveEvent.clientX - lastX) / elapsed;
            velocityY = (moveEvent.clientY - lastY) / elapsed;
            lastX = moveEvent.clientX;
            lastY = moveEvent.clientY;
            lastAt = now;
            if (Math.abs(lastX - startX) + Math.abs(lastY - startY) > 5) dragged = true;
            const canvas = canvasRef.current;
            const size = canvas ? Math.min(canvas.clientWidth, canvas.clientHeight) : 350;
            const degreesPerPixel = 180 / Math.max(130, size);
            // Keep the sphere moving with the pointer: screen Y grows downward,
            // while the orthographic camera latitude grows upward.
            rotationRef.current = [startRotation[0] + (lastX - startX) * degreesPerPixel, Math.max(-85, Math.min(85, startRotation[1] - (lastY - startY) * degreesPerPixel))];
            scheduleDraw();
        };
        const finish = () => {
            window.removeEventListener("pointermove", move);
            window.removeEventListener("pointerup", finish);
            window.removeEventListener("pointercancel", finish);
            if (dragged) suppressClickUntil.current = performance.now() + 450;
            if (!dragged) return;
            const coastX = Math.max(-3.5, Math.min(3.5, velocityX * .34 * 16));
            const coastY = Math.max(-3.5, Math.min(3.5, velocityY * .34 * 16));
            let momentum = 1;
            let previousFrame = performance.now();
            const coast = (time: number) => {
                renderFrameRef.current = 0;
                const delta = Math.min(32, time - previousFrame);
                previousFrame = time;
                momentum *= Math.pow(.92, delta / 16);
                if (momentum < .06) return;
                rotationRef.current = [rotationRef.current[0] + coastX * momentum * delta / 16, Math.max(-85, Math.min(85, rotationRef.current[1] - coastY * momentum * delta / 16))];
                draw();
                renderFrameRef.current = requestAnimationFrame(coast);
            };
            if (Math.abs(coastX) + Math.abs(coastY) > .25) renderFrameRef.current = requestAnimationFrame(coast);
        };
        window.addEventListener("pointermove", move, { passive: true });
        window.addEventListener("pointerup", finish, { once: true });
        window.addEventListener("pointercancel", finish, { once: true });
    };

    const handleCanvasClick = (event: ReactMouseEvent<HTMLCanvasElement>) => selectCountryAt(event.clientX, event.clientY);

    if (europeOnly) {
        return <div className="carte-fullscreen-stack">
            <ComposableMap projection="geoMercator" projectionConfig={{ center: [18, 53], scale: 540 }} width={1000} height={650} className="carte-map europe-map">
                <title>Carte de l’Europe</title>
                <Geographies geography={worldGeoCollection}>
                    {({ geographies }: { geographies: Array<{ rsmKey: string; id: string }> }) => geographies.map(geo => <Geography key={geo.rsmKey} geography={geo as never} fill={geo.id === targetCode ? "#F7C948" : "#D9D7F7"} stroke="#fffefa" />)}
                </Geographies>
            </ComposableMap>
        </div>;
    }

    return <div ref={frameRef} className={`carte-fullscreen-stack atlas-globe-frame${onSelect ? " world-map-interactive" : ""}${large ? " atlas-globe-large" : ""}`}>
        <canvas
            ref={canvasRef}
            className="carte-map atlas-globe"
            role="application"
            tabIndex={0}
            aria-label={onSelect ? "Globe interactif. Fais glisser pour tourner, touche un pays pour le sélectionner, ou utilise la molette pour zoomer." : "Globe terrestre interactif. Fais glisser pour tourner et utilise la molette pour zoomer."}
            onPointerDown={handlePointerDown}
            onClick={handleCanvasClick}
        />
    </div>;
}
