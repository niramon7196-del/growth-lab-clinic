const fs = require('fs');
let css = fs.readFileSync('src/index.css', 'utf8');

css = css.replace(/\.app-shell\.has-main-bg::before\s*\{[^}]+\}/, '');
css = css.replace(/background-color: #f8fafc;/, 'background-color: var(--bg-aurora);');

fs.writeFileSync('src/index.css', css);
