sed -i -e "s/firstName = targetHn ? \`คนไข้ (\${targetHn})\` : 'ผู้รับการดูแล';/firstName = hn ? \`คนไข้ (\${hn})\` : 'ผู้รับการดูแล';/g" src/services/dataAdapter.ts
