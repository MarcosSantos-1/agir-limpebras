import {
  addDoc,
  collection,
  doc,
  getDocs,
  limit as limitFn,
  orderBy,
  query,
  serverTimestamp,
  Timestamp,
  where,
} from "firebase/firestore";

import { getFirebaseDb } from "@/lib/firebase/client";
import type { HistoryRecord } from "@/types/models";

const col = "history";

function toHistory(id: string, data: Record<string, unknown>): HistoryRecord {
  return { id, ...(data as Omit<HistoryRecord, "id">) };
}

export async function listHistory(max = 150): Promise<HistoryRecord[]> {
  const db = getFirebaseDb();
  const q = query(
    collection(db, col),
    orderBy("when", "desc"),
    limitFn(max)
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => toHistory(d.id, d.data()));
}

export async function listHistoryByPoint(pointId: string): Promise<HistoryRecord[]> {
  const db = getFirebaseDb();
  const q = query(collection(db, col), where("pointId", "==", pointId));
  const snap = await getDocs(q);
  const rows = snap.docs.map((d) => toHistory(d.id, d.data()));
  return rows.sort((a, b) => {
    const ta = a.when?.toMillis?.() ?? 0;
    const tb = b.when?.toMillis?.() ?? 0;
    return tb - ta;
  });
}

export async function createHistoryEntry(input: {
  summary: string;
  when: Date;
  pointId: string | null;
  locationId: string | null;
  addressText?: string;
  whoUserId: string;
  photoIds: string[];
  notes: string;
  finalStatus: string;
  relatedActionId?: string | null;
}): Promise<string> {
  const db = getFirebaseDb();
  const ref = await addDoc(collection(db, col), {
    ...input,
    when: Timestamp.fromDate(input.when),
    createdAt: serverTimestamp(),
  });
  return ref.id;
}
