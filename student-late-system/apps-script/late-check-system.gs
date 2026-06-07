/**
 * ระบบบันทึกนักเรียนมาสาย
 *
 * วิธีใช้แบบสั้น:
 * 1. Import workbook เป็น Google Sheets
 * 2. วางโค้ดนี้ใน Extensions > Apps Script
 * 3. Run setupLateSystem() หนึ่งครั้ง
 * 4. ใช้ Google Form ที่มีคำถาม "รหัสนักเรียน", "เหตุผล", "ผู้บันทึก"
 */

const LATE_SYSTEM = {
  spreadsheetId: '1HmcqFHIQDiWZ2CWtxBC4XJjzp4cXTd3hZOrGunwA8tw',
  formId: '1sxvGNWXelrjDWFQTPh-CPQZ1aAEcLuHmP5gX4wl7ZWI',
  studentsSheet: 'Students',
  settingsSheet: 'Settings',
  transactionsSheet: 'Late_Transactions',
  historicalFormProperty: 'HISTORICAL_LATE_FORM_ID',
  rawResponseSheetFallback: 'Form Responses 1',
  settingsHeaderRow: 4,
  settingsFirstDataRow: 5,
  settingsHeaders: ['Rooms', 'Reasons', 'Teachers'],
  defaultRooms: ['ม.1/1', 'ม.1/2', 'ม.2/1', 'ม.2/2', 'ม.3/1', 'ม.3/2', 'ม.4/1', 'ม.4/2', 'ม.5/1', 'ม.5/2', 'ม.6/1', 'ม.6/2'],
  defaultReasons: ['ตื่นสาย', 'รถติด', 'ฝนตก', 'ป่วย/ไม่สบาย', 'ภารกิจครอบครัว', 'อื่น ๆ'],
  defaultTeachers: [
    'นางสาวปัทมพร แสงศรี',
    'นางสาวทิพย์รัตน์ อาจนะชัย',
    'นายคมสัน เกตุโต',
    'นางสาวประภัสสร ชูวัฒนา',
    'นางสาวดวงพร เวียงนนท์',
    'นายอานันท์ชัย มณีโชติ',
    'นายเอกลักษณ์ พุ่มโต',
    'นางสาวณันดา นาคอ่วม',
    'นางสาวกนกวรรณ เติมเพ็ชร',
  ],
  studentHeaders: [
    'student_id',
    'student_no',
    'prefix',
    'first_name',
    'last_name',
    'full_name',
    'grade',
    'room',
    'homeroom_teacher',
    'status',
    'card_code',
    'notes',
  ],
  transactionHeaders: [
    'transaction_id',
    'submitted_at',
    'late_date',
    'time_in',
    'student_id',
    'full_name',
    'grade',
    'room',
    'reason',
    'recorder',
    'status',
    'duplicate_key',
    'source_sheet',
    'raw_row',
    'notes',
  ],
  aliases: {
    studentId: ['เลือกนักเรียน', 'นักเรียน', 'รหัสนักเรียน', 'เลขนักเรียน', 'เลขประจำตัว', 'เลขประจำตัวนักเรียน', 'student_id', 'student id', 'studentid', 'card_code', 'รหัสบัตร'],
    reason: ['เหตุผล', 'reason', 'late reason', 'สาเหตุ'],
    recorder: ['ผู้บันทึก', 'ครูเวร', 'ครูผู้บันทึก', 'recorder', 'teacher', 'staff'],
    lateDate: ['วันที่', 'late_date', 'late date', 'วันที่มาสาย'],
    timeIn: ['เวลา', 'time_in', 'time', 'เวลามาสาย', 'เวลาที่มาสาย'],
    timestamp: ['timestamp', 'ประทับเวลา', 'เวลาที่ส่ง', 'submitted_at'],
  },
};

function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu('ระบบมาสาย')
    .addItem('ติดตั้ง/ตรวจระบบ', 'setupLateSystem')
    .addItem('สร้าง/อัปเดต Google Form', 'createLateCheckForm')
    .addItem('สร้าง/อัปเดตฟอร์มบันทึกย้อนหลัง', 'createHistoricalLateForm')
    .addItem('ประมวลผล Form Responses 1 ย้อนหลัง', 'backfillFormResponses')
    .addItem('ตรวจข้อมูลตัวอย่างล่าสุด', 'debugLatestLateSystemData')
    .addToUi();
}

