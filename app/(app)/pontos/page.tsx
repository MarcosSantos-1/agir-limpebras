"use client";

import { useQuery } from "@tanstack/react-query";
import { Search } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { POINT_TYPE_LABELS } from "@/lib/constants";
import { formatDisplayDate } from "@/lib/date";
import { listPoints } from "@/lib/firestore/points";
import type { PointStatus, PointType } from "@/types/models";

const STATUS_LABEL: Record<PointStatus, string> = {
  ativo: "Ativo",
  em_andamento: "Em andamento",
  resolvido: "Resolvido",
  critico: "Crítico",
  arquivado: "Arquivado",
};

export default function PontosPage() {
  const [q, setQ] = useState("");
  const [status, setStatus] = useState<PointStatus | "todos">("todos");
  const [type, setType] = useState<PointType | "todos">("todos");

  const { data: points = [], isLoading } = useQuery({
    queryKey: ["points", "all"],
    queryFn: () => listPoints(800),
  });

  const filtered = useMemo(() => {
    const qq = q.trim().toLowerCase();
    return points.filter((p) => {
      if (status !== "todos" && p.status !== status) return false;
      if (type !== "todos" && p.type !== type) return false;
      if (qq && !p.address.toLowerCase().includes(qq)) return false;
      return true;
    });
  }, [points, q, status, type]);

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Gestão de pontos</h1>
        <p className="text-sm text-muted-foreground">
          Busca por endereço, filtros por status e tipo · histórico e fotos no detalhe.
        </p>
      </header>

      <Card className="rounded-3xl border-0 shadow-agir">
        <CardHeader className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <CardTitle>Filtros</CardTitle>
            <CardDescription>
              {isLoading ? "Carregando…" : `${filtered.length} de ${points.length} pontos`}
            </CardDescription>
          </div>
          <div className="flex w-full max-w-xl flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Buscar endereço…"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                className="rounded-xl pl-9"
              />
            </div>
            <Select
              value={status}
              onValueChange={(v) => setStatus(v as PointStatus | "todos")}
            >
              <SelectTrigger className="w-full rounded-xl sm:w-[160px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos status</SelectItem>
                {(Object.keys(STATUS_LABEL) as PointStatus[]).map((s) => (
                  <SelectItem key={s} value={s}>
                    {STATUS_LABEL[s]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={type}
              onValueChange={(v) => setType(v as PointType | "todos")}
            >
              <SelectTrigger className="w-full rounded-xl sm:w-[180px]">
                <SelectValue placeholder="Tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos tipos</SelectItem>
                {(Object.keys(POINT_TYPE_LABELS) as PointType[]).map((t) => (
                  <SelectItem key={t} value={t}>
                    {POINT_TYPE_LABELS[t]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Endereço</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Última ação</TableHead>
                <TableHead className="text-right">Ação</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((p) => (
                <TableRow key={p.id}>
                  <TableCell className="max-w-[280px] font-medium">
                    {p.address}
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary">
                      {POINT_TYPE_LABELS[p.type] ?? p.type}
                    </Badge>
                  </TableCell>
                  <TableCell>{STATUS_LABEL[p.status]}</TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {p.lastActionAt
                      ? formatDisplayDate(p.lastActionAt.toDate(), "d MMM yyyy")
                      : "—"}
                  </TableCell>
                  <TableCell className="text-right">
                    <Link
                      href={`/pontos/${p.id}`}
                      className="text-primary text-sm font-medium underline-offset-4 hover:underline"
                    >
                      Abrir
                    </Link>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {!isLoading && filtered.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              Nenhum ponto encontrado. Importe dados ou ajuste filtros.
            </p>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}
