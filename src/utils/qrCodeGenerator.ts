import QRCode from 'qrcode';
import { Patient } from '../types';
import { formatPatientDisplay } from './patientUtils';
import { GROWTH_LAB_LOGO } from '../assets/logo';

/**
 * Builds the standard scannable deep link URL for a participant.
 * Guaranteed format: https://<public-host>/?token=...&member=...&qr=...
 */
/**
 * Safely encodes patient data payload into a JSON string with complete fallbacks.
 * Fallbacks:
 * - name: "ผู้รับการดูแลใหม่" if empty/null/undefined
 * - age, height, weight: "-" if missing/null/undefined/empty string/0
 */
export function encodePayloadForQR(patient?: Partial<Patient> | null): string {
  try {
    if (!patient) {
      return JSON.stringify({
        hn: 'NEW',
        name: 'ผู้รับการดูแลใหม่',
        firstName: 'ผู้รับการดูแลใหม่',
        lastName: '',
        nickname: 'ผู้รับการดูแลใหม่',
        age: '-',
        gender: 'male',
        height: '-',
        weight: '-',
        assignedExercises: [],
        assignments: []
      });
    }

    const info = formatPatientDisplay(patient as Patient);
    const rawFirstName = (patient.firstName || '').trim();
    const rawLastName = (patient.lastName || '').trim();
    const rawNickname = (patient.nickname || '').trim();

    // Fallback 2: age, height, weight -> "-" if missing/null/undefined/empty string
    const parseVal = (val: any) => {
      if (val === null || val === undefined || val === '' || Number.isNaN(val)) {
        return '-';
      }
      return val;
    };

    const age = parseVal(info.calculatedAge || patient.age);
    const height = parseVal(patient.height);
    const weight = parseVal(patient.weight);

    const payload = {
      hn: patient.hn || patient.id || 'NEW',
      name: info.fullFormattedWithAgeGroup,
      displayName: info.displayName,
      formattedNickname: info.formattedNickname,
      ageGroup: info.ageGroup,
      ageGroupTag: info.ageGroupTag,
      firstName: rawFirstName || info.displayName,
      lastName: rawLastName,
      nickname: rawNickname || 'ผู้รับการดูแลใหม่',
      age: age,
      gender: patient.gender || 'male',
      height: height,
      weight: weight,
      assignedExercises: (patient as any)?.assignedExercises || patient?.assignments || [],
      assignments: patient?.assignments || (patient as any)?.assignedExercises || []
    };

    return JSON.stringify(payload);
  } catch (err) {
    console.error('[qrCodeGenerator] Error encoding payload for QR:', err);
    return JSON.stringify({
      hn: patient?.hn || 'NEW',
      name: 'ผู้รับการดูแลใหม่',
      age: '-',
      height: '-',
      weight: '-'
    });
  }
}

/**
 * Official Central API Endpoint for Google Apps Script Web App
 */
export const API_URL = "https://script.google.com/macros/s/AKfycbyGAHfEkrgkIM5zRpK91VVfMRkWKE4m_nn66DJpavEm-ltTUoKEcaSO1_tUbSR9pqH9/exec";
export const CHECKIN_BASE_URL = API_URL;

export const NETLIFY_BASE_URL = "https://growth-lab-28.vercel.app";



export function getWebAppBaseUrl(): string {
  if (typeof window !== 'undefined') {
    return window.location.origin;
  }
  return NETLIFY_BASE_URL;
}

/**
 * Generates a unique, non-overlapping individual QR token for a patient.
 */
export function generateUniquePatientQRToken(patientId?: string, hn?: string): string {
  const cleanHn = (hn || 'HN').toString().toLowerCase().replace(/[^a-z0-9]/g, '');
  const cleanId = (patientId || `pat_${Date.now()}`).toString().toLowerCase().replace(/[^a-z0-9]/g, '');
  const timestamp = Date.now().toString(36);
  const randomSalt = Math.random().toString(36).substring(2, 8);
  return `tok_${cleanId}_${cleanHn}_${timestamp}_${randomSalt}`;
}

/**
 * Builds the standard scannable deep link URL for a participant.
 * Dynamically uses window.location.origin to ensure the QR code works correctly on the deployed domain.
 */
export function getParticipantDeepLink(patient?: Partial<Patient> | null): string {
  // Use dynamic origin, fallback to generic if window is not available (SSR)
  const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://growth-lab-28.vercel.app';
  try {
    if (!patient) return `${baseUrl}/?mode=patient`;
    
    const rawHn = (patient?.hn || patient?.id || '').trim();
    if (rawHn && rawHn !== 'NEW') {
      const cleanHn = encodeURIComponent(rawHn);
      return `${baseUrl}/?mode=patient&hn=${cleanHn}`;
    }
    
    const token = (patient?.qrToken || '').trim();
    if (token) {
      return `${baseUrl}/?mode=patient&token=${encodeURIComponent(token)}`;
    }
    
    return `${baseUrl}/?mode=patient`;
  } catch (err) {
    console.error('[qrCodeGenerator] Error generating deep link:', err);
    return `${baseUrl}/?mode=patient`;
  }
}

/**
 * Generates QR Data URL with a configurable timeout (default 10s).
 * Rejects on error or timeout so the caller UI can handle retry logic.
 */
