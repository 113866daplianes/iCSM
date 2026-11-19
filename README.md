# Daplian Elementary School iCSM — Frontend

Orange Aero-themed GitHub Pages frontend for the Daplian Elementary School Client Satisfaction Measurement system.

## Files
- `index.html` — app structure, privacy notice, survey flow, app header/footer
- `css/style.css` — orange Aero visual theme
- `js/app.js` — survey interaction and Apps Script API client
- `assets/icsm-icon.png` — supplied iCSM badge used as app icon, favicon, and Apple touch icon

## Backend
The frontend is configured to use the deployed DES iCSM Apps Script Web App:
`https://script.google.com/macros/s/AKfycbxBTjj-kvxskVgiY4ZIAfHTXO-41OBooGzZXpPQsPQ2jA8IEuF8zWV9BdvWMlrLXQ6b/exec`

The frontend uses:
- `GET ?action=ping` for connection checking
- `POST` action `submitCSMResponse` for survey submissions

The backend generates the control number during submission. The frontend does not create a separate client-registration record.

## Important configuration
In `js/app.js`, set `DASHBOARD_URL` to the actual DES iApps Dashboard URL. It is intentionally left blank because the exact dashboard URL was not provided.

## Survey data mapping
The Region of Residence field is sent as `regionOfResidence` and is stored by the existing backend in the existing `REGION_OF_RESIDENCE` column. The database schema is not changed by this frontend.

## GitHub Pages deployment
Upload the contents of this folder to the intended GitHub Pages repository, preserving the `css`, `js`, and `assets` folders. Ensure the repository serves `index.html` at its root.

## Removed from the OneCSM reference
- District / San Fernando branding and district partner logos
- Client registration / appearance transaction workflow
- Certificate of Appearance screens and PDF preview
- PDF generation, retry, token, and file-download frontend logic
- OneCSM API URL and API actions

## Kiosk behavior
After a successful CSM submission, the app displays the generated survey control number and a five-second countdown, then resets the form to the welcome screen. The user can also return immediately using the button.
