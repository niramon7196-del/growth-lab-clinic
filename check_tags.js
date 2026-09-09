
const fs = require('fs');
const content = fs.readFileSync('/src/App.tsx', 'utf8');

const lines = content.split('\n');
let stack = [];

for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  
  // Very crude tag extraction
  const matches = line.matchAll(/<(div|main|aside|header|footer|section|article|nav|aside|button|span|h1|h2|h3|h4|h5|h6|p|ul|ol|li|form|label|input|textarea|select|option|img|svg|path|circle|rect|line|polyline|polygon|ellipse|g|defs|clipPath|mask|use|text|tspan|blockquote|pre|code|table|thead|tbody|tr|th|td|a|br|hr|Fragment|>)(\s|>|\/|$)|<\/(div|main|aside|header|footer|section|article|nav|aside|button|span|h1|h2|h3|h4|h5|h6|p|ul|ol|li|form|label|input|textarea|select|option|img|svg|path|circle|rect|line|polyline|polygon|ellipse|g|defs|clipPath|mask|use|text|tspan|blockquote|pre|code|table|thead|tbody|tr|th|td|a|br|hr|Fragment|>)>/g);

  for (const match of matches) {
    const fullTag = match[0];
    if (fullTag.startsWith('</')) {
      const tagName = match[3];
      if (stack.length > 0) {
        const last = stack.pop();
        if (last.tag !== tagName) {
          console.log(`Mismatch at line ${i + 1}: expected </${last.tag}> but found ${fullTag}`);
          stack.push(last); // push back to keep going
        }
      } else {
        console.log(`Extra closing tag at line ${i + 1}: ${fullTag}`);
      }
    } else if (fullTag.endsWith('/>')) {
      // self-closing, ignore
    } else {
      const tagName = match[1];
      if (tagName === 'img' || tagName === 'input' || tagName === 'br' || tagName === 'hr') continue; // self-closing tags
      stack.push({ tag: tagName, line: i + 1 });
    }
  }
}

console.log('Unclosed tags:');
stack.forEach(s => console.log(`${s.tag} opened at line ${s.line}`));
