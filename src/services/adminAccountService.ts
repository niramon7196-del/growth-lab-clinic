export interface AdminAccount {
  id: string;
  name: string;
  username: string; // or email
  email?: string;
  passwordHash: string;
  role: 'ADMIN';
  createdAt: string;
  permissions: { [key: string]: boolean };
}

const ADMIN_ACCOUNTS_KEY = 'growth_lab_admin_accounts';

// Secure SHA-256 password hashing helper (Web Crypto API)
export async function hashPassword(password: string): Promise<string> {
  const msgUint8 = new TextEncoder().encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgUint8);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

export const adminAccountService = {
  getAdminAccounts: (): AdminAccount[] => {
    const raw = localStorage.getItem(ADMIN_ACCOUNTS_KEY);
    if (!raw) return [];
    try {
      return JSON.parse(raw);
    } catch (e) {
      return [];
    }
  },

  hasAdminAccount: (): boolean => {
    return adminAccountService.getAdminAccounts().length > 0;
  },

  createAdminAccount: async (data: {
    name: string;
    username: string;
    password: string;
    confirmPassword?: string;
  }): Promise<{ success: boolean; error?: string; account?: AdminAccount }> => {
    const name = data.name.trim();
    const username = data.username.toLowerCase().trim();
    const password = data.password;

    if (!name || !username || !password) {
      return { success: false, error: 'กรุณากรอกข้อมูลให้ครบถ้วนทุกช่อง' };
    }

    if (data.confirmPassword !== undefined && password !== data.confirmPassword) {
      return { success: false, error: 'รหัสผ่านและการยืนยันรหัสผ่านไม่ตรงกัน' };
    }

    if (password.length < 6) {
      return { success: false, error: 'รหัสผ่านต้องมีความยาวอย่างน้อย 6 ตัวอักษร' };
    }

    const existingAccounts = adminAccountService.getAdminAccounts();
    const isDuplicateAdmin = existingAccounts.some(a => a.username.toLowerCase() === username);
    if (isDuplicateAdmin) {
      return { success: false, error: 'ชื่อผู้ใช้หรืออีเมลนี้ถูกใช้งานแล้วในระบบ' };
    }

    // Check against staff accounts as well
    const staffRaw = localStorage.getItem('growth_lab_staff_accounts');
    if (staffRaw) {
      try {
        const staffList = JSON.parse(staffRaw);
        if (staffList.some((s: any) => s.username?.toLowerCase() === username)) {
          return { success: false, error: 'ชื่อผู้ใช้หรืออีเมลนี้ถูกใช้งานแล้วในระบบ' };
        }
      } catch (e) { /* ignore */ }
    }

    const passwordHash = await hashPassword(password);

    const newAdmin: AdminAccount = {
      id: `adm_${Date.now()}`,
      name,
      username,
      email: username.includes('@') ? username : undefined,
      passwordHash,
      role: 'ADMIN',
      createdAt: new Date().toISOString(),
      permissions: {
        Dashboard: true,
        'สรุปภาพรวมผู้บริหาร': true,
        'ผู้รับการดูแล': true,
        'ติดตามการรักษา': true,
        'EF / แบบฝึก': true,
        GNS: true,
        'การนอน': true,
        'การออกกำลังกาย': true,
        'Before / After': true,
        QR: true,
        'นัดหมาย': true,
        'รายงาน': true,
        'ข้อมูลคลินิก': true,
        'บุคลากร': true,
        'ตั้งค่า': true,
        'สิทธิ์การเข้าถึง': true,
        'คู่มือการใช้งาน': true
      }
    };

    const updated = [...existingAccounts, newAdmin];
    localStorage.setItem(ADMIN_ACCOUNTS_KEY, JSON.stringify(updated));

    return { success: true, account: newAdmin };
  },

  verifyAdminLogin: async (
    usernameOrEmail: string,
    password: string
  ): Promise<{ success: boolean; account?: AdminAccount; error?: string }> => {
    const targetUsr = usernameOrEmail.toLowerCase().trim();
    if (!targetUsr || !password) {
      return { success: false, error: 'กรุณากรอกชื่อผู้ใช้และรหัสผ่าน' };
    }

    const hash = await hashPassword(password);
    const accounts = adminAccountService.getAdminAccounts();
    const found = accounts.find(
      a => (a.username.toLowerCase() === targetUsr || (a.email && a.email.toLowerCase() === targetUsr)) &&
           a.passwordHash === hash
    );

    if (found) {
      return { success: true, account: found };
    }

    return { success: false, error: 'ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง' };
  }
};
