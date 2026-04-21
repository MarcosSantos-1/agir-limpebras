"use client";

import { useQuery } from "@tanstack/react-query";
import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  parseISO,
  startOfMonth,
  startOfWeek,
} from "date-fns";
import { ptBR } from "date-fns/locale";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useMemo } from "react";

import { Button } from "@/components/ui/button";
import { dateKey } from "@/lib/date";
import {
  fetchBrasilSpHolidayMap,
  municipalOnlyMap,
} from "@/lib/holidays/brasil-sp-holidays";
import { cn } from "@/lib/utils";

const WEEKDAYS = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"];

type MonthCalendarProps = {
  month: Date;
  onMonthChange: (d: Date) => void;
  today: Date;
};

export function MonthCalendar({ month, onMonthChange, today }: MonthCalendarProps) {
  const year = month.getFullYear();

  const { data, isError, isPending } = useQuery({
    queryKey: ["brasil-sp-holidays", year],
    queryFn: () => fetchBrasilSpHolidayMap(year),
    staleTime: 1000 * 60 * 60 * 24 * 7,
    retry: 1,
  });

  const holidayMap = data ?? municipalOnlyMap(year);

  const holidaysThisMonth = useMemo(() => {
    const prefix = format(month, "yyyy-MM");
    return [...holidayMap.entries()]
      .filter(([k]) => k.startsWith(prefix))
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([dateKeyStr, label]) => ({ dateKey: dateKeyStr, label }));
  }, [holidayMap, month]);

  const monthStart = startOfMonth(month);
  const monthEnd = endOfMonth(month);
  const gridStart = startOfWeek(monthStart, { weekStartsOn: 1 });
  const gridEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
  const days = eachDayOfInterval({ start: gridStart, end: gridEnd });

  return (
    <div className="w-full">
      <div className="mb-3 flex items-center justify-between gap-1.5">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="size-7 shrink-0 rounded-lg"
          onClick={() => onMonthChange(addMonths(month, -1))}
          aria-label="Mês anterior"
        >
          <ChevronLeft className="size-4" />
        </Button>
        <p className="min-w-0 truncate text-center text-lg font-bold capitalize sm:text-[20px]">
          {format(month, "MMMM, yyyy", { locale: ptBR })}
        </p>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="size-7 shrink-0 rounded-lg"
          onClick={() => onMonthChange(addMonths(month, 1))}
          aria-label="Próximo mês"
        >
          <ChevronRight className="size-4" />
        </Button>
      </div>
      <div className="grid grid-cols-7 gap-px text-center text-[12px] font-bold text-muted-foreground sm:text-[12px]">
        {WEEKDAYS.map((d) => (
          <div key={d} className="py-0.5">
            {d}
          </div>
        ))}
      </div>
      <hr className="border-border/70 mx-auto my-2 w-full max-w-[420px] border" />

      <div className="grid grid-cols-7 gap-px">
        {days.map((d) => {
          const key = dateKey(d);
          const inMonth = isSameMonth(d, month);
          const isToday = isSameDay(d, today);
          const label = holidayMap.get(key);
          const isHoliday = Boolean(label);

          return (
            <div
              key={key}
              className={cn(
                "flex min-h-7 flex-col items-center justify-start py-0.5 text-[11px] sm:min-h-8 sm:text-xs",
                !inMonth && "text-muted-foreground/40"
              )}
            >
              <span
                title={label}
                className={cn(
                  "inline-flex min-h-[1.25rem] min-w-[1.25rem] items-center justify-center tabular-nums",
                  isToday &&
                    "rounded-lg bg-purple-600 px-1 text-white shadow-sm dark:bg-purple-500",
                  !isToday && inMonth && "text-foreground",
                  !isToday && !inMonth && "text-muted-foreground/50"
                )}
              >
                {format(d, "d")}
              </span>
              <span
                className="mt-0.5 flex h-1.5 w-full items-center justify-center"
                aria-hidden
              >
                {isHoliday ? (
                  <span
                    className="size-1.5 shrink-0 rounded-full bg-red-500"
                    title={label}
                  />
                ) : (
                  <span className="size-1.5 shrink-0 opacity-0" />
                )}
              </span>
            </div>
          );
        })}
      </div>

      <div className="mt-2.5 space-y-1 border-t border-transparent pt-1">

        {isPending ? (
          <p className="text-center text-[9px] text-muted-foreground/55">
            Atualizando feriados nacionais…
          </p>
        ) : null}
        {holidaysThisMonth.length === 0 ? (
          <p className="text-center text-[10px] text-muted-foreground/55">
            Nenhum feriado neste mês.
          </p>
        ) : (
          <ul className="mx-auto max-w-md space-y-1 text-[10px] text-muted-foreground/75 sm:text-[11px]">
            {holidaysThisMonth.map(({ dateKey: dk, label: name }) => (
              <li key={dk} className="flex gap-2">
                <span className="inline-flex shrink-0 items-center gap-1.5 tabular-nums">
                  <span
                    className="size-1.5 shrink-0 rounded-full bg-red-500"
                    aria-hidden
                  />
                  {format(parseISO(dk), "d MMM", { locale: ptBR })}
                </span>
                <span className="min-w-0 leading-snug">{name}</span>
              </li>
            ))}
          </ul>
        )}
        {isError ? (
          <p className="text-center text-[9px] text-amber-700/80 dark:text-amber-400/90">
            Não foi possível carregar os feriados nacionais. Exibindo apenas os
            municipais de SP (25/01 e 9/07).
          </p>
        ) : null}
      </div>

    </div>
  );
}
