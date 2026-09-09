export { 
  app, 
  db, 
  auth, 
  isFirebaseConfigured, 
  savePatientToFirestore, 
  subscribePatientByHN, 
  addDailyLog, 
  getPatientByHN, 
  subscribeAllPatients,
  handleFirestoreError,
  OperationType
} from '../firebaseConfig';
export type { FirestoreErrorInfo } from '../firebaseConfig';
