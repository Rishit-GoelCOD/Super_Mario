/**
 * Google Apps Script Webhook Backend for Super Mario Bros
 * Supports both POST (JSON with photo) and GET (CORS-immune query parameters)
 */

const SECRET_AUTH_TOKEN = "mario_secret_token_123";
const AVATAR_FOLDER_NAME = "Mario_Leaderboard_Avatars";

function getOrCreateAvatarFolder() {
  try {
    const folders = DriveApp.getFoldersByName(AVATAR_FOLDER_NAME);
    if (folders.hasNext()) return folders.next();
    return DriveApp.createFolder(AVATAR_FOLDER_NAME);
  } catch (e) {
    console.error("Drive folder error:", e);
    return null;
  }
}

function recordScoreToSheet(data) {
  // Verify token
  const clientToken = (data.token || "").toString().trim();
  if (clientToken && clientToken !== SECRET_AUTH_TOKEN) {
    return { status: "ERROR", message: "Unauthorized token: " + clientToken };
  }

  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getActiveSheet();

  // Auto-initialize header row
  if (sheet.getLastRow() === 0 || sheet.getRange(1, 1).getValue() === "") {
    sheet.getRange(1, 1, 1, 6).setValues([["Avatar", "Player Name", "Score", "Coins", "World", "Timestamp"]]);
    const headerRange = sheet.getRange(1, 1, 1, 6);
    headerRange.setFontWeight("bold")
               .setBackground("#1a2030")
               .setFontColor("#fcd116")
               .setHorizontalAlignment("center")
               .setVerticalAlignment("middle");
    
    sheet.setRowHeight(1, 35);
    sheet.setColumnWidth(1, 80);
    sheet.setColumnWidth(2, 140);
    sheet.setColumnWidth(3, 110);
    sheet.setColumnWidth(4, 90);
    sheet.setColumnWidth(5, 110);
    sheet.setColumnWidth(6, 200);
    sheet.setFrozenRows(1);
  }

  const name = String(data.name || "MARIO").toUpperCase().slice(0, 12);
  const score = parseInt(data.score, 10) || 0;
  const coins = parseInt(data.coins, 10) || 0;
  const level = parseInt(data.level, 10) || 1;
  const timestamp = data.timestamp ? new Date(data.timestamp).toLocaleString() : new Date().toLocaleString();
  const photoB64 = data.photo_b64 || "";

  // Process Avatar Photo
  let avatarFormula = "NO PHOTO";
  if (photoB64 && photoB64.length > 50) {
    try {
      const decodedBytes = Utilities.base64Decode(photoB64);
      const fileName = "avatar_" + name + "_" + Date.now() + ".jpg";
      const blob = Utilities.newBlob(decodedBytes, "image/jpeg", fileName);
      
      const folder = getOrCreateAvatarFolder();
      if (folder) {
        const file = folder.createFile(blob);
        try {
          file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
        } catch (shareErr) {}
        const fileId = file.getId();
        const directImageUrl = "https://lh3.googleusercontent.com/d/" + fileId;
        avatarFormula = '=IMAGE("' + directImageUrl + '", 1)';
      }
    } catch (imgErr) {
      avatarFormula = "ERR PHOTO";
    }
  }

  // Append entry row
  sheet.appendRow([avatarFormula, name, score, coins, "World 1-" + level, timestamp]);
  const newRow = sheet.getLastRow();

  sheet.setRowHeight(newRow, 60);
  sheet.getRange(newRow, 1, 1, 6).setVerticalAlignment("middle").setHorizontalAlignment("center");
  sheet.getRange(newRow, 3).setNumberFormat("#,##0").setFontWeight("bold");

  // Auto-sort by Score descending
  if (newRow > 2) {
    try {
      sheet.getRange(2, 1, newRow - 1, 6).sort({ column: 3, ascending: false });
    } catch (sErr) {}
  }

  return {
    status: "OK",
    message: "Score successfully saved to Google Sheet!",
    player: name,
    score: score
  };
}

// Handles POST requests
function doPost(e) {
  try {
    let data = {};
    if (e && e.postData && e.postData.contents) {
      try {
        data = JSON.parse(e.postData.contents);
      } catch (err) {
        data = e.parameter || {};
      }
    } else if (e && e.parameter) {
      data = e.parameter;
    }
    const result = recordScoreToSheet(data);
    return ContentService.createTextOutput(JSON.stringify(result)).setMimeType(ContentService.MimeType.JSON);
  } catch (fatal) {
    return ContentService.createTextOutput(JSON.stringify({ status: "ERROR", message: fatal.toString() })).setMimeType(ContentService.MimeType.JSON);
  }
}

// Handles GET requests (supports direct browser URL sync & testing)
function doGet(e) {
  try {
    if (e && e.parameter && e.parameter.name) {
      const result = recordScoreToSheet(e.parameter);
      return ContentService.createTextOutput(JSON.stringify(result)).setMimeType(ContentService.MimeType.JSON);
    }
  } catch (err) {}
  return ContentService.createTextOutput("Super Mario Bros Leaderboard Webhook is Online and Ready!").setMimeType(ContentService.MimeType.TEXT);
}
