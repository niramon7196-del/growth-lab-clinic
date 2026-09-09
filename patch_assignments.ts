import fs from 'fs';

const file = 'src/components/AssignedExercisesView.tsx';
let content = fs.readFileSync(file, 'utf8');

const target1 = `    const finalAssignments: HomeworkAssignment[] = [];
    const hasGns = baseAssignments.some(a => a.exerciseId === 'nutrition_gns');
    const hasSleep = baseAssignments.some(a => a.exerciseId === 'sleep_ef');

    if (!hasGns) finalAssignments.push(default4StageMissions[0]);
    if (!hasSleep) finalAssignments.push(default4StageMissions[1]);

    finalAssignments.push(...baseAssignments.filter(a => a.exerciseId !== 'nutrition_gns' && a.exerciseId !== 'sleep_ef'));

    return finalAssignments;`;

const rep1 = `    // If we already loaded the 4 default missions, just return them
    if (baseAssignments.length === 4 && baseAssignments[0].exerciseId === 'posture_7') {
      return baseAssignments;
    }

    const finalAssignments: HomeworkAssignment[] = [];
    const hasGns = baseAssignments.some(a => a.exerciseId === 'nutrition_gns');
    const hasSleep = baseAssignments.some(a => a.exerciseId === 'sleep_ef');

    // We no longer forcefully push GNS and Sleep as per new requirement,
    // so we just return baseAssignments directly
    return baseAssignments;`;

content = content.replace(target1, rep1);
fs.writeFileSync(file, content);
console.log('Patched assignments map');
