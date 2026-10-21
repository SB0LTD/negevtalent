// Firestore data access + typed models for the `applications` collection.
// DEV + VITE_ADMIN_TEST_MODE override: data-access entry points serve
// in-memory fixtures and issue NO Firestore query/listener.

import {
  collection,
  getDoc,
  getDocs,
  doc,
  limit,
  onSnapshot,
  orderBy,
  query,
  startAfter,
  where,
} from "firebase/firestore";
import type {
  DocumentData,
  QueryConstraint,
  QueryDocumentSnapshot,
} from "firebase/firestore";
import { db } from "@/lib/firebase";

export type ApplicationStatus =
  | "new"
  | "contacted"
  | "interview"
  | "accepted"
  | "rejected";

export interface Application {
  id: string;
  name: string;
  phone: string;
  email: string;
  city: string;
  createdAt: string;
  status: ApplicationStatus;
  // Optional: the public HTTP `apply` path writes a shape without these.
  idNum?: string;
  birthdate?: string;
  gender?: string;
  age?: string;
  background?: string;
  motivation?: string;
}

// Hebrew status labels.
export const STATUS_LABEL_HE: Record<ApplicationStatus, string> = {
  new: "חדש",
  contacted: "נוצר קשר",
  interview: "ראיון",
  accepted: "התקבל",
  rejected: "נדחה",
};

// Display/workflow ordering for status values.
export const STATUS_ORDER: ApplicationStatus[] = [
  "new",
  "contacted",
  "interview",
  "accepted",
  "rejected",
];

export function genderLabelHe(code?: string): string {
  switch (code) {
    case "7":
      return "זכר";
    case "0":
      return "נקבה";
    case "1":
      return "אחר";
    default:
      return "לא צוין";
  }
}

export interface HistoryEntry {
  id: string;
  actorUid: string;
  actorEmail: string;
  field: string;
  from: string;
  to: string;
  // ISO-8601 string once the server timestamp resolves; null while pending.
  at: string | null;
}

const PAGE_SIZE = 25;

// --- Test-mode override plumbing -------------------------------------------

function isTestMode(): boolean {
  // `import.meta.env` is always defined under Vite; guard the non-Vite case
  // (Playwright esbuild) so importing a pure helper from this module is safe.
  const env = import.meta.env ?? {};
  return env.DEV && env.VITE_ADMIN_TEST_MODE === "1";
}

// Shared in-memory fixtures (exported so tests/other modules reuse them).
export const FIXTURE_APPLICATIONS: Application[] = [
  {
    id: "fixture-1",
    name: "דנה כהן",
    phone: "050-1111111",
    email: "dana@example.com",
    city: "באר שבע",
    createdAt: "2026-10-18T09:30:00.000Z",
    status: "new",
    idNum: "123456789",
    birthdate: "2000-04-12",
    gender: "0",
    background: "רקע בפיתוח",
    motivation: "",
  },
  {
    id: "fixture-2",
    name: "יוסי לוי",
    phone: "050-2222222",
    email: "yossi@example.com",
    city: "דימונה",
    createdAt: "2026-10-19T14:05:00.000Z",
    status: "contacted",
    idNum: "987654321",
    birthdate: "1998-11-03",
    gender: "7",
    background: "רקע בעיצוב",
    motivation: "",
  },
  {
    id: "fixture-3",
    name: "אבי מזרחי",
    phone: "050-3333333",
    email: "avi@example.com",
    city: "אופקים",
    createdAt: "2026-10-20T07:45:00.000Z",
    status: "interview",
    // Legacy HTTP-path shape: no idNum/birthdate/gender, has age.
    age: "27",
    background: "",
    motivation: "",
  },
];

export const FIXTURE_HISTORY: Record<string, HistoryEntry[]> = {
  "fixture-2": [
    {
      id: "h1",
      actorUid: "admin-uid",
      actorEmail: "asaf@sb0.tech",
      field: "status",
      from: "new",
      to: "contacted",
      at: "2026-10-19T15:00:00.000Z",
    },
  ],
};

// --- Data access entry points ----------------------------------------------

export interface FetchApplicationsOptions {
  status?: ApplicationStatus;
  lastDoc?: QueryDocumentSnapshot<DocumentData> | null;
}

export interface ApplicationsPage {
  applications: Application[];
  lastDoc: QueryDocumentSnapshot<DocumentData> | null;
  hasMore: boolean;
}

function mapApplicationDoc(
  snapshot: QueryDocumentSnapshot<DocumentData>,
): Application {
  const data = snapshot.data();
  return { id: snapshot.id, ...(data as Omit<Application, "id">) };
}

export async function fetchApplicationsPage(
  opts: FetchApplicationsOptions = {},
): Promise<ApplicationsPage> {
  if (isTestMode()) {
    const filtered = opts.status
      ? FIXTURE_APPLICATIONS.filter((a) => a.status === opts.status)
      : FIXTURE_APPLICATIONS;
    const sorted = [...filtered].sort((a, b) =>
      a.createdAt < b.createdAt ? 1 : a.createdAt > b.createdAt ? -1 : 0,
    );
    return { applications: sorted, lastDoc: null, hasMore: false };
  }

  const constraints: QueryConstraint[] = [orderBy("createdAt", "desc")];
  if (opts.status) {
    constraints.unshift(where("status", "==", opts.status));
  }
  if (opts.lastDoc) {
    constraints.push(startAfter(opts.lastDoc));
  }
  constraints.push(limit(PAGE_SIZE));

  const snapshot = await getDocs(
    query(collection(db, "applications"), ...constraints),
  );
  const applications = snapshot.docs.map(mapApplicationDoc);
  const lastDoc = snapshot.docs[snapshot.docs.length - 1] ?? null;
  return {
    applications,
    lastDoc,
    hasMore: snapshot.docs.length === PAGE_SIZE,
  };
}

export async function fetchApplication(
  id: string,
): Promise<Application | null> {
  if (isTestMode()) {
    return FIXTURE_APPLICATIONS.find((a) => a.id === id) ?? null;
  }

  const snapshot = await getDoc(doc(db, "applications", id));
  if (!snapshot.exists()) {
    return null;
  }
  return { id: snapshot.id, ...(snapshot.data() as Omit<Application, "id">) };
}

export function subscribeApplicationHistory(
  id: string,
  cb: (entries: HistoryEntry[]) => void,
): () => void {
  if (isTestMode()) {
    cb(FIXTURE_HISTORY[id] ?? []);
    return () => {};
  }

  const historyQuery = query(
    collection(db, "applications", id, "history"),
    orderBy("at"),
  );
  return onSnapshot(historyQuery, (snapshot) => {
    const entries: HistoryEntry[] = snapshot.docs.map((docSnap) => {
      const data = docSnap.data();
      return {
        id: docSnap.id,
        actorUid: data.actorUid ?? "",
        actorEmail: data.actorEmail ?? "",
        field: data.field ?? "",
        from: data.from ?? "",
        to: data.to ?? "",
        at: data.at?.toDate().toISOString() ?? null,
      };
    });
    cb(entries);
  });
}
