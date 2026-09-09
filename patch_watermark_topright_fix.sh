sed -i -e '215,225c\
.app-shell::before {\
  content: "";\
  position: absolute;\
  top: 0;\
  right: 0;\
  bottom: 0;\
  left: 0;\
  background-image: url("/bg-purple-clinic.png");\
  background-size: clamp(400px, 50vw, 900px);\
  background-position: top right;\
  background-repeat: no-repeat;\
  opacity: 0.12;\
  z-index: 0;\
  pointer-events: none;\
}' src/index.css
