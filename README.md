# Highway Maintenance Mapper (DOH Mapper)

This is a single-page geographic web application built on **Google Apps Script (GAS)**, designed for the Department of Highways (DOH) to map, visualize, and manage highway maintenance tasks.

It uses a Google Spreadsheet as the database to store task assignments, coordinates, budgets, and maintenance statuses. The frontend incorporates Leaflet.js to render interactive road maps, actively fetching actual highway vector data to draw precise curves matching the real world.

---

## 🚀 Features

- **Interactive Map Visualization**: Automatically traces the exact highway route on a Leaflet map from Start/End milestones.
- **Data Management Table**: A mobile-responsive table view to Add, Edit, and Delete maintenance tasks.
- **Coordinate Picker**: Includes a mini-map in the Add/Edit form to pick exact latitude and longitude coordinates.
- **Access Control**: Built-in permission system allowing for Public, Organization-wide, or strict Whitelist edit access.
- **Account Switcher**: Solves the notorious Google Apps Script "Multiple Accounts Signed In" issue without requiring users to open Incognito tabs.

---

## 🛠️ How to Deploy

Follow these steps to deploy this application to your own Google Drive.

### 1. Prepare the Database (Google Sheet)
1. Go to [docs.google.com](https://www.docs.google.com)
2. Make sure to login with your admin account.
3. Create a new Google Spreadsheet. ![sheet_icon](./assets/sheet_icon.png)
4. Create two sheets exactly named:
   - `Maintenance`
   - `YearColor`
5. In the `Maintenance` sheet, set up the following headers in Row 1:
   `Task_Code`, `Year`, `Highway_Number`, `Milestone_Start_Lat`, `Milestone_Start_Lng`, `Milestone_End_Lat`, `Milestone_End_Lng`, `Distance`, `Cost`, `Guarantee_Start`, `Guarantee_End`, `Add_Date`, `Adder`
6. In the `YearColor` sheet, set up the following headers in Row 1:
   `Year`, `Color`

### 2. Add the Code
1. From your Google Sheet, click **Extensions > Apps Script**.
2. Create the following 4 files in the script editor and copy the code from this repository into them:
   - `Code.gs` (Script)
   - `Index.html` (HTML)
   - `Data.html` (HTML)
   - `Map.html` (HTML)
3. Save the project.

### 3. Configure Access Control (Optional)
In `Code.gs`, you can modify the `CURRENT_ACCESS_MODE` near the top of the file to control who can see the "Edit" tab:
- `ACCESS_MODE.PUBLIC`: Everyone who can view the app can edit data.
- `ACCESS_MODE.ORG`: Only users with a specific email domain (e.g., `@doh.go.th`) can edit.
- `ACCESS_MODE.WHITELIST`: Only explicitly listed email addresses can edit.

### 4. Deploy as a Web App (Access Levels)
1. Click the **Deploy** button in the top right, then **New deployment**.
2. Select type **Web app**.
3. **Configuration Options:**
   - **Execute as:** You **must** select **"User accessing the web app"** (Execute as User). *This is required so the script knows who is logging in.*
   - **Who has access:** This dropdown controls who can open the URL. It integrates with your Google Workspace settings. 
     - **Option A (Public View / Restricted Edit):** Choose **"Anyone with Google Account"**. Everyone can view the map, but only people authorized in Step 3 can edit.
     - **Option B (Organization Only):** Choose **"Anyone within [Your Organization]"**. Only internal staff can open the link.
     - **Option C (Strict Sharing):** Choose **"Only myself"** or explicitly share the script file with specific individuals in Google Drive. Only those specific people can open the link.
4. Click **Deploy** and authorize the permissions when prompted.
5. Copy the generated Web App URL.

---

## ⚠️ Troubleshooting Google Account Errors

### The "Multiple Accounts / Unable to Open File" Error
If a user is logged into multiple Google Accounts on their browser (e.g., a personal Gmail and a work email), Google Apps Script often gets confused and forces an error page or a 401 Unauthorized redirect.

**Solution:**
This application includes a built-in **"เปลี่ยนบัญชี" (Switch Account)** button in the top navigation bar. 
If users encounter access issues or infinite login loops on Desktop or Mobile Chrome:
1. They should click the "เปลี่ยนบัญชี" button.
2. They will be taken to Google's native Account Chooser screen.
3. They must select the email address that has permission to view the app.
4. The system will automatically redirect them back to the working application.

*Note: Users no longer need to use Incognito Mode to bypass this limitation.*

---

## 📁 Documents & Assets

You can download the instruction manual and reference materials here:
- [Download User Manual (PDF)](./assets/manual.pdf) 
*(Note to editor: Upload your PDF to the assets folder and update this link)*

---
*Created for the Department of Highways*
