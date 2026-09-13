import type { VercelRequest, VercelResponse } from '@vercel/node';

/**
 * โครงสร้างข้อมูลกิจกรรม (Activity Payload)
 * อิงคำอธิบายประเภทข้อมูล (สตริง, บูลีน, ตัวเลข)
 */
export interface ActivityRequestPayload {
  // รหัสและประเภทกิจกรรม
  ประเภท: 'เช็คอิน' | 'เข้าใช้ระบบ' | 'ทำแบบฝึกหัด' | string; // สตริง (String)
  รหัสคนไข้: string; // สตริง (String)
  รหัสประจำตัวHN: string; // สตริง (String)
  ชื่อผู้รับการดูแล: string; // สตริง (String)
  
  // สถานะและตัววัด (บูลีนและตัวเลข)
  สถานะสำเร็จ: boolean; // บูลีน (Boolean)
  คะแนนความสม่ำเสมอ: number; // ตัวเลข (Number)
  จำนวนแบบฝึกหัดที่ทำเสร็จ: number; // ตัวเลข (Number)
  จำนวนภารกิจทั้งหมด: number; // ตัวเลข (Number)
  ใส่อุปกรณ์EF: boolean; // บูลีน (Boolean)
  จำนวนชั่วโมงใส่EF?: number; // ตัวเลข (Number)
  
  // วันเวลาและหมายเหตุ
  วันที่: string; // สตริง (String - YYYY-MM-DD)
  เวลา: string; // สตริง (String - HH:mm:ss)
  หมายเหตุ: string; // สตริง (String)
  
  // ข้อมูลเพิ่มเติม (Metadata)
  ข้อมูลเพิ่มเติม?: Record<string, any>;
  
  // ข้อมูลภาษาอังกฤษเผื่อรับค่าแบบ Generic
  type?: string;
  patientId?: string;
  hn?: string;
  patientName?: string;
  activity?: string;
  status?: boolean | string;
  score?: number;
  metadata?: Record<string, any>;
  timestamp?: string;
}

/**
 * โครงสร้างข้อมูลสรุปยอดรายวัน (Daily Summary Data Structure)
 */
export interface DailySummaryPayload {
  วันที่สรุปยอด: string; // สตริง (String - YYYY-MM-DD)
  เวลาตัดรอบ: string; // สตริง (String - e.g. "21:00:00")
  สถานะเลยเวลาตัดรอบ21นาฬิกา: boolean; // บูลีน (Boolean)
  รวมจำนวนกิจกรรมวันนี้: number; // ตัวเลข (Number)
  รวมยอดเช็คอินสำเร็จ: number; // ตัวเลข (Number)
  รวมยอดทำแบบฝึกหัด: number; // ตัวเลข (Number)
  รวมยอดเข้าใช้งาน: number; // ตัวเลข (Number)
  รายการกิจกรรม: Array<{
    เวลา: string; // สตริง
    รหัสประจำตัวHN: string; // สตริง
    ชื่อ: string; // สตริง
    กิจกรรม: string; // สตริง
    สถานะสำเร็จ: boolean; // บูลีน
  }>;
}

/**
 * ตัวแปรเก็บแคชชั่วคราวใน Memory ของ Serverless Instance
 */
const activityMemoryStore: {
  date: string;
  records: Array<ActivityRequestPayload & { receivedAt: string }>;
  isCutOffSummarized: boolean;
} = {
  date: new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Bangkok' }),
  records: [],
  isCutOffSummarized: false,
};

/**
 * ฟังก์ชันคำนวณและตรวจสอบเวลาปัจจุบันในโซนเวลาประเทศไทย (Asia/Bangkok)
 * ตรวจสอบเงื่อนไขการตัดยอด 21:00 น. (3 ทุ่ม)
 */
function getBangkokTimeInfo() {
  const now = new Date();
  
  // แปลงเวลาเป็น TimeZone ประเทศไทย
  const bangkokDateStr = now.toLocaleDateString('en-CA', { timeZone: 'Asia/Bangkok' }); // YYYY-MM-DD
  const bangkokTimeStr = now.toLocaleTimeString('th-TH', { 
    timeZone: 'Asia/Bangkok', 
    hour12: false, 
    hour: '2-digit', 
    minute: '2-digit', 
    second: '2-digit' 
  }); // HH:mm:ss

  const [hourStr, minStr] = bangkokTimeStr.split(':');
  const currentHour = parseInt(hourStr, 10);
  const currentMinute = parseInt(minStr, 10);

  // ตัดยอดเมื่อถึงหรือเลยเวลา 21:00 น. (3 ทุ่ม)
  const isPast21PM = currentHour >= 21;

  return {
    todayDate: bangkokDateStr,
    currentTime: bangkokTimeStr,
    currentHour,
    currentMinute,
    isPast21PM,
  };
}

