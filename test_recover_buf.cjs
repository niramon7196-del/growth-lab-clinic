const fs = require('fs');
let buf = fs.readFileSync('src/App.tsx');
const badBuf = Buffer.from("  // Guard System Management and Settings Panel access to OWNER only\n  useEffect(() => {\n    const isOwner = userRole === 'DEVELOPER' || userRole === 'CLINIC_OWNER' || userRole === 'ADMIN' || userRole === 'DOCTOR';");

let chunks = [];
let i = 0;
while (i < buf.length) {
  let idx = buf.indexOf(badBuf, i);
  if (idx === -1) {
    chunks.push(buf.slice(i));
    break;
  }
  if (idx > i) {
    chunks.push(buf.slice(i, idx));
  }
  i = idx + badBuf.length;
}

let recoveredBuf = Buffer.concat(chunks);
fs.writeFileSync('src/App.tsx.recovered2', recoveredBuf);
console.log('Recovered buf length:', recoveredBuf.length);
