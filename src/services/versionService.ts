/**
 * Growth Lab Dental & Myofunctional Therapy System
 * Auto Version Checker & Notification Engine
 */

export const CURRENT_APP_VERSION = 'v1.1.0';
export const VERSION_STORAGE_KEY = 'last_known_version';
export const UPDATE_JUST_COMPLETED_KEY = 'growth_lab_update_just_completed';
export const UPDATE_TARGET_VERSION_KEY = 'growth_lab_update_target_version';

export type VersionNotificationType = 'update_available' | 'updating' | 'live_updated' | 'first_launch' | null;

export interface VersionNotificationState {
  type: VersionNotificationType;
  message: string;
  subMessage?: string;
  currentVersion: string;
  targetVersion?: string;
}

type VersionListener = (state: VersionNotificationState | null) => void;
const listeners = new Set<VersionListener>();
let currentState: VersionNotificationState | null = null;
let isUpdating = false;

export function notifyListeners(state: VersionNotificationState | null) {
  currentState = state;
  listeners.forEach(fn => {
    try {
      fn(state);
    } catch (e) {
      console.error('Error in version listener', e);
    }
  });
}

export function subscribeVersionState(listener: VersionListener): () => void {
  listeners.add(listener);
  listener(currentState);
  return () => {
    listeners.delete(listener);
  };
}

export function getCurrentVersionState(): VersionNotificationState | null {
  return currentState;
}

export function dismissNotification() {
  notifyListeners(null);
}

/**
 * Fetch latest version from server endpoint or fallback to static version.json
 */
export async function checkRemoteVersion(): Promise<{ 
  hasUpdate: boolean; 
  remoteVersion: string; 
  currentVersion: string 
}> {
  try {
    const timestamp = Date.now();
    let res = await fetch(`/api/version?t=${timestamp}`, {
      cache: 'no-store',
      headers: { 'Cache-Control': 'no-cache, no-store, must-revalidate', 'Pragma': 'no-cache' }
    });

    if (!res.ok) {
      res = await fetch(`/version.json?t=${timestamp}`, {
        cache: 'no-store',
        headers: { 'Cache-Control': 'no-cache, no-store, must-revalidate', 'Pragma': 'no-cache' }
      });
    }

    if (res.ok) {
      const data = await res.json();
      const remoteVersion = data.version || CURRENT_APP_VERSION;
      const hasUpdate = Boolean(remoteVersion && remoteVersion !== CURRENT_APP_VERSION);
      return {
        hasUpdate,
        remoteVersion,
        currentVersion: CURRENT_APP_VERSION
      };
    }
  } catch (err) {
    // Network or server error - gracefully ignore in offline or transient state
    console.debug('[VersionChecker] Remote check skipped or offline:', err);
  }

  return {
    hasUpdate: false,
    remoteVersion: CURRENT_APP_VERSION,
    currentVersion: CURRENT_APP_VERSION
  };
}

/**
 * Prompt user with update notification toast (interactive banner)
 */
export function promptUpdateAvailable(newVersion: string = CURRENT_APP_VERSION) {
  notifyListeners({
    type: 'update_available',
    message: `ระบบมีการอัปเดตเวอร์ชันใหม่ (${newVersion})`,
    subMessage: 'มีการปรับปรุงระบบเพื่อเพิ่มประสิทธิภาพและความแม่นยำ แนะนำให้อัปเดตเพื่อการใช้งานที่ดีที่สุด',
    currentVersion: CURRENT_APP_VERSION,
    targetVersion: newVersion
  });
}

/**
 * Apply update, save new version to localStorage, and reload page
 */
export function applyUpdateAndReload(targetVersion: string = CURRENT_APP_VERSION) {
  if (isUpdating) return;
  isUpdating = true;

  try {
    localStorage.setItem(VERSION_STORAGE_KEY, targetVersion);
    sessionStorage.setItem(UPDATE_JUST_COMPLETED_KEY, 'true');
    sessionStorage.setItem(UPDATE_TARGET_VERSION_KEY, targetVersion);
  } catch (e) {
    console.warn('[VersionChecker] Failed to persist update keys', e);
  }

  notifyListeners({
    type: 'updating',
    message: 'กำลังอัปเดตระบบ...',
    subMessage: 'กำลังรีเฟรชหน้าจอเพื่อนำเข้าเวอร์ชันล่าสุด...',
    currentVersion: CURRENT_APP_VERSION,
    targetVersion
  });

  setTimeout(() => {
    try {
      window.location.reload();
    } catch {
      window.location.href = window.location.href;
    }
  }, 700);
}

