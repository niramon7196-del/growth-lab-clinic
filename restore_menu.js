const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

// The place where it should be inserted is right before:
//   const staffPermissions = isClinicOwnerOrFullAccess ? {

let staffMenuGroupsCode = `
  // 5 Master Menu Groups for Clinic Owner and Medical Staff
  const staffMenuGroups = useMemo(() => [
    {
      title: 'ภาพรวม',
      items: [
        { id: 'Dashboard', label: 'Dashboard', icon: LayoutDashboard, permissionKey: 'Dashboard' }
      ]
    },
    {
      title: 'การติดตาม',
      items: [
        { id: 'ผู้รับการดูแล', label: 'ผู้รับการดูแล', icon: Users, permissionKey: 'ผู้รับการดูแล' },
        { id: 'ติดตามผล', label: 'ติดตามผล', icon: ClipboardList, targetSubTab: 'track_history', permissionKey: 'ติดตามการรักษา' },
        { id: 'QR', label: 'คิวอาร์ / เช็คอิน', icon: QrCode, permissionKey: 'QR' },
        { id: 'นัดหมาย', label: 'นัดหมาย', icon: Calendar, permissionKey: 'นัดหมาย' },
        { id: 'รายงาน', label: 'รายงาน', icon: FileText, permissionKey: 'รายงาน' },
      ]
    },
    {
      title: 'สื่อและบันทึก',
      items: [
        { id: 'วิดีโอ', label: 'วิดีโอสาธิต', icon: Video, permissionKey: 'วิดีโอ' },
        { id: 'คู่มือการใช้งาน', label: 'คู่มือการใช้งาน', icon: BookOpen, permissionKey: 'คู่มือ' }
      ]
    },
    {
      title: 'ระบบ',
      items: [
        { id: 'การแจ้งเตือน', label: 'การแจ้งเตือน', icon: Bell, permissionKey: 'การแจ้งเตือน' },
        { id: 'ระบบ / โปรไฟล์', label: 'โปรไฟล์ / ข้อมูลคลินิก', icon: Building2, permissionKey: 'โปรไฟล์' },
        { id: 'ตั้งค่า', label: 'ตั้งค่า', icon: SettingsIcon, permissionKey: 'ตั้งค่า' },
        { id: 'บุคลากร', label: 'บุคลากร', icon: UserCog, permissionKey: 'บุคลากร' },
        { id: 'Clinical Source', label: 'Clinical Source', icon: ShieldCheck, permissionKey: 'Clinical Source' },
      ]
    }
  ], []);

`;

// Currently, it looks like this in the file:
//     'ติดตามการรักษา': true,
//     },    {      title: 'ระบบ',      items: [ ... ]    }  ], []);การรักษา': true,
// Wait, my file is totally messed up around line 1315-1355.
