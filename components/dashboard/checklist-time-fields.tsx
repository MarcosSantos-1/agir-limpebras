"use client";

import type { ChecklistTimeMode } from "@/lib/checklist-time";
import { cn } from "@/lib/utils";

const MODES: { value: ChecklistTimeMode; label: string }[] = [
  { value: "none", label: "Sem horário" },
  { value: "single", label: "Horário único" },
  { value: "range", label: "Intervalo" },
];

const timeInputClass =
  "h-8 rounded-md border border-purple-200/80 bg-white/90 px-2 text-sm text-purple-950 tabular-nums shadow-sm dark:border-purple-800 dark:bg-purple-950/50 dark:text-purple-50";

const selectClass =
  "h-8 max-w-[10rem] rounded-md border border-purple-200/80 bg-white/90 px-2 text-xs text-purple-950 dark:border-purple-800 dark:bg-purple-950/50 dark:text-purple-50";

type ChecklistTimeFieldsProps = {
  mode: ChecklistTimeMode;
  onModeChange: (mode: ChecklistTimeMode) => void;
  start: string;
  end: string;
  onStartChange: (v: string) => void;
  onEndChange: (v: string) => void;
  disabled?: boolean;
  className?: string;
};

export function ChecklistTimeFields({
  mode,
  onModeChange,
  start,
  end,
  onStartChange,
  onEndChange,
  disabled,
  className,
}: ChecklistTimeFieldsProps) {
  return (
    <div
      className={cn(
        "flex flex-wrap items-center gap-x-2 gap-y-1.5",
        className
      )}
    >
      <select
        value={mode}
        onChange={(e) => onModeChange(e.target.value as ChecklistTimeMode)}
        disabled={disabled}
        className={selectClass}
        aria-label="Tipo de horário"
      >
        {MODES.map((m) => (
          <option key={m.value} value={m.value}>
            {m.label}
          </option>
        ))}
      </select>
      {mode === "single" ? (
        <input
          type="time"
          value={start}
          onChange={(e) => onStartChange(e.target.value)}
          disabled={disabled}
          className={timeInputClass}
          aria-label="Horário"
        />
      ) : null}
      {mode === "range" ? (
        <>
          <input
            type="time"
            value={start}
            onChange={(e) => onStartChange(e.target.value)}
            disabled={disabled}
            className={timeInputClass}
            aria-label="Início do intervalo"
          />
          <span className="text-xs text-muted-foreground">até</span>
          <input
            type="time"
            value={end}
            onChange={(e) => onEndChange(e.target.value)}
            disabled={disabled}
            className={timeInputClass}
            aria-label="Fim do intervalo"
          />
        </>
      ) : null}
    </div>
  );
}
