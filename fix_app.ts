import fs from 'fs';
const appFile = 'src/App.tsx';
let content = fs.readFileSync(appFile, 'utf8');

const wipeCode = `
  useEffect(() => {
    if (localStorage.getItem('growth_lab_wiped_v2') !== 'true') {
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
        growthStage: "Late Adolescence"
      };
      
      setPatients([realPatient]);
      localStorage.setItem('growth_lab_patients', JSON.stringify([realPatient]));
      localStorage.setItem('growthlab_patients', JSON.stringify([realPatient]));
      localStorage.setItem('growth_lab_wiped_v2', 'true');
    }
  }, []);
`;

if (!content.includes('growth_lab_wiped_v2')) {
  content = content.replace('const [patients, setPatients] = useState<Patient[]>(() => {', wipeCode + '\n  const [patients, setPatients] = useState<Patient[]>(() => {');
  fs.writeFileSync(appFile, content);
}
