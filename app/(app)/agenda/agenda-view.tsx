"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

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
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  ACTION_CATEGORY_LABELS,
  PRIORITY_LABELS,
  STATUS_LABELS,
} from "@/lib/constants";
import { dateKey } from "@/lib/date";
import { canEdit } from "@/lib/auth";
import {
  createAction,
  deleteAction,
  listRecentActions,
  updateAction,
} from "@/lib/firestore/actions";
import { listUsers } from "@/lib/firestore/users";
import type { ActionCategory, ActionStatus, AgendaAction } from "@/types/models";

const schema = z.object({
  title: z.string().min(2, "Informe o título"),
  category: z.custom<ActionCategory>(),
  assigneeUserId: z.string(),
  dateKey: z.string(),
  time: z.string(),
  locationText: z.string(),
  notes: z.string(),
  priority: z.enum(["baixa", "media", "alta", "urgente"]),
  status: z.custom<ActionStatus>(),
});

type FormValues = z.infer<typeof schema>;

function defaultCategory(param: string | null): ActionCategory {
  if (param === "visita") return "visita_tecnica";
  if (param === "revitalizacao") return "revitalizacao";
  if (param === "acao") return "acao_ambiental";
  return "acao_ambiental";
}

export default function AgendaView() {
  const { profile, user } = useAuth();
  const qc = useQueryClient();
  const search = useSearchParams();
  const editor = canEdit(profile?.role);

  const { data: actions = [], isLoading } = useQuery({
    queryKey: ["actions", "recent"],
    queryFn: () => listRecentActions(250),
  });

  const { data: usersList = [] } = useQuery({
    queryKey: ["users"],
    queryFn: listUsers,
  });

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      title: "",
      category: "acao_ambiental",
      assigneeUserId: "__none",
      dateKey: dateKey(new Date()),
      time: "09:00",
      locationText: "",
      notes: "",
      priority: "media",
      status: "pendente",
    },
  });

  useEffect(() => {
    const n = search.get("new");
    if (n) {
      form.setValue("category", defaultCategory(n));
    }
  }, [search, form]);

  const createMut = useMutation({
    mutationFn: async (values: FormValues) => {
      if (!user) return;
      const [hh, mm] = values.time.split(":").map(Number);
      const d = new Date(`${values.dateKey}T12:00:00`);
      d.setHours(hh || 9, mm || 0, 0, 0);
      const assignee =
        values.assigneeUserId === "__none" ? null : values.assigneeUserId;
      await createAction({
        title: values.title,
        category: values.category,
        assigneeUserId: assignee,
        dateKey: values.dateKey,
        startAt: d,
        locationText: values.locationText,
        notes: values.notes,
        priority: values.priority,
        status: values.status,
        createdBy: user.uid,
      });
    },
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["actions"] });
      toast.success("Compromisso criado");
      form.reset({
        ...form.getValues(),
        title: "",
        notes: "",
        assigneeUserId: "__none",
      });
    },
    onError: () => toast.error("Não foi possível salvar"),
  });

  const sorted = useMemo(
    () =>
      [...actions].sort((a, b) => b.startAt.toMillis() - a.startAt.toMillis()),
    [actions]
  );

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = form;
  const category = watch("category");
  const assigneeUserId = watch("assigneeUserId");
  const priority = watch("priority");
  const status = watch("status");

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-8">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Agenda</h1>
        <p className="text-sm text-muted-foreground">
          Planejamento completo de compromissos e ações.
        </p>
      </header>

      {editor ? (
        <Card className="rounded-3xl border-0 shadow-agir">
          <CardHeader>
            <CardTitle>Novo compromisso</CardTitle>
            <CardDescription>
              Tipos: revitalização, visitas, fiscalização, reuniões e mais.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form
              className="grid gap-4 md:grid-cols-2"
              onSubmit={handleSubmit((v) => createMut.mutate(v))}
            >
              <div className="md:col-span-2 space-y-2">
                <Label htmlFor="title">Título</Label>
                <Input id="title" className="rounded-xl" {...register("title")} />
                {errors.title ? (
                  <p className="text-xs text-destructive">{errors.title.message}</p>
                ) : null}
              </div>
              <div className="space-y-2">
                <Label>Categoria</Label>
                <Select
                  value={category}
                  onValueChange={(v) => setValue("category", v as ActionCategory)}
                >
                  <SelectTrigger className="rounded-xl">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {(Object.keys(ACTION_CATEGORY_LABELS) as ActionCategory[]).map(
                      (k) => (
                        <SelectItem key={k} value={k}>
                          {ACTION_CATEGORY_LABELS[k]}
                        </SelectItem>
                      )
                    )}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Responsável</Label>
                <Select
                  value={assigneeUserId ?? "__none"}
                  onValueChange={(v) =>
                    setValue("assigneeUserId", v ?? "__none")
                  }
                >
                  <SelectTrigger className="rounded-xl">
                    <SelectValue placeholder="Selecionar" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none">—</SelectItem>
                    {usersList.map((u) => (
                      <SelectItem key={u.uid} value={u.uid}>
                        {u.displayName || u.email}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="dateKey">Data</Label>
                <Input
                  id="dateKey"
                  type="date"
                  className="rounded-xl"
                  {...register("dateKey")}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="time">Horário</Label>
                <Input id="time" type="time" className="rounded-xl" {...register("time")} />
              </div>
              <div className="md:col-span-2 space-y-2">
                <Label htmlFor="locationText">Localização</Label>
                <Input id="locationText" className="rounded-xl" {...register("locationText")} />
              </div>
              <div className="space-y-2">
                <Label>Prioridade</Label>
                <Select
                  value={priority}
                  onValueChange={(v) =>
                    setValue("priority", v as FormValues["priority"])
                  }
                >
                  <SelectTrigger className="rounded-xl">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {(Object.keys(PRIORITY_LABELS) as (keyof typeof PRIORITY_LABELS)[]).map(
                      (k) => (
                        <SelectItem key={k} value={k}>
                          {PRIORITY_LABELS[k]}
                        </SelectItem>
                      )
                    )}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Status</Label>
                <Select
                  value={status}
                  onValueChange={(v) => setValue("status", v as ActionStatus)}
                >
                  <SelectTrigger className="rounded-xl">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {(Object.keys(STATUS_LABELS) as ActionStatus[]).map((k) => (
                      <SelectItem key={k} value={k}>
                        {STATUS_LABELS[k]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="md:col-span-2 space-y-2">
                <Label htmlFor="notes">Observações</Label>
                <Textarea
                  id="notes"
                  className="min-h-[88px] rounded-xl"
                  {...register("notes")}
                />
              </div>
              <div className="md:col-span-2">
                <Button
                  type="submit"
                  className="agir-gradient rounded-xl border-0 text-white"
                  disabled={createMut.isPending}
                >
                  Salvar compromisso
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      ) : null}

      <Card className="rounded-3xl border-0 shadow-agir">
        <CardHeader>
          <CardTitle>Lista recente</CardTitle>
          <CardDescription>
            Ordenado por data de início ·{" "}
            {isLoading ? "carregando…" : `${sorted.length} itens`}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {sorted.map((a) => (
            <ActionListRow key={a.id} action={a} canEdit={editor} />
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

function ActionListRow({
  action,
  canEdit,
}: {
  action: AgendaAction;
  canEdit: boolean;
}) {
  const qc = useQueryClient();
  const remove = useMutation({
    mutationFn: () => deleteAction(action.id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["actions"] });
      toast.success("Removido");
    },
  });

  return (
    <div className="flex flex-col gap-2 rounded-2xl border border-zinc-100 bg-white p-4 shadow-sm md:flex-row md:items-center md:justify-between">
      <div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-medium">{action.title}</span>
          <Badge variant="secondary">
            {ACTION_CATEGORY_LABELS[action.category]}
          </Badge>
          <Badge variant="outline">{STATUS_LABELS[action.status]}</Badge>
        </div>
        <p className="mt-1 text-xs text-muted-foreground">
          {action.dateKey} · {action.locationText || "Sem local"}
        </p>
      </div>
      {canEdit ? (
        <div className="flex gap-2">
          <EditActionDialog action={action} />
          <Button
            variant="destructive"
            size="sm"
            className="rounded-xl"
            type="button"
            disabled={remove.isPending}
            onClick={() => remove.mutate()}
          >
            Excluir
          </Button>
        </div>
      ) : null}
    </div>
  );
}

function EditActionDialog({ action }: { action: AgendaAction }) {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    values: {
      title: action.title,
      category: action.category,
      assigneeUserId: action.assigneeUserId ?? "__none",
      dateKey: action.dateKey,
      time: `${String(action.startAt.toDate().getHours()).padStart(2, "0")}:${String(
        action.startAt.toDate().getMinutes()
      ).padStart(2, "0")}`,
      locationText: action.locationText,
      notes: action.notes,
      priority: action.priority,
      status: action.status,
    },
  });

  const save = useMutation({
    mutationFn: async (values: FormValues) => {
      const [hh, mm] = values.time.split(":").map(Number);
      const d = new Date(`${values.dateKey}T12:00:00`);
      d.setHours(hh || 9, mm || 0, 0, 0);
      const assignee =
        values.assigneeUserId === "__none" ? null : values.assigneeUserId;
      await updateAction(action.id, {
        title: values.title,
        category: values.category,
        assigneeUserId: assignee,
        dateKey: values.dateKey,
        locationText: values.locationText,
        notes: values.notes,
        priority: values.priority,
        status: values.status,
        startAt: d,
      });
    },
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["actions"] });
      toast.success("Atualizado");
      setOpen(false);
    },
    onError: () => toast.error("Falha ao atualizar"),
  });

  const { register, handleSubmit, setValue, watch } = form;
  const statusVal = watch("status");

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        className="rounded-xl"
        type="button"
        onClick={() => setOpen(true)}
      >
        Editar
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto rounded-3xl sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Editar compromisso</DialogTitle>
          </DialogHeader>
          <form
            className="grid gap-3"
            onSubmit={handleSubmit((v) => save.mutate(v))}
          >
            <div className="space-y-2">
              <Label htmlFor={`edit-title-${action.id}`}>Título</Label>
              <Input
                id={`edit-title-${action.id}`}
                className="rounded-xl"
                {...register("title")}
              />
            </div>
            <div className="space-y-2">
              <Label>Status</Label>
              <Select
                value={statusVal}
                onValueChange={(v) => setValue("status", v as ActionStatus)}
              >
                <SelectTrigger className="rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(Object.keys(STATUS_LABELS) as ActionStatus[]).map((k) => (
                    <SelectItem key={k} value={k}>
                      {STATUS_LABELS[k]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button
              type="submit"
              className="agir-gradient rounded-xl border-0 text-white"
              disabled={save.isPending}
            >
              Salvar
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
