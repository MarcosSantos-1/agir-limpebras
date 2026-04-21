import { getDownloadURL, ref, uploadBytes } from "firebase/storage";

import { getFirebaseStorage } from "@/lib/firebase/client";

export type StorageFolder = "actions" | "evidencias" | "institucional";

export async function uploadFile(params: {
  folder: StorageFolder;
  /** e.g. actionId/photo.jpg */
  path: string;
  file: Blob;
  contentType?: string;
}): Promise<{ path: string; downloadUrl: string }> {
  const storage = getFirebaseStorage();
  const fullPath = `${params.folder}/${params.path}`;
  const storageRef = ref(storage, fullPath);
  await uploadBytes(storageRef, params.file, {
    contentType: params.contentType,
  });
  const downloadUrl = await getDownloadURL(storageRef);
  return { path: fullPath, downloadUrl };
}
