# Quiz score sheet setup

The kiosk writes one row per completed quiz to the sheet with columns **Timestamp**, **Name**, **Selected Quiz**, and **Score**. The timestamp comes from Apps Script when the quiz is submitted. The score is stored as text in a fraction such as `2/8`.

1. Open the [quiz score sheet](https://docs.google.com/spreadsheets/d/1sGyiqPA4KVPSpfFAR1t8-ECw_B64euOQMqTEAdcV6is/edit?gid=0#gid=0). Set row 1 of the tab with `gid=0` to `Timestamp`, `Name`, `Selected Quiz`, `Score` in columns A–D.
2. Choose **Extensions → Apps Script**. Replace the editor contents with [Code.gs](Code.gs) and save.
3. Choose **Deploy → Manage deployments**, edit the existing web app deployment, select **New version**, and deploy. Keep **Execute as** set to **Me** and **Who has access** set to **Anyone**. The existing `/exec` URL in [Quiz.html](Quiz.html) can remain the same.
4. If no web app deployment exists, use **Deploy → New deployment → Web app**, set the same access options, and paste its `/exec` URL into `SCORE_ENDPOINT` in [Quiz.html](Quiz.html).
5. Complete a quiz on the kiosk and check that a row appears in the sheet. If it does not, open **Apps Script → Executions** to inspect the error.

The kiosk can still run before the URL is added, but scores will not be recorded. The public web app URL accepts submissions from anyone who has it, as required for an unattended kiosk.

For camera scanning, open the kiosk over HTTPS or localhost and allow camera access.
