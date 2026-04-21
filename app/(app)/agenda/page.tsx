import { Suspense } from "react";

import AgendaView from "./agenda-view";

export default function AgendaPage() {
  return (
    <Suspense
      fallback={
        <div className="p-8 text-sm text-muted-foreground">Carregando agenda…</div>
      }
    >
      <AgendaView />
    </Suspense>
  );
}