function setupLateSystem() {
  const ss = getSpreadsheet_();
  ensureSettingsSheet_(ss);
  ensureSheetWithHeaders_(ss, LATE_SYSTEM.studentsSheet, LATE_SYSTEM.studentHeaders);
  ensureSheetWithHeaders_(ss, LATE_SYSTEM.transactionsSheet, LATE_SYSTEM.transactionHeaders);
  installSpreadsheetSubmitTrigger_();
  Logger.log('Late student system is ready.');
}

function createLateCheckForm() {
  const ss = getSpreadsheet_();
  const form = LATE_SYSTEM.formId
    ? FormApp.openById(LATE_SYSTEM.formId)
    : FormApp.create('ฟอร์มบันทึกนักเรียนมาสาย');
  rebuildLateCheckForm_(form, ss);
  form.setDestination(FormApp.DestinationType.SPREADSHEET, ss.getId());
  Logger.log('Form edit URL: ' + form.getEditUrl());
  Logger.log('Form public URL: ' + form.getPublishedUrl());
}

function createHistoricalLateForm() {
  const ss = getSpreadsheet_();
  const props = PropertiesService.getScriptProperties();
  const existingFormId = props.getProperty(LATE_SYSTEM.historicalFormProperty);
  const form = existingFormId
    ? FormApp.openById(existingFormId)
    : FormApp.create('ฟอร์มบันทึกนักเรียนมาสายย้อนหลัง');
  props.setProperty(LATE_SYSTEM.historicalFormProperty, form.getId());
  rebuildHistoricalLateForm_(form, ss);
  form.setDestination(FormApp.DestinationType.SPREADSHEET, ss.getId());
  Logger.log('Historical form edit URL: ' + form.getEditUrl());
  Logger.log('Historical form public URL: ' + form.getPublishedUrl());
}

function rebuildLateCheckForm_(form, ss) {
  form.setTitle('ฟอร์มบันทึกนักเรียนมาสาย');
  form.setDescription('ครูเวรกรอกรหัสนักเรียน ระบบจะค้นชื่อ ห้อง ชั้น จากชีต Students อัตโนมัติ และเลือกผู้บันทึกจากรายการครูใน Settings');
  const items = form.getItems();
  for (let i = items.length - 1; i >= 0; i -= 1) {
    form.deleteItem(items[i]);
  }

  form.addTextItem()
    .setTitle('รหัสนักเรียน')
    .setHelpText('กรอกเลขประจำตัวนักเรียน 11 หลัก')
    .setValidation(buildStudentIdValidation_(ss))
    .setRequired(true);

  const reasonChoices = getSettingsColumnValues_(ss, 'Reasons', LATE_SYSTEM.defaultReasons);
  form.addMultipleChoiceItem()
    .setTitle('เหตุผล')
    .setChoiceValues(reasonChoices)
    .setRequired(false);

  const teacherChoices = getSettingsColumnValues_(ss, 'Teachers', LATE_SYSTEM.defaultTeachers);
  form.addListItem()
    .setTitle('ผู้บันทึก')
    .setChoiceValues(teacherChoices)
    .setRequired(true);
}

function rebuildHistoricalLateForm_(form, ss) {
  form.setTitle('ฟอร์มบันทึกนักเรียนมาสายย้อนหลัง');
  form.setDescription('ใช้กรอกข้อมูลย้อนหลังจากกระดาษ เลือกวันที่และเวลาที่มาสายเอง ระบบจะค้นชื่อ ห้อง ชั้น จากชีต Students อัตโนมัติ');
  const items = form.getItems();
  for (let i = items.length - 1; i >= 0; i -= 1) {
    form.deleteItem(items[i]);
  }

  form.addDateItem()
    .setTitle('วันที่มาสาย')
    .setHelpText('เลือกวันที่จริงตามข้อมูลในกระดาษ')
    .setRequired(true);

  form.addTimeItem()
    .setTitle('เวลามาสาย')
    .setHelpText('เลือกเวลาที่มาสาย ถ้าไม่ทราบให้เลือกเวลาโดยประมาณ')
    .setRequired(true);

  form.addTextItem()
    .setTitle('รหัสนักเรียน')
    .setHelpText('กรอกเลขประจำตัวนักเรียน 11 หลัก')
    .setValidation(buildStudentIdValidation_(ss))
    .setRequired(true);

  const reasonChoices = getSettingsColumnValues_(ss, 'Reasons', LATE_SYSTEM.defaultReasons);
  form.addMultipleChoiceItem()
    .setTitle('เหตุผล')
    .setChoiceValues(reasonChoices)
    .setRequired(false);

  const teacherChoices = getSettingsColumnValues_(ss, 'Teachers', LATE_SYSTEM.defaultTeachers);
  form.addListItem()
    .setTitle('ผู้บันทึก')
    .setChoiceValues(teacherChoices)
    .setRequired(true);
}

