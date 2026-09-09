sed -i -e '578,580c\
            // Accept ONLY IF HN is valid AND there is a valid real name\
            return (!isInvalidHn) && hasValidName;\
          });\
' src/App.tsx
