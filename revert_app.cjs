const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

code = code.replace(
  /<div className=\{"h-screen w-full overflow-hidden flex bg-slate-50 app-shell bg-transparent font-sans text-\[\#1A1A24\] relative select-none max-w-\[100vw\] box-border " \+ \(activeTab !== 'นัดหมาย' \? 'has-main-bg' : ''\)\}>/,
  `<div className="h-screen w-full overflow-hidden flex app-shell bg-transparent font-sans text-[#1A1A24] relative select-none max-w-[100vw] box-border">`
);

code = code.replace(
  /\{activeTab === 'นัดหมาย' && <AmbientBackground \/>\}/,
  `<AmbientBackground />`
);

fs.writeFileSync('src/App.tsx', code);
