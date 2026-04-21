"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  CalendarDays,
  Map as MapIcon,
  MoreHorizontal,
  Pencil,
  Plus,
  Trash2,
} from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import { useAuth } from "@/components/auth/auth-provider";
import { MonthCalendar } from "@/components/dashboard/month-calendar";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ChecklistTimeFields } from "@/components/dashboard/checklist-time-fields";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { ACTION_CATEGORY_LABELS, PRIORITY_LABELS, STATUS_LABELS } from "@/lib/constants";
import {
  buildTimeLabel,
  type ChecklistTimeMode,
  parseTimeLabel,
} from "@/lib/checklist-time";
import { dateKey } from "@/lib/date";
import { listRecentActions } from "@/lib/firestore/actions";
import {
  addChecklistItem,
  deleteChecklistItem,
  listChecklistForDay,
  toggleChecklistItem,
  updateChecklistItem,
} from "@/lib/firestore/checklist";
import { listUsers } from "@/lib/firestore/users";
import { cn } from "@/lib/utils";
import type { AgendaAction, ChecklistItem } from "@/types/models";

const MAX_CHECKLIST_VISIBLE = 8;
const MAX_UPCOMING = 5;

function actionCardClass(action: AgendaAction): string {
  if (action.priority === "urgente") {
    return "border-rose-200/80 bg-gradient-to-br from-rose-50 to-orange-50 text-rose-950 dark:border-rose-900/40 dark:from-rose-950/40 dark:to-orange-950/30 dark:text-rose-50";
  }
  if (action.priority === "alta") {
    return "border-amber-200/80 bg-gradient-to-br from-amber-50 to-yellow-50 text-amber-950 dark:border-amber-900/40 dark:from-amber-950/40 dark:to-yellow-950/30 dark:text-amber-50";
  }
  if (action.category === "revitalizacao") {
    return "border-emerald-200/80 bg-gradient-to-br from-emerald-50 to-teal-50 text-emerald-950 dark:border-emerald-900/40 dark:from-emerald-950/40 dark:to-teal-950/30 dark:text-emerald-50";
  }
  return "border-sky-200/80 bg-gradient-to-br from-sky-50 to-indigo-50 text-sky-950 dark:border-sky-900/40 dark:from-sky-950/40 dark:to-indigo-950/30 dark:text-sky-50";
}

function formatActionTime(action: AgendaAction): string {
  const start = action.startAt.toDate();
  const end = action.endAt?.toDate();
  const t0 = format(start, "HH:mm", { locale: ptBR });
  if (end) {
    const t1 = format(end, "HH:mm", { locale: ptBR });
    return `${t0} – ${t1}`;
  }
  return t0;
}

