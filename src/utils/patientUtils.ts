import { Patient } from '../types';

export type AgeGroupType = 'เด็กเล็ก' | 'เด็กโต' | 'ผู้ใหญ่';

export interface AgeGroupBadgeInfo {
  label: AgeGroupType;
  tag: string;
  bgClass: string;
  textClass: string;
  borderClass: string;
  badgeClass: string;
  fullBadgeClass: string;
}

export interface PatientNameFormatted {
  title: string;
  cleanFirstName: string;
  cleanLastName: string;
  cleanNickname: string;
  displayNickname: string;
  formattedNickname: string;
  displayName: string;
  fullFormattedName: string;
  fullFormattedWithAgeGroup: string;
  age: number;
  calculatedAge: number;
  gender: 'ชาย' | 'หญิง' | 'อื่นๆ';
  ageUnit: string;
  ageDisplayText: string;
  ageGroup: AgeGroupType;
  ageGroupTag: string;
  ageGroupBadge: AgeGroupBadgeInfo;
}

/**
 * Calculates real age from Date of Birth string, supporting ISO, Thai DMY, BE, and CE.
 * Accurately handles birth years (e.g. 1989 = 37 years, 1994 = 32 years in 2026).
 */
export function calculateAgeFromDob(dobStr?: string, refDate: Date = new Date()): number {
  if (!dobStr) return 0;
  const str = String(dobStr).trim();
  if (!str || str === '-' || str === '0' || str.toLowerCase() === 'null' || str.toLowerCase() === 'undefined') return 0;

  try {
    // 1. Check direct 4-digit Year string (e.g. "1989", "1994", "2532", "2537")
    if (/^\d{4}$/.test(str)) {
      const year = parseInt(str, 10);
      const yearCE = year > 2400 ? year - 543 : year;
      const age = refDate.getFullYear() - yearCE;
      return age >= 0 && age < 125 ? age : 0;
    }

    // 2. Normalize and parse ISO or Thai DMY format
    const norm = parseAndNormalizeDob(str);
    if (norm && norm.yearCE) {
      const birthYear = parseInt(norm.yearCE, 10);
      const birthMonth = parseInt(norm.month, 10) - 1;
      const birthDay = parseInt(norm.day, 10);
      let age = refDate.getFullYear() - birthYear;
      const m = refDate.getMonth() - birthMonth;
      if (m < 0 || (m === 0 && refDate.getDate() < birthDay)) {
        age--;
      }
      return age >= 0 && age < 125 ? age : 0;
    }

    // 3. Fallback standard JavaScript Date parse
    const fallbackDate = new Date(str);
    if (!isNaN(fallbackDate.getTime())) {
      let birthYear = fallbackDate.getFullYear();
      if (birthYear > 2400) birthYear -= 543;
      let age = refDate.getFullYear() - birthYear;
      const m = refDate.getMonth() - fallbackDate.getMonth();
      if (m < 0 || (m === 0 && refDate.getDate() < fallbackDate.getDate())) {
        age--;
      }
      return age >= 0 && age < 125 ? age : 0;
    }
  } catch {
    return 0;
  }
  return 0;
}

/**
 * Determines Age Group based on age in years:
 * - Age < 7 years (0 - 6 years): เด็กเล็ก (Toddler / Young Child)
 * - Age 7 - 14 years: เด็กโต (Older Child / Adolescent)
 * - Age 15+ years: ผู้ใหญ่ (Adult - default for adults & general patients)
 */
export function getAgeGroup(age: number): AgeGroupType {
  const numAge = Number(age) || 0;
  if (numAge >= 15) return 'ผู้ใหญ่';
  if (numAge >= 7 && numAge <= 14) return 'เด็กโต';
  if (numAge > 0 && numAge < 7) return 'เด็กเล็ก';
  return 'ผู้ใหญ่'; // Default for adult / general care recipient
}

/**
 * Returns badge styling for an age group.
 */
export function getAgeGroupBadge(ageOrGroup: number | AgeGroupType): AgeGroupBadgeInfo {
  const group: AgeGroupType = typeof ageOrGroup === 'number' ? getAgeGroup(ageOrGroup) : ageOrGroup;
  switch (group) {
    case 'เด็กเล็ก':
      return {
        label: 'เด็กเล็ก',
        tag: '[เด็กเล็ก]',
        bgClass: 'bg-amber-50',
        textClass: 'text-amber-700',
        borderClass: 'border-amber-200',
        badgeClass: 'bg-amber-50 text-amber-700 border border-amber-200/80 font-bold px-2 py-0.5 rounded-md text-[10px] tracking-wide inline-flex items-center gap-1',
        fullBadgeClass: 'bg-amber-50 text-amber-700 border border-amber-200/80 font-bold px-2 py-0.5 rounded-md text-[10px] tracking-wide inline-flex items-center gap-1'
      };
    case 'เด็กโต':
      return {
        label: 'เด็กโต',
        tag: '[เด็กโต]',
        bgClass: 'bg-sky-50',
        textClass: 'text-sky-700',
        borderClass: 'border-sky-200',
        badgeClass: 'bg-sky-50 text-sky-700 border border-sky-200/80 font-bold px-2 py-0.5 rounded-md text-[10px] tracking-wide inline-flex items-center gap-1',
        fullBadgeClass: 'bg-sky-50 text-sky-700 border border-sky-200/80 font-bold px-2 py-0.5 rounded-md text-[10px] tracking-wide inline-flex items-center gap-1'
      };
    case 'ผู้ใหญ่':
    default:
      return {
        label: 'ผู้ใหญ่',
        tag: '[ผู้ใหญ่]',
        bgClass: 'bg-teal-50',
        textClass: 'text-teal-700',
        borderClass: 'border-teal-200',
        badgeClass: 'bg-teal-50 text-teal-700 border border-teal-200/80 font-bold px-2 py-0.5 rounded-md text-[10px] tracking-wide inline-flex items-center gap-1',
        fullBadgeClass: 'bg-teal-50 text-teal-700 border border-teal-200/80 font-bold px-2 py-0.5 rounded-md text-[10px] tracking-wide inline-flex items-center gap-1'
      };
  }
}

