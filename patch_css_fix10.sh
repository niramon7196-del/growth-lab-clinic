sed -i -e '225,229c\
  position: relative;\
  box-sizing: border-box !important;\
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
}' src/index.css
