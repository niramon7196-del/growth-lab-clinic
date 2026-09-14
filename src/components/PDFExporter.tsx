import React, { useState } from 'react';
import { FileText, Printer, FileDown, Calendar, Star, Award, CheckCircle2, CloudUpload, Check, AlertCircle, RefreshCw } from 'lucide-react';
import { Patient, SessionLog } from '../types';
import { uploadFileToGoogleDrive } from '../services/googleDriveSheetsService';
import { signInWithGoogleWorkspace, getGoogleAccessToken } from '../services/googleAuthService';

interface PDFExporterProps {
  patients: Patient[];
  logs: SessionLog[];
  selectedPatientId?: string;
}

export default function PDFExporter({
  patients,
  logs,
  selectedPatientId,
}: PDFExporterProps) {
  const [reportPatientId, setReportPatientId] = useState<string>(selectedPatientId || '');
  const [doctorOpinion, setDoctorOpinion] = useState(
    'ผู้รับการดูแลมีการตึงกระชับของกล้ามเนื้อริมฝีปากบนดีขึ้นอย่างเห็นได้ชัด ปลดล็อกอัตราการหายใจทางจมูกที่ 95% แนะนำให้รักษาวินัยฝึกฝนในรอบสัปดาห์ถัดไปต่อเนื่อง'
  );

  const activePatientId = selectedPatientId || reportPatientId;
  const selectedPatient = (patients || []).find((p) => p.id === activePatientId);

  // Computations for report
  const patientLogs = selectedPatient ? (logs || []).filter((l) => l.patientId === selectedPatient.id) : [];
  
  // Compliance Rate (unique dates / 30)
  const uniqueDates = new Set((patientLogs || []).map((l) => l.date));
  const complianceRate = Math.min(100, Math.round((uniqueDates.size / 30) * 100));

  // Avg Score
  const avgScore = patientLogs.length > 0
    ? Math.round((patientLogs.reduce((acc, curr) => acc + curr.score, 0) / patientLogs.length) * 10) / 10
    : 0;

  // Exercises breakdown count
  const breathingCount = patientLogs.filter(l => l.exerciseId === 'breathing_1').length;
  const ventilationCount = patientLogs.filter(l => l.exerciseId.startsWith('ventilation_')).length;
  const tongueCount = patientLogs.filter(l => l.exerciseId === 'tongue_3').length;
  const muscleCount = patientLogs.filter(l => l.exerciseId === 'muscle_4').length;

  const [isUploadingToDrive, setIsUploadingToDrive] = useState(false);
  const [driveUploadSuccess, setDriveUploadSuccess] = useState<string | null>(null);
  const [driveUploadError, setDriveUploadError] = useState<string | null>(null);

  const triggerPrint = () => {
    if (!activePatientId) {
      alert('กรุณาเลือกผู้รับการดูแลสำหรับออกรายงานก่อนพิมพ์');
      return;
    }
    window.print();
  };

  const handleUploadReportToDrive = async () => {
    if (!selectedPatient) {
      alert('กรุณาเลือกผู้รับการดูแลก่อน');
      return;
    }

    setIsUploadingToDrive(true);
    setDriveUploadSuccess(null);
    setDriveUploadError(null);

    try {
      let token = await getGoogleAccessToken();
      if (!token) {
        const authResult = await signInWithGoogleWorkspace();
        token = authResult?.accessToken || null;
      }

      if (!token) {
        throw new Error('กรุณาเข้าสู่ระบบ Google เพื่อเข้าถึง Google Drive');
      }

      // Generate structured clinical report JSON/HTML content
      const reportPayload = {
        title: `Growth Lab Clinical Evaluation - ${selectedPatient.firstName} ${selectedPatient.lastName}`,
        hn: selectedPatient.hn,
        patientName: `${selectedPatient.firstName} ${selectedPatient.lastName}`,
        nickname: selectedPatient.nickname || '',
        age: selectedPatient.age,
        complianceRate: `${complianceRate}%`,
        averageScore: avgScore,
        totalSessionsLogged: patientLogs.length,
        exerciseBreakdown: {
          nasalBreathing: breathingCount,
          ventilation: ventilationCount,
          tonguePosture: tongueCount,
          orofacialMuscles: muscleCount,
        },
        clinicianNote: doctorOpinion,
        generatedAt: new Date().toISOString(),
        growthLabVersion: '1.0'
      };

      const fileName = `Report_${selectedPatient.hn || 'HN'}_${selectedPatient.firstName}_${new Date().toISOString().split('T')[0]}.json`;
      const blob = new Blob([JSON.stringify(reportPayload, null, 2)], { type: 'application/json' });

      const uploaded = await uploadFileToGoogleDrive(fileName, 'application/json', blob);
      setDriveUploadSuccess(`บันทึกรายงานขึ้น Google Drive เรียบร้อยแล้ว (ไฟล์: ${uploaded.name})`);
      setTimeout(() => setDriveUploadSuccess(null), 5000);
    } catch (err: any) {
      console.error('[PDFExporter] Drive upload error:', err);
      setDriveUploadError(err.message || 'เกิดข้อผิดพลาดในการอัปโหลดขึ้น Google Drive');
      setTimeout(() => setDriveUploadError(null), 6000);
    } finally {
      setIsUploadingToDrive(false);
    }
  };

  return (
    <div id="pdf-view" className="space-y-6 text-left">
      
      {/* Clinician Instructions Panel - HIDDEN during browser printing */}
      <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs flex flex-col md:flex-row justify-between items-start md:items-center gap-4 print:hidden">
        <div className="space-y-1">
          <h2 className="text-xl font-bold text-slate-800 font-sans">พิมพ์ใบรายงานประเมินผลการฝึก 🖨️</h2>
          <p className="text-slate-400 text-xs">ออกรายงานแพทย์ประเมินความสมส่วนของใบหน้าและดัชนีวินัยการหายใจ พร้อมสำรองขึ้น Google Drive</p>
        </div>

        <div className="flex flex-wrap gap-2.5 w-full md:w-auto items-center">
          <select
            value={activePatientId}
            onChange={(e) => setReportPatientId(e.target.value)}
            className="text-xs font-bold text-slate-700 bg-slate-50 border border-slate-200 rounded-xl p-2.5 focus:bg-white outline-hidden"
          >
            <option value="">-- กรุณาเลือกผู้รับการดูแล --</option>
            {(patients || []).map((p) => (
              <option key={p.id} value={p.id}>
                {p.hn} | {p.firstName} {p.lastName}
              </option>
            ))}
          </select>

          <button
            type="button"
            onClick={handleUploadReportToDrive}
            disabled={!activePatientId || isUploadingToDrive}
            className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs px-4 py-2.5 rounded-xl disabled:opacity-50 transition-colors shadow-xs shrink-0 cursor-pointer min-h-[38px]"
            title="บันทึกและส่งออกข้อมูลรายงานขึ้น Google Drive โดยอัตโนมัติ"
          >
            {isUploadingToDrive ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>กำลังบันทึกขึ้น Drive...</span>
              </>
            ) : (
              <>
                <CloudUpload className="w-4 h-4" />
                <span>สำรองขึ้น Google Drive</span>
              </>
            )}
          </button>

          <button
            onClick={triggerPrint}
            disabled={!activePatientId}
            className="flex items-center gap-1.5 bg-brand text-white font-semibold text-xs px-4 py-2.5 rounded-xl hover:bg-brand-hover disabled:opacity-50 transition-colors shadow-xs shrink-0 cursor-pointer min-h-[38px]"
          >
            <Printer className="w-4 h-4" />
            <span>พิมพ์รายงานแพทย์ / บันทึก PDF</span>
          </button>
        </div>
      </div>

      {driveUploadSuccess && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs font-bold flex items-center gap-2 print:hidden animate-in fade-in">
          <Check className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{driveUploadSuccess}</span>
        </div>
      )}

      {driveUploadError && (
        <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs font-bold flex items-center gap-2 print:hidden animate-in fade-in">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{driveUploadError}</span>
        </div>
      )}

      {reportPatientId && selectedPatient ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* Doctor opinion panel - HIDDEN during printing */}
          <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs lg:col-span-4 space-y-4 print:hidden text-left">
            <h3 className="text-sm font-bold text-slate-800 font-sans flex items-center gap-1.5">
              <FileText className="w-4 h-4 text-brand" />
              <span>ความเห็นของแพทย์ผู้ตรวจ (Clinician's Note)</span>
            </h3>
            <textarea
              value={doctorOpinion}
              onChange={(e) => setDoctorOpinion(e.target.value)}
              placeholder="พิมพ์คำแนะนำเพิ่มเติมนอกเหนือจากผลอัตโนมัติ เพื่อแนบลงในช่องความเห็นในรายงานประเมินผลก่อนสั่งพิมพ์..."
              rows={5}
              className="w-full text-xs p-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white text-slate-700 outline-hidden resize-none leading-relaxed"
            />
            <p className="text-[11px] text-slate-400 leading-relaxed italic">
              💡 ทริค: ข้อความด้านบนจะอัปเดตลงในส่วนท้ายของรายงานด้านขวาแบบเรียลไทม์ และจะปรากฏบนใบปริ้นท์จริงเท่านั้น
            </p>
          </div>

          {/* HIGH-FIDELITY MEDICAL FORM TEMPLATE (Styled with print CSS for perfect export) */}
          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-8 lg:col-span-8 print:border-0 print:shadow-none print:p-0 text-left relative overflow-hidden">
            
            {/* Clinical print style injection inside block */}
            <style dangerouslySetInnerHTML={{__html: `
              @media print {
                body * {
                  visibility: hidden;
                }
                #pdf-view, #pdf-view * {
                  visibility: visible;
                }
                .print\\:hidden {
                  display: none !important;
                }
                /* Target exactly the print sheet block */
                #print-sheet-wrapper {
                  position: absolute;
                  left: 0;
                  top: 0;
                  width: 100%;
                  padding: 20px !important;
                  border: 0 !important;
                  box-shadow: none !important;
                  background: white !important;
                }
              }
            `}} />

            <div id="print-sheet-wrapper" className="space-y-6">
              
              {/* Report Header */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b-2 border-brand pb-5 gap-4">
                <div className="text-left">
                  <h1 className="text-lg md:text-xl font-bold text-brand-dark font-sans">
                    รายงานความสมบูรณ์และวินัยการบริหารกล้ามเนื้อใบหน้า
                  </h1>
                  <p className="text-slate-500 text-xs mt-0.5 font-sans font-medium">
                    คลินิกฝึกกล้ามเนื้อใบหน้าและพัฒนาการรูปหน้า โดย ทันตแพทย์หญิง นภาพร วรรณษา 🩺
                  </p>
                </div>
                <div className="text-right sm:text-right font-mono text-xs">
                  <span className="bg-slate-100 text-slate-700 text-[10px] font-bold px-2 py-0.5 rounded">
                    HN: {selectedPatient.hn}
                  </span>
                  <div className="text-slate-400 text-[10px] mt-1">วันที่ประเมิน: 17 ก.ค. 2026</div>
                </div>
              </div>

              {/* Patient details section */}
              <div className="bg-slate-50 p-4.5 rounded-xl border border-slate-100">
                <h3 className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-3 font-sans">
                  ประวัติข้อมูลผู้รับการดูแล (Biometrics)
                </h3>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
                  <div>
                    <span className="text-slate-400 block font-medium">ชื่อ-สกุล:</span>
                    <span className="font-bold text-slate-700 mt-0.5 block">
                      {selectedPatient.firstName} {selectedPatient.lastName}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block font-medium">ชื่อเล่น:</span>
                    <span className="font-bold text-slate-700 mt-0.5 block">
                      {selectedPatient.nickname}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block font-medium">อายุ:</span>
                    <span className="font-bold text-slate-700 mt-0.5 block">
                      {selectedPatient.age} ปี
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block font-medium">ส่วนสูง / น้ำหนัก:</span>
                    <span className="font-bold text-slate-700 mt-0.5 block">
                      {selectedPatient.height} ซม. / {selectedPatient.weight} กก.
                    </span>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs mt-4 pt-3 border-t border-slate-200/50">
                  <div>
                    <span className="text-slate-400 block font-medium">เบอร์โทรศัพท์ติดต่อ:</span>
                    <span className="font-bold text-slate-700 mt-0.5 block">{selectedPatient.phone}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block font-medium">วันที่เริ่มต้นโปรแกรมฝึก:</span>
                    <span className="font-bold text-slate-700 mt-0.5 block">
                      {new Date(selectedPatient.startDate).toLocaleDateString('th-TH', { day: 'numeric', month: 'long', year: 'numeric' })}
                    </span>
                  </div>
                </div>
              </div>

              {/* Photos Block */}
              <div className="space-y-3">
                <h3 className="text-[11px] font-bold uppercase tracking-wider text-slate-400 font-sans">
                  รูปภาพเปรียบเทียบมุมปากและการเรียงฟัน (Facial Alignment Photos)
                </h3>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="border border-slate-200 rounded-xl p-3 text-center bg-slate-50/20">
                    {selectedPatient.photoBefore ? (
                      <img 
                        src={selectedPatient.photoBefore} 
                        alt="Before" 
                        className="max-h-[140px] mx-auto object-contain rounded-lg"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <div className="h-[140px] flex items-center justify-center text-slate-400 text-xs italic">
                        (ไม่มีรูปภาพก่อนฝึก)
                      </div>
                    )}
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mt-2">
                      ก่อนฝึก (Before)
                    </span>
                  </div>

                  <div className="border border-slate-200 rounded-xl p-3 text-center bg-slate-50/20">
                    {selectedPatient.photoAfter ? (
                      <img 
                        src={selectedPatient.photoAfter} 
                        alt="After" 
                        className="max-h-[140px] mx-auto object-contain rounded-lg"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <div className="h-[140px] flex items-center justify-center text-slate-400 text-xs italic">
                        (ไม่มีรูปภาพหลังฝึก)
                      </div>
                    )}
                    <span className="text-[10px] font-bold text-brand uppercase tracking-wider block mt-2">
                      หลังฝึก (After)
                    </span>
                  </div>
                </div>
              </div>

              {/* Metrics summary */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                
                {/* Score & Compliance */}
                <div className="border border-slate-200 rounded-xl p-4 flex flex-col justify-between">
                  <h4 className="text-xs font-bold text-slate-700 font-sans mb-3">ดัชนีชี้วัดความก้าวหน้า</h4>
                  
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-slate-500">อัตราความสม่ำเสมอ (30 วัน):</span>
                      <span className="text-sm font-bold text-brand font-mono">{complianceRate}%</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-slate-500">คะแนนควบคุมกล้ามเนื้อเฉลี่ย:</span>
                      <span className="text-sm font-bold text-brand font-mono">★ {avgScore} / 10</span>
                    </div>
                  </div>

                  <div className="mt-4 bg-brand-light text-[10px] text-brand-dark p-2 rounded-lg font-medium">
                    * อัตราความสม่ำเสมอคำนวณจากจำนวนวันที่เข้าฝึกจริงจาก 30 วันการรักษาล่าสุด
                  </div>
                </div>

                {/* Exercises volume */}
                <div className="border border-slate-200 rounded-xl p-4">
                  <h4 className="text-xs font-bold text-slate-700 font-sans mb-3">จำนวนเซสชันที่ฝึกสำเร็จรายหมวด</h4>
                  
                  <div className="grid grid-cols-2 gap-2 text-xs font-semibold text-slate-600">
                    <div className="bg-slate-50 p-2 rounded-lg">
                      <span className="text-[10px] text-slate-400 block">1. ฝึกการหายใจ:</span>
                      <span className="text-slate-800 font-mono">{breathingCount} ครั้ง</span>
                    </div>
                    <div className="bg-slate-50 p-2 rounded-lg">
                      <span className="text-[10px] text-slate-400 block">2. การระบายลม:</span>
                      <span className="text-slate-800 font-mono">{ventilationCount} ครั้ง</span>
                    </div>
                    <div className="bg-slate-50 p-2 rounded-lg">
                      <span className="text-[10px] text-slate-400 block">3. ยกสะบักลิ้นดึงหน้า:</span>
                      <span className="text-slate-800 font-mono">{tongueCount} ครั้ง</span>
                    </div>
                    <div className="bg-slate-50 p-2 rounded-lg">
                      <span className="text-[10px] text-slate-400 block">4. กล้ามเนื้อใบหน้า:</span>
                      <span className="text-slate-800 font-mono">{muscleCount} ครั้ง</span>
                    </div>
                  </div>
                </div>

              </div>

              {/* Clinician Opinion */}
              <div className="border-t border-slate-200 pt-4.5">
                <h3 className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2 font-sans">
                  ความเห็นและผลการประเมินจากแพทย์ผู้รักษา (Clinician's Evaluation)
                </h3>
                <div className="p-4 rounded-xl bg-slate-50 text-xs md:text-sm text-slate-700 leading-relaxed min-h-[70px] italic font-sans font-medium">
                  "{doctorOpinion || 'ไม่มีความเห็นเพิ่มเติม'}"
                </div>
              </div>

              {/* Clinician Signature block */}
              <div className="flex justify-between items-end pt-8 pb-4">
                <div className="text-xs text-slate-400 italic">
                  ระบบจัดเตรียมอัตโนมัติ Growth Lab Dental & Orthodontics
                </div>
                <div className="text-center w-56 border-t border-slate-400 pt-2 text-xs text-slate-600">
                  <span className="block font-semibold">ทันตแพทย์หญิง นภาพร วรรณษา</span>
                  <span className="text-[10px] text-slate-500 mt-0.5 block">ทันตแพทย์ผู้ให้การรักษาและเจ้าของคลินิก</span>
                </div>
              </div>

            </div>
          </div>
        </div>
      ) : (
        <div className="text-center py-20 bg-slate-50/50 border border-dashed border-slate-200 rounded-2xl flex flex-col items-center justify-center">
          <Printer className="w-16 h-16 text-slate-300 opacity-60 mb-3" />
          <h3 className="text-lg font-semibold text-slate-700 font-sans">กรุณาเลือกผู้รับการดูแลจากเมนูด้านบน</h3>
          <p className="text-slate-400 text-xs mt-1 max-w-sm">
            เพื่อจัดระเบียบเค้าโครงรายงานทางการแพทย์ และอัปเดตคำแนะนำส่วนตัวของทันตแพทย์ก่อนกดสั่งพิมพ์
          </p>
        </div>
      )}

    </div>
  );
}