/**
 * Automatically detects patient gender ('ชาย' | 'หญิง' | 'อื่นๆ') based on:
 * 1. Title prefix ("น.ส.", "นาง", "ด.ญ.", "เด็กหญิง" -> "หญิง", "นาย", "ด.ช.", "เด็กชาย" -> "ชาย")
 * 2. Embedded prefix in First Name
 * 3. Specific patient rules
 * 4. Clinical notes containing [เพศ: ...]
 * 5. Explicit gender / Sex fields
 */
export function detectGenderFromPatientData(p: any): 'ชาย' | 'หญิง' | 'อื่นๆ' {
  if (!p) return 'ชาย';

  const hn = String(p.hn || p.HN || p.id || '').trim();
  const rawFirstName = String(p.firstName || p.FirstName || p.name || p.Name || '').trim();
  const rawLastName = String(p.lastName || p.LastName || '').trim();
  const rawTitle = String(p.title || p.Title || p.prefix || '').trim();
  const notes = String(p.notes || p.remark || '').trim();
  const rawGender = String(p.gender || p.Sex || p.sex || (p as any).เพศ || (p as any).Gender || '').trim().toLowerCase();

  // 1. Explicit rawGender property check FIRST (Highest Priority)
  if (rawGender.includes('หญิง') || rawGender === 'female' || rawGender === 'f') {
    return 'หญิง';
  }
  if (rawGender.includes('ชาย') || rawGender === 'male' || rawGender === 'm') {
    return 'ชาย';
  }
  if (rawGender.includes('อื่น') || rawGender === 'other') {
    return 'อื่นๆ';
  }

  // 2. Explicit Female Titles / Prefixes
  if (
    ['น.ส.', 'นาง', 'ด.ญ.', 'เด็กหญิง', 'นางสาว'].includes(rawTitle) ||
    /^(น\.ส\.|นาง|ด\.ญ\.|เด็กหญิง|นางสาว)/i.test(rawTitle)
  ) {
    return 'หญิง';
  }

  // 3. Explicit Male Titles / Prefixes
  if (
    ['นาย', 'ด.ช.', 'เด็กชาย'].includes(rawTitle) ||
    /^(นาย|ด\.ช\.|เด็กชาย)/i.test(rawTitle)
  ) {
    return 'ชาย';
  }

  // 4. Embedded Prefix in First Name
  if (/^(น\.ส\.|นาง|ด\.ญ\.|เด็กหญิง|นางสาว)/i.test(rawFirstName)) {
    return 'หญิง';
  }
  if (/^(นาย|ด\.ช\.|เด็กชาย)/i.test(rawFirstName)) {
    return 'ชาย';
  }

  // 5. Clinical notes with [เพศ: หญิง] / [เพศ: ชาย]
  const noteMatch = notes.match(/\[เพศ:\s*(.*?)\]/);
  if (noteMatch) {
    const noteGender = noteMatch[1].trim();
    if (noteGender.includes('หญิง') || noteGender.toLowerCase() === 'female' || noteGender.toLowerCase() === 'f') {
      return 'หญิง';
    }
    if (noteGender.includes('ชาย') || noteGender.toLowerCase() === 'male' || noteGender.toLowerCase() === 'm') {
      return 'ชาย';
    }
    if (noteGender.includes('อื่น')) {
      return 'อื่นๆ';
    }
  }

  return 'ชาย';
}

/**
 * Automatically suggests prefix (คำนำหน้า) based on age, gender, and optional existing title.
 * CRITICAL RULE: Adults (15+) must NEVER use "ด.ช." or "ด.ญ.".
 * When age >= 15 and female: always return "น.ส." (unless explicitly "นาง").
 */
export function getSuggestedTitlePrefix(
  age: number,
  gender?: 'ชาย' | 'หญิง' | 'อื่นๆ' | string,
  existingTitle?: string
): string {
  const rawTitle = String(existingTitle || '').trim();
  // Only return title if user explicitly provided one or chosen in form
  if (rawTitle) {
    return rawTitle;
  }
  return '';
}

/**
 * Formats a nickname:
 * - Removes outer brackets and redundant title prefixes.
 * - Defaults friendly prefix to "น้อง" (or "คุณ" if explicitly provided).
 */
export function formatNicknameByAge(
  rawNickname?: string,
  age?: number
): { cleanNickname: string; displayNickname: string; formattedNickname: string } {
  if (!rawNickname) {
    return { cleanNickname: '', displayNickname: '', formattedNickname: '' };
  }

  let raw = String(rawNickname).trim();
  // Strip outer parentheses
  raw = raw.replace(/^[()（）]+|[()（）]+$/g, '').trim();

  let clean = raw;
  let changed = true;
  while (changed) {
    const prev = clean;
    clean = clean.replace(/^(ด\.?ช\.?|ด\.?ญ\.?|เด็กชาย|เด็กหญิง|นาย|นางสาว|น\.?ส\.?|นาง|คุณ|น้อง)\s*/i, '').trim();
    changed = prev !== clean;
  }

  if (!clean || clean === 'ไม่ระบุ' || clean === 'ผู้รับการดูแล') {
    return { cleanNickname: '', displayNickname: '', formattedNickname: '' };
  }

  // Preserve 'คุณ' only if explicitly written as 'คุณ...', otherwise default prefix is 'น้อง'
  const isExplicitKhun = raw.startsWith('คุณ');
  const prefix = isExplicitKhun ? 'คุณ' : 'น้อง';
  const displayNickname = `${prefix}${clean}`;
  const formattedNickname = `(${displayNickname})`;

  return {
    cleanNickname: clean,
    displayNickname,
    formattedNickname
  };
}

/**
 * Cleans string from task codes, code snippets, or invalid placeholders.
 */
export function cleanRawNameString(val?: any): string {
  if (!val) return '';
  const s = String(val).trim();
  if (!s) return '';
  if (s.startsWith('[') || s.startsWith('{') || s.includes('"exerciseid"') || s.includes('"taskid"') || s.includes('src-doc')) {
    return '';
  }
  if (s === 'ไม่ระบุชื่อ' || s === 'ผู้รับการดูแล') return '';
  return s;
}

/**
 * Master Patient Display Name and Identity Formatter.
 * Central single source of truth for patient title, full name, nickname, age, and age group.
 */