function handleFormSubmit(e) {
  if (!e || !e.range) {
    throw new Error('handleFormSubmit ต้องถูกเรียกจาก On form submit trigger');
  }
  processRawResponseRow_(e.range.getSheet(), e.range.getRow(), null);
}

function backfillFormResponses() {
  const ss = getSpreadsheet_();
  const sheet = getLatestFormResponseSheet_(ss);
  if (!sheet) {
    throw new Error('ไม่พบชีตคำตอบจาก Google Form');
  }
  const lastRow = sheet.getLastRow();
  for (let row = 2; row <= lastRow; row += 1) {
    processRawResponseRow_(sheet, row, null);
  }
}

function debugLatestLateSystemData() {
  const ss = getSpreadsheet_();
  const studentsSheet = ss.getSheetByName(LATE_SYSTEM.studentsSheet);
  const txSheet = ss.getSheetByName(LATE_SYSTEM.transactionsSheet);

  Logger.log('ข้อมูลกลางนักเรียนอยู่ที่ชีต: ' + LATE_SYSTEM.studentsSheet);
  if (studentsSheet) {
    const studentRows = studentsSheet
      .getDataRange()
      .getDisplayValues()
      .slice(0, 6)
      .map((row) => row.join(' | '));
    Logger.log('ตัวอย่าง Students:\n' + studentRows.join('\n'));
  }

  Logger.log('รายการบันทึกมาสายอยู่ที่ชีต: ' + LATE_SYSTEM.transactionsSheet);
  if (txSheet && txSheet.getLastRow() >= 2) {
    const startRow = Math.max(1, txSheet.getLastRow() - 5);
    const txRows = txSheet
      .getRange(startRow, 1, txSheet.getLastRow() - startRow + 1, txSheet.getLastColumn())
      .getDisplayValues()
      .map((row) => row.join(' | '));
    Logger.log('รายการล่าสุด Late_Transactions:\n' + txRows.join('\n'));
  }
}

function clearLateTransactionsData() {
  const ss = getSpreadsheet_();
  const txSheet = ensureSheetWithHeaders_(ss, LATE_SYSTEM.transactionsSheet, LATE_SYSTEM.transactionHeaders);
  const lastRow = txSheet.getLastRow();
  if (lastRow <= 1) {
    Logger.log('Late_Transactions is already empty.');
    return;
  }

  txSheet
    .getRange(2, 1, lastRow - 1, txSheet.getLastColumn())
    .clearContent();
  Logger.log('Cleared Late_Transactions rows 2 through ' + lastRow + '.');
}

function clearTestDataForFreshRun() {
  const ss = getSpreadsheet_();
  const cleared = [];

  const txSheet = ss.getSheetByName(LATE_SYSTEM.transactionsSheet);
  if (txSheet) {
    clearRowsBelowHeader_(txSheet);
    cleared.push(LATE_SYSTEM.transactionsSheet);
  }

  const responseSheets = getFormResponseSheets_(ss);
  responseSheets.forEach((sheet) => {
    clearRowsBelowHeader_(sheet);
    cleared.push(sheet.getName());
  });

  Logger.log('Cleared test data only from: ' + cleared.join(', '));
  Logger.log('Master data preserved: ' + [LATE_SYSTEM.studentsSheet, LATE_SYSTEM.settingsSheet].join(', '));
}

function removeHistoricalLateInputSheet() {
  const ss = getSpreadsheet_();
  const sheet = ss.getSheetByName('Historical_Late_Input');
  if (!sheet) {
    Logger.log('Historical_Late_Input sheet does not exist.');
    return;
  }
  ss.deleteSheet(sheet);
  Logger.log('Deleted obsolete Historical_Late_Input sheet.');
}

