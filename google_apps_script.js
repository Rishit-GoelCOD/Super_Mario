/**
 * Google Apps Script Webhook Backend for Super Mario Bros Leaderboard
 * 
 * Instructions:
 * 1. Open Google Sheets (https://sheets.new)
 * 2. In the menu, go to: Extensions > Apps Script
 * 3. Delete any code in the editor and paste this entire file.
 * 4. Change SECRET_AUTH_TOKEN below to any secret passcode you like.
 * 5. Click "Deploy" (top right) > "New deployment"
 * 6. Select type: "Web app"
 * 7. Set:
 *    - Execute as: "Me"
 *    - Who has access: "Anyone"
 * 8. Click "Deploy", authorize permissions, and copy the Web app URL.
 * 9. Paste the Web app URL and your SECRET_AUTH_TOKEN into the in-game CLOUD CONFIG modal!
 */

const SECRET_AUTH_TOKEN = "mario_secret_token_123"; // Change this to your secret token

function doPost(e) {
  try {
    if (!e || !e.postData || !e.postData.contents) {
      return ContentService.createTextOutput(JSON.stringify({
        status: "ERROR",
        message: "Empty request body"
      })).setMimeType(ContentService.MimeType.JSON);
    }

    const data = JSON.parse(e.postData.contents);

    // Verify authentication token
    if (!data.token || data.token !== SECRET_AUTH_TOKEN) {
      return ContentService.createTextOutput(JSON.stringify({
        status: "ERROR",
        message: "Unauthorized token"
      })).setMimeType(ContentService.MimeType.JSON);
    }

    const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();

    // Auto-initialize header row if empty
    if (sheet.getLastRow() === 0) {
      sheet.appendRow(["Timestamp", "Player Name", "Score", "Coins", "Level Reached", "Avatar Preview"]);
      sheet.getRange(1, 1, 1, 6).setFontWeight("bold").setBackground("#1a2030").setFontColor("#fcd116");
      sheet.setFrozenRows(1);
    }

    const name = String(data.name || "MARIO").toUpperCase().slice(0, 12);
    const score = parseInt(data.score, 10) || 0;
    const coins = parseInt(data.coins, 10) || 0;
    const level = parseInt(data.level, 10) || 1;
    const timestamp = data.timestamp || new Date().toISOString();
    const photoB64 = data.photo_b64 || "";

    // Save avatar preview or placeholder
    let avatarCell = "NO PHOTO";
    if (photoB64 && photoB64.length > 20) {
      avatarCell = photoB64.slice(0, 50) + "... [DATA]";
    }

    // Append new score entry
    sheet.appendRow([timestamp, name, score, coins, "World 1-" + level, avatarCell]);

    // Format new row
    const lastRow = sheet.getLastRow();
    sheet.getRange(lastRow, 3).setNumberFormat("#,##0");

    // Auto-sort sheet by High Score descending (Column C = Score)
    if (lastRow > 2) {
      sheet.getRange(2, 1, lastRow - 1, 6).sort({ column: 3, ascending: false });
    }

    return ContentService.createTextOutput(JSON.stringify({
      status: "OK",
      message: "Score successfully saved to Google Sheet!",
      rank_updated: true
    })).setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({
      status: "ERROR",
      message: error.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

function doGet(e) {
  return ContentService.createTextOutput("Super Mario Bros Leaderboard Webhook is Online and Ready!").setMimeType(ContentService.MimeType.TEXT);
}