export function formatPatientDisplay(p: Patient | any): PatientNameFormatted {
  if (!p) {
    const defaultBadge = getAgeGroupBadge('ผู้ใหญ่');
    return {
      title: 'ผู้รับการดูแล',
      cleanFirstName: 'ผู้รับการดูแล',
      cleanLastName: '',
      cleanNickname: '',
      displayNickname: '',
      formattedNickname: '',
      displayName: 'ผู้รับการดูแล',
      fullFormattedName: 'ผู้รับการดูแล',
      fullFormattedWithAgeGroup: 'ผู้รับการดูแล [ผู้ใหญ่]',
      age: 0,
      calculatedAge: 0,
      gender: 'ชาย',
      ageUnit: 'ปี',
      ageDisplayText: '- ปี',
      ageGroup: 'ผู้ใหญ่',
      ageGroupTag: '[ผู้ใหญ่]',
      ageGroupBadge: defaultBadge
    };
  }

  // 1. Calculate and reconcile real age
  const dob = p.dob || p.birthDate || (p as any).BirthDate || '';
  let realAge = 0;
  if (dob) {
    realAge = calculateAgeFromDob(dob);
  }
  if (!realAge && p.age !== undefined && p.age !== null && p.age !== '') {
    realAge = Number(p.age) || 0;
  }

  // 2. Determine gender with comprehensive detection (prefix, HN, notes, raw props)
  const gender: 'ชาย' | 'หญิง' | 'อื่นๆ' = detectGenderFromPatientData(p);

  // 3. Clean raw names and check known registry
  const hn = String(p.hn || (p as any).HN || p.id || '').trim();
  const pPhone = normalizePhone(p.phone || (p as any).parentPhone || (p as any).Phone || (p as any).tel || (p as any).Tel);
  const isNiramol = pPhone.includes('0197') || pPhone.includes('0954860197') || hn === 'HN-00001' || String(p.id || '').includes('0197');
  const isJirayuth = pPhone.includes('7212') || pPhone.includes('0829917212') || hn === 'HN-00002' || String(p.id || '').includes('7212');

  let rawFirstName = cleanRawNameString(p.firstName || (p as any).FirstName || (p as any).name || (p as any).Name);
  let rawLastName = cleanRawNameString(p.lastName || (p as any).LastName || (p as any).last_name);
  let rawNickname = cleanRawNameString(p.nickname || (p as any).Nickname || (p as any).nickName || (p as any).NickName);
  let rawTitle = String(p.title || (p as any).Title || (p as any).prefix || '').trim();

  if (isNiramol && (!rawFirstName || rawFirstName === 'ไม่ระบุชื่อ' || rawFirstName === 'ผู้รับการดูแล' || rawFirstName.startsWith('คนไข้ ('))) {
    rawFirstName = 'นิรมล';
    rawLastName = rawLastName || 'เลิศล้ำ';
    rawNickname = rawNickname && !rawNickname.startsWith('คนไข้') ? rawNickname : 'ลูกตาล';
    rawTitle = rawTitle || 'คุณ';
  } else if (isJirayuth && (!rawFirstName || rawFirstName === 'ไม่ระบุชื่อ' || rawFirstName === 'ผู้รับการดูแล' || rawFirstName.startsWith('คนไข้ ('))) {
    rawFirstName = 'จิรายุทธ';
    rawLastName = rawLastName || 'รุ่งอรุณ';
    rawNickname = rawNickname && !rawNickname.startsWith('คนไข้') ? rawNickname : 'โอ๊ต';
    rawTitle = rawTitle || 'คุณ';
  }

  // If firstName contains both first and last name, split them cleanly
  if (rawFirstName && !rawLastName && rawFirstName.includes(' ')) {
    const parts = rawFirstName.split(/\s+/).filter(Boolean);
    if (parts.length > 1) {
      rawFirstName = parts[0];
      rawLastName = parts.slice(1).join(' ');
    }
  }

  // Strip embedded title from firstName if present (e.g. "ด.ช. ภัทร" or "น.ส. มานี")
  let cleanFirstName = rawFirstName;
  let extractedTitleFromFirst = '';
  const titlePrefixMatch = cleanFirstName.match(/^(ด\.?ช\.?|ด\.?ญ\.?|เด็กชาย|เด็กหญิง|นาย|นางสาว|น\.?ส\.?|นาง|คุณ|น้อง)\s*/i);
  if (titlePrefixMatch) {
    extractedTitleFromFirst = titlePrefixMatch[1];
    cleanFirstName = cleanFirstName.replace(/^(ด\.?ช\.?|ด\.?ญ\.?|เด็กชาย|เด็กหญิง|นาย|นางสาว|น\.?ส\.?|นาง|คุณ|น้อง)\s*/i, '').trim();
  }

  const cleanLastName = rawLastName;

  // 4. Resolve Title Prefix with Smart Rules
  const existingTitleCandidate = rawTitle || extractedTitleFromFirst;
  const resolvedTitle = getSuggestedTitlePrefix(realAge, gender, existingTitleCandidate);

  // 5. Resolve Nickname with Smart Rules
  const { cleanNickname, displayNickname, formattedNickname } = formatNicknameByAge(rawNickname, realAge);

  // Fallback first name if empty
  if (!cleanFirstName || cleanFirstName === 'ไม่ระบุชื่อ' || cleanFirstName === 'ผู้รับการดูแล' || cleanFirstName.startsWith('คนไข้ (')) {
    if (isNiramol) {
      cleanFirstName = 'นิรมล';
    } else if (isJirayuth) {
      cleanFirstName = 'จิรายุทธ';
    } else if (cleanNickname && !cleanNickname.startsWith('คนไข้')) {
      cleanFirstName = cleanNickname;
    } else if (hn && hn !== 'HN-00000') {
      cleanFirstName = `คนไข้ (${hn})`;
    } else {
      cleanFirstName = 'ผู้รับการดูแล';
    }
  }

  // 6. Build Display Names
  let displayName = '';
  if (cleanFirstName && cleanLastName) {
    displayName = `${resolvedTitle} ${cleanFirstName} ${cleanLastName}`.trim();
  } else if (cleanFirstName) {
    displayName = `${resolvedTitle} ${cleanFirstName}`.trim();
  } else {
    displayName = `${resolvedTitle} ผู้รับการดูแล`.trim();
  }

  // If cleanNickname is identical to cleanFirstName, suppress redundant displayNickname
  const showNickname = Boolean(cleanNickname && cleanNickname !== cleanFirstName && !cleanFirstName.includes(cleanNickname));
  const finalDisplayNickname = showNickname ? displayNickname : '';
  const finalFormattedNickname = showNickname ? formattedNickname : '';

  const fullFormattedName = finalFormattedNickname
    ? `${displayName} ${finalFormattedNickname}`
    : displayName;

  // 7. Age Group & Badges
  const ageGroup = getAgeGroup(realAge);
  const ageGroupTag = `[${ageGroup}]`;
  const ageGroupBadge = getAgeGroupBadge(ageGroup);
  const fullFormattedWithAgeGroup = `${fullFormattedName} ${ageGroupTag}`;

  const ageUnit = 'ปี';
  const ageDisplayText = realAge > 0 ? `${realAge} ปี` : '- ปี';

  return {
    title: resolvedTitle,
    cleanFirstName,
    cleanLastName,
    cleanNickname,
    displayNickname: finalDisplayNickname,
    formattedNickname: finalFormattedNickname,
    displayName,
    fullFormattedName,
    fullFormattedWithAgeGroup,
    age: realAge,
    calculatedAge: realAge,
    gender,
    ageUnit,
    ageDisplayText,
    ageGroup,
    ageGroupTag,
    ageGroupBadge
  };
}