function processRawResponseRow_(rawSheet, row, namedValues) {
  const ss = getSpreadsheet_();
  const txSheet = ensureSheetWithHeaders_(ss, LATE_SYSTEM.transactionsSheet, LATE_SYSTEM.transactionHeaders);
  const sourceSheet = rawSheet.getName();

  if (isRawRowAlreadyProcessed_(txSheet, sourceSheet, row)) {
    return;
  }

  const raw = getRawValues_(rawSheet, row, namedValues);
  const submittedAt = raw.timestamp || new Date();
  const lateDate = raw.lateDate || dateOnly_(submittedAt);
  const timeIn = raw.timeIn || formatTime_(submittedAt);
  const studentInput = extractStudentId_(String(raw.studentId || '').trim());
  const reason = String(raw.reason || '').trim();
  const recorder = String(raw.recorder || '').trim();

  if (!studentInput) {
    writeRawProcessingResult_(rawSheet, row, 'Student not found', 'ไม่มีรหัสนักเรียนในคำตอบ', '');
    return;
  }

  const student = findStudent_(ss, studentInput);
  const canonicalStudentId = student ? student.student_id : studentInput;
  const duplicateKey = makeDuplicateKey_(lateDate, canonicalStudentId);
  const alreadyRecorded = hasRecordedDuplicate_(txSheet, duplicateKey);

  let status = 'Recorded';
  let note = '';
  if (!student) {
    status = 'Student not found';
    note = 'ไม่พบรหัสนี้ในชีต Students';
  } else if (alreadyRecorded) {
    status = 'Duplicate';
    note = 'มีรายการของนักเรียนคนนี้ในวันที่เดียวกันแล้ว';
  }

  const txId = Utilities.getUuid();
  txSheet.appendRow([
    txId,
    submittedAt,
    lateDate,
    timeIn,
    canonicalStudentId,
    student ? student.full_name : '',
    student ? student.grade : '',
    student ? student.room : '',
    reason,
    recorder,
    status,
    duplicateKey,
    sourceSheet,
    row,
    note,
  ]);

  const newRow = txSheet.getLastRow();
  txSheet.getRange(newRow, 2, 1, 2).setNumberFormat('yyyy-mm-dd hh:mm');
  txSheet.getRange(newRow, 3).setNumberFormat('yyyy-mm-dd');
  writeRawProcessingResult_(rawSheet, row, status, note, txId);
}

function getRawValues_(sheet, row, namedValues) {
  const result = {};
  if (namedValues) {
    result.studentId = pickNamedValue_(namedValues, LATE_SYSTEM.aliases.studentId);
    result.reason = pickNamedValue_(namedValues, LATE_SYSTEM.aliases.reason);
    result.recorder = pickNamedValue_(namedValues, LATE_SYSTEM.aliases.recorder);
    result.timestamp = parseDate_(pickNamedValue_(namedValues, LATE_SYSTEM.aliases.timestamp));
    result.lateDate = parseDate_(pickNamedValue_(namedValues, LATE_SYSTEM.aliases.lateDate));
    result.timeIn = formatTimeInput_(pickNamedValue_(namedValues, LATE_SYSTEM.aliases.timeIn));
    return result;
  }

  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  const values = sheet.getRange(row, 1, 1, sheet.getLastColumn()).getValues()[0];
  const displayValues = sheet.getRange(row, 1, 1, sheet.getLastColumn()).getDisplayValues()[0];
  result.studentId = pickByAliases_(headers, values, LATE_SYSTEM.aliases.studentId);
  result.reason = pickByAliases_(headers, values, LATE_SYSTEM.aliases.reason);
  result.recorder = pickByAliases_(headers, values, LATE_SYSTEM.aliases.recorder);
  result.timestamp = parseDate_(pickByAliases_(headers, values, LATE_SYSTEM.aliases.timestamp) || values[0]);
  result.lateDate = parseDate_(pickByAliases_(headers, values, LATE_SYSTEM.aliases.lateDate));
  result.timeIn = formatTimeInput_(
    pickByAliases_(headers, displayValues, LATE_SYSTEM.aliases.timeIn) ||
    pickByAliases_(headers, values, LATE_SYSTEM.aliases.timeIn)
  );
  return result;
}

