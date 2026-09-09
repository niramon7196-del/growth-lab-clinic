const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

code = code.replace(
  /<div className="h-screen w-full overflow-hidden flex bg-slate-50 app-shell bg-transparent font-sans text-\[\#1A1A24\] relative select-none max-w-\[100vw\] box-border">/,
  `<div className={"h-screen w-full overflow-hidden flex bg-slate-50 app-shell bg-transparent font-sans text-[#1A1A24] relative select-none max-w-[100vw] box-border " + (activeTab !== 'นัดหมาย' ? 'has-main-bg' : '')}>`
);

code = code.replace(
  /<AmbientBackground \/>/g,
  `{activeTab === 'นัดหมาย' && <AmbientBackground />}`
);

fs.writeFileSync('src/App.tsx', code);
