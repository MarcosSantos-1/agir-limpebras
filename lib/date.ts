import {
  addDays,
  endOfWeek,
  format,
  startOfWeek,
} from "date-fns";
import { ptBR } from "date-fns/locale";

export function dateKey(d: Date = new Date()): string {
  return format(d, "yyyy-MM-dd");
}

export function weekRangeMonday(d: Date = new Date()) {
  const start = startOfWeek(d, { weekStartsOn: 1 });
  const end = endOfWeek(d, { weekStartsOn: 1 });
  return {
    start,
    end,
    startKey: format(start, "yyyy-MM-dd"),
    endKey: format(end, "yyyy-MM-dd"),
  };
}

export function formatDisplayDate(d: Date, pattern = "d MMM yyyy") {
  return format(d, pattern, { locale: ptBR });
}

export function eachDayOfWeek(d: Date = new Date()) {
  const { start } = weekRangeMonday(d);
  return Array.from({ length: 7 }, (_, i) => addDays(start, i));
}
