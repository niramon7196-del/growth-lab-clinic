const fs = require('fs');
let css = fs.readFileSync('src/index.css', 'utf8');

if (!css.includes('.app-shell.has-main-bg')) {
  css += `\n.app-shell.has-main-bg::before {
  content: "";
  position: fixed;
  top: 0;
  right: 0;
  bottom: 0;
  left: 0;
  background-image: url("/bg-main-background.png");
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
  opacity: 0.85;
  z-index: 0;
  pointer-events: none;
}\n`;
} else {
  css = css.replace(/\.app-shell\.has-main-bg::before\s*\{[^}]+\}/, `.app-shell.has-main-bg::before {
  content: "";
  position: fixed;
  top: 0;
  right: 0;
  bottom: 0;
  left: 0;
  background-image: url("/bg-main-background.png");
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
  opacity: 0.85;
  z-index: 0;
  pointer-events: none;
}`);
}

fs.writeFileSync('src/index.css', css);
