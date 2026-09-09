const fs = require('fs');
let content = fs.readFileSync('src/components/Dashboard.tsx', 'utf8');
console.log(content.includes('const stats = useMemo(() => {'));