function findStudent_(ss, studentInput) {
  const sheet = ss.getSheetByName(LATE_SYSTEM.studentsSheet);
  if (!sheet || sheet.getLastRow() < 2) return null;

  const values = sheet.getDataRange().getValues();
  const headers = values[0].map(normalizeHeader_);
  const idCol = headers.indexOf(normalizeHeader_('student_id'));
  const cardCol = headers.indexOf(normalizeHeader_('card_code'));
  const statusCol = headers.indexOf(normalizeHeader_('status'));
  const input = normalizeValue_(studentInput);

  for (let i = 1; i < values.length; i += 1) {
    const row = values[i];
    const id = idCol >= 0 ? normalizeValue_(row[idCol]) : '';
    const card = cardCol >= 0 ? normalizeValue_(row[cardCol]) : '';
    const status = statusCol >= 0 ? String(row[statusCol] || 'Active') : 'Active';
    if ((id && id === input) || (card && card === input)) {
      if (String(status).toLowerCase() !== 'active') return null;
      return studentObjectFromRow_(headers, row);
    }
  }
  return null;
}

function getStudentChoices_(ss) {
  const sheet = ss.getSheetByName(LATE_SYSTEM.studentsSheet);
  if (!sheet || sheet.getLastRow() < 2) return [];
  const values = sheet.getDataRange().getValues();
  const headers = values[0].map(normalizeHeader_);
  const idCol = headers.indexOf(normalizeHeader_('student_id'));
  const nameCol = headers.indexOf(normalizeHeader_('full_name'));
  const gradeCol = headers.indexOf(normalizeHeader_('grade'));
  const roomCol = headers.indexOf(normalizeHeader_('room'));
  const statusCol = headers.indexOf(normalizeHeader_('status'));
  if (idCol < 0) return [];

  return values.slice(1)
    .filter((row) => String(row[idCol] || '').trim())
    .filter((row) => statusCol < 0 || String(row[statusCol] || 'Active').toLowerCase() === 'active')
    .map((row) => {
      const id = String(row[idCol] || '').trim();
      const fullName = nameCol >= 0 ? String(row[nameCol] || '').trim() : '';
      const grade = gradeCol >= 0 ? String(row[gradeCol] || '').trim() : '';
      const room = roomCol >= 0 ? String(row[roomCol] || '').trim() : '';
      return [id, fullName, grade || room ? [grade, room].filter(Boolean).join('/') : ''].filter(Boolean).join(' | ');
    });
}

function buildStudentIdValidation_(ss) {
  const studentIds = getActiveStudentIds_(ss);
  if (studentIds.length === 0) {
    throw new Error('ไม่พบรหัสนักเรียน Active ในชีต ' + LATE_SYSTEM.studentsSheet);
  }

  return FormApp.createTextValidation()
    .requireTextMatchesPattern(buildExactMatchPattern_(studentIds))
    .setHelpText('กรุณากรอกรหัสนักเรียน 11 หลักที่มีอยู่ในระบบ')
    .build();
}

function getActiveStudentIds_(ss) {
  const sheet = ss.getSheetByName(LATE_SYSTEM.studentsSheet);
  if (!sheet || sheet.getLastRow() < 2) return [];

  const values = sheet.getDataRange().getDisplayValues();
  const headers = values[0].map(normalizeHeader_);
  const idCol = headers.indexOf(normalizeHeader_('student_id'));
  const statusCol = headers.indexOf(normalizeHeader_('status'));
  if (idCol < 0) return [];

  return uniqueValues_(values.slice(1)
    .filter((row) => statusCol < 0 || String(row[statusCol] || 'Active').toLowerCase() === 'active')
    .map((row) => String(row[idCol] || '').trim())
    .filter((studentId) => /^\d{11}$/.test(studentId)));
}

function buildExactMatchPattern_(values) {
  const trie = {};
  values.forEach((value) => {
    let node = trie;
    String(value).split('').forEach((character) => {
      if (!node[character]) node[character] = {};
      node = node[character];
    });
  });
  return '^' + buildRegexFromTrie_(trie) + '$';
}

