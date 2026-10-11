/**
 * SPVC Student Affairs Data API
 *
 * Add this file to the Apps Script project bound to the existing master
 * spreadsheet, then run setupStudentAffairsDataApi() once and deploy as a
 * Web app. The API stores structured records in Sheets and documents in Drive.
 */

const SA_DATA = {
  spreadsheetId: '1HmcqFHIQDiWZ2CWtxBC4XJjzp4cXTd3hZOrGunwA8tw',
  rootFolderName: 'SPVC Student Affairs Data',
  tokenProperty: 'STUDENT_AFFAIRS_API_TOKEN',
  googleClientIdProperty: 'STUDENT_AFFAIRS_GOOGLE_CLIENT_ID',
  disciplinePasswordProperty: 'STUDENT_AFFAIRS_DISCIPLINE_PASSWORD',
  defaultGoogleClientId: '310874593498-pdqua66brg8nmatqgauhvu2q01ft9cs9.apps.googleusercontent.com',
  rootFolderProperty: 'STUDENT_AFFAIRS_ROOT_FOLDER_ID',
  maxFileBytes: 8 * 1024 * 1024,
  sheets: {
    authUsers: {
      name: 'Auth_Users',
      key: 'email',
      headers: [
        'email', 'name', 'role', 'systems_json', 'status', 'note',
        'created_at', 'updated_at',
      ],
    },
    behaviorCases: {
      name: 'Behavior_Cases',
      key: 'case_id',
      headers: [
        'case_id', 'student_id', 'student_name', 'room', 'incident_type',
        'severity', 'incident_at', 'place', 'detail', 'owners_json', 'status',
        'score', 'opened_by', 'created_at', 'updated_at', 'version', 'deleted_at',
      ],
    },
    lateRequests: {
      name: 'Late_Requests',
      key: 'request_id',
      headers: [
        'request_id', 'student_id', 'student_name', 'grade', 'room', 'adviser',
        'late_date', 'time_in', 'reason', 'note', 'requested_teacher', 'source',
        'status', 'called_by', 'called_at', 'approved_by', 'approved_at',
        'transaction_id', 'created_at', 'updated_at', 'version', 'deleted_at',
      ],
    },
    lateTransactions: {
      name: 'Late_Transactions',
      key: 'transaction_id',
      headers: [
        'transaction_id', 'submitted_at', 'late_date', 'time_in', 'student_id',
        'full_name', 'grade', 'room', 'reason', 'recorder', 'status',
        'duplicate_key', 'source_sheet', 'raw_row', 'notes',
      ],
    },
    offCampusRequests: {
      name: 'Off_Campus_Requests',
      key: 'request_id',
      headers: [
        'request_id', 'student_id', 'student_name', 'room', 'adviser',
        'request_date', 'leave_time', 'return_mode', 'return_time',
        'destination', 'reason', 'detail', 'subject_teacher', 'subject_note',
        'adviser_note', 'discipline_teacher', 'discipline_note', 'status',
        'created_at', 'updated_at', 'version', 'deleted_at',
      ],
    },
    offCampusTimeline: {
      name: 'Off_Campus_Timeline',
      key: 'timeline_id',
      headers: [
        'timeline_id', 'request_id', 'action_at', 'stage', 'decision',
        'status', 'actor', 'note', 'created_at',
      ],
    },
    behaviorTimeline: {
      name: 'Behavior_Timeline',
      key: 'timeline_id',
      headers: [
        'timeline_id', 'case_id', 'action', 'action_at', 'status', 'score',
        'owners_json', 'note', 'actor', 'created_at',
      ],
    },
    behaviorReports: {
      name: 'Behavior_Reports',
      key: 'report_id',
      headers: [
        'report_id', 'reporter_mode', 'reporter_student_id', 'reporter_name',
        'reporter_room', 'contact', 'incident_type', 'incident_at', 'place',
        'people_involved', 'detail', 'urgency_self', 'safe_now', 'status',
        'reviewer', 'review_note', 'linked_case_id', 'created_at', 'updated_at',
        'version', 'deleted_at',
      ],
    },
    genderRequests: {
      name: 'Gender_Requests',
      key: 'request_id',
      headers: [
        'request_id', 'student_id', 'student_name', 'room', 'registered_sex',
        'identity_group', 'permissions_json', 'decisions_json', 'preferred_name',
        'pronouns', 'effective_date', 'consent_date', 'recorder', 'approver',
        'status', 'note', 'created_at', 'updated_at', 'version', 'deleted_at',
      ],
    },
    genderTimeline: {
      name: 'Gender_Timeline',
      key: 'timeline_id',
      headers: [
        'timeline_id', 'request_id', 'action_at', 'status', 'approver',
        'decisions_json', 'note', 'actor', 'created_at',
      ],
    },
    documents: {
      name: 'Student_Affairs_Documents',
      key: 'document_id',
      headers: [
        'document_id', 'system', 'record_id', 'timeline_id', 'category',
        'file_name', 'mime_type', 'drive_file_id', 'drive_url', 'folder_id',
        'uploaded_by', 'uploaded_at', 'deleted_at',
      ],
    },
    audit: {
      name: 'Student_Affairs_Audit',
      key: 'audit_id',
      headers: [
        'audit_id', 'system', 'record_id', 'operation', 'actor',
        'payload_json', 'created_at',
      ],
    },
  },
};

const SA_THAI_MOJIBAKE_MAP = {
  '‡∏£‡∏≠‡∏ï‡∏£‡∏ß‡∏à‡∏™‡∏≠‡∏ö': 'รอตรวจสอบ',
  '‡∏Ç‡∏≠‡∏Ç‡πâ‡∏≠‡∏°‡∏π‡∏•‡πÄ‡∏û‡∏¥‡πà‡∏°': 'ขอข้อมูลเพิ่ม',
  '‡πÄ‡∏Å‡πá‡∏ö‡πÄ‡∏õ‡πá‡∏ô‡∏Ç‡πâ‡∏≠‡∏°‡∏π‡∏•‡πÄ‡∏ù‡πâ‡∏≤‡∏£‡∏∞‡∏ß‡∏±‡∏á': 'เก็บเป็นข้อมูลเฝ้าระวัง',
  '‡πÑ‡∏°‡πà‡πÄ‡∏Ç‡πâ‡∏≤‡πÄ‡∏Å‡∏ì‡∏ë‡πå': 'ไม่เข้าเกณฑ์',
  '‡∏Ç‡πâ‡∏≠‡∏°‡∏π‡∏•‡∏ã‡πâ‡∏≥': 'ข้อมูลซ้ำ',
  '‡πÄ‡∏õ‡∏¥‡∏î‡πÄ‡∏õ‡πá‡∏ô‡πÄ‡∏Ñ‡∏™‡πÅ‡∏•‡πâ‡∏ß': 'เปิดเป็นเคสแล้ว',
};

function setupStudentAffairsDataApi() {
  const ss = saSpreadsheet_();
  Object.keys(SA_DATA.sheets).forEach((key) => {
    saEnsureSheet_(ss, SA_DATA.sheets[key]);
  });
  saEnsureAuthSeed_();
  const root = saRootFolder_();
  saSystemFolder_('behavior', root);
  saSystemFolder_('behavior-report', root);
  saSystemFolder_('gender', root);
  saSystemFolder_('off-campus', root);

  const props = PropertiesService.getScriptProperties();
  let token = props.getProperty(SA_DATA.tokenProperty);
  if (!token) {
    token = Utilities.getUuid().replace(/-/g, '') + Utilities.getUuid().replace(/-/g, '');
    props.setProperty(SA_DATA.tokenProperty, token);
  }
  Logger.log('Student Affairs API setup complete.');
  Logger.log('API token: ' + token);
  Logger.log('Drive root: ' + root.getUrl());
  return {
    token: token,
    rootFolderId: root.getId(),
    rootFolderUrl: root.getUrl(),
    spreadsheetId: ss.getId(),
  };
}

/**
 * Runs the four student-facing workflows against the real spreadsheet.
 * Every temporary row uses a unique TEST-* id and is removed in finally.
 */
function runStudentAffairsIntegrationTests() {
  setupStudentAffairsDataApi();
  const student = saReadMasterStudents_()
    .find((item) => String(item.status || '').toLowerCase() === 'active');
  saRequire_(student, 'No active student was found for integration testing');

  const stamp = Utilities.formatDate(new Date(), 'Asia/Bangkok', 'yyyyMMddHHmmss');
  const ids = {
    lateRequest: 'TEST-LREQ-' + stamp,
    lateTransaction: '',
    genderRequest: 'TEST-GI-' + stamp,
    behaviorReport: 'TEST-RPT-' + stamp,
    offCampusRequest: 'TEST-OUT-' + stamp,
  };
  const result = {
    ok: false,
    studentId: student.id,
    testedAt: new Date(),
    tests: {},
    cleanup: {},
  };

  try {
    const late = saCreateLateRequest_({
      requestId: ids.lateRequest,
      studentId: student.id,
      lateDate: '2099-12-31',
      arrivalTime: '08:15',
      reason: 'ทดสอบระบบ',
      note: 'ข้อมูลทดสอบอัตโนมัติ',
      requestedTeacher: 'ครูทดสอบระบบ',
    });
    const called = saCallLateRequest_({
      requestId: late.id,
      teacher: 'ครูทดสอบระบบ',
      version: late.version,
    });
    const approvedLate = saApproveLateRequest_({
      requestId: late.id,
      teacher: 'ครูทดสอบระบบ',
      version: called.version,
    });
    ids.lateTransaction = approvedLate.transactionId;
    saRequire_(approvedLate.status === 'approved', 'Late workflow did not reach approved');
    result.tests.late = { ok: true, requestId: late.id, transactionId: ids.lateTransaction };

    const gender = saCreateGenderRequest_({
      requestId: ids.genderRequest,
      studentId: student.id,
      studentName: student.fullName,
      room: student.room,
      registeredSex: student.prefix === 'นาย' ? 'ชาย' : 'หญิง',
      identityGroup: 'ทดสอบระบบ',
      permissions: ['ทดสอบการยื่นคำขอ'],
      decisions: ['รอพิจารณา'],
      recorder: 'นักเรียนทดสอบระบบ',
      status: 'รอตรวจข้อมูล',
      note: 'ข้อมูลทดสอบอัตโนมัติ',
    });
    const updatedGender = saUpdateGenderRequest_({
      requestId: gender.requestId,
      version: gender.version,
      status: 'อนุมัติ',
      approver: 'ครูทดสอบระบบ',
      decisions: ['อนุมัติ'],
      note: 'ทดสอบการอัปเดตสถานะ',
      actor: 'ครูทดสอบระบบ',
    });
    saRequire_(updatedGender.status === 'อนุมัติ', 'Gender workflow did not update');
    result.tests.gender = { ok: true, requestId: gender.requestId };

    const report = saCreateBehaviorReport_({
      reportId: ids.behaviorReport,
      reporterMode: 'identified',
      reporterStudentId: student.id,
      reporterName: student.fullName,
      reporterRoom: student.room,
      incidentType: 'ทดสอบระบบแจ้งเหตุ',
      incidentAt: new Date(),
      place: 'พื้นที่ทดสอบระบบ',
      peopleInvolved: 'ข้อมูลทดสอบ',
      detail: 'รายละเอียดสำหรับทดสอบการแจ้งเหตุเข้าสู่ระบบกลาง',
      urgencySelf: 'ไม่เร่งด่วน',
      safeNow: 'ปลอดภัยแล้ว',
      files: [],
    });
    const reviewedReport = saReviewBehaviorReport_({
      reportId: report.reportId,
      version: 1,
      status: 'เก็บเป็นข้อมูลเฝ้าระวัง',
      reviewer: 'ครูทดสอบระบบ',
      reviewNote: 'ทดสอบขั้นตอนคัดกรอง',
    });
    saRequire_(reviewedReport.report.status === 'เก็บเป็นข้อมูลเฝ้าระวัง', 'Report workflow did not update');
    result.tests.report = { ok: true, reportId: report.reportId };

    let offCampus = saCreateOffCampusRequest_({
      requestId: ids.offCampusRequest,
      studentId: student.id,
      date: '2099-12-31',
      leaveTime: '10:00',
      returnMode: 'return',
      returnTime: '11:00',
      destination: 'พื้นที่ทดสอบระบบ',
      reason: 'ทดสอบระบบ',
      detail: 'ข้อมูลทดสอบอัตโนมัติ',
      subjectTeacher: 'ครูประจำวิชาทดสอบ',
    });
    offCampus = saReviewOffCampus_({
      requestId: offCampus.id,
      version: offCampus.version,
      stage: 'subject_teacher',
      decision: 'approve',
      actor: 'ครูประจำวิชาทดสอบ',
      note: 'รับรองเพื่อทดสอบระบบ',
    }, null);
    offCampus = saReviewOffCampus_({
      requestId: offCampus.id,
      version: offCampus.version,
      stage: 'adviser',
      decision: 'approve',
      actor: 'ครูที่ปรึกษาทดสอบ',
      note: 'รับรองเพื่อทดสอบระบบ',
    }, null);
    offCampus = saReviewOffCampus_({
      requestId: offCampus.id,
      version: offCampus.version,
      stage: 'discipline',
      decision: 'approve',
      actor: 'ครูฝ่ายปกครองทดสอบ',
      password: PropertiesService.getScriptProperties().getProperty(SA_DATA.disciplinePasswordProperty),
      note: 'อนุมัติเพื่อทดสอบระบบ',
    }, null);
    saRequire_(offCampus.status === 'approved', 'Off-campus workflow did not reach approved');
    result.tests.offCampus = { ok: true, requestId: offCampus.id };

    const dashboard = saStudentDashboard_({ studentId: student.id });
    result.tests.studentDashboard = {
      ok: dashboard.late.some((item) => item.id === ids.lateRequest)
        && dashboard.gender.some((item) => item.requestId === ids.genderRequest)
        && dashboard.reports.some((item) => item.reportId === ids.behaviorReport)
        && dashboard.offCampus.some((item) => item.id === ids.offCampusRequest),
    };
    saRequire_(result.tests.studentDashboard.ok, 'Student dashboard did not return every test record');
    result.ok = true;
  } finally {
    result.cleanup = saCleanupIntegrationTestRows_(ids);
  }

  Logger.log(JSON.stringify(result));
  return result;
}

