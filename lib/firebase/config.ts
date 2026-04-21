/** Public web config — prefer NEXT_PUBLIC_FIREBASE_* in .env.local; fallbacks match projeto AGIR. */
export const firebaseConfig = {
  apiKey:
    process.env.NEXT_PUBLIC_FIREBASE_API_KEY ?? "AIzaSyArruTNAq44tU-FfirftQNTe-G8AE95i1M",
  authDomain:
    process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN ?? "agir-3cbfc.firebaseapp.com",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ?? "agir-3cbfc",
  storageBucket:
    process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET ??
    "agir-3cbfc.firebasestorage.app",
  messagingSenderId:
    process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID ?? "688090737371",
  appId:
    process.env.NEXT_PUBLIC_FIREBASE_APP_ID ??
    "1:688090737371:web:c450dcf612c36feff47afe",
};

export function isFirebaseConfigured(): boolean {
  return Boolean(
    firebaseConfig.apiKey &&
      firebaseConfig.projectId &&
      firebaseConfig.appId
  );
}
