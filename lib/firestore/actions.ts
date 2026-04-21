import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  limit as limitFn,
  orderBy,
  query,
  serverTimestamp,
  Timestamp,
  updateDoc,
  where,
} from "firebase/firestore";

import { getFirebaseDb } from "@/lib/firebase/client";
import type { ActionCategory, ActionStatus, AgendaAction } from "@/types/models";

const col = "actions";

function toAction(id: string, data: Record<string, unknown>): AgendaAction {
  return { id, ...(data as Omit<AgendaAction, "id">) };
}

export async function listRecentActions(max = 200): Promise<AgendaAction[]> {
  const db = getFirebaseDb();
  const q = query(
    collection(db, col),
    orderBy("startAt", "desc"),
    limitFn(max)
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => toAction(d.id, d.data()));
}

export async function listActionsInDateRange(
  startKey: string,
  endKey: string
): Promise<AgendaAction[]> {
  const db = getFirebaseDb();
  const q = query(
    collection(db, col),
    where("dateKey", ">=", startKey),
    where("dateKey", "<=", endKey),
    orderBy("dateKey", "asc")
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => toAction(d.id, d.data()));
}

export async function createAction(input: {
  title: string;
  category: ActionCategory;
  assigneeUserId: string | null;
  dateKey: string;
  startAt: Date;
  endAt?: Date;
  locationText: string;
  notes: string;
  priority: AgendaAction["priority"];
  status: ActionStatus;
  pointId?: string | null;
  createdBy: string;
}): Promise<string> {
  const db = getFirebaseDb();
  const ref = await addDoc(collection(db, col), {
    title: input.title,
    category: input.category,
    assigneeUserId: input.assigneeUserId,
    dateKey: input.dateKey,
    startAt: Timestamp.fromDate(input.startAt),
    endAt: input.endAt ? Timestamp.fromDate(input.endAt) : null,
    locationText: input.locationText,
    notes: input.notes,
    priority: input.priority,
    status: input.status,
    pointId: input.pointId ?? null,
    createdBy: input.createdBy,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return ref.id;
}

export async function updateAction(
  id: string,
  patch: Partial<{
    title: string;
    category: ActionCategory;
    assigneeUserId: string | null;
    dateKey: string;
    locationText: string;
    notes: string;
    priority: AgendaAction["priority"];
    status: ActionStatus;
    pointId: string | null;
    startAt: Date;
    endAt: Date | null;
  }>
): Promise<void> {
  const db = getFirebaseDb();
  const data: Record<string, unknown> = { ...patch, updatedAt: serverTimestamp() };
  if (patch.startAt) data.startAt = Timestamp.fromDate(patch.startAt);
  if (patch.endAt !== undefined) {
    data.endAt = patch.endAt ? Timestamp.fromDate(patch.endAt) : null;
  }
  await updateDoc(doc(db, col, id), data);
}

export async function deleteAction(id: string): Promise<void> {
  await deleteDoc(doc(getFirebaseDb(), col, id));
}

export function filterActionsByMonth(actions: AgendaAction[], monthPrefix: string) {
  return actions.filter((a) => a.dateKey.startsWith(monthPrefix));
}
