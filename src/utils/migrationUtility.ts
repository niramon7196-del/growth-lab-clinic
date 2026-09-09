import { Patient } from '../types';
import { db, isFirebaseConfigured } from '../services/firebase';
import { doc, setDoc, getDoc } from 'firebase/firestore';

const DEMO_HN_PREFIXES = ['DEMO-', 'TEST-'];

/**
 * Filter real patient records from demonstration seed fixtures
 */
export function separateRealAndDemoPatients(patients: Patient[]): {
  realPatients: Patient[];
  demoPatients: Patient[];
} {
  const realPatients: Patient[] = [];
  const demoPatients: Patient[] = [];

  patients.forEach(patient => {
    const isDemoHn = DEMO_HN_PREFIXES.some(prefix => (patient.hn || '').toUpperCase().startsWith(prefix));
    const isDemoId = (patient.id || '').toLowerCase().includes('demo');
    const isDemoName = (patient.firstName || '').includes('น้องภูมิ') || (patient.firstName || '').includes('น้องพิมพ์');

    if (isDemoHn || isDemoId || isDemoName) {
      demoPatients.push({ ...patient });
    } else {
      realPatients.push({ ...patient });
    }
  });

  return { realPatients, demoPatients };
}

/**
 * Safe Migration Utility to push local real records to Firestore
 */
export async function migrateLocalPatientsToFirestore(
  localPatients: Patient[],
  options: { includeDemoData?: boolean } = {}
): Promise<{
  successCount: number;
  skippedCount: number;
  errorCount: number;
  errors: string[];
}> {
  if (!isFirebaseConfigured || !db) {
    throw new Error('Firebase Firestore is not configured or offline. Cannot run migration.');
  }

  const { realPatients, demoPatients } = separateRealAndDemoPatients(localPatients);
  const targets = options.includeDemoData ? [...realPatients, ...demoPatients] : realPatients;

  let successCount = 0;
  let skippedCount = 0;
  let errorCount = 0;
  const errors: string[] = [];

  for (const patient of targets) {
    try {
      const docRef = doc(db, 'members', patient.id);
      const existing = await getDoc(docRef);

      if (existing.exists()) {
        skippedCount++;
      } else {
        await setDoc(docRef, {
          ...patient,
          updatedAt: new Date().toISOString()
        });
        successCount++;
      }
    } catch (err: any) {
      errorCount++;
      errors.push(`Error migrating ${patient.id} (${patient.hn}): ${err?.message || String(err)}`);
    }
  }

  return {
    successCount,
    skippedCount,
    errorCount,
    errors
  };
}