function saCleanupIntegrationTestRows_(ids) {
  const recordIds = [
    ids.lateRequest,
    ids.lateTransaction,
    ids.genderRequest,
    ids.behaviorReport,
    ids.offCampusRequest,
  ].filter(Boolean);
  return {
    lateRequests: saDeleteRowsByColumn_(SA_DATA.sheets.lateRequests, 'request_id', [ids.lateRequest]),
    lateTransactions: saDeleteRowsByColumn_(SA_DATA.sheets.lateTransactions, 'transaction_id', [ids.lateTransaction]),
    genderRequests: saDeleteRowsByColumn_(SA_DATA.sheets.genderRequests, 'request_id', [ids.genderRequest]),
    genderTimeline: saDeleteRowsByColumn_(SA_DATA.sheets.genderTimeline, 'request_id', [ids.genderRequest]),
    behaviorReports: saDeleteRowsByColumn_(SA_DATA.sheets.behaviorReports, 'report_id', [ids.behaviorReport]),
    offCampusRequests: saDeleteRowsByColumn_(SA_DATA.sheets.offCampusRequests, 'request_id', [ids.offCampusRequest]),
    offCampusTimeline: saDeleteRowsByColumn_(SA_DATA.sheets.offCampusTimeline, 'request_id', [ids.offCampusRequest]),
    audit: saDeleteRowsByColumn_(SA_DATA.sheets.audit, 'record_id', recordIds),
  };
}

function saDeleteRowsByColumn_(config, column, values) {
  const targets = new Set((values || []).filter(Boolean).map(String));
  if (!targets.size) return 0;
  const sheet = saEnsureSheet_(saSpreadsheet_(), config);
  const index = config.headers.indexOf(column);
  if (index < 0 || sheet.getLastRow() < 2) return 0;
  const cells = sheet.getRange(2, index + 1, sheet.getLastRow() - 1, 1).getDisplayValues();
  const rows = [];
  cells.forEach((row, offset) => {
    if (targets.has(String(row[0] || ''))) rows.push(offset + 2);
  });
  rows.sort((a, b) => b - a).forEach((row) => sheet.deleteRow(row));
  return rows.length;
}

function authorizeStudentAffairsExternalRequest() {
  const response = UrlFetchApp.fetch('https://oauth2.googleapis.com/tokeninfo', {
    muteHttpExceptions: true,
  });
  Logger.log('External request authorization complete: ' + response.getResponseCode());
}

function rotateStudentAffairsApiToken() {
  const token = Utilities.getUuid().replace(/-/g, '') + Utilities.getUuid().replace(/-/g, '');
  PropertiesService.getScriptProperties().setProperty(SA_DATA.tokenProperty, token);
  Logger.log('New API token: ' + token);
  return token;
}

function normalizeStudentAffairsMojibakeData() {
  const targets = [
    { sheet: SA_DATA.sheets.behaviorReports.name, columns: ['urgency_self', 'safe_now', 'status'] },
    { sheet: SA_DATA.sheets.behaviorCases.name, columns: ['status'] },
    { sheet: SA_DATA.sheets.behaviorTimeline.name, columns: ['status'] },
    { sheet: SA_DATA.sheets.genderRequests.name, columns: ['status'] },
    { sheet: SA_DATA.sheets.genderTimeline.name, columns: ['status'] },
  ];
  const ss = saSpreadsheet_();
  const result = { updated: 0, sheets: {} };
  targets.forEach((target) => {
    const sheet = ss.getSheetByName(target.sheet);
    if (!sheet || sheet.getLastRow() < 2) return;
    const range = sheet.getDataRange();
    const values = range.getValues();
    const headers = values[0].map((header) => String(header).trim());
    let sheetUpdates = 0;
    target.columns.forEach((column) => {
      const index = headers.indexOf(column);
      if (index === -1) return;
      for (let row = 1; row < values.length; row += 1) {
        const normalized = saNormalizeThaiMojibake_(values[row][index]);
        if (normalized !== String(values[row][index] == null ? '' : values[row][index]).trim()) {
          values[row][index] = normalized;
          sheetUpdates += 1;
        }
      }
    });
    if (sheetUpdates) {
      range.setValues(values);
      result.updated += sheetUpdates;
      result.sheets[target.sheet] = sheetUpdates;
    }
  });
  Logger.log(JSON.stringify(result));
  return result;
}

function cleanupDuplicateStudentAffairsDocuments() {
  const config = SA_DATA.sheets.documents;
  const sheet = saSpreadsheet_().getSheetByName(config.name);
  if (!sheet || sheet.getLastRow() < 2) return { updated: 0 };
  const range = sheet.getDataRange();
  const values = range.getValues();
  const headers = values[0].map((header) => String(header).trim());
  const index = (column) => headers.indexOf(column);
  const deletedAtIndex = index('deleted_at');
  const keyIndexes = ['system', 'record_id', 'drive_file_id', 'drive_url', 'file_name', 'mime_type']
    .map(index);
  const seen = new Set();
  let updated = 0;
  for (let row = 1; row < values.length; row += 1) {
    if (deletedAtIndex >= 0 && values[row][deletedAtIndex]) continue;
    const parts = keyIndexes
      .map((columnIndex) => columnIndex >= 0 ? String(values[row][columnIndex] || '').trim().toLowerCase() : '');
    const key = parts[2] ? `${parts[0]}|${parts[1]}|${parts[2]}` : parts.join('|');
    if (!key.trim()) continue;
    if (seen.has(key)) {
      if (deletedAtIndex >= 0) values[row][deletedAtIndex] = new Date();
      updated += 1;
    } else {
      seen.add(key);
    }
  }
  if (updated) range.setValues(values);
  Logger.log(JSON.stringify({ updated: updated }));
  return { updated: updated };
}

function repairBehaviorReportEvidenceLinks() {
  const reports = saReadObjects_(SA_DATA.sheets.behaviorReports)
    .filter((row) => !row.deleted_at && row.linked_case_id);
  const documents = saReadObjects_(SA_DATA.sheets.documents)
    .filter((row) => !row.deleted_at);
  const now = new Date();
  const result = { deleted: 0, appended: 0, reports: 0 };
  reports.forEach((report) => {
    const sourceDocuments = documents
      .filter((row) => row.system === 'behavior-report' && row.record_id === report.report_id);
    if (!sourceDocuments.length) return;
    result.reports += 1;
    const expectedKeys = new Set(sourceDocuments.map(saDocumentEvidenceKey_));
    const targetDocuments = documents
      .filter((row) => row.system === 'behavior'
        && row.record_id === report.linked_case_id
        && row.category === 'student-report-evidence');
    const keptKeys = new Set();
    targetDocuments.forEach((target) => {
      const key = saDocumentEvidenceKey_(target);
      if (!expectedKeys.has(key) || keptKeys.has(key)) {
        const found = saFindRow_(SA_DATA.sheets.documents, target.document_id);
        if (found) {
          saPatchRow_(found, { deleted_at: now });
          result.deleted += 1;
        }
        return;
      }
      keptKeys.add(key);
    });
    sourceDocuments.forEach((source) => {
      const key = saDocumentEvidenceKey_(source);
      if (keptKeys.has(key)) return;
      saAppendObject_(SA_DATA.sheets.documents, {
        document_id: saId_('DOC'),
        system: 'behavior',
        record_id: report.linked_case_id,
        timeline_id: '',
        category: 'student-report-evidence',
        file_name: source.file_name,
        mime_type: source.mime_type,
        drive_file_id: source.drive_file_id,
        drive_url: source.drive_url,
        folder_id: source.folder_id,
        uploaded_by: report.reviewer || source.uploaded_by || '',
        uploaded_at: now,
        deleted_at: '',
      });
      keptKeys.add(key);
      result.appended += 1;
    });
  });
  Logger.log(JSON.stringify(result));
  return result;
}

function setStudentAffairsGoogleClientId(clientId) {
  const value = String(clientId || '').trim();
  saRequire_(value, 'Google Client ID is required');
  PropertiesService.getScriptProperties().setProperty(SA_DATA.googleClientIdProperty, value);
  Logger.log('Google Client ID saved: ' + value);
  return value;
}

