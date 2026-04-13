import Dexie, { type Table } from 'dexie';

export interface CurrentUser {
  id: number; // Always 1
  email: string;
  auth_token: string;
  full_name: string;
}

export interface ChildProfile {
  childId: string;
  parentEmail: string;
  childName: string;
  dob: string;
  gender: string;
}

export interface Scan {
  id: string; // uuid
  capturedImage: Blob;
  faceBlurStatus: string;
  bodyLandmarks: number;
}

export interface AssessmentDraft {
  id: string; // uuid
  childId: string;
  waterSource: string;
  dietaryRiskPreview: string;
  lifestyleDetails: string;
  syncStatus: 'pending' | 'synced';
}

export interface GrowthHistory {
  id: string;
  childId: string;
  zScore: number;
  height: number;
  weight: number;
  date: string;
}

export interface Streak {
  id: string;
  parentEmail: string;
  streakCount: number;
  badges: string[];
}

export class DhatuScanDB extends Dexie {
  currentUser!: Table<CurrentUser, number>;
  childProfiles!: Table<ChildProfile, string>;
  scans!: Table<Scan, string>;
  assessments!: Table<AssessmentDraft, string>;
  growthHistory!: Table<GrowthHistory, string>;
  streaks!: Table<Streak, string>;

  constructor() {
    super('DhatuScanDB');
    this.version(1).stores({
      currentUser: 'id, email',
      childProfiles: 'childId, parentEmail, childName',
      scans: 'id',
      assessments: 'id, childId, syncStatus',
      growthHistory: 'id, childId, date',
      streaks: 'id, parentEmail'
    });
  }
}

export const db = new DhatuScanDB();