/**
 * ฟังก์ชันบันทึกกิจกรรมลงระบบ Realtime DB / Local Storage Cache
 * รับพารามิเตอร์สัมพันธ์กับ ActivityRequestPayload และคืนค่าประเภทข้อมูลที่ถูกต้อง
 */
export async function saveToRealtimeDB(
  activity: ActivityRequestPayload
): Promise<{
  สำเร็จ: boolean;
  รหัสบันทึก: string;
  เวลาที่บันทึก: string;
  ข้อมูล: ActivityRequestPayload;
}> {
  const timestamp = new Date().toISOString();
  const recordWithMeta = {
    ...activity,
    receivedAt: timestamp,
  };

  // บันทึกลง Memory Store
  activityMemoryStore.records.push(recordWithMeta);

  return {
    สำเร็จ: true,
    รหัสบันทึก: `act_${Date.now()}_${activity.รหัสประจำตัวHN || 'anon'}`,
    เวลาที่บันทึก: timestamp,
    ข้อมูล: activity,
  };
}

/**
 * ฟังก์ชันดึงข้อมูลสรุปยอดรายวันจากระบบฐานข้อมูล
 * คืนค่า DailySummaryPayload ที่สัมพันธ์กับ ActivityRequestPayload
 */
export async function getDailySummaryFromDB(
  targetDate?: string
): Promise<DailySummaryPayload> {
  const { todayDate, currentTime, isPast21PM } = getBangkokTimeInfo();
  const dateToQuery = targetDate || todayDate;

  // กรองเฉพาะรายการของวันที่ระบุ
  const matchedRecords = activityMemoryStore.records.filter(
    (r) => r.วันที่ === dateToQuery || r.receivedAt.startsWith(dateToQuery)
  );

  const totalActivities = matchedRecords.length;
  const completedCheckIns = matchedRecords.filter(
    (r) => (r.ประเภท.includes('เช็คอิน') || r.type === 'check_in') && r.สถานะสำเร็จ
  ).length;
  const completedExercises = matchedRecords.filter(
    (r) => r.ประเภท.includes('แบบฝึกหัด') || r.ประเภท.includes('exercise') || r.type === 'exercise'
  ).length;
  const portalLogins = matchedRecords.filter(
    (r) => r.ประเภท.includes('เข้าใช้ระบบ') || r.ประเภท.includes('login') || r.type === 'login'
  ).length;

  const summary: DailySummaryPayload = {
    วันที่สรุปยอด: dateToQuery,
    เวลาตัดรอบ: currentTime,
    สถานะเลยเวลาตัดรอบ21นาฬิกา: isPast21PM,
    รวมจำนวนกิจกรรมวันนี้: totalActivities,
    รวมยอดเช็คอินสำเร็จ: completedCheckIns,
    รวมยอดทำแบบฝึกหัด: completedExercises,
    รวมยอดเข้าใช้งาน: portalLogins,
    รายการกิจกรรม: matchedRecords.map((r) => ({
      เวลา: r.เวลา,
      รหัสประจำตัวHN: r.รหัสประจำตัวHN,
      ชื่อ: r.ชื่อผู้รับการดูแล,
      กิจกรรม: r.ประเภท,
      สถานะสำเร็จ: r.สถานะสำเร็จ,
    })),
  };

  return summary;
}

/**
 * ส่งข้อมูลออกไปยัง Google Apps Script Web App
 */
async function sendToGoogleAppsScript(payload: Record<string, any>) {
  const appsScriptUrl = process.env.APPS_SCRIPT_URL || 
                        process.env.VITE_GOOGLE_SCRIPT_URL || 
                        'https://script.google.com/macros/s/AKfycbyk_1CbD39HQcP8vOXofkPJsYeLOvgklYk608MuK-v4vt4NgUa_Ang73AHpubIO4Pbv/exec';
  
  if (!appsScriptUrl) {
    console.warn('[Vercel Serverless] APPS_SCRIPT_URL is not defined in environment variables.');
    return { success: false, error: 'APPS_SCRIPT_URL not configured' };
  }

  try {
    const response = await fetch(appsScriptUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain;charset=utf-8',
      },
      body: JSON.stringify(payload),
    });

    if (response.ok) {
      const resText = await response.text();
      let resJson: any = {};
      try {
        resJson = JSON.parse(resText);
      } catch {
        resJson = { status: 'success', raw: resText };
      }
      return { success: true, data: resJson };
    }

    return { success: false, error: `HTTP ${response.status} from Google Apps Script` };
  } catch (err: any) {
    console.error('[Vercel Serverless] Error posting to Google Apps Script:', err);
    return { success: false, error: err?.message || 'Failed to dispatch to Google Sheets' };
  }
}

