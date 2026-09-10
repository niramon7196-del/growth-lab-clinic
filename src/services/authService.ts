import { UserRole, UserAccount } from '../types';
import { auth, isFirebaseConfigured } from './firebase';
import { signInAnonymously, signOut } from 'firebase/auth';
import { savePersistentPatientSession, clearPersistentPatientSession } from '../utils/patientUtils';

const AUTH_KEY = 'growth_lab_auth';

// Auto-restore Firebase Auth session if user was previously authenticated in application
if (typeof window !== 'undefined' && isFirebaseConfigured && auth) {
  if (!auth.currentUser && localStorage.getItem(AUTH_KEY)) {
    signInAnonymously(auth).catch((err) => {
      console.warn('[authService] Auto-restore Firebase Anonymous Auth session warning:', err);
    });
  }
}

export const SYSTEM_OWNER_INFO = {
  name: 'ทันตแพทย์หญิง นภาพร วรรณษา',
  roleTitle: 'ทันตแพทย์ผู้ให้การรักษาและเจ้าของคลินิก',
  org: 'Growth Lab'
};

export const getUserDisplayDetails = (user: UserAccount | null, role: UserRole | null) => {
  const effectiveRole = role || user?.role;

  if (!user && !effectiveRole) {
    return {
      name: 'ไม่ได้ลงชื่อเข้าใช้',
      roleTitle: 'ไม่ได้ลงชื่อเข้าใช้',
      avatarInitials: 'ผ'
    };
  }

  if (effectiveRole === 'ADMIN' || effectiveRole === 'DEVELOPER') {
    return {
      name: effectiveRole === 'DEVELOPER' ? (user?.name || 'ผู้ดูแลระบบ') : 'ทันตแพทย์หญิง นภาพร วรรณษา',
      roleTitle: effectiveRole === 'DEVELOPER' ? 'ผู้พัฒนาระบบ' : 'ทันตแพทย์ผู้ให้การรักษาและเจ้าของคลินิก',
      avatarInitials: effectiveRole === 'DEVELOPER' ? ((user?.name || 'ผด').slice(0, 2)) : 'นภ'
    };
  }

  if (effectiveRole === 'CLINIC_OWNER' || effectiveRole === 'DOCTOR' || (user?.name && user.name.includes('นภาพร'))) {
    return {
      name: 'ทันตแพทย์หญิง นภาพร วรรณษา',
      roleTitle: 'ทันตแพทย์ผู้ให้การรักษาและเจ้าของคลินิก',
      avatarInitials: 'นภ'
    };
  }

  if (effectiveRole === 'ASSISTANT') {
    return {
      name: user?.name || 'ผู้ช่วยทันตแพทย์',
      roleTitle: 'ผู้ช่วยทันตแพทย์',
      avatarInitials: 'ผช'
    };
  }

  if (effectiveRole === 'PATIENT') {
    return {
      name: user?.name || 'การดูแล',
      roleTitle: 'การดูแล',
      avatarInitials: (user?.name || 'ผ').slice(0, 2)
    };
  }

  return {
    name: user?.name || 'ผู้ใช้งาน',
    roleTitle: effectiveRole || 'ผู้ใช้งาน',
    avatarInitials: (user?.name || 'ผ').slice(0, 2)
  };
};

