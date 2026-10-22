// Paste this file into Extensions > Apps Script for the linked spreadsheet.
// Deploy it as a Web app: Execute as Me; access Anyone.
const SPREADSHEET_ID = '1i9wplSMvIT1WeZ15fBmPsNjFCsw13YUqZExOm0Awbsc';
const TAB = 'ScanLog';
const HEADERS = ['Event ID', 'Scanned at', 'Name', 'Role', 'Country', 'Condition', 'Request ID'];
const PAGE_SIZE = 250;

function setup() {
  log_();
}

function doGet(e) {
  const p = e && e.parameter || {};
  let result;
  try {
    result = getScans(p.after);
  } catch (error) {
    result = {ok: false, error: String(error.message || error)};
  }
  // JSONP lets the separately hosted display and scanner read this web app.
  const callback = String(p.callback || '');
  if (!/^[A-Za-z_$][\w$]*$/.test(callback)) {
    return ContentService.createTextOutput(JSON.stringify(result))
      .setMimeType(ContentService.MimeType.JSON);
  }
  return ContentService.createTextOutput(callback + '(' + JSON.stringify(result) + ');')
    .setMimeType(ContentService.MimeType.JAVASCRIPT);
}

function doPost(e) {
  let result;
  try {
    result = submitScan(e && e.parameter || {});
  } catch (error) {
    result = {ok: false, error: String(error.message || error)};
  }
  return ContentService.createTextOutput(JSON.stringify(result))
    .setMimeType(ContentService.MimeType.JSON);
}

function log_() {
  const book = SpreadsheetApp.openById(SPREADSHEET_ID);
  let sheet = book.getSheetByName(TAB);
  if (!sheet) sheet = book.insertSheet(TAB);
  if (sheet.getLastRow() === 0) {
    sheet.getRange(1, 1, 1, HEADERS.length).setValues([HEADERS]);
    sheet.setFrozenRows(1);
  }
  const actual = sheet.getRange(1, 1, 1, HEADERS.length).getDisplayValues()[0];
  if (actual.join('|') !== HEADERS.join('|')) {
    throw new Error('ScanLog headers differ from the expected seven columns.');
  }
  return sheet;
}

function clean_(value, limit) {
  return String(value == null ? '' : value)
    .replace(/[\u0000-\u001f\u007f]/g, ' ').trim().slice(0, limit);
}

function literal_(value) {
  return /^[=+\-@']/.test(value) ? "'" + value : value;
}

function submitScan(data) {
  const name = clean_(data.name, 120);
  const role = clean_(data.role, 60) || 'Attendee';
  const country = clean_(data.country, 80);
  const condition = clean_(data.condition, 120);
  const requestId = clean_(data.requestId, 100);
  if (!name || !requestId) throw new Error('Name and request ID are required.');

  const lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    const sheet = log_();
    const last = sheet.getLastRow();
    if (last > 1) {
      const ids = sheet.getRange(2, 7, last - 1, 1).getDisplayValues();
      const existing = ids.findIndex(row => row[0] === requestId);
      if (existing !== -1) return {ok: true, id: existing + 1, duplicate: true};
    }
    const id = last;
    sheet.appendRow([id, new Date(), literal_(name), literal_(role),
      literal_(country), literal_(condition), literal_(requestId)]);
    SpreadsheetApp.flush();
    return {ok: true, id: id};
  } finally {
    lock.releaseLock();
  }
}

function getScans(after) {
  const sheet = log_();
  const lastId = Math.max(0, sheet.getLastRow() - 1);
  const cursor = Math.max(0, Math.floor(Number(after) || 0));
  const firstId = Math.min(lastId + 1, cursor + 1);
  const count = Math.min(PAGE_SIZE, lastId - firstId + 1);
  if (count < 1) return {ok: true, events: [], cursor: lastId, latestCursor: lastId};
  const rows = sheet.getRange(firstId + 1, 1, count, 7).getDisplayValues();
  return {
    ok: true,
    events: rows.map((row, index) => ({
      id: firstId + index,
      name: row[2], role: row[3], country: row[4], requestId: row[6]
    })),
    cursor: firstId + count - 1,
    latestCursor: lastId
  };
}