/**
 * Vercel Serverless Function Handler
 * Route: /api/track-activity
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  // รองรับ CORS Preflight
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { todayDate, currentTime, isPast21PM } = getBangkokTimeInfo();

  // รีเซ็ตแคชเมื่อข้ามวันใหม่
  if (activityMemoryStore.date !== todayDate) {
    activityMemoryStore.date = todayDate;
    activityMemoryStore.records = [];
    activityMemoryStore.isCutOffSummarized = false;
  }

  // รองรับ GET Request เพื่อดูสถานะปัจจุบันและการตัดยอด 21:00 น.
  if (req.method === 'GET') {
    return res.status(200).json({
      สถานะการทำงาน: 'ปกติ (Active)', // สตริง
      วันที่ปัจจุบัน: todayDate, // สตริง
      เวลาปัจจุบัน: currentTime, // สตริง
      ตัดรอบ3ทุ่มแล้ว: isPast21PM, // บูลีน
      จำนวนกิจกรรมวันนี้: activityMemoryStore.records.length, // ตัวเลข
      การตัดยอดส่งGoogleSheetsแล้ว: activityMemoryStore.isCutOffSummarized, // บูลีน
    });
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ ข้อผิดพลาด: 'Method Not Allowed (รองรับเฉพาะ POST และ GET)' });
  }

  try {
    const body = req.body || {};

    // แปลงโครงสร้างข้อมูลภาษาไทยและภาษาอังกฤษให้เป็นสถาปัตยกรรมประเภทข้อมูลแบบภาษาไทย
    const activityRecord: ActivityRequestPayload = {
      ประเภท: body.ประเภท || body.type || body.activity || 'เช็คอิน',
      รหัสคนไข้: String(body.รหัสคนไข้ || body.patientId || body.hn || ''),
      รหัสประจำตัวHN: String(body.รหัสประจำตัวHN || body.hn || body.patientId || ''),
      ชื่อผู้รับการดูแล: String(body.ชื่อผู้รับการดูแล || body.patientName || body.name || ''),
      สถานะสำเร็จ: typeof body.สถานะสำเร็จ === 'boolean' ? body.สถานะสำเร็จ : (body.status === true || body.status === 'completed' || body.status === 'SUCCESS'),
      คะแนนความสม่ำเสมอ: Number(body.คะแนนความสม่ำเสมอ ?? body.score ?? 100),
      จำนวนแบบฝึกหัดที่ทำเสร็จ: Number(body.จำนวนแบบฝึกหัดที่ทำเสร็จ ?? body.completedTasks ?? body.metadata?.completedCount ?? 0),
      จำนวนภารกิจทั้งหมด: Number(body.จำนวนภารกิจทั้งหมด ?? body.totalTasks ?? body.metadata?.totalTasks ?? 4),
      ใส่อุปกรณ์EF: typeof body.ใส่อุปกรณ์EF === 'boolean' ? body.ใส่อุปกรณ์EF : Boolean(body.efWorn || body.metadata?.efWorn),
      จำนวนชั่วโมงใส่EF: Number(body.จำนวนชั่วโมงใส่EF ?? body.efDurationHours ?? body.metadata?.efDurationHours ?? 0),
      วันที่: String(body.วันที่ || body.date || todayDate),
      เวลา: String(body.เวลา || body.time || currentTime),
      หมายเหตุ: String(body.หมายเหตุ || body.notes || body.metadata?.notes || ''),
      ข้อมูลเพิ่มเติม: body.ข้อมูลเพิ่มเติม || body.metadata || {},
    };

    // เก็บลง Memory Store สำหรับคำนวณและสรุปยอด
    activityMemoryStore.records.push({
      ...activityRecord,
      receivedAt: new Date().toISOString(),
    });

    // 1. ส่งข้อมูลกิจกรรมแบบเรียลไทม์ (Real-time Sync) ไปยัง Google Sheets ทันที
    const realTimePayload = {
      action: 'logDaily',
      sheetName: 'Daily_Logs',
      targetSheet: 'Daily_Logs',
      timestamp: new Date().toISOString(),
      HN: activityRecord.รหัสประจำตัวHN,
      hn: activityRecord.รหัสประจำตัวHN,
      patientId: activityRecord.รหัสคนไข้,
      patientName: activityRecord.ชื่อผู้รับการดูแล,
      date: activityRecord.วันที่,
      time: activityRecord.เวลา,
      type: activityRecord.ประเภท,
      status: activityRecord.สถานะสำเร็จ ? 'สำเร็จ' : 'ยังไม่เสร็จ',
      completedTasks: activityRecord.จำนวนแบบฝึกหัดที่ทำเสร็จ,
      totalTasks: activityRecord.จำนวนภารกิจทั้งหมด,
      score: activityRecord.คะแนนความสม่ำเสมอ,
      efWorn: activityRecord.ใส่อุปกรณ์EF ? 'ใส่' : 'ไม่ใส่',
      efDurationHours: activityRecord.จำนวนชั่วโมงใส่EF,
      notes: activityRecord.หมายเหตุ,
      payload: activityRecord,
    };

    const realTimeResult = await sendToGoogleAppsScript(realTimePayload);

    // 2. Logic ตรวจเช็คเวลาตัดยอดตอน 3 ทุ่ม (21:00 น.) เพื่อสรุปยอดรายวันยิงเข้า Google Sheets
    let summaryResult: { success: boolean; data?: any; error?: string } | null = null;
    
    if (isPast21PM && !activityMemoryStore.isCutOffSummarized && activityMemoryStore.records.length > 0) {
      // คำนวณสรุปยอดรายวัน ณ เวลา 21:00 น.
      const totalActivities = activityMemoryStore.records.length;
      const completedCheckIns = activityMemoryStore.records.filter(r => r.ประเภท.includes('เช็คอิน') && r.สถานะสำเร็จ).length;
      const completedExercises = activityMemoryStore.records.filter(r => r.ประเภท.includes('แบบฝึกหัด') || r.ประเภท.includes('exercise')).length;
      const portalLogins = activityMemoryStore.records.filter(r => r.ประเภท.includes('เข้าใช้ระบบ') || r.ประเภท.includes('login')).length;

      const dailySummary: DailySummaryPayload = {
        วันที่สรุปยอด: todayDate,
        เวลาตัดรอบ: currentTime,
        สถานะเลยเวลาตัดรอบ21นาฬิกา: true,
        รวมจำนวนกิจกรรมวันนี้: totalActivities,
        รวมยอดเช็คอินสำเร็จ: completedCheckIns,
        รวมยอดทำแบบฝึกหัด: completedExercises,
        รวมยอดเข้าใช้งาน: portalLogins,
        รายการกิจกรรม: activityMemoryStore.records.map(r => ({
          เวลา: r.เวลา,
          รหัสประจำตัวHN: r.รหัสประจำตัวHN,
          ชื่อ: r.ชื่อผู้รับการดูแล,
          กิจกรรม: r.ประเภท,
          สถานะสำเร็จ: r.สถานะสำเร็จ,
        })),
      };

      // ยิงสรุปยอดรายวันเข้า Google Sheets ไปยังแท็บ Monthly_Logs หรือ Daily_Summary
      const summaryPayload = {
        action: 'save_daily_summary',
        sheetName: 'Daily_Logs',
        targetSheet: 'Daily_Logs',
        timestamp: new Date().toISOString(),
        date: todayDate,
        summaryTime: '21:00 น.',
        totalActivities,
        completedCheckIns,
        completedExercises,
        portalLogins,
        notes: `[สรุปยอดรอบ 21:00 น.] เช็คอินสำเร็จ: ${completedCheckIns} คน, ฝึกกล้ามเนื้อ: ${completedExercises} ครั้ง`,
        summaryData: dailySummary,
      };

      summaryResult = await sendToGoogleAppsScript(summaryPayload);
      if (summaryResult.success) {
        activityMemoryStore.isCutOffSummarized = true;
      }
    }

    // ตอบกลับ Client
    return res.status(200).json({
      สำเร็จ: true, // บูลีน
      ข้อความ: 'บันทึกข้อมูลกิจกรรมและประมวลผลเรียลไทม์เรียบร้อยแล้ว', // สตริง
      ข้อมูลกิจกรรม: activityRecord,
      การส่งข้อมูลเรียลไทม์: realTimeResult,
      การตัดยอด3ทุ่ม: {
        เลยเวลา21นาฬิกา: isPast21PM, // บูลีน
        สถานะการส่งสรุปยอด: activityMemoryStore.isCutOffSummarized ? 'สรุปยอดแล้ว' : 'รอตัดรอบ 21:00 น.', // สตริง
        ผลการส่งสรุปยอด: summaryResult,
      },
    });

  } catch (error: any) {
    console.error('[Vercel Serverless /api/track-activity] Error:', error);
    return res.status(500).json({
      สำเร็จ: false, // บูลีน
      ข้อผิดพลาด: error?.message || 'เกิดข้อผิดพลาดภายในระบบ Serverless', // สตริง
    });
  }
}
