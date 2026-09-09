const fs = require('fs');
let buf = fs.readFileSync('src/App.tsx.recovered2');
let str = buf.toString('utf8');

let idx = str.indexOf('!isOwner');
console.log(JSON.stringify(str.substring(idx - 10, idx + 10)));
