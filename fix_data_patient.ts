import fs from 'fs';
const dataFile = 'src/data.ts';
let content = fs.readFileSync(dataFile, 'utf8');

const correctPatient = `{
    id: "pat_001_niramon",
    hn: "HN-00001",
    qrToken: "tok_pat_001_niramon_hn00001",
    title: "น.ส.",
    firstName: "นิรมล",
    lastName: "เลิศล้ำ",
    nickname: "นิรมล",
    dob: "2010-01-01",
    age: 16,
    gender: "หญิง",
    weight: 45,
    height: 155,
    startDate: new Date().toISOString().split('T')[0],
    createdDate: new Date().toISOString(),
    status: "active",
    phone: "080-000-0000",
    parentName: "-",
    parentPhone: "-",
    notes: "",
    growthStage: "Late Adolescence"
  }`;

content = content.replace(/export const SEED_PATIENTS: Patient\[\] = \[[^\]]*\];/s, `export const SEED_PATIENTS: Patient[] = [${correctPatient}];`);
fs.writeFileSync(dataFile, content);
