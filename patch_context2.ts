import fs from 'fs';

const file = 'src/context/PatientContext.tsx';
let content = fs.readFileSync(file, 'utf8');

const regex = /useEffect\(\(\) => \{\s*if \(localStorage\.getItem\('growth_lab_wiped_v5'\) !== 'true'\) \{[\s\S]*?\}\s*\}, \[\]\);/g;

content = content.replace(regex, '');

fs.writeFileSync(file, content);
console.log('Patched PatientContext.tsx');
