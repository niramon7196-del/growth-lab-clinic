import fs from 'fs';

const file = 'src/services/dataAdapter.ts';
let content = fs.readFileSync(file, 'utf8');

// We add a filtering helper
const filterLogic = `function filterValidPatients(parsed: any[]): Patient[] {
  return parsed.filter((p: any) => {
    if (!p) return false;
    if (p.hn?.includes('DEMO-') || p.id?.toLowerCase().includes('demo')) return false;
    const isInvalidHn = !p.hn || p.hn === 'HN-' || p.hn === 'HN-00000' || p.hn === '00000' || p.hn.trim() === '';
    const isInvalidName = !p.firstName || p.firstName === 'ไม่ระบุชื่อ' || p.firstName === 'ผู้รับการดูแล' || p.firstName.trim() === '';
    if (isInvalidHn || isInvalidName || p.age === 0 || p.age === undefined) return false;
    return true;
  });
}`;

// Inject filterLogic
content = content.replace('// Helper to read localStorage safely', filterLogic + '\n\n// Helper to read localStorage safely');

// Now we need to patch getLocalPatients to use filterValidPatients
const getLocalTarget = `        return parsed.filter((p: Patient) => {
          if (!p) return false;
          if (p.hn?.includes('DEMO-') || p.id?.toLowerCase().includes('demo')) return false;
          const isInvalidHn = !p.hn || p.hn === 'HN-' || p.hn === 'HN-00000' || p.hn === '00000' || p.hn.trim() === '';
          const isInvalidName = !p.firstName || p.firstName === 'ไม่ระบุชื่อ' || p.firstName === 'ผู้รับการดูแล' || p.firstName.trim() === '';
          if (isInvalidHn || isInvalidName || p.age === 0 || p.age === undefined) return false;
          return true;
        });`;

content = content.replace(getLocalTarget, `        return filterValidPatients(parsed);`);

// Patch listMembers:
const listMembersTarget1 = `          const members = querySnapshot.docs.map(doc => doc.data() as Patient);
          saveLocalPatients(members);
          return members;`;
const listMembersRep1 = `          const members = filterValidPatients(querySnapshot.docs.map(doc => doc.data()));
          saveLocalPatients(members);
          return members;`;
content = content.replace(listMembersTarget1, listMembersRep1);

const listMembersTarget2 = `          const members = memSnapshot.docs.map(doc => doc.data() as Patient);
          saveLocalPatients(members);
          return members;`;
const listMembersRep2 = `          const members = filterValidPatients(memSnapshot.docs.map(doc => doc.data()));
          saveLocalPatients(members);
          return members;`;
content = content.replace(listMembersTarget2, listMembersRep2);

// Patch subscribeMembers target 1:
const subscribeTarget1 = `            const members = snapshot.docs.map(doc => doc.data() as Patient);
            saveLocalPatients(members);
            callback(members);`;
const subscribeRep1 = `            const members = filterValidPatients(snapshot.docs.map(doc => doc.data()));
            saveLocalPatients(members);
            callback(members);`;
content = content.replace(subscribeTarget1, subscribeRep1);

// Patch subscribeMembers target 2:
const subscribeTarget2 = `                const members = memSnap.docs.map(doc => doc.data() as Patient);
                saveLocalPatients(members);
                callback(members);`;
const subscribeRep2 = `                const members = filterValidPatients(memSnap.docs.map(doc => doc.data()));
                saveLocalPatients(members);
                callback(members);`;
content = content.replace(subscribeTarget2, subscribeRep2);

fs.writeFileSync(file, content);
console.log('Patched dataAdapter.ts');
