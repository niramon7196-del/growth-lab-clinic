sed -i -e '218c\
.app-shell {\
  width: 100% !important;\
  max-width: 100vw !important;\
  display: flex;\
  position: relative;\
  box-sizing: border-box !important;\
  background-color: #f8fafc;\
}\
.app-shell::before {\
  content: "";\
  position: absolute;\
  inset: 0;\
  background-image: url("/bg-purple-clinic.png");\
  background-size: cover;\
  background-position: center;\
  background-repeat: no-repeat;\
  opacity: 0.15;\
  z-index: 0;\
  pointer-events: none;\
}\
' src/index.css
