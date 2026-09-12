/**
 * ============================================================================
 * Google Apps Script Web App Endpoint - Growth Lab System
 * ============================================================================
 * ทำหน้าที่:
 * 1. doPost(e): รับข้อมูลบันทึกจากเว็บแอปพลิเคชัน และจัดเก็บลง Google Sheets แบบแยกแท็บ
 *    - บันทึก/ลงทะเบียนคนไข้ใหม่ -> บันทึกลงแท็บ "Patients" อย่างถูกต้อง (ไม่ปนกับ Appointments)
 *    - บันทึกนัดหมาย -> บันทึกลงแท็บ "Appointments"
 *    - บันทึกการทำแบบฝึกหัด -> บันทึกลงแท็บ "Exercise_Logs"
 *    - บันทึกเช็คอินประจำวัน/โภชนาการ/การนอน -> บันทึกลงแท็บ "Daily_Logs"
 *    - บันทึกสรุปรายเดือน -> บันทึกลงแท็บ "Monthly_Logs"
 * 2. doGet(e): ให้บริการดึงข้อมูล (API Read) แก่หน้าตารางรายชื่อคนไข้ และนัดหมาย
 *    - ?action=getPatients -> ส่งข้อมูลรายชื่อคนไข้จากชีต "Patients" กลับเป็น JSON
 *    - ?action=getAppointments -> ส่งข้อมูลนัดหมายจากชีต "Appointments"
 *    - ?action=getInitialData -> ส่งข้อมูลรวม (Patients, Appointments, Daily_Logs)
 * ============================================================================
 */

/**
 * 1. ฟังก์ชันรับคำขอ GET (ดึงข้อมูลแสดงผลในตาราง)
 */
function doGet(e) {
  try {
    var params = e && e.parameter ? e.parameter : {};
    var action = (params.action || params.type || '').toLowerCase();
    var spreadsheet = SpreadsheetApp.getActiveSpreadsheet();

    // ดึงรายชื่อคนไข้ (action: getPatients, GET_PATIENTS, getMembers)
    if (action === 'getpatients' || action === 'get_patients' || action === 'getmembers' || action === 'patients') {
      var patientsSheet = spreadsheet.getSheetByName('Patients');
      if (!patientsSheet) {
        return createJsonResponse({ success: true, data: [], patients: [] });
      }
      var patientsData = sheetToJson(patientsSheet);
      return createJsonResponse({ success: true, data: patientsData, patients: patientsData });
    }

    // ดึงนัดหมาย (action: getAppointments)
    if (action === 'getappointments' || action === 'appointments') {
      var apptSheet = spreadsheet.getSheetByName('Appointments');
      if (!apptSheet) {
        return createJsonResponse({ success: true, data: [], appointments: [] });
      }
      var apptData = sheetToJson(apptSheet);
      return createJsonResponse({ success: true, data: apptData, appointments: apptData });
    }

    // ดึงข้อมูลเช็คอิน/บันทึกประจำวัน (action: getDailyLogs, getLogs)
    if (action === 'getdailylogs' || action === 'getlogs') {
      var logsSheet = spreadsheet.getSheetByName('Daily_Logs') || spreadsheet.getSheetByName('Logs');
      if (!logsSheet) {
        return createJsonResponse({ success: true, data: [], logs: [] });
      }
      var logsData = sheetToJson(logsSheet);
      return createJsonResponse({ success: true, data: logsData, logs: logsData });
    }

    // ดึงข้อมูลภาพรวมระบบครั้งเดียว (action: getInitialData)
    if (action === 'getinitialdata') {
      var pSheet = spreadsheet.getSheetByName('Patients');
      var aSheet = spreadsheet.getSheetByName('Appointments');
      var lSheet = spreadsheet.getSheetByName('Daily_Logs');

      var patients = pSheet ? sheetToJson(pSheet) : [];
      var appointments = aSheet ? sheetToJson(aSheet) : [];
      var logs = lSheet ? sheetToJson(lSheet) : [];

      return createJsonResponse({
        success: true,
        patients: patients,
        appointments: appointments,
        logs: logs
      });
    }

    // ดึงการตั้งค่าคลินิก (action: getClinicConfig)
    if (action === 'getclinicconfig' || action === 'get_clinic_config') {
      var configSheet = spreadsheet.getSheetByName('Clinic_Config');
      var configData = configSheet ? sheetToJson(configSheet) : [];
      return createJsonResponse({ success: true, data: configData });
    }

    // ค่าเริ่มต้นหากไม่ระบุ action
    return createJsonResponse({
      success: true,
      status: 'active',
      message: 'Growth Lab Google Apps Script API is running.',
      availableActions: ['getPatients', 'getAppointments', 'getDailyLogs', 'getInitialData', 'getClinicConfig']
    });

  } catch (err) {
    return createJsonResponse({
      success: false,
      error: err.toString(),
      message: 'เกิดข้อผิดพลาดในการประมวลผล doGet'
    });
  }
}

