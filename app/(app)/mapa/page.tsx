"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { listPoints } from "@/lib/firestore/points";
import { canEdit } from "@/lib/auth";
import { useAuth } from "@/components/auth/auth-provider";
import Link from "next/link";
import type { GeoJsonObject } from "geojson";
import type { PointStatus, PointType } from "@/types/models";
import { POINT_TYPE_LABELS } from "@/lib/constants";

const OperationalMap = dynamic(
  () => import("@/components/maps/operational-map"),
  { ssr: false, loading: () => <MapSkeleton /> }
);

function MapSkeleton() {
  return (
    <div className="flex h-[min(70vh,520px)] items-center justify-center rounded-3xl bg-zinc-100 text-sm text-muted-foreground">
      Carregando camadas…
    </div>
  );
}

export default function MapaPage() {
  const { profile } = useAuth();
  const editor = canEdit(profile?.role);
  const [geo, setGeo] = useState<GeoJsonObject | null>(null);
  const [filterType, setFilterType] = useState<PointType | "todos">("todos");
  const [filterStatus, setFilterStatus] = useState<PointStatus | "todos">(
    "todos"
  );

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const res = await fetch("/geo/subprefeituras.geojson");
        const json = (await res.json()) as GeoJsonObject;
        if (!cancelled) setGeo(json);
      } catch {
        if (!cancelled) setGeo(null);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const { data: points = [], isLoading } = useQuery({
    queryKey: ["points", "all"],
    queryFn: () => listPoints(600),
  });

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
      <header className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Mapa operacional</h1>
          <p className="text-sm text-muted-foreground">
            Subprefeituras + pontos · alterne basemap no controle superior direito.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {editor ? (
            <>
              <Link
                href="/pontos"
                className="inline-flex h-8 items-center justify-center rounded-xl border border-transparent bg-secondary px-3 text-sm font-medium text-secondary-foreground shadow-sm transition-colors hover:bg-secondary/80"
              >
                Gestão de pontos
              </Link>
              <Link
                href="/galeria"
                className="agir-gradient inline-flex h-8 items-center justify-center rounded-xl px-3 text-sm font-medium text-white shadow-md hover:opacity-95"
              >
                Enviar fotos
              </Link>
            </>
          ) : null}
        </div>
      </header>

      <Card className="rounded-3xl border-0 shadow-agir">
        <CardHeader className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <CardTitle>Filtros</CardTitle>
            <CardDescription>
              {isLoading ? "Carregando pontos…" : `${points.length} pontos no conjunto`}
            </CardDescription>
          </div>
          <div className="flex flex-wrap gap-3">
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">Tipo</p>
              <Select
                value={filterType}
                onValueChange={(v) => setFilterType(v as PointType | "todos")}
              >
                <SelectTrigger className="w-[200px] rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos</SelectItem>
                  {(Object.keys(POINT_TYPE_LABELS) as PointType[]).map((k) => (
                    <SelectItem key={k} value={k}>
                      {POINT_TYPE_LABELS[k]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">Status</p>
              <Select
                value={filterStatus}
                onValueChange={(v) => setFilterStatus(v as PointStatus | "todos")}
              >
                <SelectTrigger className="w-[200px] rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos</SelectItem>
                  <SelectItem value="ativo">Ativo</SelectItem>
                  <SelectItem value="em_andamento">Em andamento</SelectItem>
                  <SelectItem value="resolvido">Resolvido</SelectItem>
                  <SelectItem value="critico">Crítico</SelectItem>
                  <SelectItem value="arquivado">Arquivado</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <OperationalMap
            subprefGeo={geo}
            points={points}
            filterType={filterType}
            filterStatus={filterStatus}
          />
          <p className="text-xs text-muted-foreground">
            Camada de subprefeituras: arquivo local em{" "}
            <code className="rounded bg-zinc-100 px-1">public/geo/subprefeituras.geojson</code>.
            Pontos vêm do Firestore (importe a planilha com o script em{" "}
            <code className="rounded bg-zinc-100 px-1">scripts/import-pontos.ts</code>).
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
