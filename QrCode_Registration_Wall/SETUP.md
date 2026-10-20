# Registration wall setup

The scanner and display use the same Google Sheet. Browser storage does not cross devices, so the Apps Script web app is the shared connection.

## 1. Deploy the sheet script

1. Open the [registration spreadsheet](https://docs.google.com/spreadsheets/d/1i9wplSMvIT1WeZ15fBmPsNjFCsw13YUqZExOm0Awbsc/edit).
2. Open **Extensions → Apps Script**. Replace the editor's code with the contents of `Code.gs` and save.
3. Select `setup` and click **Run** once. Approve the spreadsheet permission. The `ScanLog` tab is already prepared; this checks its headers.
4. Choose **Deploy → New deployment → Web app**. Set **Execute as: Me** and **Who has access: Anyone**. Deploy and copy the URL ending in `/exec`.
5. Paste that URL between the quotes of `window.SUMMIT_WEB_APP_URL` at the top of `SummitApi.js`.
6. After future changes to `Code.gs`, use **Deploy → Manage deployments → Edit → New version**. The `/exec` URL can stay the same.

## 2. Open both views

Host this whole project over HTTPS, preserving `QrCode_Registration_Wall` and `assets` as sibling folders. Open:

- `QrCode_Registration_Wall/Registration_Screen.html` on the event display.
- `QrCode_Registration_Wall/QrCode_Scanner.html` on the scanning phone.

Allow camera access on the phone. The screen and phone may be on different networks. The browser needs internet access to reach the Apps Script web app. The phone camera generally requires HTTPS (or localhost for development).

The display uses `assets/BG_Screen.mp4` in both states, with `assets/bg.png` as a fallback. The word cloud sits inside `assets/Africa_Silhouette.png`; both pages use `assets/africa_logo_v2.png`, and the welcome view uses the supplied PNG flag files. Keep the `assets` folder beside `QrCode_Registration_Wall` when publishing.

## 3. Check a scan

Use a QR code containing exactly:

`Abdallah EL Kotabi|Attendee|Egypt|Pompe-Fabry`

The scanner should confirm that the row was saved. The wall should show the welcome view for five seconds, fade back to the Africa silhouette, and show **Abdallah EL Kotabi** inside it. Reload the wall to check that the name returns from the sheet.

The generated QR fields are `Name|Role|Country|Condition`, for example `Pramod Mistry|Speaker|US|GD-ASMD`. The public display receives only name, role, and country; the condition is stored in the private `ScanLog` sheet. Avoid making the spreadsheet itself public.

If the scanner says it cannot confirm the scan, check the `/exec` URL, web app access, and `ScanLog` tab. Check for the row before scanning again. Retrying the same request ID does not create another row; a fresh scan creates a new event.
