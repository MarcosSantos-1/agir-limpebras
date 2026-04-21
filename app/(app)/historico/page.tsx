"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDisplayDate } from "@/lib/date";
import { listHistory } from "@/lib/firestore/history";
import { listUsers } from "@/lib/firestore/users";

export default function HistoricoPage() {
  const { data: entries = [], isLoading } = useQuery({
    queryKey: ["history", "all"],
    queryFn: () => listHistory(200),
  });

  const { data: users = [] } = useQuery({
    queryKey: ["users"],
    queryFn: listUsers,
  });

  function nameFor(uid: string) {
    return users.find((u) => u.uid === uid)?.displayName ?? uid.slice(0, 8);
  }

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-8">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Histórico</h1>
        <p className="text-sm text-muted-foreground">
          Registro oficial: o que foi feito, quando, onde, por quem, com fotos e status final.
        </p>
      </header>

      <Card className="rounded-3xl border-0 shadow-agir">
        <CardHeader>
          <CardTitle>Linha do tempo</CardTitle>
          <CardDescription>
            {isLoading ? "Carregando…" : `${entries.length} registros`}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {entries.map((h) => (
            <article
              key={h.id}
              className="relative border-l-2 border-primary/30 pl-6"
            >
              <div className="absolute -left-[9px] top-1 size-4 rounded-full bg-primary shadow-sm" />
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <h2 className="text-lg font-semibold">{h.summary}</h2>
                <time className="text-xs text-muted-foreground">
                  {formatDisplayDate(h.when.toDate(), "d MMM yyyy · HH:mm")}
                </time>
              </div>
              <p className="mt-2 text-sm text-muted-foreground">{h.notes}</p>
              <dl className="mt-3 grid gap-1 text-xs text-muted-foreground sm:grid-cols-2">
                <div>
                  <dt className="font-medium text-foreground">Quem</dt>
                  <dd>{nameFor(h.whoUserId)}</dd>
                </div>
                <div>
                  <dt className="font-medium text-foreground">Status final</dt>
                  <dd>{h.finalStatus}</dd>
                </div>
                {h.pointId ? (
                  <div className="sm:col-span-2">
                    <dt className="font-medium text-foreground">Ponto</dt>
                    <dd>
                      <Link
                        href={`/pontos/${h.pointId}`}
                        className="text-primary underline-offset-4 hover:underline"
                      >
                        Abrir ponto vinculado
                      </Link>
                    </dd>
                  </div>
                ) : null}
                {h.addressText ? (
                  <div className="sm:col-span-2">
                    <dt className="font-medium text-foreground">Onde</dt>
                    <dd>{h.addressText}</dd>
                  </div>
                ) : null}
                {h.photoIds.length > 0 ? (
                  <div className="sm:col-span-2">
                    <dt className="font-medium text-foreground">Fotos</dt>
                    <dd>{h.photoIds.length} referência(s) em anexo</dd>
                  </div>
                ) : null}
              </dl>
            </article>
          ))}
          {!isLoading && entries.length === 0 ? (
            <p className="text-center text-sm text-muted-foreground">
              Nenhum registro ainda. Conclua ações e registre entradas de histórico a partir dos pontos.
            </p>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}
