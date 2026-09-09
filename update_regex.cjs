const fs = require('fs');
const path = require('path');

function processDir(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      processDir(fullPath);
    } else if (fullPath.endsWith('.ts') || fullPath.endsWith('.tsx')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      const oldRegex1 = /\/\^\(ด\\\.ช\\\.\|ด\\\.ญ\\\.\|เด็กชาย\|เด็กหญิง\|นาย\|น\\\.ส\\\.\|นาง\)\\s\*\//g;
      const oldRegex2 = /\/\^\(ด\\\.ช\\\.\|ด\\\.ญ\\\.\|เด็กชาย\|เด็กหญิง\|นาย\|น\\\.ส\\\.\|นาง\)s\*\//g;
      const oldRegex3 = /\/\^\(น้อง\|คุณ\|ด\\\.ช\\\.\|ด\\\.ญ\\\.\|เด็กชาย\|เด็กหญิง\|นาย\|น\\\.ส\\\.\|นาง\)\\s\*\//g;
      
      const newRegex = '/^(ด\\.?ช\\.?|ด\\.?ญ\\.?|เด็กชาย|เด็กหญิง|นาย|นางสาว|น\\.?ส\\.?|นาง|คุณ|น้อง)\\s*/';
      
      let changed = false;
      if (oldRegex1.test(content) || oldRegex2.test(content) || oldRegex3.test(content)) {
        content = content.replace(oldRegex1, newRegex);
        content = content.replace(oldRegex2, newRegex);
        content = content.replace(oldRegex3, newRegex);
        fs.writeFileSync(fullPath, content);
        changed = true;
      }
    }
  }
}

processDir('./src');