function buildRegexFromTrie_(node) {
  const grouped = {};
  Object.keys(node).sort().forEach((character) => {
    const suffix = buildRegexFromTrie_(node[character]);
    if (!grouped[suffix]) grouped[suffix] = [];
    grouped[suffix].push(character);
  });

  const alternatives = Object.keys(grouped).map((suffix) => {
    const characters = grouped[suffix];
    const prefix = characters.length === 1
      ? characters[0]
      : '[' + characters.join('') + ']';
    return prefix + suffix;
  });
  if (alternatives.length <= 1) return alternatives[0] || '';
  return '(' + alternatives.join('|') + ')';
}

function getSettingsColumnValues_(ss, headerName, fallbackValues) {
  const sheet = ensureSettingsSheet_(ss);
  const col = findSettingsColumn_(sheet, headerName);
  if (!col) return fallbackValues.slice();

  const firstRow = LATE_SYSTEM.settingsFirstDataRow;
  const lastRow = Math.max(sheet.getLastRow(), firstRow + fallbackValues.length - 1);
  const values = sheet.getRange(firstRow, col, lastRow - firstRow + 1, 1).getValues()
    .map((row) => String(row[0] || '').trim())
    .filter(Boolean);
  return uniqueValues_(values.length ? values : fallbackValues);
}

function setSettingsColumnValues_(ss, headerName, values) {
  const sheet = ensureSettingsSheet_(ss);
  const col = findSettingsColumn_(sheet, headerName);
  if (!col || values.length === 0) return;

  const firstRow = LATE_SYSTEM.settingsFirstDataRow;
  const lastRow = Math.max(sheet.getLastRow(), firstRow + values.length - 1);
  const rowCount = lastRow - firstRow + 1;
  if (sheet.getMaxRows() < lastRow) {
    sheet.insertRowsAfter(sheet.getMaxRows(), lastRow - sheet.getMaxRows());
  }

  sheet.getRange(firstRow, col, rowCount, 1).clearContent();
  sheet.getRange(firstRow, col, values.length, 1).setValues(values.map((value) => [value]));
}

function ensureSettingsSheet_(ss) {
  let sheet = ss.getSheetByName(LATE_SYSTEM.settingsSheet);
  if (!sheet) {
    sheet = ss.insertSheet(LATE_SYSTEM.settingsSheet);
  }

  if (!String(sheet.getRange(1, 1).getValue() || '').trim()) {
    sheet.getRange(1, 1).setValue('Settings');
  }

  const headerRow = LATE_SYSTEM.settingsHeaderRow;
  LATE_SYSTEM.settingsHeaders.forEach((header, index) => {
    if (findSettingsColumn_(sheet, header)) return;

    let targetCol = index + 1;
    if (String(sheet.getRange(headerRow, targetCol).getValue() || '').trim()) {
      targetCol = sheet.getLastColumn() + 1;
    }
    sheet.getRange(headerRow, targetCol).setValue(header);
  });

  fillSettingsColumnDefaults_(sheet, 'Rooms', LATE_SYSTEM.defaultRooms);
  fillSettingsColumnDefaults_(sheet, 'Reasons', LATE_SYSTEM.defaultReasons);
  fillSettingsColumnDefaults_(sheet, 'Teachers', LATE_SYSTEM.defaultTeachers);
  sheet.setFrozenRows(Math.max(sheet.getFrozenRows(), headerRow));
  return sheet;
}

function fillSettingsColumnDefaults_(sheet, headerName, fallbackValues) {
  const col = findSettingsColumn_(sheet, headerName);
  if (!col || fallbackValues.length === 0) return;

  const firstRow = LATE_SYSTEM.settingsFirstDataRow;
  const requiredLastRow = firstRow + fallbackValues.length - 1;
  if (sheet.getMaxRows() < requiredLastRow) {
    sheet.insertRowsAfter(sheet.getMaxRows(), requiredLastRow - sheet.getMaxRows());
  }

  const existing = sheet.getRange(firstRow, col, Math.max(sheet.getLastRow() - firstRow + 1, fallbackValues.length), 1)
    .getValues()
    .some((row) => String(row[0] || '').trim());
  if (!existing) {
    sheet.getRange(firstRow, col, fallbackValues.length, 1).setValues(fallbackValues.map((value) => [value]));
  }
}