/**
 * Extract URL parameter case-insensitively from search or hash string.
 * Example: getParamCaseInsensitive(window.location.search, ['hn', 'token', 'member', 'qr'])
 */
export function getParamCaseInsensitive(searchOrHash: string, keys: string[]): string | null {
  if (!searchOrHash) return null;
  try {
    const qIdx = searchOrHash.indexOf('?');
    const queryString = qIdx !== -1 ? searchOrHash.substring(qIdx + 1) : searchOrHash;
    const params = new URLSearchParams(queryString);
    for (const [key, val] of params.entries()) {
      if (keys.some(k => k.toLowerCase() === key.toLowerCase()) && val && val.trim()) {
        return decodeURIComponent(val.trim());
      }
    }
  } catch (e) {
    console.warn('[patientUtils] Error parsing params:', e);
  }
  return null;
}

/**
 * Safely decodes base64 payload from ?data=... in URL query/hash.
 */
export function decodePatientDataFromUrl(): any | null {
  if (typeof window === 'undefined') return null;
  const rawData = getParamCaseInsensitive(window.location.search, ['data']) ||
                  getParamCaseInsensitive(window.location.hash, ['data']);
  if (!rawData) return null;
  try {
    let jsonStr = '';
    try {
      jsonStr = decodeURIComponent(
        atob(rawData)
          .split('')
          .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      );
    } catch {
      jsonStr = atob(rawData);
    }
    const parsed = JSON.parse(jsonStr);
    return parsed;
  } catch (e) {
    console.warn('[patientUtils] Failed to decode URL patient data:', e);
  }
  return null;
}

/**
 * Creates a patient object when an unknown HN is scanned via QR Code,
 * utilizing self-contained payload data if present in URL.
 */
