import fs from 'fs';

const file = 'src/components/PatientsList.tsx';
let content = fs.readFileSync(file, 'utf8');

const target1 = `{patients.length === 0 ? 'ยังไม่มีรายชื่อผู้รับการดูแล (กด + เพิ่มคนไข้ใหม่)' : 'ไม่พบข้อมูลที่ตรงกับคำค้นหา'}`;
const rep1 = `{patients.length === 0 ? 'ยังไม่มีข้อมูลผู้รับการดูแล กรุณากดปุ่ม + เพิ่มคนไข้ใหม่' : 'ไม่พบข้อมูลที่ตรงกับคำค้นหา'}`;

// Replace globally
content = content.split(target1).join(rep1);

fs.writeFileSync(file, content);
console.log('Patched empty state text');
