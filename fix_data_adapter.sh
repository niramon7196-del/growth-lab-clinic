sed -i -e "s/firstName = hn ? \`คนไข้ (\${hn})\` : 'ผู้รับการดูแล';/firstName = targetHn ? \`คนไข้ (\${targetHn})\` : 'ผู้รับการดูแล';/g" src/services/dataAdapter.ts
