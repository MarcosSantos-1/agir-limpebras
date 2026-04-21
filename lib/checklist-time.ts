export type ChecklistTimeMode = "none" | "single" | "range";

/** Monta timeLabel gravado no Firestore. */
export function buildTimeLabel(
  mode: ChecklistTimeMode,
  start: string,
  end: string
): string | undefined {
  if (mode === "none") return undefined;
  if (mode === "single") return start.trim() ? start.trim() : undefined;
  if (mode === "range") {
    if (start.trim() && end.trim()) return `${start.trim()} – ${end.trim()}`;
    if (start.trim()) return start.trim();
    return undefined;
  }
  return undefined;
}

/** Interpreta timeLabel existente para os inputs. */
export function parseTimeLabel(raw?: string | null): {
  mode: ChecklistTimeMode;
  start: string;
  end: string;
} {
  if (!raw?.trim()) {
    return { mode: "none", start: "", end: "" };
  }
  const t = raw.trim();
  const parts = t.split(/\s*[–—\-]\s*/).map((s) => s.trim());
  if (parts.length >= 2) {
    const start = toTimeInputValue(parts[0] ?? "");
    const end = toTimeInputValue(parts[1] ?? "");
    if (start && end) return { mode: "range", start, end };
  }
  const single = toTimeInputValue(parts[0] ?? t);
  if (single) return { mode: "single", start: single, end: "" };
  return { mode: "none", start: "", end: "" };
}

function toTimeInputValue(s: string): string {
  const m = s.match(/^(\d{1,2}):(\d{2})$/);
  if (!m) return "";
  const h = Math.min(23, Math.max(0, parseInt(m[1]!, 10)));
  const min = Math.min(59, Math.max(0, parseInt(m[2]!, 10)));
  return `${String(h).padStart(2, "0")}:${String(min).padStart(2, "0")}`;
}
