"use client";

import { useEffect, useState } from "react";

interface GeoJSONFeature {
  type: "Feature";
  properties: { id: string; Name: string };
  geometry: { type: "LineString"; coordinates: number[][] };
}

interface GeoJSONCollection {
  type: "FeatureCollection";
  features: GeoJSONFeature[];
}

const GEOJSON_URL =
  "https://raw.githubusercontent.com/bacinger/f1-circuits/master/f1-circuits.geojson";

let cachedData: GeoJSONCollection | null = null;
let fetchPromise: Promise<GeoJSONCollection> | null = null;

function fetchGeoJSON(): Promise<GeoJSONCollection> {
  if (cachedData) return Promise.resolve(cachedData);
  if (fetchPromise) return fetchPromise;
  fetchPromise = fetch(GEOJSON_URL)
    .then((res) => {
      if (!res.ok) throw new Error(`Failed to fetch circuit data: ${res.status}`);
      return res.json();
    })
    .then((data: GeoJSONCollection) => {
      cachedData = data;
      return data;
    })
    .catch((err) => {
      fetchPromise = null;
      throw err;
    });
  return fetchPromise;
}


function coordsToSvgPath(
  coords: number[][],
  width: number,
  height: number,
  padding: number
): string {
  if (coords.length === 0) return "";

  const lngs = coords.map((c) => c[0]);
  const lats = coords.map((c) => c[1]);
  const minLng = Math.min(...lngs);
  const maxLng = Math.max(...lngs);
  const minLat = Math.min(...lats);
  const maxLat = Math.max(...lats);

  const geoW = maxLng - minLng || 1;
  const geoH = maxLat - minLat || 1;
  const drawW = width - padding * 2;
  const drawH = height - padding * 2;
  const scale = Math.min(drawW / geoW, drawH / geoH);

  const offsetX = padding + (drawW - geoW * scale) / 2;
  const offsetY = padding + (drawH - geoH * scale) / 2;

  return coords
    .map((c, i) => {
      const x = offsetX + (c[0] - minLng) * scale;
      // Flip Y because SVG Y goes down, lat goes up
      const y = offsetY + (maxLat - c[1]) * scale;
      return `${i === 0 ? "M" : "L"}${x.toFixed(2)},${y.toFixed(2)}`;
    })
    .join(" ") + " Z";
}

interface CircuitMapProps {
  circuitId: string;
  width?: number;
  height?: number;
  className?: string;
}

export function CircuitMap({
  circuitId,
  width = 250,
  height = 188,
  className,
}: CircuitMapProps) {
  const [path, setPath] = useState<string | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    fetchGeoJSON()
      .then((data) => {
        const feature = data.features.find(
          (f) => f.properties.id === circuitId
        );
        if (feature) {
          setPath(coordsToSvgPath(feature.geometry.coordinates, width, height, 12));
        }
      })
      .catch(() => setError(true));
  }, [circuitId, width, height]);

  if (error || !path) {
    return (
      <div
        style={{ width, height }}
        className={className}
        role="img"
        aria-label={error ? "Circuit map unavailable" : "Loading circuit map"}
      />
    );
  }

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      className={className}
      role="img"
      aria-label="Circuit track layout"
    >
      <path
        d={path}
        fill="none"
        stroke="var(--text-primary, #e0e0e0)"
        strokeWidth={2.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
