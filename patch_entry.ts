import fs from 'fs';

const file = 'src/components/PatientPortalEntry.tsx';
let content = fs.readFileSync(file, 'utf8');

const target1 = `    // 4. Auto-Registration ONLY if explicit valid QR data payload is present
    const urlPayload = decodePatientDataFromUrl();
    if (!matchedPatient && usrQuery && urlPayload && (urlPayload.firstName || urlPayload.name)) {
      console.log('[PatientPortalEntry] Scanned QR with valid payload data:', usrQuery, urlPayload);
      matchedPatient = createAutoRegisteredPatient(usrQuery, urlPayload);
      savePatientToLocalStorage(matchedPatient);
    } else if (matchedPatient && urlPayload) {
      if (urlPayload.firstName) matchedPatient.firstName = urlPayload.firstName;
      if (urlPayload.lastName !== undefined) matchedPatient.lastName = urlPayload.lastName;
      if (urlPayload.nickname) matchedPatient.nickname = urlPayload.nickname;
      if (urlPayload.age) matchedPatient.age = urlPayload.age;
      if (urlPayload.gender) matchedPatient.gender = urlPayload.gender;
      
      savePatientToLocalStorage(matchedPatient);
    }`;

const rep1 = `    // 4. Auto-Registration ONLY if explicit valid QR data payload is present
    const urlPayload = decodePatientDataFromUrl();
    if (!matchedPatient && usrQuery && urlPayload && (urlPayload.firstName || urlPayload.name)) {
      console.log('[PatientPortalEntry] Scanned QR with valid payload data:', usrQuery, urlPayload);
      matchedPatient = createAutoRegisteredPatient(usrQuery, urlPayload);
      savePatientToLocalStorage(matchedPatient);
    } else if (matchedPatient && urlPayload) {
      if (urlPayload.firstName) matchedPatient.firstName = urlPayload.firstName;
      if (urlPayload.lastName !== undefined) matchedPatient.lastName = urlPayload.lastName;
      if (urlPayload.nickname) matchedPatient.nickname = urlPayload.nickname;
      if (urlPayload.age) matchedPatient.age = urlPayload.age;
      if (urlPayload.gender) matchedPatient.gender = urlPayload.gender;
      
      savePatientToLocalStorage(matchedPatient);
    }

    // 5. Fallback auto-creation for ANY unrecognized login attempt (to support new devices)
    if (!matchedPatient) {
      console.log('[PatientPortalEntry] New device fallback creation for:', usrQuery);
      matchedPatient = {
        id: \`patient_\${Date.now()}\`,
        hn: usrQuery.startsWith('HN') ? usrQuery : \`HN-\${usrQuery}\`,
        firstName: 'ผู้ใช้งาน',
        lastName: 'ใหม่',
        age: 0,
        gender: 'other',
        phone: usrQuery.match(/\\d/g)?.join('') || '',
        startDate: new Date().toISOString().split('T')[0],
        status: 'active',
        assignments: []
      };
      savePatientToLocalStorage(matchedPatient);
    }`;

content = content.replace(target1, rep1);
fs.writeFileSync(file, content);
console.log('Patched PatientPortalEntry.tsx');
