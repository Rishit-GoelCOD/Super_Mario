/**
 * Google Apps Script Webhook Backend for Super Mario Bros
 * Automatically records: Player Name, Score, Coins, World Level, Timestamp, and Face Avatar Photo!
 */

const SECRET_AUTH_TOKEN = "mario_secret_token_123";
const AVATAR_FOLDER_NAME = "Mario_Leaderboard_Avatars";

function getOrCreateAvatarFolder() {
  try {
    const folders = DriveApp.getFoldersByName(AVATAR_FOLDER_NAME);
    if (folders.hasNext()) {
      return folders.next();
    }
    return DriveApp.createFolder(AVATAR_FOLDER_NAME);
  } catch (e) {
    console.error("Drive folder error:", e);
    return null;
  }
}

function doPost(e) {
  try {
    console.log("Incoming webhook request received");

    if (!e || !e.postData || !e.postData.contents) {
      console.warn("Empty request body");
      return ContentService.createTextOutput(JSON.stringify({
        status: "ERROR",
        message: "Empty request body"
      })).setMimeType(ContentService.MimeType.JSON);
    }

    let data;
    try {
      data = JSON.parse(e.postData.contents);
    } catch (parseErr) {
      data = {};
    }

    // 1. Verify Authentication Token (tolerant of whitespace)
    const clientToken = (data.token || "").toString().trim();
    if (clientToken && clientToken !== SECRET_AUTH_TOKEN) {
      console.warn("Token mismatch. Received:", clientToken);
      return ContentService.createTextOutput(JSON.stringify({
        status: "ERROR",
        message: "Unauthorized token: " + clientToken
      })).setMimeType(ContentService.MimeType.JSON);
    }

    const ss = SpreadsheetApp.getActiveSpreadsheet();
    let sheet = ss.getActiveSheet();

    // 2. Auto-initialize Header Row if needed
    const lastRow = sheet.getLastRow();
    if (lastRow === 0 || sheet.getRange(1, 1).getValue() === "") {
      sheet.getRange(1, 1, 1, 6).setValues([["Avatar", "Player Name", "Score", "Coins", "World", "Timestamp"]]);
      const headerRange = sheet.getRange(1, 1, 1, 6);
      headerRange.setFontWeight("bold")
                 .setBackground("#1a2030")
                 .setFontColor("#fcd116")
                 .setHorizontalAlignment("center")
                 .setVerticalAlignment("middle");
      
      sheet.setRowHeight(1, 35);
      sheet.setColumnWidth(1, 80);  // Avatar
      sheet.setColumnWidth(2, 140); // Player Name
      sheet.setColumnWidth(3, 110); // Score
      sheet.setColumnWidth(4, 90);  // Coins
      sheet.setColumnWidth(5, 110); // World
      sheet.setColumnWidth(6, 200); // Timestamp
      sheet.setFrozenRows(1);
    }

    const name = String(data.name || "MARIO").toUpperCase().slice(0, 12);
    const score = parseInt(data.score, 10) || 0;
    const coins = parseInt(data.coins, 10) || 0;
    const level = parseInt(data.level, 10) || 1;
    const timestamp = data.timestamp ? new Date(data.timestamp).toLocaleString() : new Date().toLocaleString();
    const photoB64 = data.photo_b64 || "";

    // 3. Process Player Photo -> Save to Drive -> Embed in Sheet
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
          } catch (shareErr) {
            console.warn("Public link sharing restricted by workspace:", shareErr);
          }
          const fileId = file.getId();
          const directImageUrl = "https://lh3.googleusercontent.com/d/" + fileId;
          avatarFormula = '=IMAGE("' + directImageUrl + '", 1)';
        }
      } catch (imgErr) {
        console.error("Avatar process error:", imgErr);
        avatarFormula = "ERR PHOTO";
      }
    }

    // 4. Append New Entry Row
    sheet.appendRow([avatarFormula, name, score, coins, "World 1-" + level, timestamp]);
    const newRow = sheet.getLastRow();

    // Style the new row
    sheet.setRowHeight(newRow, 60);
    sheet.getRange(newRow, 1, 1, 6).setVerticalAlignment("middle").setHorizontalAlignment("center");
    sheet.getRange(newRow, 3).setNumberFormat("#,##0").setFontWeight("bold");

    // 5. Auto-sort by Score Descending (Column 3 = Score)
    if (newRow > 2) {
      try {
        sheet.getRange(2, 1, newRow - 1, 6).sort({ column: 3, ascending: false });
      } catch (sortErr) {
        console.warn("Sort error:", sortErr);
      }
    }

    console.log("Successfully recorded score for", name, score);

    return ContentService.createTextOutput(JSON.stringify({
      status: "OK",
      message: "Score successfully saved to Google Sheet!",
      player: name,
      score: score
    })).setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    console.error("Fatal doPost error:", error);
    return ContentService.createTextOutput(JSON.stringify({
      status: "ERROR",
      message: error.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

function doGet(e) {
  return ContentService.createTextOutput("Super Mario Bros Leaderboard Webhook is Online and Ready!").setMimeType(ContentService.MimeType.TEXT);
}
