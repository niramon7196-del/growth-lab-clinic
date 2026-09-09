import fs from 'fs';

const file = 'src/context/PatientContext.tsx';
let content = fs.readFileSync(file, 'utf8');

const targetUseEffect = `        useEffect(() => {
    if (localStorage.getItem('growth_lab_wiped_v5') !== 'true') {
      const realPatient = {
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
      };
      
      setPatients([realPatient]);
      localStorage.setItem('growth_lab_patients', JSON.stringify([realPatient]));
      localStorage.setItem('growthlab_patients', JSON.stringify([realPatient]));
      localStorage.setItem('growth_lab_wiped_v5', 'true');
    }
  }, []);`;

content = content.replace(targetUseEffect, '');

fs.writeFileSync(file, content);
console.log('Patched PatientContext.tsx');
