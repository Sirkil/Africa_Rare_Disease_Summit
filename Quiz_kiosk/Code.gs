/** Paste this file into the Apps Script project attached to the quiz score sheet. */
const SHEET_ID = '1sGyiqPA4KVPSpfFAR1t8-ECw_B64euOQMqTEAdcV6is';
const TAB_GID = 0;
const HEADERS = ['Timestamp', 'Name', 'Selected Quiz', 'Score'];

function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    const name = cleanText_(data.name, 80);
    const selectedQuiz = cleanText_(data.selectedQuiz, 120);
    const correct = Number(data.correct);
    const total = Number(data.total);

    if (!name || !selectedQuiz || !Number.isInteger(correct) ||
        !Number.isInteger(total) || total < 1 || total > 100 ||
        correct < 0 || correct > total) {
      throw new Error('Invalid quiz score submission');
    }

    const lock = LockService.getScriptLock();
    lock.waitLock(10000);
    try {
      const book = SpreadsheetApp.openById(SHEET_ID);
      const sheet = book.getSheets().find(tab => tab.getSheetId() === TAB_GID);
      if (!sheet) throw new Error('Sheet tab with gid 0 was not found');

      if (sheet.getLastRow() === 0) {
        sheet.getRange(1, 1, 1, 4).setValues([HEADERS]);
      } else {
        const actual = sheet.getRange(1, 1, 1, 4).getValues()[0];
        if (actual.some((value, index) => value !== HEADERS[index])) {
          throw new Error('Sheet headers must be Timestamp, Name, Selected Quiz, Score');
        }
      }

      const nextRow = sheet.getLastRow() + 1;
      sheet.getRange(nextRow, 1).setNumberFormat('yyyy-mm-dd hh:mm:ss');
      sheet.getRange(nextRow, 2, 1, 3).setNumberFormat('@');
      sheet.getRange(nextRow, 1, 1, 4).setValues([[
        new Date(), name, selectedQuiz, `${correct}/${total}`
      ]]);
    } finally {
      lock.releaseLock();
    }

    return json_({ ok: true });
  } catch (error) {
    console.error(error);
    return json_({ ok: false, error: String(error.message || error) });
  }
}

function cleanText_(value, maxLength) {
  if (typeof value !== 'string') return '';
  const text = value.trim().slice(0, maxLength);
  // Keep participant input from being interpreted as a spreadsheet formula.
  return /^[=+\-@]/.test(text) ? `'${text}` : text;
}

function json_(data) {
  return ContentService.createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}
