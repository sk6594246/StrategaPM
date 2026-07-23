# Task Manager — Authorization Slice (Features #1, #2 trigger, #25)

## Setup Steps

### 1. Google Apps Script backend
1. Create a new Google Sheet (this is your database).
2. Extensions > Apps Script, paste in `backend/Code.gs`.
3. In the Apps Script editor: Project Settings > Script Properties > add
   `PIN_HASH_SALT` = *(same secret string you'll put in GitHub Secrets)*.
4. Run `initSchema` once (Run menu) to create the `Users` sheet with headers:
   `UserID | PasswordHash | Role | Name | Department`
5. Manually add a test user row. To get a valid `PasswordHash`, you can
   temporarily call `hmacSha256Hex("yourpassword")` from the Apps Script
   editor's console and paste the result into the sheet.
6. Deploy > New deployment > Web app. Set "Execute as: Me", "Who has
   access: Anyone". Copy the deployment URL.

### 2. GitHub repo secrets
In your repo: Settings > Secrets and variables > Actions, add:
- `GAS_WEB_APP_URL` — the Web App URL from step 1.6
- `PIN_HASH_SALT` — the exact same string used in Script Properties above

### 3. GitHub Pages
Settings > Pages > Source: GitHub Actions. Push to `main` — the workflow
in `.github/workflows/deploy.yml` builds `frontend/js/config.js` from the
secrets and publishes the `frontend/` folder.

## Local testing
`frontend/js/config.js` is gitignored. To test locally, copy
`config.template.js` to `config.js` and manually fill in real values
(your Sheet's Web App URL + the same salt string), then open
`frontend/index.html` via a local server (not `file://`, since
`crypto.subtle` requires a secure context).

## Files
- `frontend/index.html` — login UI + minimal post-login shell
- `frontend/js/crypto.js` — HMAC-SHA256 (browser-native)
- `frontend/js/auth.js` — login call, session flag, restore-session logic
- `frontend/js/config.template.js` — secret placeholder, filled at deploy
- `backend/Code.gs` — GAS login endpoint + schema init
- `.github/workflows/deploy.yml` — injects secrets, deploys to Pages