function findSettingsColumn_(sheet, headerName) {
  const headerRow = LATE_SYSTEM.settingsHeaderRow;
  const lastCol = Math.max(sheet.getLastColumn(), LATE_SYSTEM.settingsHeaders.length);
  const headers = sheet.getRange(headerRow, 1, 1, lastCol).getValues()[0];
  const normalizedTarget = normalizeHeader_(headerName);
  for (let i = 0; i < headers.length; i += 1) {
    if (normalizeHeader_(headers[i]) === normalizedTarget) {
      return i + 1;
    }
  }
  return 0;
}

function studentObjectFromRow_(headers, row) {
  const get = (name) => {
    const index = headers.indexOf(normalizeHeader_(name));
    return index >= 0 ? String(row[index] || '').trim() : '';
  };
  const fullName = get('full_name') || [get('prefix'), get('first_name'), get('last_name')].filter(Boolean).join('');
  return {
    student_id: get('student_id'),
    full_name: fullName,
    grade: get('grade'),
    room: get('room'),
  };
}

function hasRecordedDuplicate_(txSheet, duplicateKey) {
  const lastRow = txSheet.getLastRow();
  if (lastRow < 2) return false;
  const headers = txSheet.getRange(1, 1, 1, txSheet.getLastColumn()).getValues()[0].map(normalizeHeader_);
  const keyCol = headers.indexOf(normalizeHeader_('duplicate_key')) + 1;
  const statusCol = headers.indexOf(normalizeHeader_('status')) + 1;
  if (!keyCol || !statusCol) return false;

  const keys = txSheet.getRange(2, keyCol, lastRow - 1, 1).getValues();
  const statuses = txSheet.getRange(2, statusCol, lastRow - 1, 1).getValues();
  for (let i = 0; i < keys.length; i += 1) {
    if (String(keys[i][0]) === duplicateKey && String(statuses[i][0]) === 'Recorded') {
      return true;
    }
  }
  return false;
}

function isRawRowAlreadyProcessed_(txSheet, sourceSheet, rawRow) {
  const lastRow = txSheet.getLastRow();
  if (lastRow < 2) return false;
  const headers = txSheet.getRange(1, 1, 1, txSheet.getLastColumn()).getValues()[0].map(normalizeHeader_);
  const sourceCol = headers.indexOf(normalizeHeader_('source_sheet')) + 1;
  const rowCol = headers.indexOf(normalizeHeader_('raw_row')) + 1;
  if (!sourceCol || !rowCol) return false;
  const sources = txSheet.getRange(2, sourceCol, lastRow - 1, 1).getValues();
  const rows = txSheet.getRange(2, rowCol, lastRow - 1, 1).getValues();
  for (let i = 0; i < sources.length; i += 1) {
    if (String(sources[i][0]) === sourceSheet && Number(rows[i][0]) === Number(rawRow)) {
      return true;
    }
  }
  return false;
}

function clearRowsBelowHeader_(sheet) {
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) return;

  sheet
    .getRange(2, 1, lastRow - 1, Math.max(sheet.getLastColumn(), 1))
    .clearContent();
}

function getFormResponseSheets_(ss) {
  return ss.getSheets()
    .filter((sheet) => /^การตอบแบบฟอร์ม \d+$|^Form Responses \d+$/.test(sheet.getName()));
}

function getLatestFormResponseSheet_(ss) {
  const preferred = ss.getSheetByName(LATE_SYSTEM.rawResponseSheetFallback);
  const responseSheets = getFormResponseSheets_(ss)
    .sort((a, b) => b.getLastRow() - a.getLastRow());
  return responseSheets[0] || preferred;
}

function writeRawProcessingResult_(sheet, row, status, note, txId) {
  const headers = sheet.getRange(1, 1, 1, Math.max(sheet.getLastColumn(), 1)).getValues()[0];
  const statusCol = ensureHeaderColumn_(sheet, headers, 'processing_status');
  const noteCol = ensureHeaderColumn_(sheet, sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0], 'processing_note');
  const txCol = ensureHeaderColumn_(sheet, sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0], 'transaction_id');
  sheet.getRange(row, statusCol).setValue(status);
  sheet.getRange(row, noteCol).setValue(note || '');
  sheet.getRange(row, txCol).setValue(txId || '');
}

