const fs = require('fs');
let css = fs.readFileSync('src/index.css', 'utf8');

// Find the .app-shell up to the next valid class selector
css = css.replace(/\.app-shell\s*\{[\s\S]*?(?=\.app-content\s*\{|\.page-content\s*\{|@media)/, `.app-shell {
  width: 100% !important;
  max-width: 100vw !important;
  display: flex;
  position: relative;
  box-sizing: border-box !important;
  background-color: #f8fafc;
}
.app-shell::before {
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
}

`);

// But let's be safer: just re-read the original file and do it again
fs.writeFileSync('src/index.css', css);
