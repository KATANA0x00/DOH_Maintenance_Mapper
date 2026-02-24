// =======================
//   ACCESS CONTROL SETTINGS
// =======================
const ACCESS_MODE = {
  PUBLIC: 'PUBLIC',       // Everyone can edit
  ORG: 'ORG',             // Only users with specific email domains can edit
  WHITELIST: 'WHITELIST'  // Only specific emails can edit
};
const CURRENT_ACCESS_MODE = ACCESS_MODE.PUBLIC; // Change to ORG or WHITELIST to restrict
const ORG_DOMAIN = '@doh.go.th'; // Example domain
const WHITELIST_EMAILS = ['test@example.com', 'admin@example.com'];

function checkPermissions() {
  if (CURRENT_ACCESS_MODE === ACCESS_MODE.PUBLIC) return true;
  
  let userEmail;
  try {
    userEmail = Session.getActiveUser().getEmail();
  } catch (e) {
    return false;
  }
  
  if (!userEmail) return false;
  
  if (CURRENT_ACCESS_MODE === ACCESS_MODE.ORG) {
    return userEmail.endsWith(ORG_DOMAIN);
  }
  
  if (CURRENT_ACCESS_MODE === ACCESS_MODE.WHITELIST) {
    return WHITELIST_EMAILS.includes(userEmail);
  }
  
  return false;
}

function doGet(e) {
  const template = HtmlService.createTemplateFromFile('Index');
  template.isEditor = checkPermissions();
  template.scriptUrl = getScriptUrl();
  
  return template.evaluate()
    .setTitle('DOH | Highway Maintenance Mapper')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL)
    .addMetaTag('viewport', 'width=device-width, initial-scale=1');
}

// Helper function to include separate HTML files
function include(filename) {
  return HtmlService.createHtmlOutputFromFile(filename).getContent();
}

// Helper function to get the current URL of this web app
function getScriptUrl() {
  return ScriptApp.getService().getUrl();
}

function getYearColors() {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName("YearColor");
    if (!sheet) return [];
    
    const data = sheet.getDataRange().getValues();
    if (data.length === 0) return [];
    data.shift(); // Remove headers
    
    return data.map(row => ({
      Year: row[0],
      Color: row[1]
    }));
  } catch(e) {
    return [];
  }
}

// =======================
//   READ
// =======================
function getMaintenanceTasks() {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName("Maintenance");
    if (!sheet) return [];

    const data = sheet.getDataRange().getValues();
    if (data.length === 0) return [];
    
    const headers = data.shift();

    const headerMap = headers.reduce((map, header, index) => {
      map[header.toString().trim()] = index;
      return map;
    }, {});

    return data.map(row => {
      // Helper to format date safely for JSON transmission
      const formatDate = (val) => {
        if (val instanceof Date) {
          return [('0'+val.getDate()).slice(-2), ('0'+(val.getMonth()+1)).slice(-2), val.getFullYear()].join('/');
        }
        return val || "";
      };

      return {
        Task_Code: row[headerMap["Task_Code"]],
        Year: row[headerMap["Year"]],
        Highway_Number: String(row[headerMap["Highway_Number"]] || "").trim(),
        Milestone_Start_Lat: row[headerMap["Milestone_Start_Lat"]],
        Milestone_Start_Lng: row[headerMap["Milestone_Start_Lng"]],
        Milestone_End_Lat: row[headerMap["Milestone_End_Lat"]],
        Milestone_End_Lng: row[headerMap["Milestone_End_Lng"]],
        Distance: row[headerMap["Distance"]],
        Cost: row[headerMap["Cost"]],
        Guarantee_Start: formatDate(row[headerMap["Guarantee_Start"]]),
        Guarantee_End: formatDate(row[headerMap["Guarantee_End"]]),
        Add_Date: formatDate(row[headerMap["Add_Date"]]),
        Adder: row[headerMap["Adder"]]
      };
    });
  } catch(e) {
    return [];
  }
}

