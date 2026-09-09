sed -i '/1. Explicit VIP\/known records: HN-00001 (นิรมล) & HN-00002 (สุรีรัตน์)/d' src/utils/patientUtils.ts
sed -i "/hn === 'HN-00001' ||/d" src/utils/patientUtils.ts
sed -i "/hn === 'HN-00002' ||/d" src/utils/patientUtils.ts
sed -i "/rawFirstName.includes('นิรมล') ||/d" src/utils/patientUtils.ts
sed -i "/rawFirstName.includes('สุรีรัตน์') ||/d" src/utils/patientUtils.ts
sed -i "/rawLastName.includes('เลิศล้ำ') ||/d" src/utils/patientUtils.ts
sed -i "/rawLastName.includes('นาคใหม่')/d" src/utils/patientUtils.ts