/**
 * Perform smooth live auto-update reload with notification
 */
export function triggerLiveAutoUpdate(targetVersion: string = CURRENT_APP_VERSION) {
  promptUpdateAvailable(targetVersion);
}

/**
 * Initialize on-mount version check and setup background listeners
 */
export function initVersionChecker(): () => void {
  // 1. Check if the app just finished a live auto-update reload
  try {
    const wasJustUpdated = sessionStorage.getItem(UPDATE_JUST_COMPLETED_KEY);
    if (wasJustUpdated === 'true') {
      sessionStorage.removeItem(UPDATE_JUST_COMPLETED_KEY);
      sessionStorage.removeItem(UPDATE_TARGET_VERSION_KEY);
      
      // Update stored version in localStorage
      localStorage.setItem(VERSION_STORAGE_KEY, CURRENT_APP_VERSION);

      notifyListeners({
        type: 'live_updated',
        message: '✨ อัปเดตเป็นเวอร์ชันล่าสุดเรียบร้อยแล้ว ระบบพร้อมใช้งาน',
        subMessage: `ระบบปรับปรุงเป็นเวอร์ชัน ${CURRENT_APP_VERSION} พร้อมใช้งานและข้อมูลมีความปลอดภัยสูงสุด`,
        currentVersion: CURRENT_APP_VERSION
      });

      // Auto dismiss after 6 seconds
      setTimeout(() => {
        if (currentState?.type === 'live_updated') {
          dismissNotification();
        }
      }, 6000);

      return () => {};
    }
  } catch (e) {
    console.warn('[VersionChecker] sessionStorage check error', e);
  }

  // 2. Check if this is a first launch after an external update (e.g. browser closed & reopened)
  try {
    const lastKnownVersion = localStorage.getItem(VERSION_STORAGE_KEY);
    if (lastKnownVersion && lastKnownVersion !== CURRENT_APP_VERSION) {
      // Version changed! Show first launch notification
      localStorage.setItem(VERSION_STORAGE_KEY, CURRENT_APP_VERSION);

      notifyListeners({
        type: 'first_launch',
        message: '🎉 อัปเดตเวอร์ชันล่าสุดสำเร็จแล้ว',
        subMessage: `แอปพลิเคชันได้รับการอัปเดตเป็นเวอร์ชัน ${CURRENT_APP_VERSION} เพื่อประสิทธิภาพสูงสุด`,
        currentVersion: CURRENT_APP_VERSION
      });

      // Auto dismiss after 7 seconds
      setTimeout(() => {
        if (currentState?.type === 'first_launch') {
          dismissNotification();
        }
      }, 7000);
    } else if (!lastKnownVersion) {
      // First time on this device, save current version quietly
      localStorage.setItem(VERSION_STORAGE_KEY, CURRENT_APP_VERSION);
    }
  } catch (e) {
    console.warn('[VersionChecker] localStorage check error', e);
  }

  // Background polling and focus/visibility listeners are disabled to prevent page stutter and unwanted reloads
  return () => {};
}

/**
 * Developer / Tester Helpers for instant demo
 */
export function simulateFirstLaunch(fakeVersion: string = 'v1.2.0') {
  notifyListeners({
    type: 'first_launch',
    message: '🎉 อัปเดตเวอร์ชันล่าสุดสำเร็จแล้ว',
    subMessage: `แอปพลิเคชันได้รับการอัปเดตเป็นเวอร์ชัน ${fakeVersion} เพื่อประสิทธิภาพสูงสุด`,
    currentVersion: fakeVersion
  });
  setTimeout(() => {
    if (currentState?.type === 'first_launch') dismissNotification();
  }, 7000);
}

export function simulateLiveUpdate(fakeNewVersion: string = 'v1.2.0') {
  triggerLiveAutoUpdate(fakeNewVersion);
}

export function simulateUpdatePrompt(fakeVersion: string = 'v1.2.0') {
  promptUpdateAvailable(fakeVersion);
}
