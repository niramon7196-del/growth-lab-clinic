const fs = require('fs');
let content = fs.readFileSync('src/components/Dashboard.tsx', 'utf8');
content = content.replace(
    "} from 'lucide-react';",
    "  PieChart,\n} from 'lucide-react';"
);
fs.writeFileSync('src/components/Dashboard.tsx', content);
