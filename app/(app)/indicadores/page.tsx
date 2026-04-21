"use client";

import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { filterActionsByMonth, listRecentActions } from "@/lib/firestore/actions";
import { listPoints } from "@/lib/firestore/points";

export default function IndicadoresPage() {
  const [month, setMonth] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
  });

  const { data: actions = [], isLoading: loadingA } = useQuery({
    queryKey: ["actions", "recent"],
    queryFn: () => listRecentActions(400),
  });

  const { data: points = [], isLoading: loadingP } = useQuery({
    queryKey: ["points", "all"],
    queryFn: () => listPoints(600),
  });

  const stats = useMemo(() => {
    const prefix = `${month}-`;
    const monthActions = filterActionsByMonth(actions, prefix);
    const revitalDone = monthActions.filter(
      (a) => a.category === "revitalizacao" && a.status === "concluido"
    ).length;
    const reinc = points.filter((p) => p.recurrenceFlag).length;
    const critRegions = points.filter((p) => p.type === "area_critica" && p.status !== "resolvido").length;
    const productivity =
      monthActions.filter((a) => a.status === "concluido").length;
    return {
      acoesMes: monthActions.length,
      revitalConcluidas: revitalDone,
      reincidencias: reinc,
      regioesCriticas: critRegions,
      produtividade: productivity,
    };
  }, [actions, month, points]);

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-8">
      <header className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Indicadores</h1>
          <p className="text-sm text-muted-foreground">
            Visão rápida — sem Power BI. Ajuste o mês de referência.
          </p>
        </div>
        <div className="space-y-1">
          <Label htmlFor="month">Mês (AAAA-MM)</Label>
          <Input
            id="month"
            type="month"
            value={month}
            onChange={(e) => setMonth(e.target.value)}
            className="w-[200px] rounded-xl"
          />
        </div>
      </header>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <KpiCard
          title="Ações do mês"
          value={loadingA ? "…" : String(stats.acoesMes)}
          hint="Compromissos com data no mês"
        />
        <KpiCard
          title="Revitalizações concluídas"
          value={loadingA ? "…" : String(stats.revitalConcluidas)}
          hint="Categoria revitalização · status concluído"
        />
        <KpiCard
          title="Reincidências"
          value={loadingP ? "…" : String(stats.reincidencias)}
          hint="Pontos marcados como recorrentes"
        />
        <KpiCard
          title="Regiões críticas ativas"
          value={loadingP ? "…" : String(stats.regioesCriticas)}
          hint="Tipo área crítica · não resolvido"
        />
        <KpiCard
          title="Produtividade operacional"
          value={loadingA ? "…" : String(stats.produtividade)}
          hint="Ações concluídas no mês"
        />
      </div>

      <Card className="rounded-3xl border-0 bg-zinc-50/80 shadow-inner">
        <CardHeader>
          <CardTitle className="text-base">Leitura executiva</CardTitle>
          <CardDescription>
            Números derivados do Firestore em tempo real. Para relatórios políticos, use também a{" "}
            <span className="font-medium text-foreground">Galeria</span> com filtros por data e local.
          </CardDescription>
        </CardHeader>
        <CardContent />
      </Card>
    </div>
  );
}

function KpiCard({
  title,
  value,
  hint,
}: {
  title: string;
  value: string;
  hint: string;
}) {
  return (
    <Card className="rounded-3xl border-0 shadow-agir">
      <CardHeader>
        <CardDescription>{title}</CardDescription>
        <CardTitle className="text-4xl tabular-nums">{value}</CardTitle>
      </CardHeader>
      <CardContent className="text-xs text-muted-foreground">{hint}</CardContent>
    </Card>
  );
}
