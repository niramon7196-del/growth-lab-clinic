sed -i -e '218c\
.app-shell {\
  background-image: url("/bg-purple-clinic.png") !important;\
  background-size: cover !important;\
  background-position: center !important;\
  background-repeat: no-repeat !important;\
' src/index.css
sed -i -e 's/bg-aurora-soft/bg-transparent/g' src/App.tsx
