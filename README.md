Contact Form (Task 6)

Overview
- Simple contact form with client-side validation for `Name`, `Email`, and `Message`.
- Shows inline error messages and a success message when inputs are valid.

Files
- `index.html` — markup and form
- `styles.css` — basic styling
- `script.js` — validation logic (prevents submission when invalid)

How to run
1. Open `index.html` in Chrome (double-click or open via `File -> Open`).
2. Try submitting with empty fields, invalid email (e.g. `abc@`), and valid inputs to see behavior.

Run with the Node/Express backend (serves the static files and API):

1. Install dependencies:

```powershell
cd "c:\Users\Karthik N\OneDrive\Desktop\Task-6"
npm install
```

2. Start the server:

```powershell
npm start
```

Open `http://localhost:3000/index.html` in Chrome to use the form (the frontend will POST to `/api/contact`).

Run Playwright tests:

```powershell
npx playwright install
npm test
```

Validation details
- Name and Message: required (non-empty after trimming).
- Email: validated using this simple regex: `^[^\s@]+@[^\s@]+\.[^\s@]+$`.
  - This covers most normal email formats but is intentionally simple for client-side checks.
  - Server-side validation (if you add a backend) should be stricter.

Edge cases to test
- Empty `Name`, `Email`, or `Message` fields.
- Email with spaces or missing `@`/`.`.
- Special characters in the message (allowed). 

Notes
- The form does not send data anywhere — it only simulates successful submission by showing a success message.
- If you want, I can add unit tests or wire this up to a simple server endpoint next.
Notes:
- The project now includes a simple Express backend (`server.js`) with server-side validation at `/api/contact`.
- Playwright tests are included under `tests/` and mock the API for the successful-submit test.
- The email regex used is stricter than the simplest variant but still intended for client-side checks; server-side validation is authoritative.
Email sending
- The server can now send an email confirmation to the address submitted in the form and (optionally) send a copy to a site owner address.
- By default, if no SMTP configuration is provided via environment variables, the server will create a temporary Ethereal account (for testing) and return preview URLs in the API response so you can inspect the sent messages.

Environment variables
- Copy `.env.example` to `.env` and set the values you want, for example:

```powershell
cd "c:\Users\Karthik N\OneDrive\Desktop\Task-6"
copy .env.example .env
# edit .env to fill in SMTP_HOST, SMTP_USER, SMTP_PASS and SITE_OWNER_EMAIL
```

If using a real SMTP provider, set `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, and optionally `FROM_EMAIL` and `SITE_OWNER_EMAIL`.

Testing email sending
- Start the server:

```powershell
npm start
```

- Submit the form at `http://localhost:3000/index.html`.
- If SMTP is not configured, the JSON response from `POST /api/contact` will include `previewUrls` (Ethereal links) you can open in a browser to view the emails.

Security note
- Do not commit `.env` with real credentials. Use environment variables in CI/CD or secret management for production.