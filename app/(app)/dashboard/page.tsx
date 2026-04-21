"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { isSameDay } from "date-fns";
import {
  AlertTriangle,
  Calendar,
  Camera,
  CheckSquare,
  ClipboardList,
  Map as MapIcon,
  Plus,
  Sparkles,
} from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import { useAuth } from "@/components/auth/auth-provider";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { ACTION_CATEGORY_LABELS, PRIORITY_LABELS, STATUS_LABELS } from "@/lib/constants";
import {
  dateKey,
  eachDayOfWeek,
  formatDisplayDate,
  weekRangeMonday,
} from "@/lib/date";
import { listRecentActions } from "@/lib/firestore/actions";
import {
  addChecklistItem,
  listChecklistForDay,
  toggleChecklistItem,
} from "@/lib/firestore/checklist";
import { listPoints } from "@/lib/firestore/points";
import { canEdit } from "@/lib/auth";
import type { AgendaAction } from "@/types/models";

export default function DashboardPage() {
  const { user, profile } = useAuth();
  const qc = useQueryClient();
  const today = useMemo(() => new Date(), []);
  const todayKey = dateKey(today);
  const week = weekRangeMonday(today);
  const weekDays = eachDayOfWeek(today);

  const { data: actions = [], isLoading: loadingActions } = useQuery({
    queryKey: ["actions", "recent"],
    queryFn: () => listRecentActions(200),
  });

  const { data: points = [], isLoading: loadingPoints } = useQuery({
    queryKey: ["points", "all"],
    queryFn: () => listPoints(400),
  });

  const { data: checklist = [] } = useQuery({
    queryKey: ["checklist", user?.uid, todayKey],
    queryFn: () =>
      user ? listChecklistForDay(user.uid, todayKey) : Promise.resolve([]),
    enabled: Boolean(user),
  });

  const weekActions = useMemo(
    () =>
      actions.filter(
        (a) => a.dateKey >= week.startKey && a.dateKey <= week.endKey
      ),
    [actions, week.endKey, week.startKey]
  );

  const upcoming = useMemo(() => {
    return actions
      .filter((a) => a.status === "pendente" || a.status === "reagendado")
      .slice(0, 8);
  }, [actions]);

  const importantVisits = useMemo(() => {
    return actions.filter(
      (a) =>
        (a.category === "visita_tecnica" ||
          a.category === "visita_institucional" ||
          a.category === "revitalizacao") &&
        (a.priority === "alta" || a.priority === "urgente") &&
        a.status === "pendente"
    );
  }, [actions]);

  const urgentPending = useMemo(() => {
    return actions.filter(
      (a) => a.priority === "urgente" && a.status === "pendente"
    );
  }, [actions]);

  const stats = useMemo(() => {
    const revitalEmAndamento = points.filter(
      (p) => p.type === "revitalizacao" && p.status === "em_andamento"
    ).length;
    const pontosAtivos = points.filter((p) => p.status === "ativo").length;
    const reincidencias = points.filter((p) => p.recurrenceFlag).length;
    const pendCrit = urgentPending.length;
    return {
      acoesSemana: weekActions.length,
      pontosAtivos,
      revitalEmAndamento,
      reincidencias,
      pendenciasCriticas: pendCrit,
    };
  }, [points, urgentPending.length, weekActions.length]);

  const [newCheck, setNewCheck] = useState("");

  const addCheck = useMutation({
    mutationFn: async () => {
      if (!user?.uid || !newCheck.trim()) return;
      await addChecklistItem({
        userId: user.uid,
        dateKey: todayKey,
        label: newCheck.trim(),
        order: checklist.length,
      });
    },
    onSuccess: async () => {
      setNewCheck("");
      await qc.invalidateQueries({
        queryKey: ["checklist", user?.uid, todayKey],
      });
      toast.success("Item adicionado");
    },
    onError: () => toast.error("Não foi possível adicionar"),
  });

  const toggleCheck = useMutation({
    mutationFn: async (p: { id: string; done: boolean }) => {
      await toggleChecklistItem(p.id, !p.done);
    },
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ["checklist", user?.uid, todayKey] }),
  });

  const editor = canEdit(profile?.role);

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-8">
      <header className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">
          Painel de hoje
        </h1>
        <p className="text-sm text-muted-foreground">
          {formatDisplayDate(today, "EEEE, d MMMM yyyy")} · cenário em segundos
        </p>
      </header>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <StatCard
          title="Ações da semana"
          value={loadingActions ? "…" : String(stats.acoesSemana)}
          hint="Compromissos na semana corrente"
        />
        <StatCard
          title="Pontos ativos"
          value={loadingPoints ? "…" : String(stats.pontosAtivos)}
          hint="Operação em campo"
        />
        <StatCard
          title="Revitalizações"
          value={loadingPoints ? "…" : String(stats.revitalEmAndamento)}
          hint="Em andamento"
        />
        <StatCard
          title="Reincidências"
          value={loadingPoints ? "…" : String(stats.reincidencias)}
          hint="Marcados como recorrentes"
        />
        <StatCard
          title="Pendências críticas"
          value={String(stats.pendenciasCriticas)}
          hint="Urgentes abertas"
          variant="alert"
        />
      </section>

      <section>
        <h2 className="mb-3 flex items-center gap-2 text-sm font-medium text-muted-foreground">
          <Sparkles className="size-4 text-primary" />
          Ações rápidas
        </h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <QuickAction
            href="/agenda?new=acao"
            label="Nova ação"
            icon={Plus}
          />
          <QuickAction
            href="/agenda?new=visita"
            label="Nova visita"
            icon={Calendar}
          />
          <QuickAction
            href="/agenda?new=revitalizacao"
            label="Nova revitalização"
            icon={Sparkles}
          />
          <QuickAction href="/galeria" label="Adicionar fotos" icon={Camera} />
          <QuickAction href="/mapa" label="Abrir mapa" icon={MapIcon} />
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="rounded-3xl border-0 shadow-agir lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Calendar className="size-4" />
              Semana · resumo
            </CardTitle>
            <CardDescription>
              {formatDisplayDate(week.start, "d MMM")} —{" "}
              {formatDisplayDate(week.end, "d MMM yyyy")}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {weekDays.map((d) => {
              const key = dateKey(d);
              const count = actions.filter((a) => a.dateKey === key).length;
              const isToday = isSameDay(d, today);
              return (
                <div
                  key={key}
                  className={`flex items-center justify-between rounded-2xl px-3 py-2 text-sm ${
                    isToday ? "bg-primary/10 font-medium" : "bg-zinc-50"
                  }`}
                >
                  <span>
                    {formatDisplayDate(d, "EEE d MMM")}
                    {isToday ? (
                      <Badge variant="secondary" className="ml-2">
                        hoje
                      </Badge>
                    ) : null}
                  </span>
                  <span className="tabular-nums text-muted-foreground">
                    {count} ação(ões)
                  </span>
                </div>
              );
            })}
          </CardContent>
        </Card>

        <Card className="rounded-3xl border-0 shadow-agir lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <ClipboardList className="size-4" />
              Próximas ações
            </CardTitle>
            <CardDescription>Pendentes e reagendadas</CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[280px] pr-3">
              <ul className="space-y-3">
                {upcoming.length === 0 ? (
                  <li className="text-sm text-muted-foreground">
                    Nada pendente nos registros recentes.
                  </li>
                ) : (
                  upcoming.map((a) => (
                    <li key={a.id}>
                      <ActionRow action={a} />
                    </li>
                  ))
                )}
              </ul>
            </ScrollArea>
          </CardContent>
        </Card>

        <Card className="rounded-3xl border-0 shadow-agir lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <CheckSquare className="size-4" />
              Checklist do dia
            </CardTitle>
            <CardDescription>Foque o que importa hoje</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {editor ? (
              <form
                className="flex gap-2"
                onSubmit={(e) => {
                  e.preventDefault();
                  addCheck.mutate();
                }}
              >
                <Input
                  placeholder="Novo item…"
                  value={newCheck}
                  onChange={(e) => setNewCheck(e.target.value)}
                  className="rounded-xl"
                />
                <Button
                  type="submit"
                  size="sm"
                  className="agir-gradient rounded-xl border-0 text-white"
                  disabled={addCheck.isPending || !newCheck.trim()}
                >
                  Add
                </Button>
              </form>
            ) : null}
            <ul className="space-y-2">
              {checklist.length === 0 ? (
                <li className="text-sm text-muted-foreground">
                  Nenhum item — adicione acima.
                </li>
              ) : (
                checklist.map((item) => (
                  <li
                    key={item.id}
                    className="flex items-center gap-3 rounded-2xl border border-transparent bg-zinc-50 px-3 py-2"
                  >
                    <Checkbox
                      checked={item.done}
                      disabled={!editor || toggleCheck.isPending}
                      onCheckedChange={() =>
                        editor
                          ? toggleCheck.mutate({ id: item.id, done: item.done })
                          : undefined
                      }
                    />
                    <span
                      className={
                        item.done ? "text-muted-foreground line-through" : ""
                      }
                    >
                      {item.label}
                    </span>
                  </li>
                ))
              )}
            </ul>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="rounded-3xl border-0 shadow-agir">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Calendar className="size-4" />
              Visitas importantes
            </CardTitle>
            <CardDescription>Alta prioridade · visitas e revitalização</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3">
              {importantVisits.length === 0 ? (
                <li className="text-sm text-muted-foreground">
                  Sem itens com esse filtro.
                </li>
              ) : (
                importantVisits.slice(0, 6).map((a) => (
                  <li key={a.id}>
                    <ActionRow action={a} />
                  </li>
                ))
              )}
            </ul>
          </CardContent>
        </Card>

        <Card className="rounded-3xl border-0 shadow-agir">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <AlertTriangle className="size-4 text-amber-600" />
              Pendências urgentes
            </CardTitle>
            <CardDescription>Status pendente · prioridade urgente</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3">
              {urgentPending.length === 0 ? (
                <li className="text-sm text-muted-foreground">
                  Nenhuma pendência urgente 🎉
                </li>
              ) : (
                urgentPending.slice(0, 8).map((a) => (
                  <li key={a.id}>
                    <ActionRow action={a} />
                  </li>
                ))
              )}
            </ul>
          </CardContent>
        </Card>
      </div>

      <Separator className="opacity-60" />

      <footer className="flex flex-wrap gap-4 text-xs text-muted-foreground">
        <Link href="/agenda" className="hover:underline">
          Ver agenda completa
        </Link>
        <span>·</span>
        <Link href="/indicadores" className="hover:underline">
          Indicadores
        </Link>
        <span>·</span>
        <span>
          Dica: arraste esta página no celular — interface pensada para uso em campo.
        </span>
      </footer>
    </div>
  );
}

