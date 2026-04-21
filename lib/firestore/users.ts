import {
  collection,
  doc,
  getDoc,
  getDocs,
  serverTimestamp,
  setDoc,
  updateDoc,
} from "firebase/firestore";

import { getFirebaseDb } from "@/lib/firebase/client";
import type { UserProfile, UserRole } from "@/types/models";

const usersCol = "users";

export async function listUsers(): Promise<UserProfile[]> {
  const snap = await getDocs(collection(getFirebaseDb(), usersCol));
  return snap.docs.map((d) => ({ uid: d.id, ...d.data() }) as UserProfile);
}

export async function getUserProfile(uid: string): Promise<UserProfile | null> {
  const ref = doc(getFirebaseDb(), usersCol, uid);
  const snap = await getDoc(ref);
  if (!snap.exists()) return null;
  return { uid, ...snap.data() } as UserProfile;
}

export async function ensureUserProfile(params: {
  uid: string;
  email: string | null;
  displayName: string | null;
}): Promise<UserProfile> {
  const db = getFirebaseDb();
  const ref = doc(db, usersCol, params.uid);
  const snap = await getDoc(ref);
  if (!snap.exists()) {
    const initial = {
      uid: params.uid,
      email: params.email ?? "",
      displayName:
        params.displayName ?? params.email?.split("@")[0] ?? "Usuário",
      role: "editor" as UserRole,
      createdAt: serverTimestamp(),
    };
    await setDoc(ref, initial);
    const again = await getDoc(ref);
    return { uid: params.uid, ...again.data() } as UserProfile;
  }
  return { uid: params.uid, ...snap.data() } as UserProfile;
}

export async function updateUserRole(uid: string, role: UserRole): Promise<void> {
  const ref = doc(getFirebaseDb(), usersCol, uid);
  await updateDoc(ref, { role, updatedAt: serverTimestamp() });
}