function setStudentAffairsDisciplinePassword(password) {
  const value = String(password || '').trim();
  saRequire_(value.length >= 8, 'รหัสผ่านฝ่ายปกครองต้องมีอย่างน้อย 8 ตัวอักษร');
  PropertiesService.getScriptProperties().setProperty(SA_DATA.disciplinePasswordProperty, value);
  return { configured: true };
}

function doGet() {
  return saJson_({
    ok: true,
    service: 'SPVC Student Affairs Data API',
    version: 2,
    timestamp: new Date().toISOString(),
  });
}

function doPost(e) {
  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(30000);
    const request = saParseRequest_(e);
    const user = saAuthorize_(request.token, request.action, request.auth, request.payload || {});
    const result = saRoute_(request.action, request.payload || {}, user);
    return saJson_({ ok: true, action: request.action, data: result });
  } catch (error) {
    return saJson_({
      ok: false,
      error: String(error && error.message ? error.message : error),
    });
  } finally {
    try {
      lock.releaseLock();
    } catch (ignore) {
      // Lock may not have been acquired.
    }
  }
}

function saRoute_(action, payload, user) {
  switch (action) {
    case 'health':
      return { timestamp: new Date(), spreadsheetId: SA_DATA.spreadsheetId };
    case 'auth.verify':
      return user;
    case 'public.summary':
      return saPublicSummary_();
    case 'student.dashboard':
      return saStudentDashboard_(payload);
    case 'master.student.register':
      return saRegisterStudent_(payload);
    case 'master.public':
      return saMasterPublic_();
    case 'master.bootstrap':
      return saMasterBootstrap_();
    case 'late.request.create':
      return saCreateLateRequest_(payload);
    case 'late.request.list':
      return saListLateRequests_();
    case 'late.dashboard':
      return saLateDashboard_();
    case 'late.transactions.list':
      return saListLateTransactions_();
    case 'late.request.call':
      return saCallLateRequest_(payload);
    case 'late.request.approve':
      return saApproveLateRequest_(payload);
    case 'late.record.create':
      return saCreateLateRecord_(payload);
    case 'gender.student.create':
      return saCreateStudentGenderRequest_(payload);
    case 'off-campus.create':
      return saCreateOffCampusRequest_(payload);
    case 'off-campus.student.get':
      return saGetStudentOffCampus_(payload);
    case 'off-campus.review':
      return saReviewOffCampus_(payload, null);
    case 'off-campus.list':
      return saListOffCampusRequests_();
    case 'off-campus.admin.update':
      return saReviewOffCampus_(payload, user);
    case 'bootstrap':
      return {
        behaviorCases: saListBehaviorCases_(),
        genderRequests: saListGenderRequests_(),
      };
    case 'behavior.list':
      return saListBehaviorCases_();
    case 'behavior.create':
      return saCreateBehaviorCase_(payload);
    case 'behavior.update':
      return saUpdateBehaviorCase_(payload);
    case 'behavior.delete':
      return saDeleteBehaviorCase_(payload);
    case 'behavior.document.get':
      return saGetBehaviorDocument_(payload);
    case 'behavior-report.create':
      return saCreateBehaviorReport_(payload);
    case 'behavior-report.list':
      return saListBehaviorReports_();
    case 'behavior-report.review':
      return saReviewBehaviorReport_(payload);
    case 'behavior-report.delete':
      return saDeleteBehaviorReport_(payload);
    case 'gender.list':
      return saListGenderRequests_();
    case 'gender.create':
      return saCreateGenderRequest_(payload);
    case 'gender.update':
      return saUpdateGenderRequest_(payload);
    case 'gender.delete':
      return saDeleteGenderRequest_(payload);
    default:
      throw new Error('Unknown action: ' + action);
  }
}

function saPublicSummary_() {
  const behaviorCases = saListBehaviorCases_();
  const behaviorReports = saListBehaviorReports_();
  const genderRequests = saListGenderRequests_();
  const offCampusRequests = saListOffCampusRequests_();
  const caseGroups = behaviorCases.reduce((summary, record) => {
    summary[saClassifyBehaviorStatus_(record.status)] += 1;
    return summary;
  }, { active: 0, pending: 0, done: 0 });
  return {
    behaviorCases: {
      total: behaviorCases.length,
      active: caseGroups.active,
      pending: caseGroups.pending,
      done: caseGroups.done,
    },
    behaviorReports: {
      total: behaviorReports.length,
    },
    genderRequests: {
      total: genderRequests.length,
    },
    offCampusRequests: {
      total: offCampusRequests.length,
      pending: offCampusRequests.filter((record) => /^waiting_/.test(String(record.status || ''))).length,
      approved: offCampusRequests.filter((record) => String(record.status || '') === 'approved').length,
    },
  };
}

function saIsPublicAction_(action) {
  return [
    'health', 'public.summary', 'behavior-report.create',
    'student.dashboard', 'master.student.register',
    'master.public',
    'late.request.create', 'gender.student.create',
    'off-campus.create', 'off-campus.student.get', 'off-campus.review',
  ].indexOf(action) !== -1;
}

function saIsTeacherPortalAction_(action) {
  return [
    'master.bootstrap', 'late.dashboard',
    'late.request.call', 'late.request.approve', 'late.record.create',
  ].indexOf(action) !== -1;
}

function saReadMasterStudents_() {
  const sheet = saSpreadsheet_().getSheetByName('Students');
  if (!sheet || sheet.getLastRow() < 2) return [];
  const values = sheet.getDataRange().getDisplayValues();
  const headers = values[0].map((value) => String(value || '').trim().toLowerCase());
  return values.slice(1).map((row) => {
    const get = (name) => {
      const index = headers.indexOf(name);
      return index >= 0 ? String(row[index] || '').trim() : '';
    };
    return {
      id: get('student_id'),
      prefix: get('prefix'),
      firstName: get('first_name'),
      lastName: get('last_name'),
      fullName: get('full_name') || [get('prefix'), get('first_name'), get('last_name')].filter(Boolean).join(''),
      grade: get('grade'),
      room: get('room'),
      homeroomTeacher: get('homeroom_teacher'),
      status: get('status') || 'Active',
    };
  }).filter((student) => student.id);
}

function saFindMasterStudent_(studentId) {
  const id = String(studentId || '').trim();
  return saReadMasterStudents_().find((student) => student.id === id && String(student.status).toLowerCase() === 'active') || null;
}

function saStudentRecord_(student) {
  return {
    id: student.id,
    prefix: student.prefix || '',
    fullName: student.fullName || '',
    grade: student.grade || '',
    room: student.room || '',
    homeroomTeacher: student.homeroomTeacher || '',
    status: student.status || 'Active',
  };
}

function saReadMasterTeachers_() {
  const ss = saSpreadsheet_();
  const sheet = ss.getSheetById(667370291) || ss.getSheetByName('Teachers');
  if (!sheet || sheet.getLastRow() < 5) return [];
  return [...new Set(sheet.getRange(5, 3, sheet.getLastRow() - 4, 1)
    .getDisplayValues()
    .map((row) => String(row[0] || '').trim())
    .filter(Boolean))];
}

function saMasterClasses_(students) {
  const classes = new Map();
  (students || []).forEach((student) => {
    if (!student.room || classes.has(student.room)) return;
    classes.set(student.room, {
      room: student.room,
      grade: student.grade || '',
      adviser: student.homeroomTeacher || '',
    });
  });
  return [...classes.values()].sort((a, b) => String(a.room).localeCompare(String(b.room)));
}

function saMasterPublic_() {
  const students = saReadMasterStudents_()
    .filter((student) => String(student.status || '').toLowerCase() === 'active');
  return {
    teachers: saReadMasterTeachers_(),
    classes: saMasterClasses_(students),
    studentCount: students.length,
  };
}

function saMasterBootstrap_() {
  const students = saReadMasterStudents_()
    .filter((student) => String(student.status || '').toLowerCase() === 'active');
  return {
    students: students.map(saStudentRecord_),
    teachers: saReadMasterTeachers_(),
    classes: saMasterClasses_(students),
    loadedAt: new Date(),
  };
}

function saRegisterStudent_(payload) {
  const studentId = String(payload.studentId || '').trim();
  const fullName = saLimit_(payload.fullName, 180);
  const room = saLimit_(payload.room, 120);
  saRequire_(/^\d{11}$/.test(studentId), 'studentId must contain 11 digits');
  saRequire_(fullName.length >= 4, 'fullName is required');
  saRequire_(room, 'room is required');

  const existing = saReadMasterStudents_().find((student) => student.id === studentId);
  if (existing) {
    saRequire_(String(existing.status || '').toLowerCase() === 'active', 'รหัสนักเรียนนี้มีอยู่แล้วแต่ยังไม่ได้เปิดใช้งาน');
    return { student: saStudentRecord_(existing), created: false };
  }

  const classProfile = saReadMasterStudents_().find((student) => student.room === room && student.homeroomTeacher);
  saRequire_(classProfile, 'ไม่พบชั้นเรียนนี้ใน Master Student');
  const prefixMatch = fullName.match(/^(นาย|นางสาว|นาง)/);
  const prefix = prefixMatch ? prefixMatch[1] : '';
  const withoutPrefix = fullName.replace(/^(นาย|นางสาว|นาง)/, '').trim();
  const nameParts = withoutPrefix.split(/\s+/);
  const firstName = nameParts.shift() || '';
  const lastName = nameParts.join(' ');
  const sheet = saSpreadsheet_().getSheetByName('Students');
  saRequire_(sheet, 'Students sheet not found');
  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getDisplayValues()[0]
    .map((value) => String(value || '').trim().toLowerCase());
  const object = {
    student_id: studentId,
    student_no: '',
    prefix: prefix,
    first_name: firstName,
    last_name: lastName,
    full_name: fullName,
    grade: classProfile.grade,
    room: classProfile.room,
    homeroom_teacher: classProfile.homeroomTeacher,
    status: 'Active',
    card_code: '',
    notes: 'ลงทะเบียนผ่าน Student Portal · ' + (payload.actor || payload.source || 'student'),
  };
  sheet.appendRow(headers.map((header) => object[header] === undefined ? '' : object[header]));
  const row = sheet.getLastRow();
  const idColumn = headers.indexOf('student_id') + 1;
  if (idColumn > 0) sheet.getRange(row, idColumn).setNumberFormat('@').setValue(studentId);
  const student = {
    id: studentId,
    prefix: prefix,
    firstName: firstName,
    lastName: lastName,
    fullName: fullName,
    grade: classProfile.grade,
    room: classProfile.room,
    homeroomTeacher: classProfile.homeroomTeacher,
    status: 'Active',
  };
  saAudit_('master', studentId, 'student-register', payload.actor || payload.source || 'student', payload);
  return { student: saStudentRecord_(student), created: true };
}

function saDateKey_(value) {
  const date = saDate_(value) || new Date();
  return Utilities.formatDate(date, 'Asia/Bangkok', 'yyyy-MM-dd');
}

function saLateRequestRecord_(row) {
  return {
    id: row.request_id,
    studentId: row.student_id,
    studentName: row.student_name,
    grade: row.grade,
    room: row.room,
    adviser: row.adviser,
    lateDate: saDateKey_(row.late_date),
    arrivalTime: row.time_in,
    reason: row.reason,
    note: row.note,
    requestedTeacher: row.requested_teacher,
    source: row.source,
    status: row.status,
    calledBy: row.called_by,
    calledAt: row.called_at,
    approvedBy: row.approved_by,
    approvedAt: row.approved_at,
    transactionId: row.transaction_id,
    submittedAt: row.created_at,
    updatedAt: row.updated_at,
    version: Number(row.version || 1),
  };
}

