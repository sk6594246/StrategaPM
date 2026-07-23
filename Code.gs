/**
 * Code.gs — Google Apps Script backend
 * Feature #1 (Login), Feature #20 (schema init), Feature #25 (HMAC compare)
 *
 * IMPORTANT: The HMAC secret used here MUST be identical to the
 * PIN_HASH_SALT injected into the frontend's config.js at deploy time.
 * Store it in Script Properties (Project Settings > Script Properties)
 * under the key PIN_HASH_SALT — do NOT hardcode it in this file.
 */

const SHEET_USERS = "Users";

/**
 * Entry point for all POST requests from the SPA.
 * Body: { action: string, ...payload }
 * Routes to the correct handler based on `action`.
 */
function doPost(e) {
  let body;
  try {
    body = JSON.parse(e.postData.contents);
  } catch (err) {
    return jsonResponse({ success: false, message: "Invalid request body." });
  }

  switch (body.action) {
    case "login":
      return handleLogin(body);
    default:
      return jsonResponse({ success: false, message: "Unknown action." });
  }
}

/**
 * Feature #1 / #25: Verifies userID + hashedPassword against the Users sheet.
 * Returns ONLY { success: true/false } — never user data, per spec.
 */
function handleLogin(body) {
  const userID = (body.userID || "").toString().trim();
  const hashedPassword = (body.hashedPassword || "").toString().trim();

  if (!userID || !hashedPassword) {
    return jsonResponse({ success: false });
  }

  const sheet = getSheet(SHEET_USERS);
  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  const colUserID = headers.indexOf("UserID");
  const colPasswordHash = headers.indexOf("PasswordHash");

  if (colUserID === -1 || colPasswordHash === -1) {
    return jsonResponse({ success: false });
  }

  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    if (row[colUserID] === userID) {
      const storedHash = (row[colPasswordHash] || "").toString().trim();
      const match = storedHash === hashedPassword;
      return jsonResponse({ success: match });
    }
  }

  // No matching userID found
  return jsonResponse({ success: false });
}

/**
 * Feature #20: Initializes the Users sheet schema if it doesn't exist.
 * Run this manually once from the Apps Script editor (Run > initSchema),
 * or call it from an admin-only setup action later.
 */
function initSchema() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(SHEET_USERS);

  if (!sheet) {
    sheet = ss.insertSheet(SHEET_USERS);
  }

  if (sheet.getLastRow() === 0) {
    sheet.appendRow(["UserID", "PasswordHash", "Role", "Name", "Department"]);
  }
}

/**
 * Utility: server-side HMAC-SHA256, used only if you ever need to
 * generate/verify hashes directly in Apps Script (e.g. an admin
 * "create user" flow that hashes a temp password server-side).
 * Uses the same secret as the frontend, read from Script Properties.
 */
function hmacSha256Hex(message) {
  const secret = PropertiesService.getScriptProperties().getProperty("PIN_HASH_SALT");
  if (!secret) {
    throw new Error("PIN_HASH_SALT not set in Script Properties.");
  }
  const signatureBytes = Utilities.computeHmacSha256Signature(message, secret);
  return signatureBytes
    .map((byte) => {
      const v = (byte < 0 ? byte + 256 : byte).toString(16);
      return v.length === 1 ? "0" + v : v;
    })
    .join("");
}

function getSheet(name) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(name);
  if (!sheet) {
    throw new Error(`Sheet "${name}" not found. Run initSchema() first.`);
  }
  return sheet;
}

function jsonResponse(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(
    ContentService.MimeType.JSON
  );
}
