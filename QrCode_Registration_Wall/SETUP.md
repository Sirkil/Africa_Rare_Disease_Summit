# Live registration scanner and wall

The scanner and registration screen work on two different devices while hosted on GitHub Pages. They exchange scans directly through a WebRTC data connection. PeerJS Cloud helps the two browsers find each other; Google Sheets and Apps Script are currently unused. The old `SummitApi.js` and `Code.gs` are kept for later.

## Start the event

1. Publish the whole project on GitHub Pages, keeping `QrCode_Registration_Wall` and `assets` as sibling folders.
2. On the display, open `QrCode_Registration_Wall/Registration_Screen.html`. Leave this page open. An eight-character pairing code appears on it.
3. On the phone, open `QrCode_Registration_Wall/QrCode_Scanner.html` from the same published site. Allow its front camera, enter the display's pairing code, and tap **Connect**. Once paired, the phone reconnects automatically after a temporary interruption.
4. Scan a badge. The phone confirms as soon as the display receives and stores it. The display welcomes the attendee for five seconds, then places the name in the Africa silhouette.

The scanner's top-right button enters or exits full screen where the browser supports it. Use the same display browser throughout the event: names are saved in that browser's local storage and restored if its page reloads. Clearing that browser's site data removes the saved names. Opening the wall in another browser starts a separate list and pairing code.

Both devices need internet access for the initial connection. PeerJS Cloud is a free shared signaling service, so some networks that block WebRTC may prevent pairing. Because GitHub Pages serves static files, it cannot relay scans by itself. No attendee condition is sent to the display or saved there.

## Check a scan

Use a QR code containing:

`Abdallah EL Kotabi|Attendee|Egypt|Pompe-Fabry`

The scanner should show a confirmation immediately after the display receives it. The display should show the welcome view for five seconds and then add **Abdallah EL Kotabi** inside the Africa shape. Reload the display to check that the name returns.