function saListLateRequests_() {
  return saReadObjects_(SA_DATA.sheets.lateRequests)
    .filter((row) => !row.deleted_at)
    .map(saLateRequestRecord_)
    .sort((a, b) => new Date(b.submittedAt) - new Date(a.submittedAt));
}

function saLateDashboard_() {
  const requests = saListLateRequests_();
  const directTransactions = saReadObjects_(SA_DATA.sheets.lateTransactions)
    .filter((row) => String(row.status || '') === 'Recorded')
    .map((row) => ({
      id: row.transaction_id,
      transactionId: row.transaction_id,
      studentId: row.student_id,
      studentName: row.full_name,
      grade: row.grade,
      room: row.room,
      adviser: '',
      lateDate: saDateKey_(row.late_date),
      arrivalTime: row.time_in,
      reason: row.reason,
      note: row.notes,
      source: String(row.source_sheet || '').toLowerCase().indexOf('student') !== -1 ? 'student' : 'teacher',
      status: 'approved',
      approvedBy: row.recorder,
      approvedAt: row.submitted_at,
      submittedAt: row.submitted_at,
    }));
  const requestTransactions = new Set(requests.map((item) => String(item.transactionId || '')).filter(Boolean));
  return {
    requests: requests,
    recent: directTransactions
      .filter((item) => !requestTransactions.has(String(item.transactionId || '')))
      .concat(requests.filter((item) => item.status === 'approved'))
      .sort((a, b) => new Date(b.approvedAt || b.submittedAt) - new Date(a.approvedAt || a.submittedAt))
      .slice(0, 100),
  };
}

function saListLateTransactions_() {
  const students = new Map(saReadMasterStudents_().map((student) => [student.id, student]));
  return saReadObjects_(SA_DATA.sheets.lateTransactions)
    .filter((row) => String(row.status || '') === 'Recorded')
    .map((row) => {
      const student = students.get(String(row.student_id || ''));
      return {
        transaction_id: row.transaction_id,
        submitted_at: row.submitted_at,
        late_date: saDateKey_(row.late_date),
        time_in: row.time_in,
        student_id: row.student_id,
        full_name: row.full_name,
        grade: row.grade,
        room: row.room,
        adviser: student ? student.homeroomTeacher : '',
        reason: row.reason,
        recorder: row.recorder,
        status: row.status,
        duplicate_key: row.duplicate_key,
        source_sheet: row.source_sheet,
        notes: row.notes,
      };
    });
}

function saCreateLateRequest_(payload) {
  const student = saFindMasterStudent_(payload.studentId);
  saRequire_(student, 'ไม่พบนักเรียนใน Master Student');
  saRequire_(payload.reason, 'reason is required');
  saRequire_(payload.requestedTeacher, 'requestedTeacher is required');
  const lateDate = saDateKey_(payload.lateDate);
  const existing = saReadObjects_(SA_DATA.sheets.lateRequests).find((row) =>
    !row.deleted_at && String(row.student_id) === student.id && saDateKey_(row.late_date) === lateDate
      && ['waiting', 'called', 'approved'].indexOf(String(row.status)) !== -1
  );
  if (existing) return saLateRequestRecord_(existing);
  const now = new Date();
  const row = {
    request_id: payload.requestId || saId_('LREQ'),
    student_id: student.id,
    student_name: student.fullName,
    grade: student.grade,
    room: student.room,
    adviser: student.homeroomTeacher,
    late_date: saDate_(lateDate + 'T00:00:00') || now,
    time_in: saLimit_(payload.arrivalTime, 10),
    reason: saLimit_(payload.reason, 160),
    note: saLimit_(payload.note, 1000),
    requested_teacher: saLimit_(payload.requestedTeacher, 180),
    source: 'student',
    status: 'waiting',
    called_by: '', called_at: '', approved_by: '', approved_at: '', transaction_id: '',
    created_at: now, updated_at: now, version: 1, deleted_at: '',
  };
  saAppendObject_(SA_DATA.sheets.lateRequests, row);
  saAudit_('late', row.request_id, 'student-submit', student.fullName, payload);
  return saLateRequestRecord_(row);
}

function saCallLateRequest_(payload) {
  saRequire_(payload.requestId, 'requestId is required');
  saRequire_(payload.teacher, 'teacher is required');
  const found = saFindRow_(SA_DATA.sheets.lateRequests, payload.requestId);
  saRequire_(found && !found.object.deleted_at, 'Late request not found');
  saRequire_(['waiting', 'called'].indexOf(String(found.object.status)) !== -1, 'Late request is not waiting');
  saCheckVersion_(found.object, payload.version);
  const now = new Date();
  saPatchRow_(found, {
    status: 'called', called_by: saLimit_(payload.teacher, 180), called_at: now,
    updated_at: now, version: Number(found.object.version || 0) + 1,
  });
  saAudit_('late', payload.requestId, 'call-student', payload.teacher, payload);
  return saLateRequestRecord_(saFindRow_(SA_DATA.sheets.lateRequests, payload.requestId).object);
}

function saWriteLateTransaction_(student, payload) {
  const lateDate = saDateKey_(payload.lateDate);
  const duplicateKey = lateDate + '|' + student.id;
  const existing = saReadObjects_(SA_DATA.sheets.lateTransactions)
    .find((row) => String(row.duplicate_key || '') === duplicateKey && String(row.status || '') === 'Recorded');
  if (existing) return { transactionId: existing.transaction_id, duplicate: true };
  const now = new Date();
  const row = {
    transaction_id: payload.transactionId || saId_('LATE'),
    submitted_at: now,
    late_date: saDate_(lateDate + 'T00:00:00') || now,
    time_in: saLimit_(payload.arrivalTime, 10),
    student_id: student.id,
    full_name: student.fullName,
    grade: student.grade,
    room: student.room,
    reason: saLimit_(payload.reason, 160),
    recorder: saLimit_(payload.teacher, 180),
    status: 'Recorded',
    duplicate_key: duplicateKey,
    source_sheet: payload.source || 'Teacher Portal',
    raw_row: '',
    notes: saLimit_(payload.note, 1000),
  };
  saAppendObject_(SA_DATA.sheets.lateTransactions, row);
  return { transactionId: row.transaction_id, duplicate: false };
}

function saApproveLateRequest_(payload) {
  saRequire_(payload.requestId, 'requestId is required');
  saRequire_(payload.teacher, 'teacher is required');
  const found = saFindRow_(SA_DATA.sheets.lateRequests, payload.requestId);
  saRequire_(found && !found.object.deleted_at, 'Late request not found');
  saRequire_(String(found.object.status) === 'called', 'กรุณาเรียกชื่อนักเรียนก่อนอนุมัติ');
  saCheckVersion_(found.object, payload.version);
  const student = saFindMasterStudent_(found.object.student_id);
  saRequire_(student, 'ไม่พบนักเรียนใน Master Student');
  const saved = saWriteLateTransaction_(student, {
    lateDate: found.object.late_date,
    arrivalTime: found.object.time_in,
    reason: found.object.reason,
    note: found.object.note,
    teacher: payload.teacher,
    source: 'Student Portal',
  });
  const now = new Date();
  saPatchRow_(found, {
    status: 'approved', approved_by: saLimit_(payload.teacher, 180), approved_at: now,
    transaction_id: saved.transactionId, updated_at: now,
    version: Number(found.object.version || 0) + 1,
  });
  saAudit_('late', payload.requestId, 'approve', payload.teacher, payload);
  return saLateRequestRecord_(saFindRow_(SA_DATA.sheets.lateRequests, payload.requestId).object);
}

function saCreateLateRecord_(payload) {
  const student = saFindMasterStudent_(payload.studentId);
  saRequire_(student, 'ไม่พบนักเรียนใน Master Student');
  saRequire_(payload.reason, 'reason is required');
  saRequire_(payload.teacher, 'teacher is required');
  const saved = saWriteLateTransaction_(student, {
    lateDate: payload.lateDate,
    arrivalTime: payload.arrivalTime,
    reason: payload.reason,
    note: payload.note,
    teacher: payload.teacher,
    source: 'Teacher Portal',
  });
  saAudit_('late', saved.transactionId, 'teacher-record', payload.teacher, payload);
  return {
    id: saved.transactionId,
    transactionId: saved.transactionId,
    duplicate: saved.duplicate,
    studentId: student.id,
    studentName: student.fullName,
    room: student.room,
    adviser: student.homeroomTeacher,
    lateDate: saDateKey_(payload.lateDate),
    arrivalTime: payload.arrivalTime,
    reason: payload.reason,
    note: payload.note || '',
    source: 'teacher', status: 'approved', approvedBy: payload.teacher, approvedAt: new Date(),
  };
}

function saCreateStudentGenderRequest_(payload) {
  const student = saFindMasterStudent_(payload.studentId);
  saRequire_(student, 'ไม่พบนักเรียนใน Master Student');
  return saCreateGenderRequest_({
    studentId: student.id,
    studentName: student.fullName,
    room: student.room,
    registeredSex: student.prefix === 'นาย' ? 'ชาย' : 'หญิง',
    identityGroup: payload.identityGroup,
    permissions: payload.permissions,
    decisions: (payload.permissions || []).map(() => 'รอพิจารณา'),
    preferredName: payload.preferredName,
    pronouns: payload.pronouns,
    recorder: 'นักเรียนยื่นคำขอด้วยตนเอง',
    approver: '',
    status: 'รอตรวจข้อมูล',
    note: payload.note,
    files: payload.files || [],
    actor: student.fullName,
  });
}

function saOffCampusRecord_(row, timeline) {
  return {
    id: row.request_id,
    requestId: row.request_id,
    studentId: row.student_id,
    studentName: row.student_name,
    room: row.room,
    adviser: row.adviser,
    date: saDateKey_(row.request_date),
    leaveTime: row.leave_time,
    returnMode: row.return_mode,
    returnTime: row.return_time,
    destination: row.destination,
    reason: row.reason,
    detail: row.detail,
    subjectTeacher: row.subject_teacher,
    subjectNote: row.subject_note,
    adviserNote: row.adviser_note,
    disciplineTeacher: row.discipline_teacher,
    disciplineNote: row.discipline_note,
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    version: Number(row.version || 1),
    timeline: (timeline || []).map((item) => ({
      timelineId: item.timeline_id,
      actionAt: item.action_at,
      stage: item.stage,
      decision: item.decision,
      status: item.status,
      actor: item.actor,
      note: item.note,
    })),
  };
}

function saAppendOffCampusTimeline_(requestId, payload) {
  const row = {
    timeline_id: saId_('OTL'), request_id: requestId,
    action_at: payload.actionAt || new Date(), stage: payload.stage || '',
    decision: payload.decision || '', status: payload.status || '',
    actor: payload.actor || '', note: payload.note || '', created_at: new Date(),
  };
  saAppendObject_(SA_DATA.sheets.offCampusTimeline, row);
  return row;
}

