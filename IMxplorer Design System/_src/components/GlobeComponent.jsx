"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";

const Globe = dynamic(() => import("react-globe.gl"), {
  ssr: false,
  loading: () => <div className="globe-loading">Loading globe...</div>,
});

const LOCATIONS = [
  {
    id: "india",
    name: "India",
    description: "Luxury experiences, culture-rich escapes",
    lat: 20.5937,
    lng: 78.9629,
    route: "/destinations/india",
  },
  {
    id: "dubai",
    name: "Dubai",
    description: "Luxury city breaks, desert experiences",
    lat: 25.2048,
    lng: 55.2708,
    route: "/destinations/dubai",
  },
  {
    id: "norway",
    name: "Norway",
    description: "Fjords, northern lights, scenic luxury",
    lat: 60.472,
    lng: 8.4689,
    route: "/destinations/norway",
  },
  {
    id: "uk",
    name: "United Kingdom",
    description: "London access, estates, and heritage routes",
    lat: 51.5074,
    lng: -0.1278,
    route: "/destinations/uk",
  },
  {
    id: "usa",
    name: "United States",
    description: "City culture, parks, and premium road journeys",
    lat: 40.7128,
    lng: -74.006,
    route: "/destinations/usa",
  },
  {
    id: "japan",
    name: "Japan",
    description: "City-modern stays and seasonal cultural routes",
    lat: 35.6762,
    lng: 139.6503,
    route: "/destinations/japan",
  },
  {
    id: "australia",
    name: "Australia",
    description: "Coasts, reef, and luxury wilderness journeys",
    lat: -33.8688,
    lng: 151.2093,
    route: "/destinations/australia",
  },
];

const ARCS = [
  {
    startLat: 20.5937,
    startLng: 78.9629,
    endLat: 25.2048,
    endLng: 55.2708,
  },
  {
    startLat: 20.5937,
    startLng: 78.9629,
    endLat: 60.472,
    endLng: 8.4689,
  },
  {
    startLat: 20.5937,
    startLng: 78.9629,
    endLat: 51.5074,
    endLng: -0.1278,
  },
  {
    startLat: 20.5937,
    startLng: 78.9629,
    endLat: 40.7128,
    endLng: -74.006,
  },
  {
    startLat: 20.5937,
    startLng: 78.9629,
    endLat: 35.6762,
    endLng: 139.6503,
  },
  {
    startLat: 20.5937,
    startLng: 78.9629,
    endLat: -33.8688,
    endLng: 151.2093,
  },
];

const DEFAULT_POV = { lat: 20, lng: 5, altitude: 3.15 };
const COUNTRY_ROUTES = {
  india: "/destinations/india",
  "united arab emirates": "/destinations/dubai",
  norway: "/destinations/norway",
  "united kingdom": "/destinations/uk",
  "united states of america": "/destinations/usa",
  japan: "/destinations/japan",
  australia: "/destinations/australia",
};
const CLICKABLE_COUNTRY_KEYS = new Set(Object.keys(COUNTRY_ROUTES));

function normalizeCountryName(name) {
  return String(name || "").trim().toLowerCase();
}

