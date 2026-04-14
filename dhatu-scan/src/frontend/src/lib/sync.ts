/**
 * Sync layer for Dhatu-Scan.
 * Uses the single `dhatu-scan-db` IndexedDB via data repositories.
 * Auth token is read from localStorage.
 */

import { API_BASE } from './api';
import {
  getPendingAssessments,
  markAssessmentSynced,
} from '@/data/assessmentRepository';
import {
  getPendingChildren,
  markChildSynced,
} from '@/data/childRepository';
import { clearDhatuScanDb } from '@/data/db';

function getToken(): string | null {
  return localStorage.getItem('dhatu_auth_token');
}

/**
 * Sync offline assessments to the cloud.
 */
export async function syncAssessmentsToCloud() {
  const token = getToken();
  if (!token) return;

  const pending = await getPendingAssessments();

  for (const assessment of pending) {
    try {
      const response = await fetch(`${API_BASE}/assessment`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(assessment)
      });

      if (response.ok) {
        await markAssessmentSynced(assessment.id);
      }
    } catch (error) {
      console.warn('[Sync] Network offline or error during assessment sync; will retry later.', error);
    }
  }
}

/**
 * Sync pending child profiles to the cloud.
 */
export async function syncChildrenToCloud() {
  const token = getToken();
  if (!token) return;

  const pending = await getPendingChildren();

  for (const child of pending) {
    try {
      const response = await fetch(`${API_BASE}/children`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          childName: child.name,
          dob: child.dateOfBirth ?? '',
          gender: child.gender,
        })
      });

      if (response.ok) {
        await markChildSynced(child.id);
      }
    } catch (error) {
      console.warn('[Sync] Network offline or error during child sync; will retry later.', error);
    }
  }
}

/**
 * Run all pending syncs.
 */
export async function syncAll() {
  await syncChildrenToCloud();
  await syncAssessmentsToCloud();
  console.log('[Sync] Sync cycle complete.');
}

/**
 * Clear all local data (user-triggered "Clear Data" action).
 * Does NOT affect cloud data.
 */
export async function clearLocalCache() {
  await clearDhatuScanDb();
  localStorage.removeItem('dhatu_auth_token');
  localStorage.removeItem('dhatu_auth_email');
  localStorage.removeItem('dhatu_auth_name');
  localStorage.removeItem('dhatu_indexeddb_initialized');
  localStorage.removeItem('dhatu_auth');
  console.log('[Privacy] All local cache cleared.');
}
