"use client";

import { useQuery } from "@tanstack/react-query";
import Image from "next/image";
import Link from "next/link";
import { useParams } from "next/navigation";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { POINT_TYPE_LABELS } from "@/lib/constants";
import { formatDisplayDate } from "@/lib/date";
import { listHistoryByPoint } from "@/lib/firestore/history";
import { listPhotosByPoint } from "@/lib/firestore/photos";
import { getPoint } from "@/lib/firestore/points";

const STATUS_LABEL: Record<string, string> = {
  ativo: "Ativo",
  em_andamento: "Em andamento",
  resolvido: "Resolvido",
  critico: "Crítico",
  arquivado: "Arquivado",
};

export default function PontoDetailPage() {
  const params = useParams();
  const id = typeof params.id === "string" ? params.id : "";

  const { data: point, isLoading } = useQuery({
    queryKey: ["point", id],
    queryFn: () => getPoint(id),
    enabled: Boolean(id),
  });

  const { data: history = [] } = useQuery({
    queryKey: ["history", "point", id],
    queryFn: () => listHistoryByPoint(id),
    enabled: Boolean(id) && Boolean(point),
  });

  const { data: photos = [] } = useQuery({
    queryKey: ["photos", "point", id],
    queryFn: () => listPhotosByPoint(id),
    enabled: Boolean(id) && Boolean(point),
  });

  if (isLoading) {
    return (
      <div className="text-sm text-muted-foreground">Carregando ponto…</div>
    );
  }

  if (!point) {
    return (
      <div className="space-y-4">
        <p className="text-muted-foreground">Ponto não encontrado.</p>
        <Link href="/pontos" className="text-primary underline-offset-4 hover:underline">
          Voltar à lista
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <Link
            href="/pontos"
            className="mb-2 inline-block text-xs text-muted-foreground hover:underline"
          >
            ← Pontos
          </Link>
          <h1 className="text-2xl font-semibold tracking-tight">{point.address}</h1>
          <div className="mt-2 flex flex-wrap gap-2">
            <Badge variant="secondary">
              {POINT_TYPE_LABELS[point.type] ?? point.type}
            </Badge>
            <Badge variant="outline">{STATUS_LABEL[point.status] ?? point.status}</Badge>
            {point.recurrenceFlag ? (
              <Badge variant="destructive">Reincidência</Badge>
            ) : null}
          </div>
        </div>
        <div className="text-right text-sm text-muted-foreground">
          <p>
            {point.geo.lat.toFixed(5)}, {point.geo.lng.toFixed(5)}
          </p>
          {point.subprefeitura ? <p>Subprefeitura: {point.subprefeitura}</p> : null}
        </div>
      </div>

      <Card className="rounded-3xl border-0 shadow-agir">
        <CardHeader>
          <CardTitle>Observações</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="whitespace-pre-wrap text-sm">
            {point.notes || "Sem observações registradas."}
          </p>
        </CardContent>
      </Card>

      <Card className="rounded-3xl border-0 shadow-agir">
        <CardHeader>
          <CardTitle>Galeria</CardTitle>
          <CardDescription>Fotos vinculadas a este ponto</CardDescription>
        </CardHeader>
        <CardContent>
          {photos.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Nenhuma foto. Envie em{" "}
              <Link href="/galeria" className="text-primary underline-offset-4 hover:underline">
                Galeria
              </Link>
              .
            </p>
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {photos.map((ph) => (
                <div
                  key={ph.id}
                  className="overflow-hidden rounded-2xl border border-zinc-100 bg-zinc-50 shadow-sm"
                >
                  {ph.downloadUrl ? (
                    <div className="relative aspect-square w-full">
                      <Image
                        src={ph.downloadUrl}
                        alt={ph.caption || "Evidência"}
                        fill
                        className="object-cover"
                        sizes="200px"
                      />
                    </div>
                  ) : (
                    <div className="flex aspect-square items-center justify-center text-xs text-muted-foreground">
                      Sem URL
                    </div>
                  )}
                  {ph.caption ? (
                    <p className="p-2 text-xs text-muted-foreground line-clamp-2">
                      {ph.caption}
                    </p>
                  ) : null}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="rounded-3xl border-0 shadow-agir">
        <CardHeader>
          <CardTitle>Histórico vinculado</CardTitle>
          <CardDescription>Registro oficial do que foi feito neste local</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {history.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Nenhum registro de histórico ainda.
            </p>
          ) : (
            history.map((h) => (
              <div key={h.id}>
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <p className="font-medium">{h.summary}</p>
                  <time className="text-xs text-muted-foreground">
                    {formatDisplayDate(h.when.toDate(), "d MMM yyyy HH:mm")}
                  </time>
                </div>
                <p className="mt-1 text-sm text-muted-foreground">{h.notes}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Status final: {h.finalStatus}
                </p>
                <Separator className="mt-4" />
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
