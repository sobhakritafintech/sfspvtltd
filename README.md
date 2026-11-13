# sfspvtltd

Static marketing website for **Sobhakrita Fintech Solutions Private Limited**, a loan
facilitator in Chittoor, Andhra Pradesh.

## Run locally

```powershell
node server.js
# open http://localhost:3000
```

## Editing the site

- Page sources live in `src/pages/*.html`.
- Shared head, header and footer live in `src/partials/`.
- Root `*.html` files are generated. After editing a source file run:

```powershell
powershell -ExecutionPolicy Bypass -File .\build.ps1
```

- Validate the generated site before shipping:

```powershell
python tools\check-site.py
```

## sobhi — website assistant

`assets/js/sobhi-chat.js` adds a small chat assistant named **sobhi** to every page.
It is intentionally lightweight:

1. sobhi greets the visitor and asks for a language (12 Indian languages plus
   "other"). Language can be changed at any time with the globe button.
2. sobhi offers short support options (loans, eligibility, fees, EMI, apply,
   talk to a human).
3. Answers are grounded only in the content of the pages in this repository.
   Retrieval runs in the browser. Free-form answers come from a free, keyless
   model (Pollinations, called by `server.js`), then from
   [Puter.js](https://js.puter.com/v2/) when the site is hosted without the
   Node server, and finally from the matched page text.
4. If no answer is found, sobhi offers to send the question to the team. On
   consent it collects name, mobile number, optional email and the question.
5. Leads are stored in `data/chat-leads.jsonl`, emailed to
   `services@sobhakrita.com`, and sent as a short SMS notification.

The `/api/chat/ask` endpoint caches repeated answers for 30 minutes and limits
each IP to 40 model calls per 10 minutes. The free model may occasionally be
rate limited; sobhi then answers from the site content instead.

### Chat configuration

All settings are optional environment variables for `server.js`:

| Variable | Purpose | Default |
| --- | --- | --- |
| `CONTACT_EMAIL` | Mailbox that receives chat queries | `services@sobhakrita.com` |
| `CHAT_NOTIFY_PHONES` | Comma-separated mobile numbers for SMS alerts | `+918886633118,+918886633119` |
| `LEAD_EMAIL_WEBHOOK` | POST endpoint that delivers email (for example a transactional email service) | — |
| `SMS_WEBHOOK_URL` | POST endpoint that accepts `{ "to", "message" }` | — |
| `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_FROM` | Twilio SMS credentials | — |
| `PORT` | HTTP port | `3000` |

Without an email webhook the server uses FormSubmit's keyless relay. The first
delivery to a new inbox requires clicking FormSubmit's activation link once.
Without an SMS provider, SMS notifications are skipped and the failure is
logged; the lead is still saved and emailed. Never commit `data/`.