function saListOffCampusRequests_() {
  const timeline = saReadObjects_(SA_DATA.sheets.offCampusTimeline);
  return saReadObjects_(SA_DATA.sheets.offCampusRequests)
    .filter((row) => !row.deleted_at)
    .map((row) => saOffCampusRecord_(row, timeline.filter((item) => item.request_id === row.request_id)))
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
}

function saCreateOffCampusRequest_(payload) {
  const student = saFindMasterStudent_(payload.studentId);
  saRequire_(student, 'ไม่พบนักเรียนใน Master Student');
  saRequire_(payload.destination, 'destination is required');
  saRequire_(payload.reason, 'reason is required');
  saRequire_(payload.subjectTeacher, 'subjectTeacher is required');
  const returnMode = payload.returnMode === 'no-return' ? 'no-return' : 'return';
  if (returnMode === 'return') saRequire_(payload.returnTime, 'returnTime is required');
  const now = new Date();
  const requestDate = saDateKey_(payload.date);
  const existing = payload.requestId ? saFindRow_(SA_DATA.sheets.offCampusRequests, payload.requestId) : null;
  if (existing) {
    saRequire_(String(existing.object.student_id) === student.id, 'Student does not match this request');
    saRequire_(String(existing.object.status) === 'returned_to_student', 'Only returned requests can be resubmitted');
    saPatchRow_(existing, {
      request_date: saDate_(requestDate + 'T00:00:00') || now,
      leave_time: saLimit_(payload.leaveTime, 10), return_mode: returnMode,
      return_time: returnMode === 'return' ? saLimit_(payload.returnTime, 10) : '',
      destination: saLimit_(payload.destination, 240), reason: saLimit_(payload.reason, 180),
      detail: saLimit_(payload.detail, 3000), subject_teacher: saLimit_(payload.subjectTeacher, 180),
      subject_note: '', adviser_note: '', discipline_teacher: '', discipline_note: '',
      status: 'waiting_subject_teacher', updated_at: now,
      version: Number(existing.object.version || 0) + 1,
    });
    saAppendOffCampusTimeline_(payload.requestId, {
      stage: 'student', decision: 'resubmit', status: 'waiting_subject_teacher',
      actor: student.fullName, note: 'นักเรียนแก้ไขและส่งคำขอใหม่',
    });
    saAudit_('off-campus', payload.requestId, 'resubmit', student.fullName, payload);
    return saListOffCampusRequests_().find((item) => item.id === payload.requestId);
  }
  const row = {
    request_id: payload.requestId || saId_('OUT'),
    student_id: student.id, student_name: student.fullName, room: student.room,
    adviser: student.homeroomTeacher,
    request_date: saDate_(requestDate + 'T00:00:00') || now,
    leave_time: saLimit_(payload.leaveTime, 10), return_mode: returnMode,
    return_time: returnMode === 'return' ? saLimit_(payload.returnTime, 10) : '',
    destination: saLimit_(payload.destination, 240), reason: saLimit_(payload.reason, 180),
    detail: saLimit_(payload.detail, 3000), subject_teacher: saLimit_(payload.subjectTeacher, 180),
    subject_note: '', adviser_note: '', discipline_teacher: '', discipline_note: '',
    status: 'waiting_subject_teacher', created_at: now, updated_at: now,
    version: 1, deleted_at: '',
  };
  saAppendObject_(SA_DATA.sheets.offCampusRequests, row);
  const timeline = saAppendOffCampusTimeline_(row.request_id, {
    stage: 'student', decision: 'submit', status: row.status,
    actor: student.fullName, note: row.detail,
  });
  saAudit_('off-campus', row.request_id, 'create', student.fullName, payload);
  return saOffCampusRecord_(row, [timeline]);
}

function saGetStudentOffCampus_(payload) {
  const studentId = String(payload.studentId || '').trim();
  saRequire_(studentId, 'studentId is required');
  return saListOffCampusRequests_().filter((item) => item.studentId === studentId);
}

function saReviewOffCampus_(payload, user) {
  saRequire_(payload.requestId, 'requestId is required');
  const found = saFindRow_(SA_DATA.sheets.offCampusRequests, payload.requestId);
  saRequire_(found && !found.object.deleted_at, 'Off-campus request not found');
  saCheckVersion_(found.object, payload.version);
  const decision = payload.decision === 'reject' ? 'reject' : 'approve';
  const current = String(found.object.status);
  const stageByStatus = {
    waiting_subject_teacher: 'subject_teacher',
    waiting_adviser: 'adviser',
    waiting_discipline: 'discipline',
  };
  const stage = stageByStatus[current];
  saRequire_(stage, 'Request is not waiting for review');
  if (payload.stage) saRequire_(payload.stage === stage, 'Review stage does not match request status');
  let actor = saLimit_(payload.actor, 180);
  if (user) actor = user.name || user.email;
  if (stage === 'subject_teacher') actor = actor || found.object.subject_teacher;
  if (stage === 'adviser') actor = actor || found.object.adviser;
  if (stage === 'discipline' && !user) {
    const expected = PropertiesService.getScriptProperties().getProperty(SA_DATA.disciplinePasswordProperty);
    saRequire_(expected, 'ยังไม่ได้ตั้งค่ารหัสผ่านฝ่ายปกครองใน Script Properties');
    saRequire_(String(payload.password || '') === expected, 'รหัสผ่านฝ่ายปกครองไม่ถูกต้อง');
    saRequire_(actor, 'discipline teacher is required');
  }
  saRequire_(actor, 'reviewer is required');
  const nextStatus = decision === 'reject'
    ? 'returned_to_student'
    : ({ subject_teacher: 'waiting_adviser', adviser: 'waiting_discipline', discipline: 'approved' })[stage];
  const note = saLimit_(payload.note, 2000);
  if (decision === 'reject') saRequire_(note.length >= 5, 'กรุณาระบุเหตุผลที่ไม่อนุมัติอย่างน้อย 5 ตัวอักษร');
  const patch = {
    status: nextStatus, updated_at: new Date(), version: Number(found.object.version || 0) + 1,
  };
  if (stage === 'subject_teacher') patch.subject_note = note;
  if (stage === 'adviser') patch.adviser_note = note;
  if (stage === 'discipline') {
    patch.discipline_teacher = actor;
    patch.discipline_note = note;
  }
  saPatchRow_(found, patch);
  saAppendOffCampusTimeline_(payload.requestId, {
    stage: stage, decision: decision, status: nextStatus, actor: actor, note: note,
  });
  saAudit_('off-campus', payload.requestId, stage + '-' + decision, actor, payload);
  return saListOffCampusRequests_().find((item) => item.id === payload.requestId);
}

function saStudentDashboard_(payload) {
  const studentId = String(payload.studentId || '').trim();
  saRequire_(studentId, 'studentId is required');
  const student = saFindMasterStudent_(studentId);
  saRequire_(student, 'ไม่พบนักเรียนใน Master Student');
  const late = saListLateRequests_().filter((item) => item.studentId === studentId).slice(0, 20);
  const gender = saListGenderRequests_().filter((item) => String(item.studentId) === studentId).slice(0, 20)
    .map((item) => ({ requestId: item.requestId, permissions: item.permissions, status: item.status, createdAt: item.createdAt, updatedAt: item.updatedAt }));
  const offCampus = saGetStudentOffCampus_({ studentId: studentId }).slice(0, 20);
  const reports = saListBehaviorReports_().filter((item) => String(item.reporterStudentId) === studentId).slice(0, 20)
    .map((item) => ({ reportId: item.reportId, incidentType: item.incidentType, status: item.status, createdAt: item.createdAt }));
  return { student: saStudentRecord_(student), late: late, gender: gender, offCampus: offCampus, reports: reports };
}

function saClassifyBehaviorStatus_(status) {
  const value = String(status || '').trim().toLowerCase();
  if (/^(ปิดเคส|เสร็จสิ้น|closed|resolved|done)$/.test(value)) return 'done';
  if (/รอ|ค้าง|pending|hold/.test(value)) return 'pending';
  return 'active';
}

function saCreateBehaviorReport_(payload) {
  const reporterMode = payload.reporterMode === 'identified' ? 'identified' : 'anonymous';
  saRequire_(payload.incidentType, 'incidentType is required');
  saRequire_(payload.detail && String(payload.detail).trim().length >= 10, 'detail must contain at least 10 characters');
  if (reporterMode === 'identified') {
    saRequire_(payload.reporterStudentId, 'reporterStudentId is required');
    saRequire_(payload.reporterName, 'reporterName is required');
  }
  if (payload.website) throw new Error('Invalid submission');

  const now = new Date();
  const reportId = payload.reportId || saId_('RPT');
  const row = {
    report_id: reportId,
    reporter_mode: reporterMode,
    reporter_student_id: reporterMode === 'identified' ? saLimit_(payload.reporterStudentId, 40) : '',
    reporter_name: reporterMode === 'identified' ? saLimit_(payload.reporterName, 160) : '',
    reporter_room: reporterMode === 'identified' ? saLimit_(payload.reporterRoom, 80) : '',
    contact: reporterMode === 'identified' ? saLimit_(payload.contact, 160) : '',
    incident_type: saLimit_(payload.incidentType, 160),
    incident_at: saDate_(payload.incidentAt) || '',
    place: saLimit_(payload.place, 240),
    people_involved: saLimit_(payload.peopleInvolved, 500),
    detail: saLimit_(payload.detail, 5000),
    urgency_self: saLimit_(payload.urgencySelf || 'ไม่แน่ใจ', 80),
    safe_now: saLimit_(payload.safeNow || 'ไม่ระบุ', 80),
    status: 'รอตรวจสอบ',
    reviewer: '',
    review_note: '',
    linked_case_id: '',
    created_at: now,
    updated_at: now,
    version: 1,
    deleted_at: '',
  };
  saAppendObject_(SA_DATA.sheets.behaviorReports, row);
  const files = (payload.files || []).slice(0, 3);
  const documents = saSaveFiles_('behavior-report', reportId, '', files, reporterMode === 'identified' ? row.reporter_name : 'anonymous');
  saAudit_('behavior-report', reportId, 'create-public', reporterMode, payload);
  return {
    reportId: reportId,
    status: row.status,
    createdAt: now,
    documents: documents.map((file) => ({ name: file.name })),
  };
}

function saListBehaviorReports_() {
  const rows = saReadObjects_(SA_DATA.sheets.behaviorReports).filter((row) => !row.deleted_at);
  const documents = saReadObjects_(SA_DATA.sheets.documents)
    .filter((row) => !row.deleted_at && row.system === 'behavior-report');
  return rows
    .map((row) => saBehaviorReportRecord_(
      row,
      documents.filter((item) => item.record_id === row.report_id)
    ))
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
}

