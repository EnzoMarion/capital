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
    "020": { label: "Andorre", coordinates: [1.58, 42.55] },
    "674": { label: "Saint-Marin", coordinates: [12.46, 43.94] },
    "492": { label: "Monaco", coordinates: [7.42, 43.74] },
    "438": { label: "Liechtenstein", coordinates: [9.55, 47.14] },
    "336": { label: "Vatican", coordinates: [12.45, 41.9] },
    "442": { label: "Luxembourg", coordinates: [6.13, 49.8] },
    "470": { label: "Malte", coordinates: [14.4, 35.9] },
    "702": { label: "Singapour", coordinates: [103.82, 1.35] },
    "048": { label: "Bahreïn", coordinates: [50.55, 26.07] },
    "462": { label: "Maldives", coordinates: [73.22, 3.2] },
    "690": { label: "Seychelles", coordinates: [55.45, -4.62] },
    "480": { label: "Maurice", coordinates: [57.55, -20.2] },
    "174": { label: "Comores", coordinates: [43.33, -11.65] },
    "520": { label: "Nauru", coordinates: [166.93, -0.52] },
    "798": { label: "Tuvalu", coordinates: [179.2, -8.52] },
    "585": { label: "Palaos", coordinates: [134.58, 7.5] },
    "296": { label: "Kiribati", coordinates: [-157.36, 1.87] },
    "584": { label: "Îles Marshall", coordinates: [171.18, 7.1] },
    "583": { label: "Micronésie", coordinates: [158.2, 6.9] },
    "776": { label: "Tonga", coordinates: [-175.2, -21.18] },
    "882": { label: "Samoa", coordinates: [-172.1, -13.76] },
    "028": { label: "Antigua-et-Barbuda", coordinates: [-61.8, 17.06] },
    "044": { label: "Bahamas", coordinates: [-77.4, 25.03] },
    "052": { label: "Barbade", coordinates: [-59.55, 13.19] },
    "212": { label: "Dominique", coordinates: [-61.37, 15.41] },
    "308": { label: "Grenade", coordinates: [-61.68, 12.12] },
    "659": { label: "Saint-Christophe-et-Niévès", coordinates: [-62.73, 17.34] },
    "662": { label: "Sainte-Lucie", coordinates: [-60.98, 13.91] },
    "670": { label: "Saint-Vincent-et-les-Grenadines", coordinates: [-61.2, 13.25] },
};

const countryCode = (country: WorldCountry) => String(country.id ?? "").padStart(3, "0");

export function CarteMonde({ codeISO, region = "world", selectedCode, answerCode, onSelect, focusCode, large = false }: {
    codeISO: string;
    region?: "world" | "europe";
    selectedCode?: string | null;
    answerCode?: string;
    onSelect?: (code: string) => void;
    focusCode?: string;
    large?: boolean;
}) {
    const europeOnly = region === "europe";
    const targetCode = codeISO.trim().padStart(3, "0");
    const correctCode = answerCode?.trim().padStart(3, "0");
    const pickedCode = selectedCode?.trim().padStart(3, "0");
    const focusedCode = focusCode?.trim().padStart(3, "0") ?? (codeISO ? targetCode : undefined);
    const smallTarget = focusedCode ? SMALL_COUNTRIES[focusedCode] : undefined;
    const [geographies] = useState<WorldCountry[]>(worldGeographies);
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
            context.beginPath();
            path(geo as GeoPermissibleObjects);
            context.fillStyle = picked ? "#F7C948" : answer ? "#52d49a" : target ? (onSelect ? "#52d49a" : "#F7C948") : "#bfc9df";
            context.fill();
            context.strokeStyle = "#465575";
            context.lineWidth = Math.max(.45, size * .0013);
            context.stroke();
        }

        const visibleCenter: Coordinate = [-rotation[0], -rotation[1]];
        const markerCodes = Object.keys(SMALL_COUNTRIES).filter(code => onSelect || code === targetCode || code === correctCode || code === pickedCode);
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
    }, [correctCode, focusedCode, geographies, onSelect, pickedCode, targetCode]);

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

        for (const [code, item] of Object.entries(SMALL_COUNTRIES)) {
            if (geoDistance([-rotationRef.current[0], -rotationRef.current[1]], item.coordinates) > Math.PI / 2) continue;
            const point = projection(item.coordinates);
            if (point && Math.hypot(point[0] - x, point[1] - y) <= Math.max(9, rect.width * .026)) {
                onSelect(code);
                return;
            }
        }
        for (let index = geographies.length - 1; index >= 0; index -= 1) {
            const geo = geographies[index];
            if (geoContains(geo as never, coordinate)) {
                onSelect(countryCode(geo));
                return;
            }
        }
    }, [geographies, onSelect]);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const observer = new ResizeObserver(scheduleDraw);
        observer.observe(canvas);
        scheduleDraw();
        return () => {
            observer.disconnect();
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
