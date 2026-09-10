/**
 * Google Apps Script (doPost) Handler
 * ทำหน้าที่รับข้อมูล (POST Request) จากเว็บไซต์และจัดเก็บลง Google Sheets แบบแยกแท็บ
 */
function doPost(e) {
  try {
    // 1. รับค่าและแปลงข้อมูล Payload (JSON)
    var payload = JSON.parse(e.postData.contents);
    var action = payload.action || payload.altAction || payload.type || '';
    
    var sheetName = payload.sheetName || payload.targetSheet || payload.tab || payload.sheet;
    
    // 2. แยกแยะประเภทข้อมูลและกำหนดแท็บปลายทาง (Action Routing)
    var aLower = action.toLowerCase();
    
    if (aLower === 'saveappointment' || aLower === 'createappointment' || aLower === 'appointment') {
      sheetName = 'Appointments';
    } else if (aLower === 'saveexercise' || aLower.indexOf('แบบฝึกหัด') !== -1) {
      sheetName = 'Exercise_Logs';
    } else if (
      aLower === 'logdaily' || 
      aLower === 'save_daily_summary' || 
      aLower.indexOf('เช็คอิน') !== -1 ||
      aLower.indexOf('โภชนาการ') !== -1 ||
      aLower.indexOf('การนอน') !== -1 ||
      aLower.indexOf('gns') !== -1 ||
      aLower.indexOf('ef') !== -1
    ) {
      sheetName = 'Daily_Logs';
    } else if (!sheetName) {
      sheetName = 'Logs'; // ค่าเริ่มต้นหากไม่ได้ระบุ
    }

    var spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = spreadsheet.getSheetByName(sheetName);
    
    // 3. กำหนดชุดหัวตารางมาตรฐาน (Default Headers) แยกตามประเภทของชีต
    var defaultHeaders = [];
    if (sheetName === 'Appointments') {
      defaultHeaders = ['ID', 'HN', 'PatientName', 'Date', 'Time', 'Type', 'Doctor', 'Status', 'Notes'];
    } else if (sheetName === 'Exercise_Logs') {
      defaultHeaders = ['ID', 'HN', 'PatientName', 'Date', 'Time', 'ExerciseID', 'Duration', 'Reps', 'Score', 'Status', 'Details'];
    } else if (sheetName === 'Daily_Logs') {
      defaultHeaders = ['ID', 'HN', 'PatientName', 'Date', 'Time', 'ActionName', 'Score', 'Status', 'Details'];
    } else {
      defaultHeaders = ['ID', 'HN', 'PatientName', 'Date', 'Time', 'Action', 'Status', 'Details'];
    }
    
    // สร้างชีตใหม่ถ้ายังไม่มี
    if (!sheet) {
      sheet = spreadsheet.insertSheet(sheetName);
      sheet.appendRow(defaultHeaders);
    }
    
    // 4. ดึงหัวคอลัมน์ปัจจุบัน (กรณีที่ทางคลินิกปรับแก้คอลัมน์เอง)
    var lastCol = Math.max(1, sheet.getLastColumn());
    var sheetHeaders = sheet.getRange(1, 1, 1, lastCol).getValues()[0];
    
    if (sheetHeaders.length === 0 || sheetHeaders[0] === '') {
      sheetHeaders = defaultHeaders;
      sheet.getRange(1, 1, 1, sheetHeaders.length).setValues([sheetHeaders]);
    }
    
    // ฟังก์ชันย่อยสำหรับค้นหาค่าใน payload โดยไม่สนตัวพิมพ์เล็ก/ใหญ่
    var getValueFromPayload = function(key) {
      var kLower = key.toLowerCase();
      // ค้นหาที่ระดับนอกสุด
      for (var p in payload) {
        if (p.toLowerCase() === kLower) return payload[p];
      }
      // ค้นหาใน object 'payload' 
      if (payload.payload && typeof payload.payload === 'object') {
        for (var p2 in payload.payload) {
          if (p2.toLowerCase() === kLower) return payload.payload[p2];
        }
      }
      // ค้นหาใน object 'data'
      if (payload.data && typeof payload.data === 'object') {
        for (var p3 in payload.data) {
          if (p3.toLowerCase() === kLower) return payload.data[p3];
        }
      }
      return '';
    };

    // เตรียมค่า Default พื้นฐาน
    var id = getValueFromPayload('id') || getValueFromPayload('appointmentId') || Utilities.getUuid();
    var hn = getValueFromPayload('hn') || getValueFromPayload('patientId') || '';
    var patientName = getValueFromPayload('patientName') || getValueFromPayload('name') || getValueFromPayload('patient') || '';
    
    var date = getValueFromPayload('date');
    if (!date) {
      var d = new Date();
      date = d.toISOString().split('T')[0];
    }
    
    var time = getValueFromPayload('time');
    if (!time) {
      var d2 = new Date();
      time = d2.getHours() + ':' + ('0' + d2.getMinutes()).slice(-2);
    }
    
    // 5. แมปข้อมูลให้ตรงกับหัวตารางแต่ละชีตอย่างเป็นระเบียบ
    var rowData = [];
    
    for (var i = 0; i < sheetHeaders.length; i++) {
      var header = sheetHeaders[i].toString().trim();
      var hLower = header.toLowerCase();
      
      if (hLower === 'id') {
        rowData.push(id);
      } else if (hLower === 'hn' || hLower === 'patientid') {
        rowData.push(hn);
      } else if (hLower === 'patientname' || hLower === 'patient name' || hLower === 'name') {
        rowData.push(patientName);
      } else if (hLower === 'date') {
        rowData.push(date);
      } else if (hLower === 'time') {
        rowData.push(time);
      } else if (hLower === 'type' && sheetName === 'Appointments') {
        // ดึงค่า Type สำหรับ Appointments
        rowData.push(getValueFromPayload('type') || action);
      } else if (hLower === 'doctor') {
        rowData.push(getValueFromPayload('doctor') || getValueFromPayload('doctorName') || 'ทันตแพทย์หญิง นภาพร วรรณษา');
      } else if (hLower === 'status' || hLower === 'สถานะ' || hLower.indexOf('อัพเดต') !== -1) {
        rowData.push(getValueFromPayload('status') || 'บันทึกสำเร็จ');
      } else if (hLower === 'notes' || hLower === 'note') {
        rowData.push(getValueFromPayload('notes') || getValueFromPayload('note') || '');
      } else if (hLower === 'exerciseid' || hLower === 'exercise id' || (hLower === 'type' && sheetName === 'Exercise_Logs')) {
        // ดึงชื่อหรือ ID ของแบบฝึกหัด
        rowData.push(getValueFromPayload('exerciseId') || getValueFromPayload('type') || action);
      } else if (hLower === 'actionname' || hLower === 'action' || (hLower === 'type' && sheetName === 'Daily_Logs')) {
        // ดึงชื่อกิจกรรมสำหรับการเช็คอิน
        rowData.push(getValueFromPayload('actionName') || getValueFromPayload('altAction') || action);
      } else if (hLower === 'score' || hLower === 'คะแนน') {
        rowData.push(getValueFromPayload('score') || getValueFromPayload('omtScore') || getValueFromPayload('exerciseScore') || '');
      } else if (hLower === 'duration') {
        rowData.push(getValueFromPayload('duration') || getValueFromPayload('sleepHours') || getValueFromPayload('efHours') || '');
      } else if (hLower === 'reps') {
        rowData.push(getValueFromPayload('reps') || '');
      } else if (hLower === 'details' || hLower === 'exercise_logs' || hLower === 'exerciselogs') {
        // เก็บข้อมูลดิบ (JSON) หรืออาเรย์ที่ซับซ้อนลงในช่องรายละเอียด
        var details = getValueFromPayload('details') || getValueFromPayload('completedExercises') || getValueFromPayload('itemsChecked') || getValueFromPayload('payload') || '';
        if (typeof details === 'object') {
           details = JSON.stringify(details);
        }
        rowData.push(details);
      } else {
        // สำหรับคอลัมน์อื่นๆ ที่อาจมีเพิ่มเติม
        var val = getValueFromPayload(header);
        if (typeof val === 'object') val = JSON.stringify(val);
        rowData.push(val);
      }
    }
    
    // 6. บันทึกข้อมูลลงในแถวสุดท้ายของชีต (Append Row)
    sheet.appendRow(rowData);
    
    // 7. ส่ง JSON แจ้งผลลัพธ์กลับไปยังแอปพลิเคชัน
    return ContentService.createTextOutput(JSON.stringify({
      success: true,
      message: 'บันทึกข้อมูลลงชีต ' + sheetName + ' เรียบร้อยแล้ว',
      sheet: sheetName,
      action: action,
      rowSaved: rowData
    })).setMimeType(ContentService.MimeType.JSON);
    
  } catch (error) {
    // ส่ง Error กลับไปหากมีปัญหา
    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      error: error.toString(),
      message: 'เกิดข้อผิดพลาดในการประมวลผล POST Request (doPost)'
    })).setMimeType(ContentService.MimeType.JSON);
  }
}