/**
 * 2. ฟังก์ชันรับคำขอ POST (บันทึกข้อมูล)
 */
function doPost(e) {
  try {
    if (!e || !e.postData || !e.postData.contents) {
      return createJsonResponse({ success: false, error: 'Empty post data payload' });
    }

    // 1. รับค่าและแปลงข้อมูล Payload (JSON)
    var payload = JSON.parse(e.postData.contents);
    var action = payload.action || payload.altAction || payload.type || '';
    var aLower = action.toLowerCase();

    // 2. ฟังก์ชันย่อยสำหรับค้นหาค่าใน payload โดยไม่สนตัวพิมพ์เล็ก/ใหญ่
    var getValueFromPayload = function(key) {
      if (!key) return '';
      var kLower = key.toLowerCase();
      // ค้นหาที่ระดับนอกสุด
      for (var p in payload) {
        if (p && p.toLowerCase() === kLower && payload[p] !== undefined && payload[p] !== null) {
          return payload[p];
        }
      }
      // ค้นหาใน object 'payload' 
      if (payload.payload && typeof payload.payload === 'object') {
        for (var p2 in payload.payload) {
          if (p2 && p2.toLowerCase() === kLower && payload.payload[p2] !== undefined && payload.payload[p2] !== null) {
            return payload.payload[p2];
          }
        }
      }
      // ค้นหาใน object 'data'
      if (payload.data && typeof payload.data === 'object') {
        for (var p3 in payload.data) {
          if (p3 && p3.toLowerCase() === kLower && payload.data[p3] !== undefined && payload.data[p3] !== null) {
            return payload.data[p3];
          }
        }
      }
      return '';
    };

    // ตรวจสอบเงื่อนไขว่าข้อมูลนี้คือ "การลงทะเบียนคนไข้ใหม่ / ข้อมูลคนไข้" หรือไม่
    var isPatientAction = (
      aLower === 'savepatient' || 
      aLower === 'registerpatient' || 
      aLower === 'addpatient' || 
      aLower === 'createpatient' || 
      aLower === 'createmember' || 
      aLower === 'savemember' || 
      aLower === 'patient' || 
      aLower === 'patients' || 
      aLower === 'member' || 
      aLower === 'members' || 
      aLower.indexOf('ลงทะเบียน') !== -1 || 
      aLower.indexOf('คนไข้') !== -1 || 
      aLower.indexOf('ผู้รับการดูแล') !== -1
    );

    var hasPatientFields = Boolean(
      getValueFromPayload('firstName') || 
      getValueFromPayload('lastName') || 
      getValueFromPayload('nickname') || 
      getValueFromPayload('birthDate') || 
      getValueFromPayload('dob') || 
      getValueFromPayload('parentPhone') || 
      getValueFromPayload('citizenId') || 
      getValueFromPayload('gender')
    );

    var isAppointmentAction = (
      aLower === 'saveappointment' || 
      aLower === 'createappointment' || 
      aLower === 'appointment' || 
      aLower === 'rescheduleappointment' ||
      aLower === 'delete_appointment' ||
      aLower.indexOf('นัดหมาย') !== -1
    );

    // 3. กำหนดแท็บปลายทาง (Sheet Routing)
    // *** กฎเหล็ก: ข้อมูลลงทะเบียนคนไข้ใหม่ บันทึกลงแท็บ "Patients" เสมอ ห้ามลง Appointments เด็ดขาด ***
    var sheetName = '';
    if (isPatientAction || (hasPatientFields && !isAppointmentAction)) {
      sheetName = 'Patients';
    } else if (isAppointmentAction) {
      sheetName = 'Appointments';
    } else if (payload.sheetName || payload.targetSheet || payload.tab || payload.sheet) {
      sheetName = payload.sheetName || payload.targetSheet || payload.tab || payload.sheet;
    } else if (aLower === 'saveexercise' || aLower.indexOf('แบบฝึกหัด') !== -1) {
      sheetName = 'Exercise_Logs';
    } else if (
      aLower === 'logdaily' || 
      aLower === 'save_daily_summary' || 
      aLower === 'dailycheckin' || 
      aLower.indexOf('เช็คอิน') !== -1 ||
      aLower.indexOf('โภชนาการ') !== -1 ||
      aLower.indexOf('การนอน') !== -1 ||
      aLower.indexOf('gns') !== -1 ||
      aLower.indexOf('ef') !== -1
    ) {
      sheetName = 'Daily_Logs';
    } else if (aLower === 'save_monthly_report') {
      sheetName = 'Monthly_Logs';
    } else if (aLower === 'save_clinic_config') {
      sheetName = 'Clinic_Config';
    } else {
      sheetName = 'Logs';
    }

    var spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = spreadsheet.getSheetByName(sheetName);

    // 4. กำหนดชุดหัวตารางมาตรฐาน (Default Headers) แยกตามประเภทของแต่ละชีต
    var defaultHeaders = [];
    if (sheetName === 'Patients') {
      // หัวคอลัมน์มาตรฐานสำหรับตารางคนไข้ ให้ตรงกับระบบอ่านข้อมูล
      defaultHeaders = [
        'HN', 'Name', 'Nickname', 'Gender', 'BirthDate', 'Phone', 
        'AssignedTasks', 'Status', 'FirstName', 'LastName', 'Age', 
        'ParentPhone', 'Weight', 'Height', 'Notes', 'StartDate', 'QRToken', 'UpdatedAt'
      ];
    } else if (sheetName === 'Appointments') {
      defaultHeaders = ['ID', 'HN', 'PatientName', 'Date', 'Time', 'Type', 'Doctor', 'Status', 'Notes'];
    } else if (sheetName === 'Exercise_Logs') {
      defaultHeaders = ['ID', 'HN', 'PatientName', 'Date', 'Time', 'ExerciseID', 'Duration', 'Reps', 'Score', 'Status', 'Details'];
    } else if (sheetName === 'Daily_Logs') {
      defaultHeaders = ['ID', 'HN', 'PatientName', 'Date', 'Time', 'ActionName', 'Score', 'Status', 'Details'];
    } else if (sheetName === 'Monthly_Logs') {
      defaultHeaders = ['ID', 'Date', 'Month', 'TotalPatients', 'AverageScore', 'ActiveRatio', 'SummaryJSON', 'Timestamp'];
    } else if (sheetName === 'Clinic_Config') {
      defaultHeaders = ['Key', 'Value', 'UpdatedAt'];
    } else {
      defaultHeaders = ['ID', 'HN', 'PatientName', 'Date', 'Time', 'Action', 'Status', 'Details'];
    }

    // สร้างชีตใหม่พร้อมหัวตารางหากยังไม่มีใน Spreadsheet
    if (!sheet) {
      sheet = spreadsheet.insertSheet(sheetName);
      sheet.appendRow(defaultHeaders);
      SpreadsheetApp.flush();
    }

    // ดึงหัวคอลัมน์ปัจจุบัน
    var lastCol = Math.max(1, sheet.getLastColumn());
    var sheetHeaders = sheet.getRange(1, 1, 1, lastCol).getValues()[0];

    if (!sheetHeaders || sheetHeaders.length === 0 || sheetHeaders[0] === '') {
      sheetHeaders = defaultHeaders;
      sheet.getRange(1, 1, 1, sheetHeaders.length).setValues([sheetHeaders]);
      SpreadsheetApp.flush();
    }

    // 5. เตรียมค่าข้อมูลพื้นฐาน
    var hn = (getValueFromPayload('hn') || getValueFromPayload('patientId') || getValueFromPayload('id') || '').toString().trim();
    var firstName = (getValueFromPayload('firstName') || '').toString().trim();
    var lastName = (getValueFromPayload('lastName') || '').toString().trim();
    var nickname = (getValueFromPayload('nickname') || getValueFromPayload('nickName') || '').toString().trim();
    
    var fullName = getValueFromPayload('name') || getValueFromPayload('fullName') || getValueFromPayload('patientName');
    if (!fullName) {
      if (firstName || lastName) {
        fullName = (firstName + ' ' + lastName).trim();
      } else if (nickname) {
        fullName = nickname;
      } else if (hn) {
        fullName = 'คนไข้ (' + hn + ')';
      } else {
        fullName = 'ผู้รับการดูแล';
      }
    }

    var id = getValueFromPayload('id') || getValueFromPayload('appointmentId') || (hn ? hn : Utilities.getUuid());

    var date = getValueFromPayload('date');
    if (!date) {
      date = new Date().toISOString().split('T')[0];
    }

    var time = getValueFromPayload('time');
    if (!time) {
      var d = new Date();
      time = ('0' + d.getHours()).slice(-2) + ':' + ('0' + d.getMinutes()).slice(-2);
    }

    // 6. แมปข้อมูลให้ตรงกับหัวตาราง
    var rowData = [];
    for (var i = 0; i < sheetHeaders.length; i++) {
      var header = (sheetHeaders[i] || '').toString().trim();
      var hLower = header.toLowerCase();

      if (hLower === 'hn') {
        rowData.push(hn);
      } else if (hLower === 'id') {
        rowData.push(id);
      } else if (hLower === 'name' || hLower === 'patientname' || hLower === 'patient name' || hLower === 'ชื่อ' || hLower === 'ชื่อ-นามสกุล') {
        rowData.push(fullName);
      } else if (hLower === 'firstname' || hLower === 'first name' || hLower === 'ชื่อจริง') {
        rowData.push(firstName || fullName);
      } else if (hLower === 'lastname' || hLower === 'last name' || hLower === 'นามสกุล') {
        rowData.push(lastName);
      } else if (hLower === 'nickname' || hLower === 'nick name' || hLower === 'ชื่อเล่น') {
        rowData.push(nickname);
      } else if (hLower === 'gender' || hLower === 'เพศ') {
        rowData.push(getValueFromPayload('gender') || 'ชาย');
      } else if (hLower === 'age' || hLower === 'อายุ') {
        rowData.push(getValueFromPayload('age') || '');
      } else if (hLower === 'birthdate' || hLower === 'birth date' || hLower === 'dob' || hLower === 'วันเกิด') {
        rowData.push(getValueFromPayload('birthDate') || getValueFromPayload('dob') || '');
      } else if (hLower === 'phone' || hLower === 'tel' || hLower === 'เบอร์โทร' || hLower === 'เบอร์โทรศัพท์') {
        rowData.push(getValueFromPayload('phone') || getValueFromPayload('parentPhone') || '');
      } else if (hLower === 'parentphone' || hLower === 'parent phone' || hLower === 'เบอร์ผู้ปกครอง') {
        rowData.push(getValueFromPayload('parentPhone') || getValueFromPayload('phone') || '');
      } else if (hLower === 'assignedtasks' || hLower === 'assigned_tasks' || hLower === 'การบ้าน') {
        var tasks = getValueFromPayload('assignedTasks') || getValueFromPayload('assignedExercises') || getValueFromPayload('assignments') || '';
        rowData.push(typeof tasks === 'object' ? JSON.stringify(tasks) : tasks);
      } else if (hLower === 'status' || hLower === 'สถานะ') {
        rowData.push(getValueFromPayload('status') || 'Active');
      } else if (hLower === 'notes' || hLower === 'note' || hLower === 'หมายเหตุ') {
        rowData.push(getValueFromPayload('notes') || getValueFromPayload('note') || '');
      } else if (hLower === 'weight' || hLower === 'น้ำหนัก') {
        rowData.push(getValueFromPayload('weight') || '');
      } else if (hLower === 'height' || hLower === 'ส่วนสูง') {
        rowData.push(getValueFromPayload('height') || '');
      } else if (hLower === 'startdate' || hLower === 'start date' || hLower === 'วันที่เริ่มรักษา') {
        rowData.push(getValueFromPayload('startDate') || date);
      } else if (hLower === 'qrtoken' || hLower === 'token') {
        rowData.push(getValueFromPayload('qrToken') || ('tok_' + (hn || id)));
      } else if (hLower === 'updatedat' || hLower === 'updateddate' || hLower === 'timestamp') {
        rowData.push(new Date().toISOString());
      } else if (hLower === 'date' || hLower === 'วันที่') {
        rowData.push(date);
      } else if (hLower === 'time' || hLower === 'เวลา') {
        rowData.push(time);
      } else if (hLower === 'type') {
        rowData.push(getValueFromPayload('type') || action);
      } else if (hLower === 'doctor') {
        rowData.push(getValueFromPayload('doctor') || getValueFromPayload('doctorName') || 'ทันตแพทย์หญิง นภาพร วรรณษา');
      } else if (hLower === 'score') {
        rowData.push(getValueFromPayload('score') || getValueFromPayload('omtScore') || '');
      } else if (hLower === 'duration') {
        rowData.push(getValueFromPayload('duration') || getValueFromPayload('sleepHours') || '');
      } else if (hLower === 'reps') {
        rowData.push(getValueFromPayload('reps') || '');
      } else if (hLower === 'details' || hLower === 'detail') {
        var details = getValueFromPayload('details') || getValueFromPayload('payload') || '';
        rowData.push(typeof details === 'object' ? JSON.stringify(details) : details);
      } else {
        var anyVal = getValueFromPayload(header);
        rowData.push(typeof anyVal === 'object' ? JSON.stringify(anyVal) : anyVal);
      }
    }

    // 7. บันทึกข้อมูล:
    // หากเป็นชีต Patients และมี HN ให้ตรวจสอบว่ามีอยู่แล้วหรือไม่ (Upsert) เพื่อป้องกันข้อมูลซ้ำซ้อน
    var isUpdated = false;
    var targetRowIndex = -1;

    if (sheetName === 'Patients' && hn) {
      var lastRow = sheet.getLastRow();
      if (lastRow > 1) {
        // ค้นหาคอลัมน์ HN ใน header
        var hnColIndex = 1;
        for (var h = 0; h < sheetHeaders.length; h++) {
          if ((sheetHeaders[h] || '').toString().trim().toLowerCase() === 'hn') {
            hnColIndex = h + 1;
            break;
          }
        }
        var hnValues = sheet.getRange(2, hnColIndex, lastRow - 1, 1).getValues();
        for (var r = 0; r < hnValues.length; r++) {
          if (String(hnValues[r][0]).trim() === hn) {
            targetRowIndex = r + 2; // +2 เพราะเริ่มบรรทัดที่ 2
            sheet.getRange(targetRowIndex, 1, 1, rowData.length).setValues([rowData]);
            isUpdated = true;
            break;
          }
        }
      }
    }

    if (!isUpdated) {
      sheet.appendRow(rowData);
    }
    SpreadsheetApp.flush();

    // 8. ตอบกลับผลลัพธ์เป็น JSON
    return createJsonResponse({
      success: true,
      message: 'บันทึกข้อมูลลงชีต ' + sheetName + ' เรียบร้อยแล้ว',
      sheet: sheetName,
      action: action,
      hn: hn,
      isUpdated: isUpdated,
      rowSaved: rowData
    });

  } catch (error) {
    return createJsonResponse({
      success: false,
      error: error.toString(),
      message: 'เกิดข้อผิดพลาดในการประมวลผล POST Request (doPost)'
    });
  }
}

