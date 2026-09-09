sed -i -e "s/firstName = rawNickname || (hn ? \`คนไข้ (\${hn})\` : 'ผู้รับการดูแล');/firstName = hn ? \`คนไข้ (\${hn})\` : 'ผู้รับการดูแล';/g" src/services/cloudApi.ts
sed -i -e "s/if (rawNickname) {/if (false) {/g" src/services/dataAdapter.ts