export async function generateQRDataURL(
  payload: string,
  options?: {
    width?: number;
    margin?: number;
    colorDark?: string;
    colorLight?: string;
    timeoutMs?: number;
  }
): Promise<string> {
  const timeoutMs = options?.timeoutMs || 10000;

  return new Promise<string>((resolve, reject) => {
    let timerId: ReturnType<typeof setTimeout> | null = null;
    let isSettled = false;

    timerId = setTimeout(() => {
      if (!isSettled) {
        isSettled = true;
        reject(new Error('QR Generation Timeout (10s)'));
      }
    }, timeoutMs);

    QRCode.toDataURL(payload || CHECKIN_BASE_URL, {
      width: options?.width || 360,
      margin: options?.margin ?? 2,
      color: {
        dark: options?.colorDark || '#0f172a',
        light: options?.colorLight || '#ffffff',
      },
      errorCorrectionLevel: 'M',
    })
      .then((dataUrl) => {
        if (!isSettled) {
          isSettled = true;
          if (timerId) clearTimeout(timerId);
          if (dataUrl) {
            resolve(dataUrl);
          } else {
            reject(new Error('Generated QR Data URL is empty'));
          }
        }
      })
      .catch((err) => {
        if (!isSettled) {
          isSettled = true;
          if (timerId) clearTimeout(timerId);
          reject(err);
        }
      });
  });
}

/**
 * Generates a high-quality printable/downloadable PNG canvas with Growth Lab header & details.
 */
export async function createDownloadableQRCanvas(patient: Patient, qrDataUrl: string, clinicName?: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    canvas.width = 600;
    canvas.height = 760;
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      reject(new Error('Canvas context not available'));
      return;
    }

    // White background
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Decorative top header bar
    const gradient = ctx.createLinearGradient(0, 0, canvas.width, 0);
    gradient.addColorStop(0, '#581c87'); // purple-900
    gradient.addColorStop(1, '#3b82f6'); // blue-500
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, 16);

    // Outer border frame
    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 4;
    ctx.strokeRect(16, 16, canvas.width - 32, canvas.height - 32);

    // Header title
    const displayClinicName = (clinicName || 'GROWTH LAB CLINICAL QR').toUpperCase();
    ctx.fillStyle = '#1e1b4b';
    ctx.font = 'bold 24px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(displayClinicName, canvas.width / 2, 70);

    // Subtitle
    ctx.fillStyle = '#64748b';
    ctx.font = '16px sans-serif';
    ctx.fillText('ระบบยืนยันตัวตนและการเข้าใช้งานของการดูแล', canvas.width / 2, 100);

    // Participant Name Box
    ctx.fillStyle = '#f8fafc';
    ctx.fillRect(40, 125, canvas.width - 80, 85);
    ctx.strokeStyle = '#cbd5e1';
    ctx.lineWidth = 1;
    ctx.strokeRect(40, 125, canvas.width - 80, 85);

    const info = formatPatientDisplay(patient);
    ctx.fillStyle = '#0f172a';
    ctx.font = 'bold 21px sans-serif';
    ctx.fillText(`${info.displayName} ${info.formattedNickname ? info.formattedNickname : ''}`.trim(), canvas.width / 2, 158);

    ctx.fillStyle = '#4f46e5';
    ctx.font = 'bold 15px sans-serif';
    ctx.fillText(`HN: ${patient.hn || patient.id} • ${info.ageDisplayText} • ${info.ageGroupTag}`, canvas.width / 2, 188);

    // Load and draw real QR image
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const qrSize = 340;
      const qrX = (canvas.width - qrSize) / 2;
      const qrY = 230;

      // QR container box
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(qrX - 10, qrY - 10, qrSize + 20, qrSize + 20);
      ctx.strokeStyle = '#818cf8';
      ctx.lineWidth = 2;
      ctx.strokeRect(qrX - 10, qrY - 10, qrSize + 20, qrSize + 20);

      ctx.drawImage(img, qrX, qrY, qrSize, qrSize);

      const drawFooterAndResolve = () => {
        // Token Display Box
        ctx.fillStyle = '#f1f5f9';
        ctx.fillRect(50, 600, canvas.width - 100, 45);
        ctx.strokeStyle = '#e2e8f0';
        ctx.strokeRect(50, 600, canvas.width - 100, 45);

        ctx.fillStyle = '#475569';
        ctx.font = 'bold 14px monospace';
        const tokenDisplay = patient.qrToken || `tok_${patient.id}_${patient.hn}`;
        ctx.fillText(`Token: ${tokenDisplay}`, canvas.width / 2, 628);

        // Instructions footer
        ctx.fillStyle = '#94a3b8';
        ctx.font = '13px sans-serif';
        ctx.fillText('สแกนด้วยกล้องมือถือเพื่อเข้าสู่หน้าแบบฝึกหัดและเช็กอินรายวัน', canvas.width / 2, 680);
        ctx.fillText('ทันตแพทย์หญิง นภาพร วรรณษา • Growth Lab Clinic', canvas.width / 2, 705);

        resolve(canvas.toDataURL('image/png'));
      };

      // Load and draw Growth Lab logo in center of QR code
      const logoImg = new Image();
      logoImg.crossOrigin = 'anonymous';
      logoImg.onload = () => {
        const logoWidth = 64;
        const logoHeight = 64;
        const logoX = (canvas.width - logoWidth) / 2;
        const logoY = qrY + (qrSize - logoHeight) / 2;

        // Clean white circular background pill for logo
        ctx.save();
        ctx.beginPath();
        ctx.arc(canvas.width / 2, qrY + qrSize / 2, logoWidth / 2 + 6, 0, Math.PI * 2);
        ctx.fillStyle = '#ffffff';
        ctx.fill();
        ctx.strokeStyle = '#818cf8';
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.restore();

        ctx.drawImage(logoImg, logoX, logoY, logoWidth, logoHeight);
        drawFooterAndResolve();
      };
      logoImg.onerror = () => {
        drawFooterAndResolve();
      };
      logoImg.src = GROWTH_LAB_LOGO;
    };
    img.onerror = () => {
      reject(new Error('Failed to load QR image for canvas'));
    };
    img.src = qrDataUrl;
  });
}
