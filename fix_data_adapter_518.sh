sed -i -e '517,519c\
  if (!firstName || firstName === "ไม่ระบุชื่อ" || firstName === "ผู้รับการดูแล") {\
    if (nickname) {\
      firstName = nickname;\
    } else if (targetHn) {\
      firstName = `คนไข้ (${targetHn})`;\
    } else {\
      firstName = "ผู้รับการดูแล";\
    }\
  }' src/services/dataAdapter.ts
