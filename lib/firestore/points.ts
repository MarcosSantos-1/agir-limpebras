import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
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
import type { GeoPointData, OperationalPoint, PointStatus, PointType } from "@/types/models";

const col = "points";

function toPoint(id: string, data: Record<string, unknown>): OperationalPoint {
  return { id, ...(data as Omit<OperationalPoint, "id">) };
}

export async function listPoints(max = 500): Promise<OperationalPoint[]> {
  const db = getFirebaseDb();
  const q = query(collection(db, col), orderBy("updatedAt", "desc"), limitFn(max));
  const snap = await getDocs(q);
  return snap.docs.map((d) => toPoint(d.id, d.data()));
}

export async function listPointsByStatus(status: PointStatus): Promise<OperationalPoint[]> {
  const db = getFirebaseDb();
  const q = query(collection(db, col), where("status", "==", status));
  const snap = await getDocs(q);
  return snap.docs.map((d) => toPoint(d.id, d.data()));
}

export async function getPoint(id: string): Promise<OperationalPoint | null> {
  const ref = doc(getFirebaseDb(), col, id);
  const snap = await getDoc(ref);
  if (!snap.exists()) return null;
  return toPoint(snap.id, snap.data());
}

export async function createPoint(input: {
  address: string;
  geo: GeoPointData;
  type: PointType;
  status: PointStatus;
  assigneeUserId: string | null;
  notes: string;
  recurrenceFlag?: boolean;
  subprefeitura?: string | null;
}): Promise<string> {
  const db = getFirebaseDb();
  const ref = await addDoc(collection(db, col), {
    ...input,
    lastActionAt: null,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return ref.id;
}

export async function updatePoint(
  id: string,
  patch: Partial<{
    address: string;
    geo: GeoPointData;
    type: PointType;
    status: PointStatus;
    assigneeUserId: string | null;
    notes: string;
    lastActionAt: Date | null;
    recurrenceFlag: boolean;
    subprefeitura: string | null;
  }>
): Promise<void> {
  const data: Record<string, unknown> = { ...patch, updatedAt: serverTimestamp() };
  if (patch.lastActionAt !== undefined) {
    data.lastActionAt = patch.lastActionAt
      ? Timestamp.fromDate(patch.lastActionAt)
      : null;
  }
  await updateDoc(doc(getFirebaseDb(), col, id), data);
}

export async function deletePoint(id: string): Promise<void> {
  await deleteDoc(doc(getFirebaseDb(), col, id));
}