/**
 * ฟังก์ชันแปลงแถวใน Google Sheet ให้เป็น Array of Objects ตามหัวคอลัมน์
 */
function sheetToJson(sheet) {
  var lastRow = sheet.getLastRow();
  var lastCol = sheet.getLastColumn();
  if (lastRow <= 1 || lastCol < 1) return [];

  var values = sheet.getRange(1, 1, lastRow, lastCol).getValues();
  var headers = values[0].map(function(h) {
    return (h || '').toString().trim();
  });

  var result = [];
  for (var i = 1; i < values.length; i++) {
    var row = values[i];
    // ตรวจสอบว่าแถวไม่ว่างเปล่า
    var hasData = row.some(function(cell) {
      return cell !== '' && cell !== null && cell !== undefined;
    });
    if (!hasData) continue;

    var item = {};
    for (var j = 0; j < headers.length; j++) {
      var headerKey = headers[j];
      if (headerKey) {
        var cellVal = row[j];
        if (cellVal instanceof Date) {
          try {
            cellVal = cellVal.toISOString().split('T')[0];
          } catch(e) {
            cellVal = cellVal.toString();
          }
        }
        item[headerKey] = cellVal;
        
        // เพิ่มคีย์แบบ camelCase สำหรับความสะดวกของฝั่ง React
        var cleanKey = headerKey.toLowerCase().replace(/[\s\-_]/g, '');
        if (!item[cleanKey]) {
          item[cleanKey] = cellVal;
        }
      }
    }
    result.push(item);
  }
  return result;
}

/**
 * ฟังก์ชันสร้าง JSON Response พร้อม Headers สำหรับ CORS
 */
function createJsonResponse(data) {
  return ContentService.createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}
