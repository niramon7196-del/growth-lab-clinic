import fs from 'fs';

const file = 'src/components/AssignedExercisesView.tsx';
let content = fs.readFileSync(file, 'utf8');

const target1 = `export default function AssignedExercisesView({ 
  patient, 
  onBack,`;

const rep1 = `const FALLBACK_PATIENT: Patient = {
  id: 'guest',
  hn: 'HN-GUEST',
  title: 'ผู้รับการดูแล',
  firstName: 'ผู้ใช้งาน',
  lastName: 'ทั่วไป',
  age: 0,
  gender: 'other',
  phone: '',
  startDate: new Date().toISOString().split('T')[0],
  status: 'active',
  assignments: []
};

export default function AssignedExercisesView({ 
  patient: inputPatient, 
  onBack,`;

content = content.replace(target1, rep1);

const target2 = `}: AssignedExercisesViewProps) {
  const [selectedStageTab, setSelectedStageTab] = useState<'all' | 'gns' | 'sleep' | 'exercise' | 'omt'>(initialStage || 'all');`;

const rep2 = `}: AssignedExercisesViewProps) {
  const patient = inputPatient || FALLBACK_PATIENT;
  const [selectedStageTab, setSelectedStageTab] = useState<'all' | 'gns' | 'sleep' | 'exercise' | 'omt'>(initialStage || 'all');`;

content = content.replace(target2, rep2);

fs.writeFileSync(file, content);
console.log('Patched AssignedExercisesView.tsx');
