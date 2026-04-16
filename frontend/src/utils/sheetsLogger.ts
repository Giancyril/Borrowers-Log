/**
 * sheetsLogger.ts
 *
 * Appends a borrow record row to the Google Sheet after a successful borrow.
 *
 * SETUP (one-time):
 * ─────────────────
 * 1. Open your sheet:
 *    https://docs.google.com/spreadsheets/d/1mZMt0sPGNLgL1E2SudDtsgXsHI-LGAlFL0eeZfi76Gk/edit
 *
 * 2. Go to Extensions → Apps Script, paste this code and deploy as a Web App:
 *    (see bottom of this file for the Apps Script code)
 *
 * 3. Copy the deployed Web App URL and set it as:
 *    VITE_SHEETS_WEBHOOK_URL=https://script.google.com/macros/s/YOUR_ID/exec
 *    in your .env file.
 *
 * SHEET COLUMNS (Sheet1 — in this exact order):
 * ──────────────────────────────────────────────
 *  A  Timestamp (logged)
 *  B  Student ID
 *  C  Borrower Name
 *  D  Department / Section
 *  E  Email
 *  F  Item Name
 *  G  Qty
 *  H  Borrow Date
 *  I  Due Date
 *  J  Status
 *  K  Purpose
 *  L  Condition on Borrow
 *  M  Scanned At           ← new: ISO timestamp of when scanner captured the student
 *  N  Record ID            ← new: links back to your system
 *
 * Set up the header row manually in the sheet (Row 1).
 */

export interface SheetRowPayload {
  studentId:         string;
  borrowerName:      string;
  department:        string;
  email:             string;
  itemName:          string;
  qty:               number;
  borrowDate:        string;
  dueDate:           string;
  status:            string;
  purpose:           string;
  conditionOnBorrow: string;
  scannedAt:         string; // ISO string — time the barcode was scanned
  recordId:          string; // borrow record ID from your backend
}

const WEBHOOK_URL = import.meta.env.VITE_SHEETS_WEBHOOK_URL as string | undefined;

/**
 * Fire-and-forget: logs a row to Google Sheets.
 * Silently swallows errors so it never blocks the borrow flow.
 */
export async function logToSheet(payload: SheetRowPayload): Promise<void> {
  if (!WEBHOOK_URL) {
    console.warn("[sheetsLogger] VITE_SHEETS_WEBHOOK_URL is not set — skipping sheet log.");
    return;
  }

  const row = [
    new Date().toLocaleString("en-PH"),   // A: Timestamp
    payload.studentId,                     // B: Student ID
    payload.borrowerName,                  // C: Borrower Name
    payload.department,                    // D: Department
    payload.email,                         // E: Email
    payload.itemName,                      // F: Item Name
    payload.qty,                           // G: Qty
    payload.borrowDate,                    // H: Borrow Date
    payload.dueDate,                       // I: Due Date
    payload.status,                        // J: Status
    payload.purpose,                       // K: Purpose
    payload.conditionOnBorrow,             // L: Condition on Borrow
    payload.scannedAt,                     // M: Scanned At
    payload.recordId,                      // N: Record ID
  ];

  try {
    await fetch(WEBHOOK_URL, {
      method: "POST",
      // Apps Script requires no-cors for cross-origin POST from browser
      mode:    "no-cors",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ row }),
    });
  } catch (err) {
    // Non-blocking — borrow record is already saved in your DB
    console.error("[sheetsLogger] Failed to log to Google Sheets:", err);
  }
}

/*
──────────────────────────────────────────────────────────────────────────────
GOOGLE APPS SCRIPT  (Extensions → Apps Script in your Google Sheet)
Copy everything below into Code.gs and deploy as a Web App:
  - Execute as: Me
  - Who has access: Anyone

──────────────────────────────────────────────────────────────────────────────

function doPost(e) {
  try {
    var data  = JSON.parse(e.postData.contents);
    var row   = data.row;
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Sheet1");

    // Auto-add header row if the sheet is empty
    if (sheet.getLastRow() === 0) {
      sheet.appendRow([
        "Timestamp", "Student ID", "Borrower Name", "Department / Section",
        "Email", "Item Name", "Qty", "Borrow Date", "Due Date",
        "Status", "Purpose", "Condition on Borrow", "Scanned At", "Record ID"
      ]);
      // Style header
      var header = sheet.getRange(1, 1, 1, 14);
      header.setFontWeight("bold");
      header.setBackground("#1a1a2e");
      header.setFontColor("#ffffff");
    }

    sheet.appendRow(row);

    return ContentService
      .createTextOutput(JSON.stringify({ success: true }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    return ContentService
      .createTextOutput(JSON.stringify({ success: false, error: err.message }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

──────────────────────────────────────────────────────────────────────────────
*/