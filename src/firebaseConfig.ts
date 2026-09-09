import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { 
  getFirestore, 
  Firestore, 
  doc, 
  setDoc, 
  getDoc,
  onSnapshot, 
  collection, 
  addDoc,
  updateDoc,
  deleteDoc,
  getDocs,
  query,
  where,
  Unsubscribe 
} from 'firebase/firestore';
import { getAuth, Auth } from 'firebase/auth';
import firebaseConfigJson from '../firebase-applet-config.json';

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null): never {
  const currentAuth = auth;
  const currentUser = currentAuth?.currentUser;
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: currentUser?.uid || null,
      email: currentUser?.email || null,
      emailVerified: currentUser?.emailVerified || null,
      isAnonymous: currentUser?.isAnonymous || null,
    },
    operationType,
    path
  };
  console.error('[GrowthLab Firestore Error]', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Load Firebase configuration
const firebaseConfig = {
  apiKey: firebaseConfigJson.apiKey || import.meta.env.VITE_FIREBASE_API_KEY || '',
  authDomain: firebaseConfigJson.authDomain || import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || '',
  projectId: firebaseConfigJson.projectId || import.meta.env.VITE_FIREBASE_PROJECT_ID || '',
  storageBucket: firebaseConfigJson.storageBucket || import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || '',
  messagingSenderId: firebaseConfigJson.messagingSenderId || import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '',
  appId: firebaseConfigJson.appId || import.meta.env.VITE_FIREBASE_APP_ID || '',
};

const databaseId = (firebaseConfigJson as any).firestoreDatabaseId || import.meta.env.VITE_FIREBASE_DATABASE_ID || '';

export const isFirebaseConfigured = Boolean(firebaseConfig.apiKey && firebaseConfig.projectId);

let appInstance: FirebaseApp;
if (!getApps().length) {
  appInstance = initializeApp(firebaseConfig);
} else {
  appInstance = getApp();
}

let dbInstance: Firestore;
if (databaseId && databaseId !== '(default)') {
  dbInstance = getFirestore(appInstance, databaseId);
} else {
  dbInstance = getFirestore(appInstance);
}

export const app = appInstance;
export const db = dbInstance;
export const auth = getAuth(appInstance);

/**
 * 1. บันทึก/อัปเดตโปรไฟล์คนไข้และแผนการบ้าน: setDoc(doc(db, "patients", hn), patientData)
 */
export async function savePatientToFirestore(patientData: any): Promise<void> {
  const hn = patientData.hn || patientData.id;
  if (!hn) throw new Error('HN is required to save patient to Firestore');

  const cleanData = {
    ...patientData,
    hn: String(hn).trim(),
    updatedAt: new Date().toISOString()
  };

  try {
    const docRef = doc(db, 'patients', cleanData.hn);
    await setDoc(docRef, cleanData, { merge: true });
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, `patients/${cleanData.hn}`);
  }

  // Dual-sync to legacy 'members' collection for compatibility
  try {
    const memberId = patientData.id || cleanData.hn;
    const memberRef = doc(db, 'members', memberId);
    await setDoc(memberRef, cleanData, { merge: true });
  } catch (err) {
    console.warn('[firebaseConfig] Member fallback sync warning:', err);
  }
}

/**
 * 2. ดึงข้อมูลคนไข้แบบ Real-time: onSnapshot(doc(db, "patients", hn), (doc) => ...)
 */
export function subscribePatientByHN(
  hn: string, 
  onData: (patientData: any) => void,
  onError?: (error: any) => void
): Unsubscribe {
  const cleanHn = String(hn).trim();
  const docRef = doc(db, 'patients', cleanHn);

  return onSnapshot(
    docRef, 
    (docSnap) => {
      if (docSnap.exists()) {
        onData(docSnap.data());
      } else {
        // Fallback check in 'members' collection
        getDoc(doc(db, 'members', cleanHn)).then(memSnap => {
          if (memSnap.exists()) {
            onData(memSnap.data());
          } else {
            onData(null);
          }
        }).catch(() => onData(null));
      }
    },
    (err) => {
      console.error('[firebaseConfig] subscribePatientByHN error:', err);
      if (onError) onError(err);
      else handleFirestoreError(err, OperationType.GET, `patients/${cleanHn}`);
    }
  );
}

/**
 * 3. บันทึกประวัติการส่งการบ้านรายวัน: addDoc(collection(db, "daily_logs"), logData)
 */
export async function addDailyLog(logData: any): Promise<string> {
  const logsCol = collection(db, 'daily_logs');
  const payload = {
    ...logData,
    createdAt: new Date().toISOString()
  };

  try {
    const docRef = await addDoc(logsCol, payload);
    return docRef.id;
  } catch (err) {
    handleFirestoreError(err, OperationType.CREATE, 'daily_logs');
  }
}

/**
 * Single document fetch by HN
 */
export async function getPatientByHN(hn: string): Promise<any | null> {
  const cleanHn = String(hn).trim();
  if (!cleanHn) return null;

  try {
    const docRef = doc(db, 'patients', cleanHn);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return docSnap.data();
    }
    // Fallback lookup in members
    const memSnap = await getDoc(doc(db, 'members', cleanHn));
    if (memSnap.exists()) {
      return memSnap.data();
    }
  } catch (err) {
    console.warn('[firebaseConfig] getPatientByHN warning:', err);
  }
  return null;
}

/**
 * Subscribe to all patients collection for real-time list
 */
export function subscribeAllPatients(
  onData: (patients: any[]) => void,
  onError?: (err: any) => void
): Unsubscribe {
  const colRef = collection(db, 'patients');
  return onSnapshot(
    colRef,
    (snapshot) => {
      if (!snapshot.empty) {
        const list = snapshot.docs.map(d => d.data());
        onData(list);
      }
    },
    (err) => {
      console.warn('[firebaseConfig] subscribeAllPatients warning:', err);
      if (onError) onError(err);
    }
  );
}