function saReviewBehaviorReport_(payload) {
  saRequire_(payload.reportId, 'reportId is required');
  saRequire_(payload.status, 'status is required');
  payload.status = saNormalizeThaiMojibake_(payload.status);
  saRequire_(payload.reviewer, 'reviewer is required');
  const allowedStatuses = [
    'รอตรวจสอบ', 'ขอข้อมูลเพิ่ม', 'เก็บเป็นข้อมูลเฝ้าระวัง',
    'ไม่เข้าเกณฑ์', 'ข้อมูลซ้ำ', 'เปิดเป็นเคสแล้ว',
  ];
  if (allowedStatuses.indexOf(payload.status) === -1) {
    throw new Error('Invalid behavior report status');
  }
  const found = saFindRow_(SA_DATA.sheets.behaviorReports, payload.reportId);
  saRequire_(found, 'Behavior report not found');
  saCheckVersion_(found.object, payload.version);
  if (found.object.linked_case_id && payload.status === 'เปิดเป็นเคสแล้ว') {
    throw new Error('This report is already linked to a behavior case');
  }

  let behaviorCase = null;
  if (payload.status === 'เปิดเป็นเคสแล้ว') {
    const caseData = payload.case || {};
    saRequire_(caseData.studentId, 'case.studentId is required');
    saRequire_(caseData.studentName, 'case.studentName is required');
    saRequire_(caseData.incidentType, 'case.incidentType is required');
    behaviorCase = saCreateBehaviorCase_({
      studentId: caseData.studentId,
      studentName: caseData.studentName,
      room: caseData.room || '',
      incidentType: caseData.incidentType,
      severity: caseData.severity || 'ปานกลาง',
      incidentAt: caseData.incidentAt || found.object.incident_at || found.object.created_at,
      place: caseData.place || found.object.place,
      detail: caseData.detail || found.object.detail,
      owners: caseData.owners || [],
      status: 'เปิดเคสใหม่',
      actor: payload.reviewer,
      timeline: {
        action: 'อนุมัติเรื่องแจ้งและเปิดเป็นเคส',
        actionAt: new Date(),
        status: 'เปิดเคสใหม่',
        owners: caseData.owners || [],
        note: 'อ้างอิงเรื่องแจ้ง ' + payload.reportId + (payload.reviewNote ? ' · ' + payload.reviewNote : ''),
        actor: payload.reviewer,
      },
    });
    saLinkBehaviorReportDocumentsToCase_(payload.reportId, behaviorCase.caseId, payload.reviewer);
    behaviorCase = saGetBehaviorCase_(behaviorCase.caseId);
  }

  const now = new Date();
  saPatchRow_(found, {
    status: payload.status,
    reviewer: payload.reviewer,
    review_note: saLimit_(payload.reviewNote, 3000),
    linked_case_id: behaviorCase ? behaviorCase.caseId : found.object.linked_case_id,
    updated_at: now,
    version: Number(found.object.version || 0) + 1,
  });
  saAudit_('behavior-report', payload.reportId, 'review', payload.reviewer, payload);
  const updated = saReadObjects_(SA_DATA.sheets.behaviorReports)
    .find((row) => row.report_id === payload.reportId);
  const documents = saReadObjects_(SA_DATA.sheets.documents)
    .filter((row) => !row.deleted_at && row.system === 'behavior-report' && row.record_id === payload.reportId);
  return {
    report: saBehaviorReportRecord_(updated, documents),
    behaviorCase: behaviorCase,
  };
}

function saLinkBehaviorReportDocumentsToCase_(reportId, caseId, actor) {
  const sourceDocuments = saReadObjects_(SA_DATA.sheets.documents)
    .filter((row) => !row.deleted_at && row.system === 'behavior-report' && row.record_id === reportId);
  const existingKeys = new Set(saReadObjects_(SA_DATA.sheets.documents)
    .filter((row) => !row.deleted_at && row.system === 'behavior' && row.record_id === caseId)
    .map(saDocumentEvidenceKey_));
  sourceDocuments.forEach((source) => {
    const key = saDocumentEvidenceKey_(source);
    if (existingKeys.has(key)) return;
    existingKeys.add(key);
    saAppendObject_(SA_DATA.sheets.documents, {
      document_id: saId_('DOC'),
      system: 'behavior',
      record_id: caseId,
      timeline_id: '',
      category: 'student-report-evidence',
      file_name: source.file_name,
      mime_type: source.mime_type,
      drive_file_id: source.drive_file_id,
      drive_url: source.drive_url,
      folder_id: source.folder_id,
      uploaded_by: actor || source.uploaded_by || '',
      uploaded_at: new Date(),
      deleted_at: '',
    });
  });
}

function saDeleteBehaviorReport_(payload) {
  saRequire_(payload.reportId, 'reportId is required');
  const found = saFindRow_(SA_DATA.sheets.behaviorReports, payload.reportId);
  saRequire_(found, 'Behavior report not found');
  saCheckVersion_(found.object, payload.version);
  const now = new Date();
  saPatchRow_(found, {
    deleted_at: now,
    updated_at: now,
    version: Number(found.object.version || 0) + 1,
  });
  saAudit_('behavior-report', payload.reportId, 'delete', payload.actor, payload);
  return { reportId: payload.reportId, deletedAt: now };
}

function saBehaviorReportRecord_(row, documents) {
  return {
    reportId: row.report_id,
    reporterMode: row.reporter_mode,
    reporterStudentId: row.reporter_student_id,
    reporterName: row.reporter_name,
    reporterRoom: row.reporter_room,
    contact: row.contact,
    incidentType: row.incident_type,
    incidentAt: row.incident_at,
    place: row.place,
    peopleInvolved: row.people_involved,
    detail: row.detail,
    urgencySelf: row.urgency_self,
    safeNow: row.safe_now,
    status: saNormalizeThaiMojibake_(row.status),
    reviewer: row.reviewer,
    reviewNote: row.review_note,
    linkedCaseId: row.linked_case_id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    version: Number(row.version || 1),
    documents: (documents || []).map(saDocumentRecord_),
  };
}

function saCreateBehaviorCase_(payload) {
  saRequire_(payload.studentId, 'studentId is required');
  saRequire_(payload.studentName, 'studentName is required');
  saRequire_(payload.incidentType, 'incidentType is required');

  const now = new Date();
  const caseId = payload.caseId || saId_('BEH');
  const row = {
    case_id: caseId,
    student_id: payload.studentId,
    student_name: payload.studentName,
    room: payload.room || '',
    incident_type: payload.incidentType,
    severity: payload.severity || 'ปานกลาง',
    incident_at: saDate_(payload.incidentAt) || now,
    place: payload.place || '',
    detail: payload.detail || '',
    owners_json: saStringify_(payload.owners || []),
    status: payload.status || 'เปิดเคสใหม่',
    score: payload.score === '' || payload.score == null ? '' : Number(payload.score),
    opened_by: payload.actor || '',
    created_at: now,
    updated_at: now,
    version: 1,
    deleted_at: '',
  };
  saAppendObject_(SA_DATA.sheets.behaviorCases, row);
  const timeline = saAppendBehaviorTimeline_(caseId, payload.timeline || {
    action: 'เปิดเคสและบันทึกเหตุการณ์',
    actionAt: row.incident_at,
    status: row.status,
    owners: payload.owners || [],
    note: payload.detail || '',
    actor: payload.actor || '',
  });
  const documents = saSaveFiles_('behavior', caseId, timeline.timeline_id, payload.files || [], payload.actor || '');
  saAudit_('behavior', caseId, 'create', payload.actor, payload);
  return saBehaviorRecord_(row, [timeline], documents);
}

function saUpdateBehaviorCase_(payload) {
  saRequire_(payload.caseId, 'caseId is required');
  const found = saFindRow_(SA_DATA.sheets.behaviorCases, payload.caseId);
  saRequire_(found, 'Behavior case not found');
  saCheckVersion_(found.object, payload.version);

  const patch = {};
  const assign = (column, value) => {
    if (value !== undefined) patch[column] = value;
  };
  assign('status', payload.status);
  assign('score', payload.score === '' || payload.score == null ? '' : Number(payload.score));
  assign('owners_json', payload.owners === undefined ? undefined : saStringify_(payload.owners));
  assign('severity', payload.severity);
  assign('detail', payload.detail);
  assign('place', payload.place);
  patch.updated_at = new Date();
  patch.version = Number(found.object.version || 0) + 1;
  saPatchRow_(found, patch);

  const timeline = saAppendBehaviorTimeline_(payload.caseId, {
    action: payload.action || 'อัปเดตเคส',
    actionAt: payload.actionAt || new Date(),
    status: payload.status || found.object.status,
    score: payload.score,
    owners: payload.owners === undefined ? saParseJson_(found.object.owners_json, []) : payload.owners,
    note: payload.note || '',
    actor: payload.actor || '',
  });
  const documents = saSaveFiles_('behavior', payload.caseId, timeline.timeline_id, payload.files || [], payload.actor || '');
  saAudit_('behavior', payload.caseId, 'update', payload.actor, payload);
  return saGetBehaviorCase_(payload.caseId);
}

function saDeleteBehaviorCase_(payload) {
  saRequire_(payload.caseId, 'caseId is required');
  const found = saFindRow_(SA_DATA.sheets.behaviorCases, payload.caseId);
  saRequire_(found, 'Behavior case not found');
  saCheckVersion_(found.object, payload.version);
  const now = new Date();
  saPatchRow_(found, {
    deleted_at: now,
    updated_at: now,
    version: Number(found.object.version || 0) + 1,
  });
  saAppendBehaviorTimeline_(payload.caseId, {
    action: 'ลบเคสออกจากทะเบียน',
    actionAt: now,
    status: 'ลบแล้ว',
    note: payload.note || '',
    actor: payload.actor || '',
  });
  saAudit_('behavior', payload.caseId, 'delete', payload.actor, payload);
  return { caseId: payload.caseId, deletedAt: now };
}

function saGetBehaviorDocument_(payload) {
  saRequire_(payload.documentId, 'documentId is required');
  const found = saFindRow_(SA_DATA.sheets.documents, payload.documentId);
  saRequire_(found && !found.object.deleted_at, 'Document not found');
  saRequire_(found.object.system === 'behavior', 'Document is not attached to a behavior case');
  const blob = DriveApp.getFileById(found.object.drive_file_id).getBlob();
  const bytes = blob.getBytes();
  if (bytes.length > SA_DATA.maxFileBytes) {
    throw new Error('Document exceeds the report limit: ' + found.object.file_name);
  }
  return {
    documentId: found.object.document_id,
    name: found.object.file_name,
    mimeType: found.object.mime_type || blob.getContentType() || 'application/octet-stream',
    base64: Utilities.base64Encode(bytes),
  };
}

function saCreateGenderRequest_(payload) {
  saRequire_(payload.studentId, 'studentId is required');
  saRequire_(payload.studentName, 'studentName is required');
  saRequire_(payload.permissions && payload.permissions.length, 'permissions are required');

  const now = new Date();
  const requestId = payload.requestId || saId_('GI');
  const decisions = payload.decisions || payload.permissions.map(() => 'รอพิจารณา');
  const row = {
    request_id: requestId,
    student_id: payload.studentId,
    student_name: payload.studentName,
    room: payload.room || '',
    registered_sex: payload.registeredSex || '',
    identity_group: payload.identityGroup || '',
    permissions_json: saStringify_(payload.permissions),
    decisions_json: saStringify_(decisions),
    preferred_name: payload.preferredName || '',
    pronouns: payload.pronouns || '',
    effective_date: saDate_(payload.effectiveDate) || '',
    consent_date: saDate_(payload.consentDate) || '',
    recorder: payload.recorder || '',
    approver: payload.approver || '',
    status: payload.status || 'รอตรวจข้อมูล',
    note: payload.note || '',
    created_at: now,
    updated_at: now,
    version: 1,
    deleted_at: '',
  };
  saAppendObject_(SA_DATA.sheets.genderRequests, row);
  const timeline = saAppendGenderTimeline_(requestId, {
    actionAt: now,
    status: row.status,
    approver: row.approver,
    decisions: decisions,
    note: payload.note || 'บันทึกคำขอเข้าระบบ',
    actor: payload.recorder || payload.actor || '',
  });
  const documents = saSaveFiles_('gender', requestId, timeline.timeline_id, payload.files || [], payload.recorder || payload.actor || '');
  saAudit_('gender', requestId, 'create', payload.recorder || payload.actor, payload);
  return saGenderRecord_(row, [timeline], documents);
}

