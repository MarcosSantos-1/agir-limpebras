"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Image from "next/image";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import { useAuth } from "@/components/auth/auth-provider";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { canEdit } from "@/lib/auth";
import { createPhotoDoc, listPhotos } from "@/lib/firestore/photos";
import { listPoints } from "@/lib/firestore/points";
import { uploadFile } from "@/lib/storage/upload";
import type { PhotoRecord } from "@/types/models";

export default function GaleriaPage() {
  const { user, profile } = useAuth();
  const qc = useQueryClient();
  const editor = canEdit(profile?.role);
  const [filterPoint, setFilterPoint] = useState<string>("todos");
  const [tagFilter, setTagFilter] = useState("");

  const { data: photos = [], isLoading } = useQuery({
    queryKey: ["photos", "all"],
    queryFn: () => listPhotos(300),
  });

  const { data: points = [] } = useQuery({
    queryKey: ["points", "all"],
    queryFn: () => listPoints(500),
  });

  const filtered = useMemo(() => {
    const t = tagFilter.trim().toLowerCase();
    return photos.filter((p) => {
      if (filterPoint !== "todos" && p.pointId !== filterPoint) return false;
      if (t && !p.tags.some((x) => x.toLowerCase().includes(t)))
        return false;
      return true;
    });
  }, [photos, filterPoint, tagFilter]);

  const upload = useMutation({
    mutationFn: async (input: {
      file: File;
      caption: string;
      pointId: string | null;
      tagAntesDepois: string;
    }) => {
      if (!user) throw new Error("auth");
      const path = `${user.uid}/${Date.now()}-${input.file.name.replace(/\s+/g, "_")}`;
      const { path: storagePath, downloadUrl } = await uploadFile({
        folder: "evidencias",
        path,
        file: input.file,
        contentType: input.file.type || undefined,
      });
      const tags = [input.tagAntesDepois].filter(Boolean);
      await createPhotoDoc({
        storagePath,
        downloadUrl,
        pointId: input.pointId,
        actionId: null,
        historyId: null,
        takenAt: new Date(),
        uploadedBy: user.uid,
        caption: input.caption,
        tags,
        pairId: null,
      });
    },
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["photos"] });
      toast.success("Foto enviada");
    },
    onError: () => toast.error("Falha no upload"),
  });

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-8">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Galeria / evidências</h1>
        <p className="text-sm text-muted-foreground">
          Antes/depois, por local, data e equipe — organize evidências para relatórios.
        </p>
      </header>

      {editor && user ? (
        <Card className="rounded-3xl border-0 shadow-agir">
          <CardHeader>
            <CardTitle>Enviar foto</CardTitle>
            <CardDescription>
              Armazenamento em <code className="rounded bg-zinc-100 px-1">evidencias/</code>
            </CardDescription>
          </CardHeader>
          <CardContent>
            <UploadForm
              points={points}
              disabled={upload.isPending}
              onSubmit={(data) => upload.mutate(data)}
            />
          </CardContent>
        </Card>
      ) : null}

      <Card className="rounded-3xl border-0 shadow-agir">
        <CardHeader className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <CardTitle>Biblioteca</CardTitle>
            <CardDescription>
              {isLoading ? "Carregando…" : `${filtered.length} fotos`}
            </CardDescription>
          </div>
          <div className="flex flex-wrap gap-3">
            <div className="space-y-1">
              <Label className="text-xs">Ponto</Label>
              <Select
                value={filterPoint}
                onValueChange={(v) => setFilterPoint(v ?? "todos")}
              >
                <SelectTrigger className="w-[220px] rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos</SelectItem>
                  {points.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.address.slice(0, 48)}
                      {p.address.length > 48 ? "…" : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Tag (antes/depois, equipe…)</Label>
              <Input
                className="rounded-xl"
                placeholder="Filtrar por tag"
                value={tagFilter}
                onChange={(e) => setTagFilter(e.target.value)}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {filtered.map((ph) => (
              <PhotoTile key={ph.id} photo={ph} points={points} />
            ))}
          </div>
          {!isLoading && filtered.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              Nenhuma foto com esses filtros.
            </p>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}

function UploadForm({
  points,
  disabled,
  onSubmit,
}: {
  points: { id: string; address: string }[];
  disabled: boolean;
  onSubmit: (data: {
    file: File;
    caption: string;
    pointId: string | null;
    tagAntesDepois: string;
  }) => void;
}) {
  const [file, setFile] = useState<File | null>(null);
  const [caption, setCaption] = useState("");
  const [pointId, setPointId] = useState<string>("__none");
  const [antesDepois, setAntesDepois] = useState<string>("neutro");

  return (
    <form
      className="grid gap-4 md:grid-cols-2"
      onSubmit={(e) => {
        e.preventDefault();
        if (!file) {
          toast.error("Selecione um arquivo");
          return;
        }
        onSubmit({
          file,
          caption,
          pointId: pointId === "__none" ? null : pointId,
          tagAntesDepois:
            antesDepois === "antes"
              ? "antes"
              : antesDepois === "depois"
                ? "depois"
                : "",
        });
        setFile(null);
        setCaption("");
      }}
    >
      <div className="space-y-2 md:col-span-2">
        <Label htmlFor="file">Arquivo</Label>
        <Input
          id="file"
          type="file"
          accept="image/*"
          className="rounded-xl"
          onChange={(e) => setFile(e.target.files?.[0] ?? null)}
        />
      </div>
      <div className="space-y-2">
        <Label>Vínculo (ponto)</Label>
        <Select
          value={pointId}
          onValueChange={(v) => setPointId(v ?? "__none")}
        >
          <SelectTrigger className="rounded-xl">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__none">Nenhum</SelectItem>
            {points.map((p) => (
              <SelectItem key={p.id} value={p.id}>
                {p.address.slice(0, 40)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label>Antes / depois</Label>
        <Select
          value={antesDepois}
          onValueChange={(v) => setAntesDepois(v ?? "neutro")}
        >
          <SelectTrigger className="rounded-xl">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="neutro">Neutro</SelectItem>
            <SelectItem value="antes">Antes</SelectItem>
            <SelectItem value="depois">Depois</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2 md:col-span-2">
        <Label htmlFor="caption">Legenda</Label>
        <Input
          id="caption"
          className="rounded-xl"
          value={caption}
          onChange={(e) => setCaption(e.target.value)}
          placeholder="Descrição curta"
        />
      </div>
      <div className="md:col-span-2">
        <Button
          type="submit"
          className="agir-gradient rounded-xl border-0 text-white"
          disabled={disabled}
        >
          Enviar
        </Button>
      </div>
    </form>
  );
}

function PhotoTile({
  photo,
  points,
}: {
  photo: PhotoRecord;
  points: { id: string; address: string }[];
}) {
  const addr = points.find((p) => p.id === photo.pointId)?.address;
  return (
    <div className="overflow-hidden rounded-3xl border border-zinc-100 bg-white shadow-md">
      {photo.downloadUrl ? (
        <div className="relative aspect-square w-full bg-zinc-100">
          <Image
            src={photo.downloadUrl}
            alt={photo.caption || "Foto"}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 50vw, 25vw"
          />
        </div>
      ) : (
        <div className="flex aspect-square items-center justify-center text-xs text-muted-foreground">
          Sem preview
        </div>
      )}
      <div className="space-y-1 p-3">
        <p className="line-clamp-2 text-xs font-medium">{photo.caption || "—"}</p>
        {addr ? (
          <p className="line-clamp-2 text-[11px] text-muted-foreground">{addr}</p>
        ) : null}
        {photo.tags.length > 0 ? (
          <p className="text-[10px] text-muted-foreground">
            {photo.tags.join(" · ")}
          </p>
        ) : null}
      </div>
    </div>
  );
}