function StatCard({
  title,
  value,
  hint,
  variant,
}: {
  title: string;
  value: string;
  hint: string;
  variant?: "alert";
}) {
  return (
    <Card
      className={`rounded-3xl border-0 shadow-md ${
        variant === "alert" ? "ring-1 ring-amber-500/30" : ""
      }`}
    >
      <CardHeader className="pb-2">
        <CardDescription>{title}</CardDescription>
        <CardTitle className="text-3xl tabular-nums">{value}</CardTitle>
      </CardHeader>
      <CardContent className="text-xs text-muted-foreground">{hint}</CardContent>
    </Card>
  );
}

function QuickAction({
  href,
  label,
  icon: Icon,
}: {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}) {
  return (
    <Link href={href}>
      <div className="group flex h-full flex-col justify-between rounded-3xl bg-white p-4 shadow-md transition hover:shadow-lg">
        <div className="flex items-center justify-between gap-2">
          <span className="text-sm font-medium">{label}</span>
          <Icon className="size-5 shrink-0 text-primary opacity-80 transition group-hover:opacity-100" />
        </div>
        <span className="mt-3 text-xs text-muted-foreground">Abrir fluxo →</span>
      </div>
    </Link>
  );
}

function ActionRow({ action }: { action: AgendaAction }) {
  return (
    <div className="rounded-2xl border border-zinc-100 bg-zinc-50/80 px-3 py-2">
      <div className="flex flex-wrap items-center gap-2">
        <span className="font-medium">{action.title}</span>
        <Badge variant="secondary" className="text-[10px]">
          {ACTION_CATEGORY_LABELS[action.category]}
        </Badge>
        <Badge variant="outline" className="text-[10px]">
          {PRIORITY_LABELS[action.priority]}
        </Badge>
      </div>
      <div className="mt-1 flex flex-wrap gap-2 text-xs text-muted-foreground">
        <span>{action.dateKey}</span>
        <span>·</span>
        <span>{STATUS_LABELS[action.status]}</span>
        {action.locationText ? (
          <>
            <span>·</span>
            <span className="line-clamp-1">{action.locationText}</span>
          </>
        ) : null}
      </div>
    </div>
  );
}
