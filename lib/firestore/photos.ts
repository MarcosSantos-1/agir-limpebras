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
  where,
} from "firebase/firestore";

import { getFirebaseDb } from "@/lib/firebase/client";
import type { PhotoRecord } from "@/types/models";

const col = "photos";

function toPhoto(id: string, data: Record<string, unknown>): PhotoRecord {
  return { id, ...(data as Omit<PhotoRecord, "id">) };
}

export async function listPhotos(max = 200): Promise<PhotoRecord[]> {
  const db = getFirebaseDb();
  const q = query(
    collection(db, col),
    orderBy("createdAt", "desc"),
    limitFn(max)
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => toPhoto(d.id, d.data()));
}

export async function listPhotosByPoint(pointId: string): Promise<PhotoRecord[]> {
  const db = getFirebaseDb();
  const q = query(collection(db, col), where("pointId", "==", pointId));
  const snap = await getDocs(q);
  const rows = snap.docs.map((d) => toPhoto(d.id, d.data()));
  return rows.sort((a, b) => {
    const ta = a.createdAt?.toMillis?.() ?? 0;
    const tb = b.createdAt?.toMillis?.() ?? 0;
    return tb - ta;
  });
}

export async function createPhotoDoc(input: {
  storagePath: string;
  downloadUrl?: string;
  actionId?: string | null;
  pointId?: string | null;
  historyId?: string | null;
  takenAt: Date | null;
  uploadedBy: string;
  caption: string;
  tags: string[];
  pairId?: string | null;
}): Promise<string> {
  const db = getFirebaseDb();
  const ref = await addDoc(collection(db, col), {
    ...input,
    takenAt: input.takenAt ? Timestamp.fromDate(input.takenAt) : null,
    createdAt: serverTimestamp(),
  });
  return ref.id;
}

export async function deletePhotoDoc(id: string): Promise<void> {
  await deleteDoc(doc(getFirebaseDb(), col, id));
}