export default function DashboardPage() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const today = useMemo(() => new Date(), []);
  const todayKey = dateKey(today);
  const [calendarMonth, setCalendarMonth] = useState(() => new Date());

  const { data: actions = [], isLoading: loadingActions } = useQuery({
    queryKey: ["actions", "recent"],
    queryFn: () => listRecentActions(200),
  });

  const { data: users = [] } = useQuery({
    queryKey: ["users"],
    queryFn: listUsers,
  });

  const { data: checklist = [] } = useQuery({
    queryKey: ["checklist", user?.uid, todayKey],
    queryFn: () =>
      user ? listChecklistForDay(user.uid, todayKey) : Promise.resolve([]),
    enabled: Boolean(user),
  });

  const upcoming = useMemo(() => {
    const open = actions.filter(
      (a) => a.status === "pendente" || a.status === "reagendado"
    );
    return [...open]
      .sort((a, b) => a.startAt.toMillis() - b.startAt.toMillis())
      .slice(0, MAX_UPCOMING);
  }, [actions]);

  const [newCheck, setNewCheck] = useState("");
  const [addTimeMode, setAddTimeMode] = useState<ChecklistTimeMode>("none");
  const [addTimeStart, setAddTimeStart] = useState("");
  const [addTimeEnd, setAddTimeEnd] = useState("");
  const [addingRow, setAddingRow] = useState(false);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editLabel, setEditLabel] = useState("");
  const [editTimeMode, setEditTimeMode] = useState<ChecklistTimeMode>("none");
  const [editTimeStart, setEditTimeStart] = useState("");
  const [editTimeEnd, setEditTimeEnd] = useState("");

  function beginEdit(item: ChecklistItem) {
    setEditingId(item.id);
    setEditLabel(item.label);
    const p = parseTimeLabel(item.timeLabel);
    setEditTimeMode(p.mode);
    setEditTimeStart(p.start);
    setEditTimeEnd(p.end);
  }

  function cancelEdit() {
    setEditingId(null);
    setEditLabel("");
    setEditTimeMode("none");
    setEditTimeStart("");
    setEditTimeEnd("");
  }

  const addCheck = useMutation({
    mutationFn: async () => {
      if (!user?.uid || !newCheck.trim()) return;
      const timeLabel = buildTimeLabel(
        addTimeMode,
        addTimeStart,
        addTimeEnd
      );
      await addChecklistItem({
        userId: user.uid,
        dateKey: todayKey,
        label: newCheck.trim(),
        timeLabel,
        order: checklist.length,
      });
    },
    onSuccess: async () => {
      setNewCheck("");
      setAddTimeMode("none");
      setAddTimeStart("");
      setAddTimeEnd("");
      setAddingRow(false);
      await qc.invalidateQueries({
        queryKey: ["checklist", user?.uid, todayKey],
      });
      toast.success("Item adicionado");
    },
    onError: () => toast.error("Não foi possível adicionar"),
  });

  const saveEdit = useMutation({
    mutationFn: async () => {
      if (!editingId || !editLabel.trim()) return;
      const timeLabel = buildTimeLabel(
        editTimeMode,
        editTimeStart,
        editTimeEnd
      );
      await updateChecklistItem(editingId, {
        label: editLabel.trim(),
        timeLabel: timeLabel ?? null,
      });
    },
    onSuccess: async () => {
      cancelEdit();
      await qc.invalidateQueries({
        queryKey: ["checklist", user?.uid, todayKey],
      });
      toast.success("Item atualizado");
    },
    onError: () => toast.error("Não foi possível salvar"),
  });

  const deleteCheck = useMutation({
    mutationFn: async (id: string) => {
      await deleteChecklistItem(id);
    },
    onSuccess: async () => {
      await qc.invalidateQueries({
        queryKey: ["checklist", user?.uid, todayKey],
      });
      toast.success("Item removido");
    },
    onError: () => toast.error("Não foi possível remover"),
  });

  const toggleCheck = useMutation({
    mutationFn: async (p: { id: string; done: boolean }) => {
      await toggleChecklistItem(p.id, !p.done);
    },
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ["checklist", user?.uid, todayKey] }),
  });

  const canUseChecklist = Boolean(user);
  const checklistDone = useMemo(
    () => checklist.filter((i) => i.done).length,
    [checklist]
  );
  const checklistTotal = checklist.length;

  function nameFor(uid: string | null): string | null {
    if (!uid) return null;
    const u = users.find((x) => x.uid === uid);
    return u?.displayName || u?.email || uid.slice(0, 8);
  }

  const checklistVisible = checklist.slice(0, MAX_CHECKLIST_VISIBLE);
  const checklistOverflow = checklist.length > MAX_CHECKLIST_VISIBLE;

  return (
    <div
      className={cn(
        "mx-auto flex w-full max-w-6xl flex-col gap-3",
        "lg:max-h-[calc(100dvh-5rem)] lg:min-h-0 lg:overflow-hidden"
      )}
    >
      <header className="shrink-0">
        <h1 className="text-xl font-semibold tracking-tight md:text-2xl">
          Painel de hoje
        </h1>
      </header>

      <div className="grid min-h-0 flex-1 gap-3 lg:grid-cols-2 lg:gap-4 lg:overflow-hidden">
        {/* Coluna 1: calendário e checklist */}
        <div className="flex min-h-0 flex-col gap-3 p-4 lg:overflow-hidden lg:p-5">
          <div className="w-full max-w-md shrink-0">
            <MonthCalendar
              month={calendarMonth}
              onMonthChange={setCalendarMonth}
              today={today}
            />
          </div>


          <div className="mt-4 flex min-h-0 flex-1 flex-col gap-3 lg:min-h-0 lg:overflow-hidden">
            <div className="flex items-center justify-between gap-3">
              <div className="flex min-w-0 items-center gap-2">
                <h2 className="shrink-0 text-lg font-bold">Checklist diário</h2>
                <span
                  className="text-sm tabular-nums text-muted-foreground"
                  aria-label={`${checklistDone} de ${checklistTotal} itens concluídos`}
                >
                  {checklistDone}/{checklistTotal}
                </span>
              </div>
              {canUseChecklist && !addingRow ? (
                <Button
                  type="button"
                  size="icon"
                  className="mr-2 size-7 shrink-0 bg-zinc-50 border-0 text-purple-800  hover:scale-110 transition-all duration-300"
                  onClick={() => setAddingRow(true)}
                  aria-label="Adicionar item"
                >
                  <Plus className="size-6 stroke-[2.5]" />
                </Button>
              ) : null}
            </div>

            {canUseChecklist && addingRow ? (
              <form
                id="checklist-add-form"
                className="w-full rounded-2xl border-2 border-purple-300/80 bg-purple-50/90 p-4 shadow-sm dark:border-purple-700 dark:bg-purple-950/50"
                onSubmit={(e) => {
                  e.preventDefault();
                  addCheck.mutate();
                }}
              >
                <div className="flex flex-col gap-4">
                  <Input
                    placeholder="Texto do item"
                    value={newCheck}
                    onChange={(e) => setNewCheck(e.target.value)}
                    className="h-10 w-full rounded-xl border-purple-300/90 bg-white text-purple-950 placeholder:text-purple-900/40 focus-visible:border-purple-600 focus-visible:ring-purple-500/30 dark:border-purple-800 dark:bg-purple-950/70 dark:text-purple-50 dark:placeholder:text-purple-300/45"
                  />
                  <div className="flex w-full flex-wrap items-end justify-between gap-x-3 gap-y-3">
                    <ChecklistTimeFields
                      mode={addTimeMode}
                      onModeChange={setAddTimeMode}
                      start={addTimeStart}
                      end={addTimeEnd}
                      onStartChange={setAddTimeStart}
                      onEndChange={setAddTimeEnd}
                      className="min-w-0 flex-1 basis-[min(100%,20rem)]"
                    />
                    <div className="ml-auto flex shrink-0 items-center gap-2">
                      <Button
                        type="submit"
                        size="sm"
                        className="h-10 min-w-[4.5rem] rounded-xl bg-purple-700 px-4 font-medium text-white shadow-sm hover:bg-purple-800 dark:bg-purple-600 dark:hover:bg-purple-500"
                        disabled={addCheck.isPending || !newCheck.trim()}
                      >
                        Ok
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="h-10 rounded-xl border-purple-300/80 bg-white text-purple-900 hover:bg-purple-50 dark:border-purple-700 dark:bg-purple-950 dark:text-purple-100 dark:hover:bg-purple-900"
                        onClick={() => {
                          setNewCheck("");
                          setAddTimeMode("none");
                          setAddTimeStart("");
                          setAddTimeEnd("");
                          setAddingRow(false);
                        }}
                      >
                        Cancelar
                      </Button>
                    </div>
                  </div>
                </div>
              </form>
            ) : null}

            <ul className="space-y-1.5 lg:min-h-0 lg:flex-1 lg:overflow-hidden">
              {checklistVisible.length === 0 && !addingRow ? (
                <li className="text-xs text-muted-foreground">
                  Nenhum item — use + para adicionar.
                </li>
              ) : (
                checklistVisible.map((item) => (
                  <li key={item.id}>
                    <div
                      className={cn(
                        "group flex items-start gap-2 rounded-xl border border-transparent bg-zinc-100/80 px-2 py-1.5 dark:bg-zinc-900/40",
                        editingId === item.id && "ring-1 ring-purple-200/60 dark:ring-purple-900/50"
                      )}
                    >
                      <Checkbox
                        checked={item.done}
                        disabled={
                          !canUseChecklist ||
                          toggleCheck.isPending ||
                          editingId === item.id
                        }
                        onCheckedChange={() =>
                          canUseChecklist
                            ? toggleCheck.mutate({ id: item.id, done: item.done })
                            : undefined
                        }
                        className="mt-0.5 size-7 shrink-0 rounded-lg [&_svg]:size-4"
                      />
                      {editingId === item.id ? (
                        <div className="flex min-w-0 flex-1 flex-col gap-2">
                          <Input
                            value={editLabel}
                            onChange={(e) => setEditLabel(e.target.value)}
                            className="h-8 rounded-md text-xl"
                            placeholder="Texto"
                          />
                          <ChecklistTimeFields
                            mode={editTimeMode}
                            onModeChange={setEditTimeMode}
                            start={editTimeStart}
                            end={editTimeEnd}
                            onStartChange={setEditTimeStart}
                            onEndChange={setEditTimeEnd}
                            disabled={saveEdit.isPending}
                          />
                          <div className="flex flex-wrap gap-1.5">
                            <Button
                              type="button"
                              size="sm"
                              className="h-8 rounded-lg bg-purple-600 text-white hover:bg-purple-700"
                              disabled={
                                saveEdit.isPending || !editLabel.trim()
                              }
                              onClick={() => saveEdit.mutate()}
                            >
                              Salvar
                            </Button>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="h-8"
                              disabled={saveEdit.isPending}
                              onClick={() => cancelEdit()}
                            >
                              Cancelar
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <span
                            className={cn(
                              "min-w-0 flex-1 text-sm leading-tight",
                              item.done && "text-muted-foreground line-through"
                            )}
                          >
                            {item.label}
                          </span>
                          {item.timeLabel ? (
                            <span className="shrink-0 text-xs tabular-nums text-muted-foreground">
                              {item.timeLabel}
                            </span>
                          ) : (
                            <span className="w-px shrink-0" />
                          )}
                          {canUseChecklist ? (
                            <DropdownMenu>
                              <DropdownMenuTrigger
                                className={cn(
                                  buttonVariants({
                                    variant: "ghost",
                                    size: "icon",
                                  }),
                                  "size-8 shrink-0 opacity-0 transition-opacity group-hover:opacity-100 max-md:opacity-100 focus-visible:opacity-100"
                                )}
                                aria-label="Ações do item"
                              >
                                <MoreHorizontal className="size-4" />
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="min-w-[8rem]">
                                <DropdownMenuItem
                                  onClick={() => beginEdit(item)}
                                  className="gap-2"
                                >
                                  <Pencil className="size-4" />
                                  Editar
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  variant="destructive"
                                  onClick={() => {
                                    if (
                                      window.confirm(
                                        "Remover este item do checklist?"
                                      )
                                    ) {
                                      deleteCheck.mutate(item.id);
                                    }
                                  }}
                                  disabled={deleteCheck.isPending}
                                  className="gap-2"
                                >
                                  <Trash2 className="size-4" />
                                  Apagar
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          ) : null}
                        </>
                      )}
                    </div>
                  </li>
                ))
              )}
            </ul>
            {checklistOverflow ? (
              <p className="text-[10px] text-muted-foreground">
                Mostrando {MAX_CHECKLIST_VISIBLE} de {checklist.length} itens.
              </p>
            ) : null}
          </div>
        </div>

        {/* Coluna 2: ações rápidas + próximas */}
        <div className="flex min-h-0 flex-col gap-8 p-4 lg:overflow-hidden lg:p-5">
          <Card className="shrink-0 overflow-hidden rounded-2xl border border-white/15 bg-gradient-to-br from-purple-600 via-purple-700 to-violet-950 text-white shadow-lg ring-1 ring-white/10">
            <CardHeader className="pb-2 pt-4">
              <CardTitle className="text-base text-white">Ações rápidas</CardTitle>
              <CardDescription className="text-xs text-white/85">
                Atalhos frequentes
              </CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-3 gap-2 pb-4">
              <QuickAction
                href="/agenda?new=acao"
                label="Nova ação"
                icon={Plus}
              />
              <QuickAction href="/mapa" label="Mapa" icon={MapIcon} />
              <QuickAction href="/agenda" label="Agenda" icon={CalendarDays} />
            </CardContent>
          </Card>

          <div className="flex min-h-0 flex-1 flex-col gap-3 pt-2 lg:overflow-hidden">
            <h2 className="shrink-0 text-base font-semibold tracking-tight">
              Próximas ações
            </h2>
            <ul className="min-h-0 space-y-2 lg:flex-1 lg:overflow-hidden">
              {loadingActions ? (
                <li className="text-xs text-muted-foreground">Carregando…</li>
              ) : upcoming.length === 0 ? (
                <li className="text-xs text-muted-foreground">
                  Nenhuma ação pendente nos registros recentes.
                </li>
              ) : (
                upcoming.map((a) => (
                  <li key={a.id}>
                    <UpcomingActionCard
                      action={a}
                      assigneeName={nameFor(a.assigneeUserId)}
                    />
                  </li>
                ))
              )}
            </ul>
          </div>
        </div>
      </div>
    </div>
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
    <Link href={href} className="block min-w-0">
      <div className="flex h-full min-h-[4.25rem] flex-col items-center justify-center gap-1.5 rounded-xl border border-amber-300/45 bg-white/12 p-2 text-center text-white shadow-inner transition hover:border-amber-200/60 hover:bg-white/20">
        <Icon className="size-5 shrink-0 text-amber-200 drop-shadow-sm" />
        <span className="text-[11px] font-semibold leading-tight text-white">
          {label}
        </span>
      </div>
    </Link>
  );
}