// =======================
//   CREATE
// =======================
function addMaintenanceTask(taskObj) {
  if (!checkPermissions()) throw new Error("Permission Denied: You do not have edit access.");
  
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName("Maintenance");
  if (!sheet) throw new Error("Maintenance sheet not found.");
  
  // Also check if we need to add a newly created YearColor
  if (taskObj.NewYearColor) {
     const colorSheet = ss.getSheetByName("YearColor");
     if (colorSheet) {
       colorSheet.appendRow([taskObj.Year, taskObj.NewYearColor]);
     }
  }

  // Force authoritative server-side tracking
  try {
    taskObj.Adder = Session.getActiveUser().getEmail() || "Anonymous";
  } catch (e) {
    taskObj.Adder = "Unknown (Permission Needed)";
  }
  
  const d = new Date();
  taskObj.Add_Date = [('0'+d.getDate()).slice(-2), ('0'+(d.getMonth()+1)).slice(-2), d.getFullYear()].join('/');

  // Get headers to ensure correct column order
  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  
  const newRowData = headers.map(header => {
    const key = header.toString().trim();
    return taskObj[key] !== undefined ? taskObj[key] : "";
  });

  // Append new row right after the headers (optional: insert at top or append at bottom)
  // To match the UI (which puts it at the top), we insert it at row 2.
  sheet.insertRowBefore(2);
  sheet.getRange(2, 1, 1, newRowData.length).setValues([newRowData]);
  
  return { success: true, message: `Task ${taskObj.Task_Code} added successfully.` };
}

// =======================
//   UPDATE
// =======================
function updateMaintenanceTask(taskCode, updatedObj) {
  if (!checkPermissions()) throw new Error("Permission Denied: You do not have edit access.");

  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName("Maintenance");
  if (!sheet) throw new Error("Maintenance sheet not found.");

  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  const taskCodeColIdx = headers.indexOf("Task_Code");
  
  if (taskCodeColIdx === -1) throw new Error("Task_Code column not found.");

  // Find the row
  let rowIdx = -1;
  for (let i = 1; i < data.length; i++) {
    if (String(data[i][taskCodeColIdx]) === String(taskCode)) {
      rowIdx = i + 1; // +1 because array is 0-indexed but sheets are 1-indexed
      break;
    }
  }

  if (rowIdx === -1) throw new Error(`Task ${taskCode} not found.`);

  // Force authoritative server-side tracking on modify
  try {
    updatedObj.Adder = Session.getActiveUser().getEmail() || "Anonymous";
  } catch (e) {
    updatedObj.Adder = "Unknown (Permission Needed)";
  }
  
  const d = new Date();
  updatedObj.Add_Date = [('0'+d.getDate()).slice(-2), ('0'+(d.getMonth()+1)).slice(-2), d.getFullYear()].join('/');

  // Prepare updated row data
  const newRowData = headers.map(header => {
    const key = header.toString().trim();
    return updatedObj[key] !== undefined ? updatedObj[key] : "";
  });

  sheet.getRange(rowIdx, 1, 1, newRowData.length).setValues([newRowData]);
  return { success: true, message: `Task ${taskCode} updated successfully.` };
}

// =======================
//   DELETE
// =======================
function deleteMaintenanceTask(taskCode) {
  if (!checkPermissions()) throw new Error("Permission Denied: You do not have edit access.");

  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName("Maintenance");
  if (!sheet) throw new Error("Maintenance sheet not found.");

  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  const taskCodeColIdx = headers.indexOf("Task_Code");

  if (taskCodeColIdx === -1) throw new Error("Task_Code column not found.");

  for (let i = 1; i < data.length; i++) {
    if (String(data[i][taskCodeColIdx]) === String(taskCode)) {
      sheet.deleteRow(i + 1);
      return { success: true, message: `Task ${taskCode} deleted successfully.` };
    }
  }

  throw new Error(`Task ${taskCode} not found for deletion.`);
}