export default function GlobeComponent() {
  const router = useRouter();
  const globeRef = useRef(null);
  const lastHoveredLocationIdRef = useRef(null);
  const hoverMoveTimeoutRef = useRef(null);
  const lightsAddedRef = useRef(false);
  const [countries, setCountries] = useState([]);
  const [hoveredCountry, setHoveredCountry] = useState(null);
  const [hoveredLocation, setHoveredLocation] = useState(null);
  const [clickedLocationId, setClickedLocationId] = useState(null);
  const mousePositionRef = useRef({ x: 0, y: 0 });
  const tooltipRef = useRef(null);
  const shellRef = useRef(null);

  const pointsData = useMemo(() => LOCATIONS, []);
  const arcsData = useMemo(() => ARCS, []);
  const ringsData = useMemo(
    () =>
      pointsData.map((point) => ({
        ...point,
        maxR: point.id === "india" ? 6.4 : 5.3,
        period: point.id === "india" ? 1350 : 1650,
      })),
    [pointsData],
  );

  useEffect(() => {
    let isMounted = true;
    const abortController = new AbortController();

    async function loadCountries() {
      try {
        const [topologyResponse, topojsonClient] = await Promise.all([
          fetch("https://unpkg.com/world-atlas@2/countries-110m.json", {
            signal: abortController.signal,
          }),
          import("topojson-client"),
        ]);

        const topology = await topologyResponse.json();
        const countryFeatures = topojsonClient.feature(
          topology,
          topology.objects.countries,
        ).features;

        if (isMounted) {
          setCountries(countryFeatures);
        }
      } catch (error) {
        if (error?.name !== "AbortError") {
          console.error("Failed to load country polygons:", error);
        }
      }
    }

    loadCountries();

    return () => {
      isMounted = false;
      abortController.abort();
    };
  }, []);

  useEffect(() => {
    return () => {
      if (hoverMoveTimeoutRef.current) {
        clearTimeout(hoverMoveTimeoutRef.current);
      }
    };
  }, []);

  // Pause globe autoRotate when scrolled out of view
  useEffect(() => {
    const el = shellRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        const controls = globeRef.current?.controls?.();
        if (controls) {
          controls.autoRotate = entry.isIntersecting;
        }
      },
      { threshold: 0.1 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const handleMouseMove = useCallback((event) => {
    mousePositionRef.current = { x: event.clientX, y: event.clientY };
    if (tooltipRef.current) {
      tooltipRef.current.style.left = event.clientX + 18 + "px";
      tooltipRef.current.style.top  = event.clientY + 18 + "px";
    }
  }, []);

  const handleMouseLeave = useCallback(() => {
    setHoveredLocation(null);
    setHoveredCountry(null);

    if (hoverMoveTimeoutRef.current) {
      clearTimeout(hoverMoveTimeoutRef.current);
      hoverMoveTimeoutRef.current = null;
    }

    if (globeRef.current) {
      globeRef.current.pointOfView(DEFAULT_POV, 1400);
    }
  }, []);

  const handlePointHover = useCallback((point) => {
    setHoveredLocation(point || null);

    if (hoverMoveTimeoutRef.current) {
      clearTimeout(hoverMoveTimeoutRef.current);
      hoverMoveTimeoutRef.current = null;
    }

    if (!point) {
      lastHoveredLocationIdRef.current = null;
      return;
    }

    if (lastHoveredLocationIdRef.current === point.id || !globeRef.current) {
      return;
    }

    hoverMoveTimeoutRef.current = setTimeout(() => {
      if (!globeRef.current || lastHoveredLocationIdRef.current === point.id) {
        return;
      }

      lastHoveredLocationIdRef.current = point.id;
      globeRef.current.pointOfView(
        {
          lat: point.lat,
          lng: point.lng,
          altitude: 1.5,
        },
        900,
      );
    }, 130);
  }, []);

  const handlePointClick = useCallback(
    (point) => {
      if (!point || !globeRef.current) {
        return;
      }

      setHoveredLocation(point);
      setClickedLocationId(point.id);
      globeRef.current.pointOfView(
        {
          lat: point.lat,
          lng: point.lng,
          altitude: 1.7,
        },
        850,
      );

      if (point.route) {
        setTimeout(() => {
          router.push(point.route);
        }, 180);
      }
    },
    [router],
  );

  const handlePolygonHover = useCallback((polygon) => {
    if (!polygon) {
      setHoveredCountry(null);
      return;
    }
    const countryName = normalizeCountryName(polygon?.properties?.name);
    if (CLICKABLE_COUNTRY_KEYS.has(countryName)) {
      setHoveredCountry(polygon);
      return;
    }
    setHoveredCountry(null);
  }, []);

  const handlePolygonClick = useCallback(
    (polygon) => {
      if (!polygon) return;
      const countryName = normalizeCountryName(polygon?.properties?.name);
      if (!countryName) {
        return;
      }

      const route = COUNTRY_ROUTES[countryName];
      if (route) {
        router.push(route);
      }
    },
    [router],
  );

  const handleGlobeReady = useCallback(() => {
    if (!globeRef.current || lightsAddedRef.current) return;

    const scene = globeRef.current.scene?.();
    if (!scene) return;

    // Get THREE from the globe's THREE variable (exposed globally by globe.gl)
    if (typeof window !== "undefined" && window.THREE) {
      const THREE = window.THREE;

      if (!scene.getObjectByName("imx-globe-dir-light")) {
        const directional = new THREE.DirectionalLight(0xffffff, 1.2);
        directional.name = "imx-globe-dir-light";
        directional.position.set(5, 3, 5);
        scene.add(directional);
      }

      if (!scene.getObjectByName("imx-globe-ambient-light")) {
        const ambient = new THREE.AmbientLight(0x404040, 0.6);
        ambient.name = "imx-globe-ambient-light";
        scene.add(ambient);
      }
    }

    const controls = globeRef.current.controls();
    controls.autoRotate = true;
    controls.autoRotateSpeed = 0.25;
    controls.enableDamping = true;
    controls.dampingFactor = 0.08;
    controls.enablePan = false;
    controls.enableZoom = false;
    controls.minDistance = 160;
    controls.maxDistance = 420;

    globeRef.current.pointOfView(DEFAULT_POV, 0);

    lightsAddedRef.current = true;
  }, []);

  const tooltipContent = useMemo(() => {
    if (hoveredLocation) {
      return {
        title: hoveredLocation.name,
        body: hoveredLocation.description,
      };
    }

    if (hoveredCountry) {
      const countryName = hoveredCountry?.properties?.name || "this region";
      return {
        title: hoveredCountry?.properties?.name || "Country",
        body: `Explore routes and insights for ${countryName}.`,
      };
    }

    return null;
  }, [hoveredCountry, hoveredLocation]);

  return (
    <div
      ref={shellRef}
      className={`globe-shell ${hoveredLocation ? "hotspot" : ""}`}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      <div className="star-layer" />
      <div className="aurora-layer" />
      <div className="vignette-layer" />
      <div className="red-halo-layer" />
      <div className="fx-overlay" />

      <Globe
        ref={globeRef}
        backgroundColor="rgba(0,0,0,0)"
        rendererConfig={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
        globeImageUrl="//unpkg.com/three-globe/example/img/earth-blue-marble.jpg"
        bumpImageUrl="//unpkg.com/three-globe/example/img/earth-topology.png"
        showAtmosphere={false}
        globeCurvatureResolution={8}
        onGlobeClick={() => {}}
        onGlobeReady={handleGlobeReady}
        pointsData={pointsData}
        pointsMerge={false}
        pointLat="lat"
        pointLng="lng"
        pointAltitude={0.06}
        pointRadius={(point) => {
          if (point.id === clickedLocationId) {
            return 1.35;
          }
          return point.id === hoveredLocation?.id ? 1.15 : 0.98;
        }}
        pointColor={(point) =>
          point.id === hoveredLocation?.id || point.id === clickedLocationId
            ? "#dff6ff"
            : "#95d6ff"
        }
        pointResolution={26}
        onPointHover={handlePointHover}
        onPointClick={handlePointClick}
        ringsData={ringsData}
        ringLat="lat"
        ringLng="lng"
        ringColor={(point) =>
          point.id === hoveredLocation?.id || point.id === clickedLocationId
            ? "rgba(198, 236, 255, 0.75)"
            : "rgba(104, 190, 255, 0.55)"
        }
        ringMaxRadius="maxR"
        ringPropagationSpeed={1.9}
        ringRepeatPeriod={(point) => point.period}
        arcsData={arcsData}
        arcColor={() => ["#9de6ff", "#68c6ff"]}
        arcStroke={1.1}
        arcAltitude={0.22}
        arcDashLength={0.45}
        arcDashGap={0.09}
        arcDashInitialGap={() => Math.random()}
        arcDashAnimateTime={1400}
        polygonsData={countries}
        polygonCapColor={(polygon) => {
          const countryName = normalizeCountryName(polygon?.properties?.name);
          const isClickable = CLICKABLE_COUNTRY_KEYS.has(countryName);
          if (polygon === hoveredCountry && isClickable) {
            return "rgba(157, 230, 255, 0.42)";
          }
          if (isClickable) {
            return "rgba(120, 188, 255, 0.2)";
          }
          return "rgba(20, 38, 58, 0.03)";
        }}
        polygonSideColor={(polygon) => {
          const countryName = normalizeCountryName(polygon?.properties?.name);
          return CLICKABLE_COUNTRY_KEYS.has(countryName)
            ? "rgba(86, 162, 234, 0.2)"
            : "rgba(41, 67, 96, 0.06)";
        }}
        polygonStrokeColor={(polygon) => {
          const countryName = normalizeCountryName(polygon?.properties?.name);
          return CLICKABLE_COUNTRY_KEYS.has(countryName)
            ? "rgba(144, 214, 255, 0.7)"
            : "rgba(63, 99, 136, 0.12)";
        }}
        polygonAltitude={(polygon) => {
          const countryName = normalizeCountryName(polygon?.properties?.name);
          const isClickable = CLICKABLE_COUNTRY_KEYS.has(countryName);
          if (!isClickable) return 0.0015;
          return polygon === hoveredCountry ? 0.024 : 0.014;
        }}
        polygonCapCurvatureResolution={4}
        onPolygonHover={handlePolygonHover}
        onPolygonClick={handlePolygonClick}
      />

      {tooltipContent && (
        <div
          ref={tooltipRef}
          className="tooltip"
        >
          <div className="tooltip-name">{tooltipContent.title}</div>
          <div className="tooltip-detail">{tooltipContent.body}</div>
        </div>
      )}

      <style jsx>{`
        .globe-shell {
          position: absolute;
          top: 0;
          left: 0;
          height: 100%;
          width: 100%;
          background: #000;
          isolation: isolate;
          cursor: grab;
        }

        .globe-shell.hotspot {
          cursor: pointer;
        }

        .star-layer {
          position: absolute;
          inset: 0;
          pointer-events: none;
          z-index: 0;
          background: radial-gradient(circle at 50% 50%, #071021 0%, #01040a 68%, #000 100%);
        }

        .star-layer {
          opacity: 0.55;
          background-image:
            radial-gradient(1px 1px at 20% 30%, #fff, transparent),
            radial-gradient(1px 1px at 70% 60%, #fff, transparent),
            radial-gradient(1.2px 1.2px at 45% 20%, rgba(179, 223, 255, 0.9), transparent),
            radial-gradient(1px 1px at 82% 34%, rgba(147, 210, 255, 0.88), transparent);
          background-size:
            340px 340px,
            420px 420px,
            520px 520px,
            620px 620px;
          animation:
            drift 55s linear infinite,
            twinkle 8.5s ease-in-out infinite alternate;
        }

        .aurora-layer {
          position: absolute;
          inset: -12%;
          pointer-events: none;
          z-index: 1;
          opacity: 0.7;
          background:
            radial-gradient(circle at 16% 40%, rgba(62, 126, 255, 0.27), transparent 35%),
            radial-gradient(circle at 78% 30%, rgba(90, 228, 255, 0.22), transparent 35%),
            radial-gradient(circle at 56% 82%, rgba(98, 145, 255, 0.16), transparent 34%);
          filter: blur(22px);
          animation: auroraShift 14s ease-in-out infinite alternate;
        }

        .vignette-layer {
          position: absolute;
          inset: 0;
          pointer-events: none;
          z-index: 1;
          background:
            radial-gradient(circle at center, transparent 40%, rgba(0, 0, 0, 0.35) 78%),
            linear-gradient(180deg, rgba(0, 0, 0, 0.2), rgba(0, 0, 0, 0.52));
        }

        .red-halo-layer {
          position: absolute;
          inset: 0;
          pointer-events: none;
          z-index: 2;
          background:
            radial-gradient(
              circle at 52% 52%,
              rgba(255, 96, 118, 0.06) 0%,
              rgba(255, 74, 108, 0.05) 28%,
              rgba(255, 74, 108, 0.018) 46%,
              rgba(255, 74, 108, 0) 60%
            );
          filter: blur(3px);
        }

        .fx-overlay {
          position: absolute;
          inset: -8%;
          pointer-events: none;
          z-index: 3;
          opacity: 0.5;
          mix-blend-mode: screen;
          background:
            radial-gradient(circle at 22% 18%, rgba(104, 178, 255, 0.2), transparent 36%),
            radial-gradient(circle at 84% 24%, rgba(122, 226, 255, 0.18), transparent 34%),
            radial-gradient(circle at 52% 82%, rgba(255, 255, 255, 0.06), transparent 28%);
          filter: blur(10px);
          animation: overlayFloat 11s ease-in-out infinite alternate;
        }

        .globe-shell :global(canvas) {
          position: relative;
          z-index: 2;
          width: 100% !important;
          height: 100% !important;
          transform: scale(1.3) !important;
          pointer-events: auto !important;
          touch-action: none;
        }

        .tooltip {
          position: fixed;
          z-index: 999;
          pointer-events: none;
          padding: 10px 12px;
          min-width: 160px;
          border-radius: 14px;
          border: 1px solid rgba(255, 255, 255, 0.22);
          background: rgba(12, 11, 10, 0.62);
          backdrop-filter: blur(11px);
          -webkit-backdrop-filter: blur(11px);
          box-shadow:
            0 12px 30px rgba(2, 8, 24, 0.45),
            inset 0 0 0 1px rgba(255, 255, 255, 0.08);
        }

        .tooltip-name {
          margin: 0;
          font-size: 0.9rem;
          font-weight: 600;
          color: #f4efe3;
          letter-spacing: 0.02em;
        }

        .tooltip-detail {
          margin-top: 3px;
          font-size: 0.75rem;
          color: rgba(240, 226, 202, 0.78);
        }

        .globe-loading {
          display: grid;
          place-items: center;
          width: 100%;
          height: 100%;
          color: rgba(207, 226, 255, 0.82);
          font-size: 0.9rem;
          letter-spacing: 0.03em;
        }

        @keyframes drift {
          from {
            transform: translate3d(0, 0, 0);
          }
          to {
            transform: translate3d(-90px, -40px, 0);
          }
        }

        @keyframes twinkle {
          0% {
            opacity: 0.35;
          }
          100% {
            opacity: 0.55;
          }
        }

        @keyframes auroraShift {
          0% {
            transform: translate3d(-2%, 0, 0) scale(1);
          }
          50% {
            transform: translate3d(2%, -1.5%, 0) scale(1.04);
          }
          100% {
            transform: translate3d(0, 2%, 0) scale(1.02);
          }
        }

        @keyframes overlayFloat {
          0% {
            transform: translate3d(-1.5%, -1%, 0) scale(1);
          }
          50% {
            transform: translate3d(1.5%, 1.5%, 0) scale(1.03);
          }
          100% {
            transform: translate3d(0, -1%, 0) scale(1.01);
          }
        }

        @media (max-width: 1024px) {
          .globe-shell {
            left: 0;
          }
        }

        @media (max-width: 640px) {
          .globe-shell {
            left: 0;
          }
        }
      `}</style>
    </div>
  );
}
