#!/bin/bash
sed -i 's/import NotificationsPanel from/import ProfileLoadingFallback from ".\/components\/ProfileLoadingFallback";\nimport NotificationsPanel from/g' src/App.tsx

perl -0777 -pi -e 's/<div className="flex flex-col items-center justify-center h-full space-y-4 min-h-\[50vh\]">\s*<div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"><\/div>\s*<p className="text-slate-500 font-medium animate-pulse">กำลังโหลดข้อมูลโปรไฟล์...<\/p>\s*<\/div>/<ProfileLoadingFallback isLoading={isInitialDataLoading} patients={patients} onAutoLink={handleAutoLinkSuccess} \/>/g' src/App.tsx