export const authService = {
  ensureFirebaseAuth: async (): Promise<boolean> => {
    if (isFirebaseConfigured && auth) {
      if (!auth.currentUser) {
        try {
          await signInAnonymously(auth);
          return true;
        } catch (err) {
          console.warn('[authService.ensureFirebaseAuth] Anonymous sign-in error:', err);
          return false;
        }
      }
      return true;
    }
    return false;
  },

  login: (role: UserRole, patientId?: string, customName?: string, customPermissions?: { [key: string]: boolean }, username?: string, email?: string): UserAccount => {
    // Initiate Firebase Anonymous Auth session asynchronously
    if (isFirebaseConfigured && auth && !auth.currentUser) {
      signInAnonymously(auth).catch((err) => {
        console.warn('[authService.login] Firebase Anonymous Auth session initiation error:', err);
      });
    }

    let name = customName;
    if (!name) {
      if (role === 'ADMIN' || role === 'DEVELOPER') {
        name = 'ผู้ดูแลระบบ';
      } else if (role === 'CLINIC_OWNER' || role === 'DOCTOR') {
        name = 'ทันตแพทย์หญิง นภาพร วรรณษา';
      } else if (role === 'ASSISTANT') {
        name = 'ผู้ช่วยทันตแพทย์';
      } else if (role === 'PATIENT') {
        name = 'การดูแล';
      } else {
        name = 'เจ้าหน้าที่คลินิก';
      }
    }

    let defaultUsername = 'user';
    if (role === 'ADMIN' || role === 'DEVELOPER') {
      defaultUsername = 'admin_user';
    } else if (role === 'CLINIC_OWNER') {
      defaultUsername = 'owner_user';
    } else if (role === 'DOCTOR') {
      defaultUsername = 'doctor_user';
    } else if (role === 'ASSISTANT') {
      defaultUsername = 'staff_user';
    } else if (role === 'PATIENT') {
      defaultUsername = 'patient_user';
    }

    const resolvedEmail = email || (username?.includes('@') ? username : (role === 'DEVELOPER' || username === 'dev' ? 'niramon7196@gmail.com' : undefined));

    const user: UserAccount = {
      id: `usr_${Date.now()}`,
      username: username || defaultUsername,
      role,
      patientId: role === 'PATIENT' ? patientId : undefined,
      hn: role === 'PATIENT' ? (username || patientId) : undefined,
      name,
      email: resolvedEmail,
      permissions: customPermissions
    };
    if (role === 'PATIENT' && (username || patientId)) {
      const hnVal = username || patientId;
      if (hnVal) {
        savePersistentPatientSession({
          hn: hnVal,
          name: name || 'คนไข้',
          id: patientId || hnVal,
          phone: hnVal.match(/^0\d{8,9}$/) ? hnVal : undefined
        });
      }
    }
    localStorage.setItem(AUTH_KEY, JSON.stringify(user));
    return user;
  },

  logout: () => {
    try {
      clearPersistentPatientSession();
      localStorage.removeItem(AUTH_KEY);
      sessionStorage.clear();
    } catch (e) {
      console.warn('[authService.logout] storage clear error:', e);
    }

    if (typeof window !== 'undefined') {
      if (window.location.search || window.location.hash) {
        try {
          window.history.replaceState({}, document.title, window.location.pathname);
        } catch (e) {
          // ignore
        }
      }
    }

    if (isFirebaseConfigured && auth && auth.currentUser) {
      signOut(auth).catch((err) => {
        console.warn('[authService.logout] Firebase sign-out warning:', err);
      });
    }
  },

  getCurrentUser: (): UserAccount | null => {
    const data = localStorage.getItem(AUTH_KEY);
    if (!data) {
      return null;
    }
    try {
      let user: UserAccount = JSON.parse(data);
      if (!user) {
        return null;
      }
      if ((user.role === 'DEVELOPER' || user.username === 'dev') && !user.email) {
        user.email = 'niramon7196@gmail.com';
      }
      return user;
    } catch (e) {
      return null;
    }
  },

  isAuthenticated: (): boolean => {
    return !!localStorage.getItem(AUTH_KEY);
  },

  hasRole: (roles: UserRole[]): boolean => {
    const user = authService.getCurrentUser();
    return user ? roles.includes(user.role) : false;
  },

  verifyStaffWithCloud: async (username: string, passwordOrPin: string): Promise<{
    success: boolean;
    user?: UserAccount;
    error?: string;
  }> => {
    try {
      const { verifyStaff } = await import('./cloudApi');
      const res = await verifyStaff({ username, password: passwordOrPin, pin: passwordOrPin });
      if (res.success && res.data?.verified) {
        const staffName = res.data.name || username;
        const role = (res.data.role as UserRole) || 'ASSISTANT';
        const user = authService.login(role, undefined, staffName, res.data.permissions, username);
        return { success: true, user };
      }
    } catch (e) {
      console.warn('[authService.verifyStaffWithCloud] Cloud verification warning:', e);
    }
    return { success: false, error: 'การตรวจสอบสิทธิ์ล้มเหลว' };
  }
};

