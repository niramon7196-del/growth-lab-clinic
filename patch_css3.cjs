const fs = require('fs');
let css = fs.readFileSync('src/index.css', 'utf8');

css = css.replace(
  /\.app-shell::before/g,
  '.app-shell.has-main-bg::before'
);

fs.writeFileSync('src/index.css', css);
