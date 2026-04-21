import {
  addDoc,
  collection,
  deleteDoc,
  deleteField,
  doc,
  getDocs,
  query,
  Timestamp,
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
  timeLabel?: string;
  order: number;
}): Promise<string> {
  const db = getFirebaseDb();
  const { timeLabel, ...rest } = input;
  const ref = await addDoc(collection(db, col), {
    ...rest,
    ...(timeLabel?.trim() ? { timeLabel: timeLabel.trim() } : {}),
    done: false,
    /** Timestamp do cliente: evita sentinel de serverTimestamp() nas security rules. */
    createdAt: Timestamp.now(),
  });
  return ref.id;
}

export async function toggleChecklistItem(id: string, done: boolean): Promise<void> {
  await updateDoc(doc(getFirebaseDb(), col, id), { done });
}

export async function updateChecklistItem(
  id: string,
  patch: {
    label?: string;
    /** `null` ou string vazia remove o campo */
    timeLabel?: string | null;
    order?: number;
  }
): Promise<void> {
  const ref = doc(getFirebaseDb(), col, id);
  const data: Record<string, unknown> = {};
  if (patch.label !== undefined) data.label = patch.label;
  if (patch.timeLabel !== undefined) {
    if (patch.timeLabel === null || patch.timeLabel === "") {
      data.timeLabel = deleteField();
    } else {
      data.timeLabel = patch.timeLabel.trim();
    }
  }
  if (patch.order !== undefined) data.order = patch.order;
  if (Object.keys(data).length === 0) return;
  await updateDoc(ref, data);
}

export async function deleteChecklistItem(id: string): Promise<void> {
  await deleteDoc(doc(getFirebaseDb(), col, id));
}
