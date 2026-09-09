import { Patient } from '../types';
import { isFirebaseConfigured, db } from './firebase';
import { doc, setDoc } from 'firebase/firestore';

export const REVOKED_QRS_KEY = 'growth_lab_revoked_qrs';
export const REVOKED_HNS_KEY = 'growth_lab_revoked_hns';

/**
 * Get all revoked QR tokens and HNs from local storage
 */
export function getRevokedQRsAndHNs(): { qrs: string[]; hns: string[] } {
  if (typeof window === 'undefined') return { qrs: [], hns: [] };
  try {
    const rawQrs = localStorage.getItem(REVOKED_QRS_KEY);
    const rawHns = localStorage.getItem(REVOKED_HNS_KEY);
    const qrs: string[] = rawQrs ? JSON.parse(rawQrs) : [];
    const hns: string[] = rawHns ? JSON.parse(rawHns) : [];
    return { qrs, hns };
  } catch (err) {
    console.warn('[qrRevokeService] Error reading revoked QRs/HNs:', err);
    return { qrs: [], hns: [] };
  }
}

/**
 * Check if a given query (HN, QR Token, patient ID, deep link token) is revoked or invalid
 */
export function checkQRRevokedStatus(
  rawQuery?: string | null,
  activePatients?: Patient[] | null
): { isRevoked: boolean; isInvalidOrNotFound: boolean; reason?: string } {
  if (!rawQuery) return { isRevoked: false, isInvalidOrNotFound: false };

  const queryClean = rawQuery.trim();
  if (!queryClean || queryClean.toUpperCase().includes('DEMO-')) {
    return { isRevoked: false, isInvalidOrNotFound: false };
  }

  const queryLower = queryClean.toLowerCase();
  const querySanitized = queryLower.replace(/[^a-z0-9]/g, '');

  const { qrs, hns } = getRevokedQRsAndHNs();

  // 1. Direct match against known revoked list
  const isDirectRevoked = qrs.some(q => q.toLowerCase() === queryLower || q.toLowerCase().replace(/[^a-z0-9]/g, '') === querySanitized) ||
                          hns.some(h => h.toLowerCase() === queryLower || h.toLowerCase().replace(/[^a-z0-9]/g, '') === querySanitized);

  if (isDirectRevoked) {
    return {
      isRevoked: true,
      isInvalidOrNotFound: true,
      reason: 'QR Code นี้ถูกยกเลิกหรือลบออกจากระบบแล้ว'
    };
  }

  // 2. If activePatients list is provided and non-empty, verify if patient exists in system
  if (activePatients && Array.isArray(activePatients) && activePatients.length > 0) {
    const exists = activePatients.some(p => {
      if (!p) return false;
      const pHn = (p.hn || '').trim().toLowerCase();
      const pId = (p.id || '').trim().toLowerCase();
      const pQrToken = (p.qrToken || '').trim().toLowerCase();

      return (
        pHn === queryLower ||
        pId === queryLower ||
        pQrToken === queryLower ||
        (pHn && pHn.replace(/[^a-z0-9]/g, '') === querySanitized) ||
        (pQrToken && pQrToken.replace(/[^a-z0-9]/g, '') === querySanitized)
      );
    });

    if (!exists) {
      return {
        isRevoked: true,
        isInvalidOrNotFound: true,
        reason: 'QR Code นี้ถูกยกเลิกหรือไม่มีรายชื่ออยู่ในระบบแล้ว'
      };
    }
  }

  return { isRevoked: false, isInvalidOrNotFound: false };
}

/**
 * Register a QR token / HN as revoked permanently
 */
export function registerRevokedQR(tokenOrHn: string): void {
  if (!tokenOrHn || typeof window === 'undefined') return;
  const clean = tokenOrHn.trim();
  if (!clean) return;

  try {
    const { qrs, hns } = getRevokedQRsAndHNs();
    const isHn = clean.toUpperCase().startsWith('HN-') || clean.toUpperCase().startsWith('HN');
    const targetQrs = new Set(qrs);
    const targetHns = new Set(hns);

    targetQrs.add(clean.toLowerCase());
    targetQrs.add(clean.toLowerCase().replace(/[^a-z0-9]/g, ''));
    if (isHn) {
      targetHns.add(clean.toLowerCase());
      targetHns.add(clean.toLowerCase().replace(/[^a-z0-9]/g, ''));
    }

    localStorage.setItem(REVOKED_QRS_KEY, JSON.stringify(Array.from(targetQrs)));
    localStorage.setItem(REVOKED_HNS_KEY, JSON.stringify(Array.from(targetHns)));

    // Sync to Firestore revoked_qrs if Firebase is active
    if (isFirebaseConfigured && db) {
      const docId = clean.toLowerCase().replace(/[^a-z0-9]/g, '_');
      setDoc(doc(db, 'revoked_qrs', docId), {
        tokenOrHn: clean,
        revokedAt: new Date().toISOString()
      }).catch(e => console.warn('[qrRevokeService] Firestore setDoc revoked_qrs error:', e));
    }
  } catch (err) {
    console.warn('[qrRevokeService] Error registering revoked QR:', err);
  }
}

/**
 * Comprehensive Cascade Delete & Cache/Session Purge for a Patient
 */
