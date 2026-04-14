import type { Assessment } from "@/types";
import {
  getDb,
  type LocalAssessment,
  STORES,
  requestToPromise,
  withStore,
} from "./db";
import { enqueueSync } from "./syncQueueRepository";

function getCurrentParentEmail(): string | null {
  const email = localStorage.getItem("dhatu_auth_email");
  return email?.trim() || null;
}

function toLocalAssessment(assessment: Assessment): LocalAssessment {
  const ownerEmail = getCurrentParentEmail();
  return {
    ...assessment,
    ownerEmail: ownerEmail ?? undefined,
    syncStatus: "pending",
    deleted: false,
  };
}

export async function saveAssessmentRecord(assessment: Assessment) {
  const localAssessment = toLocalAssessment(assessment);
  await withStore(STORES.assessments, "readwrite", (store) =>
    store.put(localAssessment),
  );
  await enqueueSync("assessment", assessment.id, "upsert", localAssessment);
}

export async function getAssessments(): Promise<LocalAssessment[]> {
  const ownerEmail = getCurrentParentEmail();
  if (!ownerEmail) return [];

  const assessments = await withStore<LocalAssessment[]>(
    STORES.assessments,
    "readonly",
    (store) => store.getAll(),
  );

  return assessments
    .filter(
      (assessment) =>
        !assessment.deleted && assessment.ownerEmail === ownerEmail,
    )
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

export async function getAssessmentsByChild(
  childId: string,
): Promise<LocalAssessment[]> {
  const ownerEmail = getCurrentParentEmail();
  if (!ownerEmail) return [];

  const db = await getDb();
  const tx = db.transaction(STORES.assessments, "readonly");
  const index = tx.objectStore(STORES.assessments).index("childId");
  const assessments = await requestToPromise<LocalAssessment[]>(
    index.getAll(childId),
  );

  return assessments
    .filter(
      (assessment) =>
        !assessment.deleted && assessment.ownerEmail === ownerEmail,
    )
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

export async function getAssessment(
  id: string,
): Promise<LocalAssessment | null> {
  const ownerEmail = getCurrentParentEmail();
  if (!ownerEmail) return null;

  const assessment = await withStore<LocalAssessment | undefined>(
    STORES.assessments,
    "readonly",
    (store) => store.get(id),
  );

  return assessment && !assessment.deleted && assessment.ownerEmail === ownerEmail
    ? assessment
    : null;
}

export async function deleteAssessmentRecord(id: string) {
  const assessment = await getAssessment(id);
  if (!assessment) return;

  const deletedAssessment: LocalAssessment = {
    ...assessment,
    deleted: true,
    syncStatus: "pending",
  };

  await withStore(STORES.assessments, "readwrite", (store) =>
    store.put(deletedAssessment),
  );
  await enqueueSync("assessment", id, "delete", deletedAssessment);
}

export async function markAssessmentSynced(id: string) {
  const assessment = await withStore<LocalAssessment | undefined>(
    STORES.assessments,
    "readonly",
    (store) => store.get(id),
  );

  if (!assessment) return;

  await withStore(STORES.assessments, "readwrite", (store) =>
    store.put({
      ...assessment,
      syncStatus: "synced",
      lastSyncedAt: new Date().toISOString(),
    } satisfies LocalAssessment),
  );
}

export async function getPendingAssessments(): Promise<LocalAssessment[]> {
  const ownerEmail = getCurrentParentEmail();
  if (!ownerEmail) return [];

  const db = await getDb();
  const tx = db.transaction(STORES.assessments, "readonly");
  const index = tx.objectStore(STORES.assessments).index("syncStatus");
  const assessments = await requestToPromise<LocalAssessment[]>(
    index.getAll("pending"),
  );

  return assessments.filter(
    (assessment) => !assessment.deleted && assessment.ownerEmail === ownerEmail,
  );
}