function UpcomingActionCard({
  action,
  assigneeName,
}: {
  action: AgendaAction;
  assigneeName: string | null;
}) {
  return (
    <Link href="/agenda" className="block min-w-0">
      <div
        className={cn(
          "rounded-2xl border px-3 py-2 shadow-sm transition hover:opacity-95",
          actionCardClass(action)
        )}
      >
        <div className="flex flex-wrap gap-1">
          <Badge variant="secondary" className="text-[9px]">
            {ACTION_CATEGORY_LABELS[action.category]}
          </Badge>
          <Badge variant="outline" className="text-[9px]">
            {PRIORITY_LABELS[action.priority]}
          </Badge>
          <Badge variant="outline" className="text-[9px]">
            {STATUS_LABELS[action.status]}
          </Badge>
        </div>
        <p className="mt-1.5 line-clamp-2 text-sm font-semibold leading-tight">
          {action.title}
        </p>
        <div className="mt-1 space-y-0.5 text-[11px] opacity-90">
          {action.locationText ? (
            <p className="line-clamp-1">{action.locationText}</p>
          ) : null}
          <p className="tabular-nums">{formatActionTime(action)}</p>
          {assigneeName ? (
            <p className="line-clamp-1">Participante: {assigneeName}</p>
          ) : null}
        </div>
      </div>
    </Link>
  );
}
