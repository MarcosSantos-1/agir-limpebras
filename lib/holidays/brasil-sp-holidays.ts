/**
 * Feriados nacionais via BrasilAPI (comunidade, dados públicos) +
 * feriados municipais fixos da capital de São Paulo (25/01 e 09/07).
 *
 * Não existe API oficial gratuita e estável que publique o decreto municipal
 * completo da Prefeitura (pontos facultativos etc.); para isso seria scraping
 * ou manutenção manual anual.
 */

const BRASIL_API = "https://brasilapi.com.br/api/feriados/v1";

export type BrasilApiHolidayRow = {
  date: string;
  name: string;
  type: string;
};

const SP_CAPITAL_MUNICIPAL: readonly { month: number; day: number; label: string }[] =
  [
    { month: 1, day: 25, label: "Aniversário da cidade de São Paulo" },
    {
      month: 7,
      day: 9,
      label: "Revolução Constitucionalista de 1932 (Data Magna de SP)",
    },
  ];

function pad(n: number) {
  return String(n).padStart(2, "0");
}

/** Feriados municipais da capital SP com data fixa (mesmo dia todo ano). */
export function saoPauloCapitalMunicipalEntries(year: number): {
  dateKey: string;
  label: string;
}[] {
  return SP_CAPITAL_MUNICIPAL.map(({ month, day, label }) => ({
    dateKey: `${year}-${pad(month)}-${pad(day)}`,
    label,
  }));
}

export async function fetchBrasilNationalHolidays(
  year: number
): Promise<BrasilApiHolidayRow[]> {
  const res = await fetch(`${BRASIL_API}/${year}`);
  if (!res.ok) {
    throw new Error(`BrasilAPI feriados: ${res.status}`);
  }
  return res.json();
}

/**
 * Mapa dateKey (yyyy-MM-dd) → nome exibido.
 * Nacionais (API) + municipais SP; nas datas 25/01 e 09/07 prevalece o rótulo municipal.
 */
export async function fetchBrasilSpHolidayMap(
  year: number
): Promise<Map<string, string>> {
  const map = new Map<string, string>();
  const national = await fetchBrasilNationalHolidays(year);
  for (const h of national) {
    map.set(h.date, h.name);
  }
  for (const { dateKey, label } of saoPauloCapitalMunicipalEntries(year)) {
    map.set(dateKey, label);
  }
  return map;
}

export function municipalOnlyMap(year: number): Map<string, string> {
  const map = new Map<string, string>();
  for (const { dateKey, label } of saoPauloCapitalMunicipalEntries(year)) {
    map.set(dateKey, label);
  }
  return map;
}
