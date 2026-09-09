sed -i -e '209,240c\
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
.app-content {\
  flex: 1 1 auto;\
  min-height: 0;\
  min-height: 100vh;\
  min-height: 100dvh;\
  width: 100% !important;\
  max-width: 100%;\
  display: flex;\
  flex-direction: column;\
  overflow-x: hidden !important;\
  box-sizing: border-box !important;\
}\
.page-content {\
  flex: 1 1 auto;\
' src/index.css
