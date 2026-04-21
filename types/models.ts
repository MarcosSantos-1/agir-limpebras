import type { Timestamp } from "firebase/firestore";

export type UserRole = "admin" | "editor" | "visualizacao";

export type ActionCategory =
  | "revitalizacao"
  | "visita_tecnica"
  | "visita_institucional"
  | "acao_ambiental"
  | "reuniao"
  | "fiscalizacao"
  | "vistoria";

export type ActionStatus = "pendente" | "concluido" | "reagendado" | "cancelado";

export type PointType =
  | "viciado"
  | "ecoponto"
  | "ubs"
  | "escola"
  | "area_critica"
  | "revitalizacao"
  | "recorrente"
  | "outro";

export type PointStatus =
  | "ativo"
  | "em_andamento"
  | "resolvido"
  | "critico"
  | "arquivado";

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  role: UserRole;
  createdAt: Timestamp;
  updatedAt?: Timestamp;
}

export interface AgendaAction {
  id: string;
  title: string;
  category: ActionCategory;
  assigneeUserId: string | null;
  /** ISO date string YYYY-MM-DD for simple queries */
  dateKey: string;
  startAt: Timestamp;
  endAt?: Timestamp;
  locationText: string;
  notes: string;
  priority: "baixa" | "media" | "alta" | "urgente";
  status: ActionStatus;
  pointId?: string | null;
  createdBy: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface GeoPointData {
  lat: number;
  lng: number;
}

export interface OperationalPoint {
  id: string;
  address: string;
  geo: GeoPointData;
  type: PointType;
  status: PointStatus;
  assigneeUserId: string | null;
  lastActionAt: Timestamp | null;
  notes: string;
  recurrenceFlag?: boolean;
  subprefeitura?: string | null;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface LocationRecord {
  id: string;
  name: string;
  type: string;
  geo: GeoPointData;
  metadata?: Record<string, unknown>;
  source: "import" | "manual";
  createdAt: Timestamp;
}

export interface PhotoRecord {
  id: string;
  storagePath: string;
  downloadUrl?: string;
  actionId?: string | null;
  pointId?: string | null;
  historyId?: string | null;
  takenAt: Timestamp | null;
  uploadedBy: string;
  caption: string;
  tags: string[];
  pairId?: string | null;
  createdAt: Timestamp;
}

export interface HistoryRecord {
  id: string;
  summary: string;
  when: Timestamp;
  pointId: string | null;
  locationId: string | null;
  addressText?: string;
  whoUserId: string;
  photoIds: string[];
  notes: string;
  finalStatus: string;
  relatedActionId?: string | null;
  createdAt: Timestamp;
}

export interface NotificationRecord {
  id: string;
  userId: string;
  message: string;
  read: boolean;
  createdAt: Timestamp;
  link?: string;
}

export interface ChecklistItem {
  id: string;
  userId: string;
  dateKey: string;
  label: string;
  done: boolean;
  order: number;
  createdAt: Timestamp;
}