function ensureSheetWithHeaders_(ss, sheetName, expectedHeaders) {
  let sheet = ss.getSheetByName(sheetName);
  if (!sheet) {
    sheet = ss.insertSheet(sheetName);
  }
  const existing = sheet.getLastColumn() > 0
    ? sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0].map(String)
    : [];
  expectedHeaders.forEach((header) => {
    if (!existing.map(normalizeHeader_).includes(normalizeHeader_(header))) {
      sheet.getRange(1, sheet.getLastColumn() + 1).setValue(header);
      existing.push(header);
    }
  });
  sheet.setFrozenRows(1);
  return sheet;
}

function ensureHeaderColumn_(sheet, headers, headerName) {
  const normalized = headers.map(normalizeHeader_);
  let index = normalized.indexOf(normalizeHeader_(headerName));
  if (index >= 0) return index + 1;
  const col = sheet.getLastColumn() + 1;
  sheet.getRange(1, col).setValue(headerName);
  return col;
}

function installSpreadsheetSubmitTrigger_() {
  const ss = getSpreadsheet_();
  const triggers = ScriptApp.getProjectTriggers();
  const exists = triggers.some((trigger) =>
    trigger.getHandlerFunction() === 'handleFormSubmit' &&
    trigger.getEventType() === ScriptApp.EventType.ON_FORM_SUBMIT
  );
  if (!exists) {
    ScriptApp.newTrigger('handleFormSubmit')
      .forSpreadsheet(ss)
      .onFormSubmit()
      .create();
  }
}

function pickNamedValue_(namedValues, aliases) {
  const keys = Object.keys(namedValues || {});
  for (const key of keys) {
    if (aliases.map(normalizeHeader_).includes(normalizeHeader_(key))) {
      const value = namedValues[key];
      return Array.isArray(value) ? value[0] : value;
    }
  }
  return '';
}

function pickByAliases_(headers, values, aliases) {
  const normalizedHeaders = headers.map(normalizeHeader_);
  for (const alias of aliases) {
    const index = normalizedHeaders.indexOf(normalizeHeader_(alias));
    if (index >= 0) {
      return values[index];
    }
  }
  return '';
}

function makeDuplicateKey_(dateValue, studentId) {
  const date = parseDate_(dateValue) || new Date();
  return Utilities.formatDate(date, Session.getScriptTimeZone(), 'yyyy-MM-dd') + '|' + String(studentId).trim();
}

function dateOnly_(dateValue) {
  const date = parseDate_(dateValue) || new Date();
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function formatTime_(dateValue) {
  const date = parseDate_(dateValue) || new Date();
  return Utilities.formatDate(date, Session.getScriptTimeZone(), 'HH:mm');
}

function formatTimeInput_(value) {
  if (!value) return '';
  if (Object.prototype.toString.call(value) === '[object Date]' && !isNaN(value)) {
    return Utilities.formatDate(value, Session.getScriptTimeZone(), 'HH:mm');
  }
  const text = String(value || '').trim();
  const match = text.match(/(\d{1,2})[:.](\d{2})/);
  if (!match) return text;
  return String(Number(match[1])).padStart(2, '0') + ':' + match[2];
}

function parseDate_(value) {
  if (!value) return null;
  if (Object.prototype.toString.call(value) === '[object Date]' && !isNaN(value)) return value;
  const text = String(value || '').trim();
  const iso = text.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
  if (iso) return new Date(Number(iso[1]), Number(iso[2]) - 1, Number(iso[3]));
  const slash = text.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})/);
  if (slash) {
    let year = Number(slash[3]);
    if (year > 2400) year -= 543;
    return new Date(year, Number(slash[2]) - 1, Number(slash[1]));
  }
  const parsed = new Date(value);
  return isNaN(parsed) ? null : parsed;
}

function normalizeHeader_(value) {
  return String(value || '').toLowerCase().replace(/[\s_\-:]/g, '').trim();
}

function normalizeValue_(value) {
  return String(value || '').trim();
}

function uniqueValues_(values) {
  const seen = {};
  return values.filter((value) => {
    const key = normalizeHeader_(value);
    if (!key || seen[key]) return false;
    seen[key] = true;
    return true;
  });
}

function extractStudentId_(value) {
  const text = String(value || '').trim();
  if (!text) return '';
  return text.split('|')[0].trim();
}

function getSpreadsheet_() {
  if (LATE_SYSTEM.spreadsheetId) {
    return SpreadsheetApp.openById(LATE_SYSTEM.spreadsheetId);
  }
  return SpreadsheetApp.getActive();
}
