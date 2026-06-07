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
  rootFolderProperty: 'STUDENT_AFFAIRS_ROOT_FOLDER_ID',
  maxFileBytes: 8 * 1024 * 1024,
  sheets: {
    behaviorCases: {
      name: 'Behavior_Cases',
      key: 'case_id',
      headers: [
        'case_id', 'student_id', 'student_name', 'room', 'incident_type',
        'severity', 'incident_at', 'place', 'detail', 'owners_json', 'status',
        'score', 'opened_by', 'created_at', 'updated_at', 'version', 'deleted_at',
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

function setupStudentAffairsDataApi() {
  const ss = saSpreadsheet_();
  Object.keys(SA_DATA.sheets).forEach((key) => {
    saEnsureSheet_(ss, SA_DATA.sheets[key]);
  });
  const root = saRootFolder_();
  saSystemFolder_('behavior', root);
  saSystemFolder_('gender', root);

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

function rotateStudentAffairsApiToken() {
  const token = Utilities.getUuid().replace(/-/g, '') + Utilities.getUuid().replace(/-/g, '');
  PropertiesService.getScriptProperties().setProperty(SA_DATA.tokenProperty, token);
  Logger.log('New API token: ' + token);
  return token;
}

function doGet() {
  return saJson_({
    ok: true,
    service: 'SPVC Student Affairs Data API',
    version: 1,
    timestamp: new Date().toISOString(),
  });
}

function doPost(e) {
  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(30000);
    const request = saParseRequest_(e);
    saAuthorize_(request.token);
    const result = saRoute_(request.action, request.payload || {});
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

function saRoute_(action, payload) {
  switch (action) {
    case 'health':
      return { timestamp: new Date(), spreadsheetId: SA_DATA.spreadsheetId };
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
    documents: documents.map(saDocumentRecord_),
  };
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
    payload: parsed.payload || {},
  };
}

function saAuthorize_(token) {
  const expected = PropertiesService.getScriptProperties().getProperty(SA_DATA.tokenProperty);
  saRequire_(expected, 'API is not configured. Run setupStudentAffairsDataApi().');
  if (token !== expected) throw new Error('Unauthorized');
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
  const values = sheet.getRange(2, 1, sheet.getLastRow() - 1, config.headers.length).getValues();
  return values.map((row) => {
    const object = {};
    config.headers.forEach((header, index) => {
      object[header] = row[index];
    });
    return object;
  });
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
  const values = sheet.getRange(rowIndex, 1, 1, config.headers.length).getValues()[0];
  const object = {};
  config.headers.forEach((header, index) => {
    object[header] = values[index];
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
  const name = system === 'behavior' ? 'Behavior Cases' : 'Gender Requests';
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

function saJson_(value) {
  return ContentService
    .createTextOutput(JSON.stringify(value, (key, item) => item instanceof Date ? item.toISOString() : item))
    .setMimeType(ContentService.MimeType.JSON);
}

