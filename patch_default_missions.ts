import fs from 'fs';

const file = 'src/components/AssignedExercisesView.tsx';
let content = fs.readFileSync(file, 'utf8');

const newMissions = `  const default4StageMissions: HomeworkAssignment[] = useMemo(() => [
    {
      id: \`asgn_\${patient.id}_gns\`,
      patientId: patient.id,
      exerciseId: 'nutrition_gns',
      reps: 1,
      durationMinutes: 5,
      startDate: todayStr,
      status: 'pending' as const,
      instruction: 'บันทึกสารอาหาร โปรตีน แคลเซียม และการดื่มน้ำประจำวัน'
    },
    {
      id: \`asgn_\${patient.id}_sleep_ef\`,
      patientId: patient.id,
      exerciseId: 'sleep_ef',
      reps: 1,
      durationMinutes: 480,
      startDate: todayStr,
      status: 'pending' as const,
      instruction: 'บันทึกเวลานอน คะแนนคุณภาพการนอน และชั่วโมงใส่อุปกรณ์ EF'
    },
    {
      id: \`asgn_\${patient.id}_posture_wall\`,
      patientId: patient.id,
      exerciseId: 'posture_wall',
      reps: 1,
      durationMinutes: 5,
      startDate: todayStr,
      status: 'pending' as const,
      instruction: 'ท่ายืนปรับบุคลิกภาพ (Posture Alignment & Wall Stand)'
    },
    {
      id: \`asgn_\${patient.id}_jump_bone\`,
      patientId: patient.id,
      exerciseId: 'jump_bone',
      reps: 50,
      durationMinutes: 5,
      startDate: todayStr,
      status: 'pending' as const,
      instruction: 'ท่ากระโดดกระตุ้นการเจริญเติบโต (Bone Loading / Growth Plate Stimulation)'
    },
    {
      id: \`asgn_\${patient.id}_spine_stretch\`,
      patientId: patient.id,
      exerciseId: 'spine_stretch',
      reps: 10,
      durationMinutes: 5,
      startDate: todayStr,
      status: 'pending' as const,
      instruction: 'ท่ายืดเหยียดแนวกระดูกสันหลัง (Spinal Stretch & Decompression)'
    },
    {
      id: \`asgn_\${patient.id}_tongue_spot\`,
      patientId: patient.id,
      exerciseId: 'tongue_spot',
      reps: 10,
      durationMinutes: 5,
      startDate: todayStr,
      status: 'pending' as const,
      instruction: 'ท่าบริหารกล้ามเนื้อช่องปากและลิ้น (Tongue Spot & Lip Seal)'
    }
  ], [patient.id, todayStr]);`;

// Regex replacement
content = content.replace(/const default4StageMissions[\s\S]*?\]\, \[patient\.id, todayStr\]\);/, newMissions);

fs.writeFileSync(file, content);
console.log('Patched default missions');