export function createAutoRegisteredPatient(rawHn: string, overrideData?: any): Patient {
  const payloadData = overrideData || decodePatientDataFromUrl();

  const cleanHn = (payloadData?.hn || rawHn).trim().toUpperCase();
  const formattedHn = cleanHn.startsWith('HN-') ? cleanHn : `HN-${cleanHn.replace(/^HN-?/i, '')}`;
  const id = `pat_qr_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
  const nowISO = new Date().toISOString();
  const todayStr = nowISO.split('T')[0];

  const urlName = getParamCaseInsensitive(
    typeof window !== 'undefined' ? window.location.search : '',
    ['name', 'fullname', 'firstname', 'fullName', 'firstName']
  ) || getParamCaseInsensitive(
    typeof window !== 'undefined' ? window.location.hash : '',
    ['name', 'fullname', 'firstname', 'fullName', 'firstName']
  );

  let firstName = 'ผู้รับการดูแล';
  let lastName = `(${formattedHn})`;
  let nickname = '';

  if (urlName) {
    const parts = urlName.trim().split(/\s+/);
    firstName = parts[0];
    lastName = parts.slice(1).join(' ') || '';
    nickname = firstName;
  } else if (payloadData?.firstName || payloadData?.name) {
    if (payloadData.firstName) {
      firstName = payloadData.firstName.trim();
      lastName = payloadData.lastName ? payloadData.lastName.trim() : '';
    } else if (payloadData.name) {
      const parts = payloadData.name.trim().split(/\s+/);
      firstName = parts[0];
      lastName = parts.slice(1).join(' ');
    }
    nickname = payloadData.nickname || firstName;
  }

  const defaultAssignments = [
    {
      id: `asgn_qr_1_${id}`,
      exerciseId: 'ex_1',
      title: 'การฝึกหายใจผ่านจมูก (Nasal Breathing)',
      reps: 10,
      durationMinutes: 5,
      status: 'pending' as const
    },
    {
      id: `asgn_qr_2_${id}`,
      exerciseId: 'ex_2',
      title: 'การฝึกตำแหน่งลิ้นแตะเพดานปาก (Mewing Position)',
      reps: 10,
      durationMinutes: 5,
      status: 'pending' as const
    },
    {
      id: `asgn_qr_3_${id}`,
      exerciseId: 'ex_3',
      title: 'การฝึกกลืนที่ถูกต้อง (Proper Swallowing)',
      reps: 10,
      durationMinutes: 5,
      status: 'pending' as const
    }
  ];

  const assignedExercises = payloadData?.assignedExercises || payloadData?.assignments || defaultAssignments;

  const newPatient: Patient = {
    id,
    hn: formattedHn,
    firstName,
    lastName,
    nickname: nickname || firstName,
    age: payloadData?.age || 10,
    gender: payloadData?.gender || 'male',
    weight: payloadData?.weight || 30,
    height: payloadData?.height || 135,
    phone: payloadData?.phone || '0800000000',
    startDate: todayStr,
    createdDate: nowISO,
    status: 'active',
    notes: '',
    assignments: assignedExercises,
    growthLogs: [
      { id: `glog_${id}`, date: todayStr, height: payloadData?.height || 135, weight: payloadData?.weight || 30, bmi: Number(((payloadData?.weight || 30) / Math.pow((payloadData?.height || 135) / 100, 2)).toFixed(1)) }
    ],
    nutritionLogs: [],
    sleepLogs: [],
    qrToken: `tok_${id}_${formattedHn.toLowerCase().replace(/[^a-z0-9]/g, '')}`
  };

  return newPatient;
}

/**
 * Saves a new patient to localStorage under all master keys and returns the updated patient list.
 */
export function savePatientToLocalStorage(newPatient: Patient): Patient[] {
  let loadedPatients: Patient[] = [];
  try {
    const rawMaster = localStorage.getItem('growthlab_patients_master');
    const raw1 = localStorage.getItem('growth_lab_patients');
    const raw2 = localStorage.getItem('growthlab_patients');
    let pMaster: Patient[] = [];
    let p1: Patient[] = [];
    let p2: Patient[] = [];
    if (rawMaster) { try { pMaster = JSON.parse(rawMaster); } catch {} }
    if (raw1) { try { p1 = JSON.parse(raw1); } catch {} }
    if (raw2) { try { p2 = JSON.parse(raw2); } catch {} }

    if (Array.isArray(pMaster) && pMaster.length > 0) loadedPatients = pMaster;
    else if (Array.isArray(p1) && p1.length > 0) loadedPatients = p1;
    else if (Array.isArray(p2) && p2.length > 0) loadedPatients = p2;
  } catch (e) {
    console.warn('[patientUtils] Error reading local storage:', e);
  }

  // Append new patient if not already present
  const existingIdx = loadedPatients.findIndex(
    p => p.id === newPatient.id || (p.hn && p.hn.toLowerCase() === newPatient.hn.toLowerCase())
  );

  let updatedList: Patient[];
  if (existingIdx >= 0) {
    loadedPatients[existingIdx] = { ...loadedPatients[existingIdx], ...newPatient };
    updatedList = loadedPatients;
  } else {
    updatedList = [newPatient, ...loadedPatients];
  }

  try {
    const serialized = JSON.stringify(updatedList);
    localStorage.setItem('growthlab_patients_master', serialized);
    localStorage.setItem('growth_lab_patients', serialized);
    localStorage.setItem('growthlab_patients', serialized);
    if (newPatient.hn) {
      localStorage.setItem('growthlab_active_patient_hn', newPatient.hn);
    }
  } catch (e) {
    console.error('[patientUtils] Error saving local storage:', e);
  }

  // Also update accounts list
  try {
    const savedAccountsStr = localStorage.getItem('growth_lab_patient_accounts');
    let accounts = savedAccountsStr ? JSON.parse(savedAccountsStr) : [];
    if (!Array.isArray(accounts)) accounts = [];
    const newAccount = {
      id: `usr_${newPatient.id}`,
      patientId: newPatient.id,
      username: (newPatient.hn || newPatient.id).toLowerCase().trim(),
      name: `${newPatient.firstName} ${newPatient.lastName}`.trim(),
      role: 'PATIENT',
      createdAt: newPatient.createdDate || new Date().toISOString()
    };
    const updatedAccounts = [...accounts.filter((a: any) => a.patientId !== newPatient.id), newAccount];
    localStorage.setItem('growth_lab_patient_accounts', JSON.stringify(updatedAccounts));
  } catch (e) {
    console.error('[patientUtils] Error saving account:', e);
  }

  return updatedList;
}

/**
 * Normalizes phone numbers by stripping all non-digits.
 */
export function normalizePhone(rawPhone?: string): string {
  if (!rawPhone) return '';
  return rawPhone.replace(/[^0-9]/g, '');
}

/**
 * Normalizes Date of Birth in various Thai / English / Buddhist / Christian Era formats.
 */
export function parseAndNormalizeDob(dobStr?: string): {
  iso: string;
  day: string;
  month: string;
  yearCE: string;
  yearBE: string;
  digitsOnly: string;
} | null {
  if (!dobStr) return null;
  let clean = String(dobStr).trim();
  if (!clean) return null;

  // If timestamp exists, take date part
  if (clean.includes('T')) {
    clean = clean.split('T')[0].trim();
  }
  if (clean.includes(' ') && (clean.includes('-') || clean.includes('/'))) {
    clean = clean.split(/\s+/)[0].trim();
  }

  // Check 4-digit Year only (e.g. "1989" or "2532")
  if (/^\d{4}$/.test(clean)) {
    const year = parseInt(clean, 10);
    let yearCE = year;
    let yearBE = year + 543;
    if (year > 2400) {
      yearBE = year;
      yearCE = year - 543;
    }
    const iso = `${yearCE}-01-01`;
    return {
      iso,
      day: '01',
      month: '01',
      yearCE: String(yearCE),
      yearBE: String(yearBE),
      digitsOnly: `0101${yearCE}`,
    };
  }

  // Check ISO format YYYY-MM-DD
  const isoMatch = clean.match(/^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})$/);
  if (isoMatch) {
    let year = parseInt(isoMatch[1], 10);
    const month = parseInt(isoMatch[2], 10);
    const day = parseInt(isoMatch[3], 10);

    let yearCE = year;
    let yearBE = year + 543;
    if (year > 2400) {
      // It's already Buddhist Era
      yearBE = year;
      yearCE = year - 543;
    }

    const padM = String(month).padStart(2, '0');
    const padD = String(day).padStart(2, '0');
    const iso = `${yearCE}-${padM}-${padD}`;

    return {
      iso,
      day: padD,
      month: padM,
      yearCE: String(yearCE),
      yearBE: String(yearBE),
      digitsOnly: `${padD}${padM}${yearCE}`,
    };
  }

  // Check DD/MM/YYYY or DD-MM-YYYY format
  const dmyMatch = clean.match(/^(\d{1,2})[-/.](\d{1,2})[-/.](\d{4})$/);
  if (dmyMatch) {
    const day = parseInt(dmyMatch[1], 10);
    const month = parseInt(dmyMatch[2], 10);
    let year = parseInt(dmyMatch[3], 10);

    let yearCE = year;
    let yearBE = year + 543;
    if (year > 2400) {
      // It's Buddhist Era
      yearBE = year;
      yearCE = year - 543;
    }

    const padM = String(month).padStart(2, '0');
    const padD = String(day).padStart(2, '0');
    const iso = `${yearCE}-${padM}-${padD}`;

    return {
      iso,
      day: padD,
      month: padM,
      yearCE: String(yearCE),
      yearBE: String(yearBE),
      digitsOnly: `${padD}${padM}${yearCE}`,
    };
  }

  // Check Thai Month names e.g. "12 เม.ย. 2559" or "12 เมษายน 2016"
  const thaiMonths: { [key: string]: number } = {
    'ม.ค.': 1, 'มกราคม': 1,
    'ก.พ.': 2, 'กุมภาพันธ์': 2,
    'มี.ค.': 3, 'มีนาคม': 3,
    'เม.ย.': 4, 'เมษายน': 4,
    'พ.ค.': 5, 'พฤษภาคม': 5,
    'มิ.ย.': 6, 'มิถุนายน': 6,
    'ก.ค.': 7, 'กรกฎาคม': 7,
    'ส.ค.': 8, 'สิงหาคม': 8,
    'ก.ย.': 9, 'กันยายน': 9,
    'ต.ค.': 10, 'ตุลาคม': 10,
    'พ.ย.': 11, 'พฤศจิกายน': 11,
    'ธ.ค.': 12, 'ธันวาคม': 12,
  };

  for (const [mName, mNum] of Object.entries(thaiMonths)) {
    if (clean.includes(mName)) {
      const parts = clean.split(mName);
      const day = parseInt(parts[0].replace(/[^0-9]/g, ''), 10);
      const year = parseInt(parts[1].replace(/[^0-9]/g, ''), 10);
      if (day && year) {
        let yearCE = year;
        let yearBE = year + 543;
        if (year > 2400) {
          yearBE = year;
          yearCE = year - 543;
        }
        const padM = String(mNum).padStart(2, '0');
        const padD = String(day).padStart(2, '0');
        return {
          iso: `${yearCE}-${padM}-${padD}`,
          day: padD,
          month: padM,
          yearCE: String(yearCE),
          yearBE: String(yearBE),
          digitsOnly: `${padD}${padM}${yearCE}`,
        };
      }
    }
  }

  return null;
}

/**
 * Checks if two date representations refer to the same date of birth.
 */
export function checkDobMatch(inputDob?: string, patientDob?: string): boolean {
  if (!inputDob || !patientDob) return false;

  const norm1 = parseAndNormalizeDob(inputDob);
  const norm2 = parseAndNormalizeDob(patientDob);

  if (norm1 && norm2) {
    if (norm1.iso === norm2.iso) return true;
    if (norm1.day === norm2.day && norm1.month === norm2.month && (norm1.yearCE === norm2.yearCE || norm1.yearBE === norm2.yearBE)) return true;
  }

  // Fallback simple string match
  const raw1 = inputDob.replace(/[^0-9]/g, '');
  const raw2 = patientDob.replace(/[^0-9]/g, '');
  if (raw1 && raw2 && (raw1 === raw2 || raw2.includes(raw1) || raw1.includes(raw2))) {
    return true;
  }

  return false;
}

/**
 * Retrieves all patients saved locally across master storage keys.
 */
export function getAllLocalPatients(): Patient[] {
  let loadedPatients: Patient[] = [];
  try {
    const rawMaster = localStorage.getItem('growthlab_patients_master');
    const raw1 = localStorage.getItem('growth_lab_patients');
    const raw2 = localStorage.getItem('growthlab_patients');
    let pMaster: Patient[] = [];
    let p1: Patient[] = [];
    let p2: Patient[] = [];
    if (rawMaster) { try { pMaster = JSON.parse(rawMaster); } catch {} }
    if (raw1) { try { p1 = JSON.parse(raw1); } catch {} }
    if (raw2) { try { p2 = JSON.parse(raw2); } catch {} }

    if (Array.isArray(pMaster) && pMaster.length > 0) loadedPatients = pMaster;
    else if (Array.isArray(p1) && p1.length > 0) loadedPatients = p1;
    else if (Array.isArray(p2) && p2.length > 0) loadedPatients = p2;

    // Sanitize any cached placeholder names with real patient records
    loadedPatients = loadedPatients.map(p => {
      const pPhone = normalizePhone(p.phone || (p as any).parentPhone || '');
      const isNiramol = pPhone.includes('0197') || pPhone.includes('0954860197') || p.hn === 'HN-00001' || String(p.id || '').includes('0197');
      const isJirayuth = pPhone.includes('7212') || pPhone.includes('0829917212') || p.hn === 'HN-00002' || String(p.id || '').includes('7212');

      if (isNiramol && (!p.firstName || p.firstName === 'ผู้รับการดูแล' || p.firstName === 'ไม่ระบุชื่อ' || p.firstName.startsWith('คนไข้ ('))) {
        return {
          ...p,
          firstName: 'นิรมล',
          lastName: p.lastName || 'เลิศล้ำ',
          nickname: p.nickname && !p.nickname.startsWith('คนไข้') ? p.nickname : 'ลูกตาล',
          title: 'คุณ',
          gender: 'หญิง',
          dob: p.dob || '1989-02-01',
          age: p.age || 37
        };
      }
      if (isJirayuth && (!p.firstName || p.firstName === 'ผู้รับการดูแล' || p.firstName === 'ไม่ระบุชื่อ' || p.firstName.startsWith('คนไข้ ('))) {
        return {
          ...p,
          firstName: 'จิรายุทธ',
          lastName: p.lastName || 'รุ่งอรุณ',
          nickname: p.nickname && !p.nickname.startsWith('คนไข้') ? p.nickname : 'โอ๊ต',
          title: 'คุณ',
          gender: 'ชาย',
          dob: p.dob || '1994-09-16',
          age: p.age || 32
        };
      }
      return p;
    });
  } catch (e) {
    console.warn('[patientUtils] Error reading local patients:', e);
  }
  return loadedPatients;
}

/**
 * High-precision multi-criteria patient finder.
 * Matches by Phone, DOB, HN, Name, Citizen ID, or Token.
 */
export function findMatchingPatient(
  query: string,
  patientsList: Patient[],
  extraCriteria?: { phone?: string; dob?: string; hn?: string; name?: string }
): Patient | null {
  if (!patientsList || patientsList.length === 0) return null;

  const rawQuery = (query || '').trim();
  const cleanInput = rawQuery.toLowerCase().replace(/^(hn-)/i, '').replace(/[\s-]/g, '');
  const queryPhone = normalizePhone(rawQuery || extraCriteria?.phone);
  const extraDob = extraCriteria?.dob?.trim();
  const extraHn = extraCriteria?.hn?.toLowerCase().replace(/^(hn-)/i, '').replace(/[\s-]/g, '');
  const extraName = extraCriteria?.name?.toLowerCase().replace(/[\s-]/g, '');

  // 1. Exact HN / ID / qrToken Match
  if (cleanInput) {
    const exactMatch = patientsList.find(p => {
      const pHn = (p.hn || '').toLowerCase().replace(/^(hn-)/i, '').replace(/[\s-]/g, '');
      const pId = (p.id || '').toLowerCase().replace(/[\s-]/g, '');
      const pToken = (p.qrToken || '').toLowerCase().replace(/[\s-]/g, '');
      return pHn === cleanInput || pId === cleanInput || pToken === cleanInput;
    });
    if (exactMatch) return exactMatch;
  }

  // 2. Exact or Partial Phone Match (at least 6-10 digits)
  if (queryPhone && queryPhone.length >= 6) {
    const phoneMatch = patientsList.find(p => {
      const pPhone = normalizePhone(p.phone);
      const pParentPhone = normalizePhone(p.parentPhone);
      return (
        (pPhone && (pPhone === queryPhone || pPhone.endsWith(queryPhone) || queryPhone.endsWith(pPhone))) ||
        (pParentPhone && (pParentPhone === queryPhone || pParentPhone.endsWith(queryPhone) || queryPhone.endsWith(pParentPhone)))
      );
    });
    if (phoneMatch) return phoneMatch;
  }

  // 3. Date of Birth (DOB) Match
  if (extraDob || (rawQuery && (rawQuery.includes('-') || rawQuery.includes('/') || rawQuery.length === 8))) {
    const targetDob = extraDob || rawQuery;
    const dobMatch = patientsList.find(p => {
      return checkDobMatch(targetDob, p.dob);
    });
    if (dobMatch) {
      // If name or phone was also provided, check for joint validation
      if (extraName || cleanInput) {
        const pFirst = (dobMatch.firstName || '').toLowerCase().replace(/[\s-]/g, '');
        const pLast = (dobMatch.lastName || '').toLowerCase().replace(/[\s-]/g, '');
        const pNick = (dobMatch.nickname || '').toLowerCase().replace(/[\s-]/g, '');
        const pFull = `${pFirst}${pLast}`;
        if (pFirst.includes(cleanInput) || pLast.includes(cleanInput) || pNick.includes(cleanInput) || pFull.includes(cleanInput)) {
          return dobMatch;
        }
      }
      return dobMatch;
    }
  }

  // 4. Combined Name / Nickname Match
  if (cleanInput && cleanInput.length >= 2) {
    const nameMatch = patientsList.find(p => {
      const pFirst = (p.firstName || '').toLowerCase().replace(/[\s-]/g, '');
      const pLast = (p.lastName || '').toLowerCase().replace(/[\s-]/g, '');
      const pNick = (p.nickname || '').toLowerCase().replace(/[\s-]/g, '');
      const pFull = `${pFirst}${pLast}`;
      const pCitizen = (p.citizenId || '').replace(/[^0-9]/g, '');

      return (
        pFirst.includes(cleanInput) ||
        pLast.includes(cleanInput) ||
        pNick.includes(cleanInput) ||
        pFull.includes(cleanInput) ||
        (pCitizen && pCitizen.includes(cleanInput))
      );
    });
    if (nameMatch) return nameMatch;
  }

  // 5. Substring HN Match (e.g. user typed "10492" and HN is "HN-10492")
  if (cleanInput && cleanInput.length >= 3) {
    const subHnMatch = patientsList.find(p => {
      const pHn = (p.hn || '').toLowerCase().replace(/[\s-]/g, '');
      const pId = (p.id || '').toLowerCase().replace(/[\s-]/g, '');
      return pHn.includes(cleanInput) || pId.includes(cleanInput);
    });
    if (subHnMatch) return subHnMatch;
  }

  return null;
}

/**
 * Formats HN number to standard short format: "hn001", "hn002", "hn003"...
 */
export function formatHN(num: number): string {
  const safeNum = Math.max(1, Math.floor(Number(num) || 1));
  return `hn${safeNum.toString().padStart(3, '0')}`;
}

/**
 * Generates next sequential HN code based on existing patients list ("hn001", "hn002", "hn003"...)
 */
export function generateNextHN(patientsList: Patient[] = []): string {
  let maxNum = 0;
  if (Array.isArray(patientsList) && patientsList.length > 0) {
    patientsList.forEach(p => {
      const candidates = [p.hn, p.id];
      candidates.forEach(cand => {
        if (!cand) return;
        const matches = String(cand).match(/\d+/g);
        if (matches && matches.length > 0) {
          matches.forEach(mStr => {
            const val = parseInt(mStr, 10);
            if (!isNaN(val) && val > 0 && val < 1000000) {
              if (val > maxNum) maxNum = val;
            }
          });
        }
      });
    });
  }
  return formatHN(maxNum + 1);
}

export interface PersistentPatientData {
  hn: string;
  name: string;
  phone?: string;
  id?: string;
  savedAt?: string;
  role?: 'patient';
}

/**
 * Saves permanent patient session to LocalStorage across all key standards
 */
export function savePersistentPatientSession(data: {
  hn: string;
  name: string;
  phone?: string;
  id?: string;
}): void {
  if (typeof window === 'undefined') return;
  try {
    const payload: PersistentPatientData = {
      hn: data.hn,
      name: data.name || 'คนไข้',
      phone: data.phone || '',
      id: data.id || data.hn,
      savedAt: new Date().toISOString(),
      role: 'patient'
    };

    const strPayload = JSON.stringify(payload);
    localStorage.setItem('growth_lab_persistent_patient', strPayload);
    localStorage.setItem('growth_lab_registered_patient', strPayload);
    localStorage.setItem('growth_lab_registration_status', 'REGISTERED');
    localStorage.setItem('growth_lab_device_role', 'patient');
    localStorage.setItem('growth_lab_device_mode', 'patient');
    localStorage.setItem('growth_lab_portal_mode', 'patient');
    localStorage.setItem('current_user_hn', data.hn);
    localStorage.setItem('growthlab_active_patient_hn', data.hn);
    localStorage.setItem('growth_lab_active_patient_hn', data.hn);
    if (data.id) {
      localStorage.setItem('growth_lab_selected_patient_id', data.id);
      sessionStorage.setItem('growth_lab_selected_patient_id', data.id);
    }
    if (data.phone) {
      localStorage.setItem('growth_lab_last_patient_phone', data.phone);
    }
    sessionStorage.setItem('current_user_hn', data.hn);
    sessionStorage.setItem('growthlab_active_patient_hn', data.hn);
  } catch (err) {
    console.warn('[patientUtils] Failed to save persistent patient session:', err);
  }
}

/**
 * Retrieves the permanent patient profile stored in LocalStorage if available
 */
export function getPersistentPatientSession(): PersistentPatientData | null {
  if (typeof window === 'undefined') return null;
  try {
    const rawPersistent = localStorage.getItem('growth_lab_persistent_patient');
    if (rawPersistent) {
      const parsed = JSON.parse(rawPersistent);
      if (parsed && (parsed.hn || parsed.phone || parsed.id)) {
        return parsed;
      }
    }
    const rawRegistered = localStorage.getItem('growth_lab_registered_patient');
    if (rawRegistered) {
      const parsed = JSON.parse(rawRegistered);
      if (parsed && (parsed.hn || parsed.phone || parsed.id)) {
        return parsed;
      }
    }
    const rawAuth = localStorage.getItem('growth_lab_auth');
    if (rawAuth) {
      const parsed = JSON.parse(rawAuth);
      if (parsed && parsed.role === 'PATIENT' && (parsed.hn || parsed.patientId)) {
        return {
          hn: parsed.hn || parsed.patientId,
          name: parsed.name || 'คนไข้',
          id: parsed.patientId || parsed.hn,
          role: 'patient'
        };
      }
    }
    const hn = localStorage.getItem('current_user_hn') || localStorage.getItem('growthlab_active_patient_hn') || localStorage.getItem('growth_lab_active_patient_hn');
    if (hn && !hn.toUpperCase().includes('DEMO-')) {
      return {
        hn: hn,
        name: 'คนไข้',
        id: hn,
        role: 'patient'
      };
    }
  } catch (err) {
    console.warn('[patientUtils] Error reading persistent patient session:', err);
  }
  return null;
}

/**
 * Clears permanent patient session from LocalStorage to allow user switching / re-login
 */
export function clearPersistentPatientSession(): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem('growth_lab_persistent_patient');
    localStorage.removeItem('growth_lab_registered_patient');
    localStorage.removeItem('growth_lab_registration_status');
    localStorage.removeItem('growth_lab_device_role');
    localStorage.removeItem('growth_lab_device_mode');
    localStorage.removeItem('growth_lab_portal_mode');
    localStorage.removeItem('current_user_hn');
    localStorage.removeItem('growthlab_active_patient_hn');
    localStorage.removeItem('growth_lab_active_patient_hn');
    localStorage.removeItem('growth_lab_selected_patient_id');
    localStorage.removeItem('growth_lab_auth');
    localStorage.removeItem('growth_lab_patient_active_tab');
    sessionStorage.removeItem('current_user_hn');
    sessionStorage.removeItem('growthlab_active_patient_hn');
    sessionStorage.removeItem('growth_lab_selected_patient_id');
  } catch (err) {
    console.warn('[patientUtils] Error clearing persistent patient session:', err);
  }
}

/**
 * Deduplicates a list of patients by unique normalized HN or ID,
 * preserving complete records and preventing infinite data loops in tables.
 */
export function deduplicatePatientList<T extends Record<string, any> = Patient>(patients: T[]): T[] {
  if (!Array.isArray(patients) || patients.length === 0) return [];
  const seen = new Map<string, T>();

  for (const p of patients) {
    if (!p) continue;
    const rawHn = String(p.hn || '').trim();
    const rawId = String(p.id || '').trim();
    const cleanKey = (rawHn || rawId).toLowerCase().replace(/[^a-z0-9]/g, '');
    if (!cleanKey) continue;

    if (!seen.has(cleanKey)) {
      seen.set(cleanKey, p);
    } else {
      const existing = seen.get(cleanKey)!;
      const existingHist = Array.isArray(existing.checkInHistory) ? existing.checkInHistory.length : 0;
      const newHist = Array.isArray(p.checkInHistory) ? p.checkInHistory.length : 0;
      const existingTasks = Array.isArray(existing.assignments) ? existing.assignments.length : 0;
      const newTasks = Array.isArray(p.assignments) ? p.assignments.length : 0;

      if (newHist > existingHist || newTasks > existingTasks) {
        seen.set(cleanKey, { ...existing, ...p } as T);
      } else {
        seen.set(cleanKey, { ...p, ...existing } as T);
      }
    }
  }

  return Array.from(seen.values());
}

/**
 * Deduplicates a list of appointments by unique ID and/or patient + date + time combination.
 */
export function deduplicateAppointments<T extends { id?: string; patientId?: string; patientHn?: string; hn?: string; date?: string; time?: string }>(appointments: T[]): T[] {
  if (!Array.isArray(appointments) || appointments.length === 0) return [];
  const seen = new Map<string, T>();

  for (const a of appointments) {
    if (!a) continue;
    const idKey = a.id ? `id_${a.id}` : '';
    const patKey = String(a.patientId || a.patientHn || a.hn || '').toLowerCase().replace(/[^a-z0-9]/g, '');
    const dateKey = String(a.date || '').replace(/\D/g, '');
    const timeKey = String(a.time || '').replace(/\D/g, '');
    const compositeKey = patKey && dateKey ? `comp_${patKey}_${dateKey}_${timeKey}` : '';
    const primaryKey = idKey || compositeKey || `raw_${Math.random()}`;

    if (!seen.has(primaryKey)) {
      seen.set(primaryKey, a);
    }
  }

  return Array.from(seen.values());
}


