import fs from 'fs';

const file = 'src/components/AssignedExercisesView.tsx';
let content = fs.readFileSync(file, 'utf8');

const targetArray = `    {
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
    }`;

const newArray = `    {
      id: \`asgn_\${patient.id}_posture_wall\`,
      patientId: patient.id,
      exerciseId: 'posture_7',
      reps: 1,
      durationMinutes: 5,
      startDate: todayStr,
      status: 'pending' as const,
      instruction: 'ท่ายืนปรับบุคลิกภาพ (Posture Alignment & Wall Stand)'
    },
    {
      id: \`asgn_\${patient.id}_jump_bone\`,
      patientId: patient.id,
      exerciseId: 'EX_1',
      reps: 50,
      durationMinutes: 5,
      startDate: todayStr,
      status: 'pending' as const,
      instruction: 'ท่ากระโดดกระตุ้นการเจริญเติบโต (Bone Loading)'
    },
    {
      id: \`asgn_\${patient.id}_spine_stretch\`,
      patientId: patient.id,
      exerciseId: 'EX_2',
      reps: 10,
      durationMinutes: 5,
      startDate: todayStr,
      status: 'pending' as const,
      instruction: 'ท่ายืดเหยียดแนวกระดูกสันหลัง (Spinal Stretch)'
    },
    {
      id: \`asgn_\${patient.id}_tongue_spot\`,
      patientId: patient.id,
      exerciseId: 'tongue_3',
      reps: 10,
      durationMinutes: 5,
      startDate: todayStr,
      status: 'pending' as const,
      instruction: 'ท่าบริหารกล้ามเนื้อช่องปากและลิ้น (Tongue/Lip Seal)'
    }`;

content = content.replace(targetArray, newArray);

const pushGnsSleepTarget = `    const hasGns = baseAssignments.some(a => a.exerciseId === 'nutrition_gns');
    const hasSleep = baseAssignments.some(a => a.exerciseId === 'sleep_ef');
    if (!hasGns) finalAssignments.push(default4StageMissions[0]);
    if (!hasSleep) finalAssignments.push(default4StageMissions[1]);`;
content = content.replace(pushGnsSleepTarget, `    // 4 standard missions are all pushed if nothing else matches (they are already in baseAssignments if empty)`);

fs.writeFileSync(file, content);
console.log('Patched AssignedExercisesView.tsx');
