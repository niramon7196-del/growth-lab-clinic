sed -i -e '815,825c\
    let firstName = rawFirstName;\
    let extractedTitle = rawTitle;\
    const tm = firstName.match(/^(ด\\.ช\\.|ด\\.ญ\\.|เด็กชาย|เด็กหญิง|นาย|น\\.ส\\.|นาง)\\s*/i);\
    if (tm) {\
      if (!extractedTitle) extractedTitle = tm[1];\
      firstName = firstName.replace(/^(ด\\.ช\\.|ด\\.ญ\\.|เด็กชาย|เด็กหญิง|นาย|น\\.ส\\.|นาง)\\s*/i, "").trim();\
    }\
    let lastName = rawLastName;' src/services/cloudApi.ts
