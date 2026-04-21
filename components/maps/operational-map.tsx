"use client";

import type { GeoJsonObject } from "geojson";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { useEffect, useMemo, useState } from "react";
import {
  CircleMarker,
  GeoJSON,
  LayersControl,
  MapContainer,
  Popup,
  TileLayer,
  useMap,
} from "react-leaflet";
import Link from "next/link";

import type { OperationalPoint, PointStatus, PointType } from "@/types/models";
import { POINT_TYPE_LABELS } from "@/lib/constants";

const SP_CENTER: [number, number] = [-23.55, -46.63];

function FitGeo({ data }: { data: GeoJsonObject | null }) {
  const map = useMap();
  useEffect(() => {
    if (!data) return;
    try {
      const layer = L.geoJSON(data);
      const b = layer.getBounds();
      if (b.isValid()) {
        map.fitBounds(b, { padding: [24, 24], maxZoom: 12 });
      }
    } catch {
      /* ignore */
    }
  }, [data, map]);
  return null;
}

export default function OperationalMap({
  subprefGeo,
  points,
  filterType,
  filterStatus,
}: {
  subprefGeo: GeoJsonObject | null;
  points: OperationalPoint[];
  filterType: PointType | "todos";
  filterStatus: PointStatus | "todos";
}) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const filtered = useMemo(() => {
    return points.filter((p) => {
      if (filterType !== "todos" && p.type !== filterType) return false;
      if (filterStatus !== "todos" && p.status !== filterStatus) return false;
      return true;
    });
  }, [points, filterStatus, filterType]);

  if (!mounted) {
    return (
      <div className="flex h-[420px] items-center justify-center rounded-3xl bg-zinc-100 text-sm text-muted-foreground">
        Carregando mapa…
      </div>
    );
  }

  return (
    <MapContainer
      center={SP_CENTER}
      zoom={11}
      className="z-0 h-[min(70vh,520px)] w-full overflow-hidden rounded-3xl shadow-agir"
      scrollWheelZoom
    >
      <LayersControl position="topright">
        <LayersControl.BaseLayer checked name="CartoDB Positron">
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> · Carto'
            url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
          />
        </LayersControl.BaseLayer>
        <LayersControl.BaseLayer name="Esri Satélite">
          <TileLayer
            attribution="Esri"
            url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
          />
        </LayersControl.BaseLayer>
      </LayersControl>
      {subprefGeo ? (
        <>
          <GeoJSON
            data={subprefGeo}
            style={() => ({
              color: "#6a0eaf",
              weight: 1,
              fillOpacity: 0.06,
            })}
          />
          <FitGeo data={subprefGeo} />
        </>
      ) : null}
      {filtered.map((p) => (
        <CircleMarker
          key={p.id}
          center={[p.geo.lat, p.geo.lng]}
          radius={7}
          pathOptions={{
            color: "#6a0eaf",
            fillColor: "#f318e3",
            fillOpacity: 0.55,
            weight: 2,
          }}
        >
          <Popup>
            <div className="min-w-[200px] space-y-1 text-sm">
              <p className="font-semibold">{p.address}</p>
              <p className="text-muted-foreground">
                {POINT_TYPE_LABELS[p.type] ?? p.type} · {p.status}
              </p>
              <Link
                href={`/pontos/${p.id}`}
                className="text-primary underline-offset-4 hover:underline"
              >
                Abrir ponto
              </Link>
            </div>
          </Popup>
        </CircleMarker>
      ))}
    </MapContainer>
  );
}
