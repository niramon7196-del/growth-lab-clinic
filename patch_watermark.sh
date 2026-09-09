sed -i -e '218c\
.app-shell {\
  background-image: url("/bg-purple-clinic.png") !important;\
  background-size: cover !important;\
  background-position: center !important;\
  background-repeat: no-repeat !important;\
  position: relative;\
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
  position: relative;\
  z-index: 1;\
' src/index.css