export function cascadeDeletePatientAndRevokeQR(
  patient: { id: string; hn?: string; qrToken?: string } | string,
  hnArg?: string
): void {
  let patientId = '';
  let hn = '';
  let qrToken = '';

  if (typeof patient === 'string') {
    patientId = patient;
    hn = hnArg || '';
  } else {
    patientId = patient.id;
    hn = patient.hn || hnArg || '';
    qrToken = patient.qrToken || '';
  }

  console.log(`[qrRevokeService] Performing cascade delete & QR revoke for ID: ${patientId}, HN: ${hn}`);

  // 1. Mark tokens & HN as revoked
  if (patientId) registerRevokedQR(patientId);
  if (hn) registerRevokedQR(hn);
  if (qrToken) registerRevokedQR(qrToken);

  if (typeof window === 'undefined') return;

  try {
    const targetHnClean = hn ? hn.trim().toLowerCase() : '';
    const targetIdClean = patientId ? patientId.trim().toLowerCase() : '';

    // 2. Remove patient from all local patient arrays
    const masterKeys = ['growthlab_patients_master', 'growth_lab_patients', 'growthlab_patients', 'ef_patients'];
    masterKeys.forEach(key => {
      const raw = localStorage.getItem(key);
      if (raw) {
        try {
          const list: Patient[] = JSON.parse(raw);
          if (Array.isArray(list)) {
            const filtered = list.filter(p => {
              if (!p) return false;
              const pId = (p.id || '').toLowerCase();
              const pHn = (p.hn || '').toLowerCase();
              if (targetIdClean && pId === targetIdClean) return false;
              if (targetHnClean && pHn === targetHnClean) return false;
              if (targetHnClean && targetHnClean.replace(/[^a-z0-9]/g, '') === pHn.replace(/[^a-z0-9]/g, '')) return false;
              return true;
            });
            localStorage.setItem(key, JSON.stringify(filtered));
          }
        } catch (e) {}
      }
    });

    // 3. Clear accounts bound to this patient
    const savedAccountsStr = localStorage.getItem('growth_lab_patient_accounts');
    if (savedAccountsStr) {
      try {
        const accounts = JSON.parse(savedAccountsStr);
        if (Array.isArray(accounts)) {
          const updated = accounts.filter((a: any) => {
            const aId = (a.patientId || '').toLowerCase();
            const aUsername = (a.username || '').toLowerCase();
            if (targetIdClean && aId === targetIdClean) return false;
            if (targetHnClean && (aUsername === targetHnClean || aUsername.replace(/[^a-z0-9]/g, '') === targetHnClean.replace(/[^a-z0-9]/g, ''))) return false;
            return true;
          });
          localStorage.setItem('growth_lab_patient_accounts', JSON.stringify(updated));
        }
      } catch (e) {}
    }

    // 4. Clear check-in records and homework logs for this patient
    const checkinStr = localStorage.getItem('growth_lab_checkin_logs');
    if (checkinStr) {
      try {
        const logs = JSON.parse(checkinStr);
        if (Array.isArray(logs)) {
          const updated = logs.filter((l: any) => l.patientId !== patientId && l.hn !== hn);
          localStorage.setItem('growth_lab_checkin_logs', JSON.stringify(updated));
        }
      } catch (e) {}
    }

    // 5. Purge patient exercise key patterns from localStorage
    const keysToScan: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k) keysToScan.push(k);
    }

    keysToScan.forEach(k => {
      const kLower = k.toLowerCase();
      if (
        (targetIdClean && kLower.includes(targetIdClean)) ||
        (targetHnClean && kLower.includes(targetHnClean.replace(/[^a-z0-9]/g, '')))
      ) {
        localStorage.removeItem(k);
      }
    });

    // 6. Purge active patient sessions if this patient was currently logged in / selected
    const activeHn = localStorage.getItem('growthlab_active_patient_hn') ||
                     localStorage.getItem('growth_lab_active_patient_hn') ||
                     localStorage.getItem('current_user_hn');
    if (activeHn) {
      const activeClean = activeHn.trim().toLowerCase();
      if (activeClean === targetIdClean || activeClean === targetHnClean || activeClean.replace(/[^a-z0-9]/g, '') === targetHnClean.replace(/[^a-z0-9]/g, '')) {
        localStorage.removeItem('growthlab_active_patient_hn');
        localStorage.removeItem('growth_lab_active_patient_hn');
        localStorage.removeItem('current_user_hn');
      }
    }

    const regPatient = localStorage.getItem('growth_lab_registered_patient');
    if (regPatient) {
      try {
        const parsed = JSON.parse(regPatient);
        const regHn = (parsed?.hn || '').toLowerCase();
        if (regHn === targetHnClean || parsed?.id === patientId) {
          localStorage.removeItem('growth_lab_registered_patient');
        }
      } catch (e) {}
    }

    const selPatId = localStorage.getItem('growth_lab_selected_patient_id') || sessionStorage.getItem('growth_lab_selected_patient_id');
    if (selPatId && (selPatId === patientId || selPatId === hn)) {
      localStorage.removeItem('growth_lab_selected_patient_id');
      sessionStorage.removeItem('growth_lab_selected_patient_id');
    }

  } catch (err) {
    console.warn('[qrRevokeService] Error purging local storage for patient:', err);
  }
}
