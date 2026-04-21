import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from "firebase/firestore";

import { getFirebaseDb } from "@/lib/firebase/client";
import type { ChecklistItem } from "@/types/models";

const col = "checklist_items";

function toItem(id: string, data: Record<string, unknown>): ChecklistItem {
  return { id, ...(data as Omit<ChecklistItem, "id">) };
}

export async function listChecklistForDay(
  userId: string,
  dateKey: string
): Promise<ChecklistItem[]> {
  const db = getFirebaseDb();
  const q = query(collection(db, col), where("userId", "==", userId));
  const snap = await getDocs(q);
  const items = snap.docs
    .map((d) => toItem(d.id, d.data()))
    .filter((x) => x.dateKey === dateKey);
  return items.sort((a, b) => a.order - b.order);
}

export async function addChecklistItem(input: {
  userId: string;
  dateKey: string;
  label: string;
  order: number;
}): Promise<string> {
  const db = getFirebaseDb();
  const ref = await addDoc(collection(db, col), {
    ...input,
    done: false,
    createdAt: serverTimestamp(),
  });
  return ref.id;
}

export async function toggleChecklistItem(id: string, done: boolean): Promise<void> {
  await updateDoc(doc(getFirebaseDb(), col, id), { done });
}

export async function deleteChecklistItem(id: string): Promise<void> {
  await deleteDoc(doc(getFirebaseDb(), col, id));
}
