import { getSyncQueue, removeSyncQueueItem, markSyncQueueItemFailed } from "./syncQueueRepository";
import { markChildSynced } from "./childRepository";
import { markAssessmentSynced } from "./assessmentRepository";
import { markGamificationSynced } from "./gamificationRepository";
import { getCurrentUserToken } from "./userRepository";
import type { SyncQueueItem, SyncEntityType } from "./db";
import type { LocalChildProfile, LocalAssessment, LocalGamificationState } from "./db";

const API_BASE = "http://127.0.0.1:8000";

let isSyncing = false;

export async function processSyncQueue(): Promise<{
  success: number;
  failed: number;
  skipped: number;
}> {
  if (isSyncing) {
    return { success: 0, failed: 0, skipped: 0 };
  }

  const token = await getCurrentUserToken();
  if (!token) {
    console.log("[Sync] No auth token, skipping sync");
    return { success: 0, failed: 0, skipped: 0 };
  }

  isSyncing = true;
  const queue = await getSyncQueue();
  
  let success = 0;
  let failed = 0;
  let skipped = 0;

  for (const item of queue) {
    try {
      const result = await syncItem(item, token);
      if (result) {
        await removeSyncQueueItem(item.id);
        await markEntitySynced(item.entityType, item.entityId);
        success++;
      } else {
        await markSyncQueueItemFailed(item.id, "Sync failed");
        failed++;
      }
    } catch (error) {
      console.error(`[Sync] Error syncing ${item.entityType}:${item.entityId}`, error);
      await markSyncQueueItemFailed(item.id, error);
      failed++;
    }
  }

  isSyncing = false;
  console.log(`[Sync] Completed: ${success} success, ${failed} failed, ${skipped} skipped`);
  return { success, failed, skipped };
}

async function syncItem(item: SyncQueueItem, token: string): Promise<boolean> {
  switch (item.entityType) {
    case "child":
      return syncChild(item.payload as LocalChildProfile, item.operation, token);
    case "assessment":
      return syncAssessment(item.payload as LocalAssessment, item.operation, token);
    case "gamification":
      return syncGamification(item.payload as LocalGamificationState, item.operation, token);
    default:
      return false;
  }
}

async function syncChild(
  child: LocalChildProfile,
  operation: "upsert" | "delete",
  token: string
): Promise<boolean> {
  try {
    if (operation === "delete") {
      const response = await fetch(`${API_BASE}/children/${child.id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      return response.ok || response.status === 404;
    }

    // For upsert, try PUT if child exists, otherwise POST
    const putResponse = await fetch(`${API_BASE}/children/${child.id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        childName: child.name,
        dob: child.dateOfBirth,
        gender: child.gender,
      }),
    });

    if (putResponse.ok) return true;

    // If PUT fails (child doesn't exist), try POST
    if (putResponse.status === 404) {
      const postResponse = await fetch(`${API_BASE}/children`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          childName: child.name,
          dob: child.dateOfBirth,
          gender: child.gender,
        }),
      });
      return postResponse.ok;
    }

    return false;
  } catch (error) {
    console.error("[Sync] Failed to sync child:", error);
    return false;
  }
}

async function syncAssessment(
  assessment: LocalAssessment,
  operation: "upsert" | "delete",
  token: string
): Promise<boolean> {
  try {
    if (operation === "delete") {
      // Note: Backend might not have a delete endpoint for assessments
      return true; // Assume success for deletes
    }

    const response = await fetch(`${API_BASE}/assessment`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        childId: assessment.childId,
        anthropometry: {
          ageMonths: assessment.age,
          heightCm: assessment.height,
          weightKg: assessment.weight,
        },
        dietary: {
          dietDiversity: assessment.dietDiversity,
          waterSource: assessment.waterSource,
          recentDiarrhea: assessment.recentDiarrhea > 0,
        },
        capture: {
          bodyLandmarksDetected: assessment.bodyLandmarksDetected ?? 0,
          faceLandmarksDetected: assessment.faceLandmarksDetected ?? 0,
          faceMasked: assessment.faceMasked ?? false,
          modelConfidence: assessment.cameraConfidence ?? 0,
        },
      }),
    });

    return response.ok;
  } catch (error) {
    console.error("[Sync] Failed to sync assessment:", error);
    return false;
  }
}

async function syncGamification(
  gamification: LocalGamificationState,
  operation: "upsert" | "delete",
  token: string
): Promise<boolean> {
  // Gamification is typically calculated server-side
  // We just need to ensure assessments are synced
  return true;
}

async function markEntitySynced(entityType: SyncEntityType, entityId: string) {
  switch (entityType) {
    case "child":
      await markChildSynced(entityId);
      break;
    case "assessment":
      await markAssessmentSynced(entityId);
      break;
    case "gamification":
      await markGamificationSynced();
      break;
  }
}

// Auto-sync interval (every 30 seconds when online)
let syncInterval: number | null = null;

export function startAutoSync(intervalMs = 30000) {
  if (syncInterval) return;
  
  syncInterval = window.setInterval(() => {
    if (navigator.onLine) {
      processSyncQueue().catch(console.error);
    }
  }, intervalMs);
  
  console.log("[Sync] Auto-sync started");
}

export function stopAutoSync() {
  if (syncInterval) {
    clearInterval(syncInterval);
    syncInterval = null;
    console.log("[Sync] Auto-sync stopped");
  }
}

// Trigger sync immediately
export async function triggerSync(): Promise<{ success: number; failed: number; skipped: number }> {
  return processSyncQueue();
}
