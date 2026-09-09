sed -i "s/name: user?.name || 'นิรมล (ผู้ดูแลระบบ)'/name: user?.name || 'ผู้ดูแลระบบ'/g" src/services/authService.ts
sed -i "s/avatarInitials: (user?.name || 'นิ').slice(0, 2)/avatarInitials: (user?.name || 'ผด').slice(0, 2)/g" src/services/authService.ts
sed -i "s/name: user?.name || 'นิรมล'/name: user?.name || 'ผู้ช่วยทันตแพทย์'/g" src/services/authService.ts
sed -i "s/avatarInitials: 'นิ'/avatarInitials: 'ผช'/g" src/services/authService.ts
sed -i "s/name = 'นิรมล (ผู้ดูแลระบบ)';/name = 'ผู้ดูแลระบบ';/g" src/services/authService.ts
sed -i "s/name = 'นิรมล';/name = 'ผู้ช่วยทันตแพทย์';/g" src/services/authService.ts
