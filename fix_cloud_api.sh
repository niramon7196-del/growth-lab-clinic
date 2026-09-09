sed -i -e '922,928c\
      const isPlaceholderOnly = !hasValidName;\
' src/services/cloudApi.ts
