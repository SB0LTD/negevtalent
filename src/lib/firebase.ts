import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getFunctions } from "firebase/functions";

// Under Vite (dev/build/preview) `import.meta.env` is ALWAYS an object, so the
// real VITE_FIREBASE_* values are read exactly as before — a missing var still
// surfaces as `undefined`. The fallback branch is taken ONLY when this module
// is evaluated completely outside Vite (Playwright's standalone esbuild, which
// does not define `import.meta.env`) while loading a pure helper that happens
// to live in a module importing this one. In that harness-only case we supply
// inert placeholder config so the top-level `getAuth(app)` constructs without
// throwing on an undefined apiKey; no firebase service method is ever called
// there (the DEV+flag guards short-circuit before any network access), so the
// placeholders are never used to reach a backend.
const env =
  import.meta.env ??
  ({
    VITE_FIREBASE_API_KEY: "test-mode-placeholder",
    VITE_FIREBASE_AUTH_DOMAIN: "test.local",
    VITE_FIREBASE_PROJECT_ID: "test",
    VITE_FIREBASE_STORAGE_BUCKET: "test.appspot.com",
    VITE_FIREBASE_MESSAGING_SENDER_ID: "0",
    VITE_FIREBASE_APP_ID: "test",
  } as unknown as ImportMetaEnv);

const firebaseConfig = {
  apiKey: env.VITE_FIREBASE_API_KEY,
  authDomain: env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: env.VITE_FIREBASE_APP_ID,
};

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const functions = getFunctions(app, "europe-west1");
