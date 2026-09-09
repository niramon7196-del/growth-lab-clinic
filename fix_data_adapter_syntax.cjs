const fs = require('fs');

let content = fs.readFileSync('src/services/dataAdapter.ts', 'utf8');

const regex = /if \(!firstName \|\| firstName === "ไม่ระบุชื่อ" \|\| firstName === "ผู้รับการดูแล"\) \{\s*if \(nickname\) \{\s*firstName = nickname;\s*\} else if \(targetHn\) \{\s*firstName = `คนไข้ \(\$\{targetHn\}\)`;\s*\} else \{\s*firstName = "ผู้รับการดูแล";\s*\}\s*\}\s*firstName = 'ผู้รับการดูแล';\s*\}\s*\}/g;

const replacement = `if (!firstName || firstName === "ไม่ระบุชื่อ" || firstName === "ผู้รับการดูแล") {
    if (nickname) {
      firstName = nickname;
    } else if (targetHn) {
      firstName = \`คนไข้ (\${targetHn})\`;
    } else {
      firstName = "ผู้รับการดูแล";
    }
  }`;

content = content.replace(regex, replacement);

fs.writeFileSync('src/services/dataAdapter.ts', content);