function saUpdateGenderRequest_(payload) {
  saRequire_(payload.requestId, 'requestId is required');
  const found = saFindRow_(SA_DATA.sheets.genderRequests, payload.requestId);
  saRequire_(found, 'Gender request not found');
  saCheckVersion_(found.object, payload.version);

  const patch = {};
  const assign = (column, value) => {
    if (value !== undefined) patch[column] = value;
  };
  assign('status', payload.status);
  assign('approver', payload.approver);
  assign('recorder', payload.recorder);
  assign('decisions_json', payload.decisions === undefined ? undefined : saStringify_(payload.decisions));
  assign('permissions_json', payload.permissions === undefined ? undefined : saStringify_(payload.permissions));
  assign('consent_date', payload.consentDate === undefined ? undefined : (saDate_(payload.consentDate) || ''));
  assign('effective_date', payload.effectiveDate === undefined ? undefined : (saDate_(payload.effectiveDate) || ''));
  assign('note', payload.note);
  patch.updated_at = new Date();
  patch.version = Number(found.object.version || 0) + 1;
  saPatchRow_(found, patch);

  const decisions = payload.decisions === undefined
    ? saParseJson_(found.object.decisions_json, [])
    : payload.decisions;
  const timeline = saAppendGenderTimeline_(payload.requestId, {
    actionAt: payload.actionAt || new Date(),
    status: payload.status || found.object.status,
    approver: payload.approver || found.object.approver,
    decisions: decisions,
    note: payload.note || '',
    actor: payload.actor || '',
  });
  const documents = saSaveFiles_('gender', payload.requestId, timeline.timeline_id, payload.files || [], payload.actor || '');
  saAudit_('gender', payload.requestId, 'update', payload.actor, payload);
  return saGetGenderRequest_(payload.requestId);
}

function saDeleteGenderRequest_(payload) {
  saRequire_(payload.requestId, 'requestId is required');
  const found = saFindRow_(SA_DATA.sheets.genderRequests, payload.requestId);
  saRequire_(found, 'Gender request not found');
  saCheckVersion_(found.object, payload.version);
  const now = new Date();
  saPatchRow_(found, {
    deleted_at: now,
    updated_at: now,
    version: Number(found.object.version || 0) + 1,
  });
  saAppendGenderTimeline_(payload.requestId, {
    actionAt: now,
    status: 'ลบแล้ว',
    approver: found.object.approver,
    decisions: saParseJson_(found.object.decisions_json, []),
    note: payload.note || '',
    actor: payload.actor || '',
  });
  saAudit_('gender', payload.requestId, 'delete', payload.actor, payload);
  return { requestId: payload.requestId, deletedAt: now };
}

function saListBehaviorCases_() {
  const rows = saReadObjects_(SA_DATA.sheets.behaviorCases).filter((row) => !row.deleted_at);
  const timeline = saReadObjects_(SA_DATA.sheets.behaviorTimeline);
  const documents = saReadObjects_(SA_DATA.sheets.documents).filter((row) => !row.deleted_at && row.system === 'behavior');
  return rows.map((row) => saBehaviorRecord_(
    row,
    timeline.filter((item) => item.case_id === row.case_id),
    documents.filter((item) => item.record_id === row.case_id)
  ));
}

function saGetBehaviorCase_(caseId) {
  const row = saReadObjects_(SA_DATA.sheets.behaviorCases).find((item) => item.case_id === caseId && !item.deleted_at);
  saRequire_(row, 'Behavior case not found');
  return saBehaviorRecord_(
    row,
    saReadObjects_(SA_DATA.sheets.behaviorTimeline).filter((item) => item.case_id === caseId),
    saReadObjects_(SA_DATA.sheets.documents).filter((item) => item.system === 'behavior' && item.record_id === caseId && !item.deleted_at)
  );
}

function saBehaviorRecord_(row, timeline, documents) {
  return {
    caseId: row.case_id,
    studentId: row.student_id,
    studentName: row.student_name,
    room: row.room,
    incidentType: row.incident_type,
    severity: row.severity,
    incidentAt: row.incident_at,
    place: row.place,
    detail: row.detail,
    owners: saParseJson_(row.owners_json, []),
    status: row.status,
    score: row.score,
    openedBy: row.opened_by,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    version: Number(row.version || 1),
    timeline: timeline.map(saBehaviorTimelineRecord_),
    documents: saUniqueDocumentRows_(documents).map(saDocumentRecord_),
  };
}

