const fs = require('fs');
let css = fs.readFileSync('src/index.css', 'utf8');

// Find the .app-shell class and its pseudo-elements to fix them
css = css.replace(/\.app-shell\s*\{[^}]+\}/g, `.app-shell {
  width: 100% !important;
  max-width: 100vw !important;
  display: flex;
  position: relative;
  box-sizing: border-box !important;
  background-color: #f8fafc;
}`);

css = css.replace(/\.app-shell::before\s*\{[^}]+\}/g, `.app-shell::before {
  content: "";
  position: absolute;
  top: 0;
  right: 0;
  bottom: 0;
  left: 0;
  background-image: url("/bg-purple-clinic.png");
  background-size: clamp(350px, 45vw, 900px);
  background-position: top right;
  background-repeat: no-repeat;
  opacity: 0.12;
  z-index: 0;
  pointer-events: none;
}`);

// Delete any trailing junk between .app-shell::before and .app-content
css = css.replace(/\}\s*pointer-events:\s*none;\s*\.app-content/g, `}\n\n.app-content`);

fs.writeFileSync('src/index.css', css);
