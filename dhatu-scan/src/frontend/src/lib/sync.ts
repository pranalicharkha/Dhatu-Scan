import { db } from './db';
import { API_BASE } from './api';

/**
 * Sync offline assessments to the cloud.
 */
export async function syncAssessmentsToCloud() {
  const pending = await db.assessments.where('syncStatus').equals('pending').toArray();
  const user = await db.currentUser.get(1);
  if (!user) return;

  for (const assessment of pending) {
    try {
      const response = await fetch(`${API_BASE}/assessment`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user.auth_token}`
        },
        body: JSON.stringify(assessment)
      });

      if (response.ok) {
        await db.assessments.update(assessment.id, { syncStatus: 'synced' });
      }
    } catch (error) {
      console.warn('Network offline or error during sync; will retry later.', error);
    }
  }
}

/**
 * Fetch child profile details from cloud and cache locally (the "10% ask-once" data).
 */
export async function syncChildProfilesFromCloud() {
  try {
    const user = await db.currentUser.get(1);
    if (!user) return;

    const response = await fetch(`${API_BASE}/children`, {
      headers: { 'Authorization': `Bearer ${user.auth_token}` }
    });

    if (response.ok) {
      const children = await response.json();
      await db.transaction('rw', db.childProfiles, async () => {
        await db.childProfiles.clear();
        for (const c of children) {
          await db.childProfiles.put({
            childId: c.childId,
            parentEmail: user.email,
            childName: c.childName,
            dob: c.dob,
            gender: c.gender
          });
        }
      });
    }
  } catch (error) {
    console.warn('Unable to fetch child records right now; using local cache.', error);
  }
}

/**
 * Save growth entry result to local Dexie DB (the last 5 entries for quick charts).
 */
export async function saveGrowthHistoryLocally(entry: {
  id: string;
  childId: string;
  zScore: number;
  height: number;
  weight: number;
  date: string;
}) {
  // Keep only the last 5 locally
  const existing = await db.growthHistory.where('childId').equals(entry.childId).toArray();
  if (existing.length >= 5) {
    const oldest = existing.sort((a, b) => a.date.localeCompare(b.date))[0];
    await db.growthHistory.delete(oldest.id);
  }
  await db.growthHistory.put(entry);
}

/**
 * Save an assessment draft to Dexie first (offline-first). Will be synced later.
 */
export async function saveAssessmentDraft(draft: {
  id: string;
  childId: string;
  waterSource: string;
  dietaryRiskPreview: string;
  lifestyleDetails: string;
}) {
  await db.assessments.put({ ...draft, syncStatus: 'pending' });
}

/**
 * Wipe sensitive raw image scan data from Dexie immediately after ML processing.
 * This is the zero-retention privacy guarantee.
 */
export async function clearSensitiveScans() {
  await db.scans.clear();
  console.log('[Privacy] Raw scan images wiped from local storage.');
}

/**
 * Clear all local Dexie data (user-triggered "Clear Data" action).
 * Does NOT affect cloud data.
 */
export async function clearLocalCache() {
  await db.currentUser.clear();
  await db.childProfiles.clear();
  await db.scans.clear();
  await db.assessments.clear();
  await db.growthHistory.clear();
  console.log('[Privacy] All local cache cleared.');
}