function saUniqueDocumentRows_(documents) {
  const seen = new Set();
  return (documents || []).filter((row) => {
    const key = [
      row.system,
      row.record_id,
      saDocumentEvidenceKey_(row),
    ].map((value) => String(value || '').trim().toLowerCase()).join('|');
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function saDocumentEvidenceKey_(row) {
  const driveKey = String(row.drive_file_id || '').trim().toLowerCase();
  if (driveKey) return driveKey;
  return [
    row.drive_url,
    row.file_name,
    row.mime_type,
  ].map((value) => String(value || '').trim().toLowerCase()).join('|');
}

function saAppendBehaviorTimeline_(caseId, payload) {
  const row = {
    timeline_id: saId_('BTL'),
    case_id: caseId,
    action: payload.action || 'อัปเดตเคส',
    action_at: saDate_(payload.actionAt) || new Date(),
    status: payload.status || '',
    score: payload.score === '' || payload.score == null ? '' : Number(payload.score),
    owners_json: saStringify_(payload.owners || []),
    note: payload.note || '',
    actor: payload.actor || '',
    created_at: new Date(),
  };
  saAppendObject_(SA_DATA.sheets.behaviorTimeline, row);
  return row;
}

function saBehaviorTimelineRecord_(row) {
  return {
    timelineId: row.timeline_id,
    action: row.action,
    actionAt: row.action_at,
    status: row.status,
    score: row.score,
    owners: saParseJson_(row.owners_json, []),
    note: row.note,
    actor: row.actor,
    createdAt: row.created_at,
  };
}

function saListGenderRequests_() {
  const rows = saReadObjects_(SA_DATA.sheets.genderRequests).filter((row) => !row.deleted_at);
  const timeline = saReadObjects_(SA_DATA.sheets.genderTimeline);
  const documents = saReadObjects_(SA_DATA.sheets.documents).filter((row) => !row.deleted_at && row.system === 'gender');
  return rows.map((row) => saGenderRecord_(
    row,
    timeline.filter((item) => item.request_id === row.request_id),
    documents.filter((item) => item.record_id === row.request_id)
  ));
}

function saGetGenderRequest_(requestId) {
  const row = saReadObjects_(SA_DATA.sheets.genderRequests).find((item) => item.request_id === requestId && !item.deleted_at);
  saRequire_(row, 'Gender request not found');
  return saGenderRecord_(
    row,
    saReadObjects_(SA_DATA.sheets.genderTimeline).filter((item) => item.request_id === requestId),
    saReadObjects_(SA_DATA.sheets.documents).filter((item) => item.system === 'gender' && item.record_id === requestId && !item.deleted_at)
  );
}

function saGenderRecord_(row, timeline, documents) {
  return {
    requestId: row.request_id,
    studentId: row.student_id,
    studentName: row.student_name,
    room: row.room,
    registeredSex: row.registered_sex,
    identityGroup: row.identity_group,
    permissions: saParseJson_(row.permissions_json, []),
    decisions: saParseJson_(row.decisions_json, []),
    preferredName: row.preferred_name,
    pronouns: row.pronouns,
    effectiveDate: row.effective_date,
    consentDate: row.consent_date,
    recorder: row.recorder,
    approver: row.approver,
    status: row.status,
    note: row.note,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    version: Number(row.version || 1),
    timeline: timeline.map(saGenderTimelineRecord_),
    documents: documents.map(saDocumentRecord_),
  };
}

function saAppendGenderTimeline_(requestId, payload) {
  const row = {
    timeline_id: saId_('GTL'),
    request_id: requestId,
    action_at: saDate_(payload.actionAt) || new Date(),
    status: payload.status || '',
    approver: payload.approver || '',
    decisions_json: saStringify_(payload.decisions || []),
    note: payload.note || '',
    actor: payload.actor || '',
    created_at: new Date(),
  };
  saAppendObject_(SA_DATA.sheets.genderTimeline, row);
  return row;
}

function saGenderTimelineRecord_(row) {
  return {
    timelineId: row.timeline_id,
    actionAt: row.action_at,
    status: row.status,
    approver: row.approver,
    decisions: saParseJson_(row.decisions_json, []),
    note: row.note,
    actor: row.actor,
    createdAt: row.created_at,
  };
}

function saSaveFiles_(system, recordId, timelineId, files, actor) {
  if (!files || !files.length) return [];
  const folder = saRecordFolder_(system, recordId);
  return files.map((file) => {
    saRequire_(file.name, 'File name is required');
    saRequire_(file.base64, 'File content is required');
    const bytes = Utilities.base64Decode(file.base64);
    if (bytes.length > SA_DATA.maxFileBytes) {
      throw new Error('File exceeds 8 MB: ' + file.name);
    }
    const blob = Utilities.newBlob(bytes, file.mimeType || 'application/octet-stream', file.name);
    const driveFile = folder.createFile(blob);
    driveFile.setDescription(system + ' / ' + recordId + ' / ' + (file.category || 'document'));
    const row = {
      document_id: saId_('DOC'),
      system: system,
      record_id: recordId,
      timeline_id: timelineId || '',
      category: file.category || 'document',
      file_name: file.name,
      mime_type: file.mimeType || 'application/octet-stream',
      drive_file_id: driveFile.getId(),
      drive_url: driveFile.getUrl(),
      folder_id: folder.getId(),
      uploaded_by: actor || '',
      uploaded_at: new Date(),
      deleted_at: '',
    };
    saAppendObject_(SA_DATA.sheets.documents, row);
    return saDocumentRecord_(row);
  });
}

function saDocumentRecord_(row) {
  return {
    documentId: row.document_id,
    timelineId: row.timeline_id,
    category: row.category,
    name: row.file_name,
    mimeType: row.mime_type,
    fileId: row.drive_file_id,
    url: row.drive_url,
    folderId: row.folder_id,
    uploadedBy: row.uploaded_by,
    uploadedAt: row.uploaded_at,
  };
}

function saAudit_(system, recordId, operation, actor, payload) {
  saAppendObject_(SA_DATA.sheets.audit, {
    audit_id: saId_('AUD'),
    system: system,
    record_id: recordId,
    operation: operation,
    actor: actor || '',
    payload_json: saStringify_(saRedactFiles_(payload)),
    created_at: new Date(),
  });
}

function saRedactFiles_(payload) {
  const clone = JSON.parse(JSON.stringify(payload || {}));
  if (clone.files) {
    clone.files = clone.files.map((file) => ({
      name: file.name,
      mimeType: file.mimeType,
      category: file.category,
      bytes: file.base64 ? Math.round(file.base64.length * 0.75) : 0,
    }));
  }
  return clone;
}

function saParseRequest_(e) {
  const raw = e && e.postData && e.postData.contents ? e.postData.contents : '{}';
  const parsed = JSON.parse(raw);
  return {
    action: String(parsed.action || '').trim(),
    token: String(parsed.token || '').trim(),
    auth: parsed.auth || {},
    payload: parsed.payload || {},
  };
}

function saAuthorize_(token, action, auth, payload) {
  if (saIsPublicAction_(action)) return null;
  const expected = PropertiesService.getScriptProperties().getProperty(SA_DATA.tokenProperty);
  saRequire_(expected, 'API is not configured. Run setupStudentAffairsDataApi().');
  if (token !== expected) throw new Error('Unauthorized');
  if (saIsTeacherPortalAction_(action)) return null;
  const user = saVerifyGoogleUser_(auth || {});
  const systemId = (auth && auth.systemId) || (payload && payload.systemId) || saSystemForAction_(action);
  saRequireAuthorizedUser_(user.email, systemId);
  return user;
}

function saSystemForAction_(action) {
  if (/^late\./.test(action)) return 'late';
  if (/^behavior-report\./.test(action)) return 'behavior';
  if (/^behavior\./.test(action)) return 'behavior';
  if (/^gender\./.test(action)) return 'gender';
  if (/^off-campus\./.test(action)) return 'off-campus';
  if (action === 'bootstrap') return 'center';
  return '';
}

function saVerifyGoogleUser_(auth) {
  const idToken = String(auth.idToken || '').trim();
  saRequire_(idToken, 'กรุณาเข้าสู่ระบบด้วย Gmail ก่อนใช้งาน');
  const response = UrlFetchApp.fetch('https://oauth2.googleapis.com/tokeninfo?id_token=' + encodeURIComponent(idToken), {
    muteHttpExceptions: true,
  });
  if (response.getResponseCode() !== 200) {
    throw new Error('เซสชัน Gmail หมดอายุ กรุณาเข้าสู่ระบบใหม่');
  }
  const data = JSON.parse(response.getContentText());
  const configuredClientId = PropertiesService.getScriptProperties().getProperty(SA_DATA.googleClientIdProperty) || SA_DATA.defaultGoogleClientId;
  if (configuredClientId && data.aud !== configuredClientId) {
    throw new Error('Google Client ID ไม่ตรงกับระบบที่อนุญาต');
  }
  if (data.email_verified !== true && data.email_verified !== 'true') {
    throw new Error('บัญชี Gmail นี้ยังไม่ได้ยืนยันอีเมล');
  }
  return {
    email: String(data.email || '').toLowerCase(),
    name: data.name || '',
    picture: data.picture || '',
    sub: data.sub || '',
  };
}

function saEmailAuthUser_(auth) {
  const email = String(auth.email || '').trim().toLowerCase();
  saRequire_(email, 'กรุณากรอกอีเมลก่อนใช้งาน');
  return {
    email: email,
    name: auth.name || email,
    picture: '',
    sub: 'email:' + email,
  };
}

function saRequireAuthorizedUser_(email, systemId) {
  const normalizedEmail = String(email || '').trim().toLowerCase();
  saRequire_(normalizedEmail, 'ไม่พบอีเมลผู้ใช้งาน');
  saEnsureAuthSeed_();
  const users = saReadObjects_(SA_DATA.sheets.authUsers);
  const found = users.find((row) => String(row.email || '').trim().toLowerCase() === normalizedEmail);
  if (!found || String(found.status || '').toLowerCase() !== 'active') {
    throw new Error('บัญชีนี้ยังไม่ได้รับอนุญาตให้เข้าใช้งานระบบ');
  }
  const systems = saParseJson_(found.systems_json, []);
  if (systemId && systems.length && systems.indexOf(systemId) === -1 && systems.indexOf('*') === -1) {
    throw new Error('บัญชีนี้ไม่มีสิทธิ์เข้าใช้งานระบบนี้');
  }
  return found;
}

function saEnsureAuthSeed_() {
  const config = SA_DATA.sheets.authUsers;
  const existingRows = saReadObjects_(config);
  const existing = existingRows
    .map((row) => String(row.email || '').trim().toLowerCase())
    .filter(Boolean);
  const now = new Date();
  [
    { email: 'drum.094094@gmail.com', name: 'Authorized User' },
    { email: 'patthamaporn.sn@gmail.com', name: 'Authorized User' },
  ].forEach((user) => {
    if (existing.indexOf(user.email) !== -1) {
      const current = existingRows.find((row) => String(row.email || '').trim().toLowerCase() === user.email);
      const systems = saParseJson_(current.systems_json, []);
      if (systems.indexOf('off-campus') === -1 && systems.indexOf('*') === -1) {
        const found = saFindRow_(config, current.email);
        if (found) saPatchRow_(found, { systems_json: saStringify_(systems.concat('off-campus')), updated_at: now });
      }
      return;
    }
    saAppendObject_(config, {
      email: user.email,
      name: user.name,
      role: 'admin',
      systems_json: saStringify_(['late', 'behavior', 'gender', 'off-campus', 'center']),
      status: 'active',
      note: 'seed user',
      created_at: now,
      updated_at: now,
    });
  });
}

function saSpreadsheet_() {
  return SpreadsheetApp.openById(SA_DATA.spreadsheetId);
}

function saEnsureSheet_(ss, config) {
  let sheet = ss.getSheetByName(config.name);
  if (!sheet) sheet = ss.insertSheet(config.name);
  const headers = config.headers;
  if (sheet.getLastColumn() < headers.length) {
    sheet.insertColumnsAfter(Math.max(1, sheet.getLastColumn()), headers.length - sheet.getLastColumn());
  }
  const current = sheet.getRange(1, 1, 1, headers.length).getDisplayValues()[0];
  if (current.join('|') !== headers.join('|')) {
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  }
  sheet.setFrozenRows(1);
  sheet.getRange(1, 1, 1, headers.length)
    .setFontWeight('bold')
    .setBackground('#123b35')
    .setFontColor('#ffffff');
  return sheet;
}

function saReadObjects_(config) {
  const sheet = saEnsureSheet_(saSpreadsheet_(), config);
  if (sheet.getLastRow() < 2) return [];
  const range = sheet.getRange(2, 1, sheet.getLastRow() - 1, config.headers.length);
  const values = range.getValues();
  const displayValues = range.getDisplayValues();
  return values.map((row, rowIndex) => {
    const object = {};
    config.headers.forEach((header, index) => {
      object[header] = saSheetValue_(header, row[index], displayValues[rowIndex][index]);
    });
    return object;
  });
}

function saSheetValue_(header, value, displayValue) {
  if (['time_in', 'leave_time', 'return_time'].indexOf(header) === -1) return value;
  const match = String(displayValue || value || '').match(/(\d{1,2}):(\d{2})/);
  return match ? ('0' + match[1]).slice(-2) + ':' + match[2] : String(displayValue || value || '').trim();
}

function saAppendObject_(config, object) {
  const sheet = saEnsureSheet_(saSpreadsheet_(), config);
  sheet.appendRow(config.headers.map((header) => object[header] === undefined ? '' : object[header]));
  return sheet.getLastRow();
}

function saFindRow_(config, id) {
  const sheet = saEnsureSheet_(saSpreadsheet_(), config);
  if (sheet.getLastRow() < 2) return null;
  const keyColumn = config.headers.indexOf(config.key) + 1;
  const finder = sheet.getRange(2, keyColumn, sheet.getLastRow() - 1, 1)
    .createTextFinder(String(id))
    .matchEntireCell(true)
    .findNext();
  if (!finder) return null;
  const rowIndex = finder.getRow();
  const range = sheet.getRange(rowIndex, 1, 1, config.headers.length);
  const values = range.getValues()[0];
  const displayValues = range.getDisplayValues()[0];
  const object = {};
  config.headers.forEach((header, index) => {
    object[header] = saSheetValue_(header, values[index], displayValues[index]);
  });
  return { sheet: sheet, rowIndex: rowIndex, object: object, config: config };
}

function saPatchRow_(found, patch) {
  Object.keys(patch).forEach((header) => {
    if (patch[header] === undefined) return;
    const index = found.config.headers.indexOf(header);
    if (index >= 0) found.sheet.getRange(found.rowIndex, index + 1).setValue(patch[header]);
  });
}

function saCheckVersion_(object, version) {
  if (version == null || version === '') return;
  if (Number(version) !== Number(object.version || 1)) {
    throw new Error('Record was updated by another user. Reload and try again.');
  }
}

function saRootFolder_() {
  const props = PropertiesService.getScriptProperties();
  const storedId = props.getProperty(SA_DATA.rootFolderProperty);
  if (storedId) {
    try {
      return DriveApp.getFolderById(storedId);
    } catch (ignore) {
      props.deleteProperty(SA_DATA.rootFolderProperty);
    }
  }
  const matches = DriveApp.getFoldersByName(SA_DATA.rootFolderName);
  const folder = matches.hasNext() ? matches.next() : DriveApp.createFolder(SA_DATA.rootFolderName);
  props.setProperty(SA_DATA.rootFolderProperty, folder.getId());
  return folder;
}

function saSystemFolder_(system, root) {
  const names = {
    behavior: 'Behavior Cases',
    gender: 'Gender Requests',
    'behavior-report': 'Student Behavior Reports',
    'off-campus': 'Off-campus Permission Requests',
  };
  const name = names[system] || 'Other Documents';
  const matches = root.getFoldersByName(name);
  return matches.hasNext() ? matches.next() : root.createFolder(name);
}

function saRecordFolder_(system, recordId) {
  const parent = saSystemFolder_(system, saRootFolder_());
  const safeName = String(recordId).replace(/[\\/:*?"<>|]/g, '_');
  const matches = parent.getFoldersByName(safeName);
  return matches.hasNext() ? matches.next() : parent.createFolder(safeName);
}

function saId_(prefix) {
  const stamp = Utilities.formatDate(new Date(), 'Asia/Bangkok', 'yyyyMMddHHmmss');
  return prefix + '-' + stamp + '-' + Utilities.getUuid().slice(0, 6).toUpperCase();
}

function saDate_(value) {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  return isNaN(date.getTime()) ? null : date;
}

function saParseJson_(value, fallback) {
  if (Array.isArray(value) || (value && typeof value === 'object')) return value;
  try {
    return value ? JSON.parse(value) : fallback;
  } catch (error) {
    return fallback;
  }
}

function saStringify_(value) {
  return JSON.stringify(value == null ? null : value);
}

function saRequire_(value, message) {
  if (!value) throw new Error(message);
  return value;
}

function saLimit_(value, maxLength) {
  return String(value == null ? '' : value).trim().slice(0, maxLength);
}

function saNormalizeThaiMojibake_(value) {
  const text = String(value == null ? '' : value).trim();
  return SA_THAI_MOJIBAKE_MAP[text] || text;
}

function saJson_(value) {
  return ContentService
    .createTextOutput(JSON.stringify(value, (key, item) => item instanceof Date ? item.toISOString() : item))
    .setMimeType(ContentService.MimeType.JSON);
}
