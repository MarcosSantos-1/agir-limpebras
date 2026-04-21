import type { ActionCategory } from "@/types/models";

export const ACTION_CATEGORY_LABELS: Record<ActionCategory, string> = {
  revitalizacao: "Revitalização",
  visita_tecnica: "Visita técnica",
  visita_institucional: "Visita institucional",
  acao_ambiental: "Ação ambiental",
  reuniao: "Reunião",
  fiscalizacao: "Fiscalização",
  vistoria: "Vistoria",
};

export const POINT_TYPE_LABELS: Record<string, string> = {
  viciado: "Ponto viciado",
  ecoponto: "Ecoponto",
  ubs: "UBS",
  escola: "Escola",
  area_critica: "Área crítica",
  revitalizacao: "Revitalização",
  recorrente: "Recorrente",
  outro: "Outro",
};

export const PRIORITY_LABELS = {
  baixa: "Baixa",
  media: "Média",
  alta: "Alta",
  urgente: "Urgente",
} as const;

export const STATUS_LABELS = {
  pendente: "Pendente",
  concluido: "Concluído",
  reagendado: "Reagendado",
  cancelado: "Cancelado",
} as const;
