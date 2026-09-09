perl -0777 -pi -e 's/    height: 100vh;\n    height: 100dvh;/    min-height: 100vh;\n    min-height: 100dvh;/g' src/index.css
perl -0777 -pi -e 's/    overflow-y: hidden;\n//g' src/index.css
