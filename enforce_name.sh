sed -i -e "s/return (!isInvalidHn) && (hasValidName || hasValidNickname);/return (!isInvalidHn) && hasValidName;/g" src/App.tsx
sed -i -e "s/const isPlaceholderOnly = /const isPlaceholderOnly = !hasValidName || /g" src/services/cloudApi.ts
