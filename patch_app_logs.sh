sed -i -e "s/              logs={logs}\n              appointments/              appointments/g" src/App.tsx
sed -i -e "s/              logs={logs}\n              logs={scopedLogs}/              logs={scopedLogs}/g" src/App.tsx
sed -i -e "s/              logs={logs}\n                  logs={scopedLogs}/                  logs={scopedLogs}/g" src/App.tsx
