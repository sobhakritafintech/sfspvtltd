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

`assets/js/sobhi-boot.js` is a tiny launcher that loads `assets/js/sobhi-chat.js`
only when a visitor shows intent, keeping the initial page payload small.
The assistant is intentionally lightweight:

1. sobhi greets the visitor and asks for a language (12 Indian languages plus
   "other"). Language can be changed at any time with the globe button.
2. sobhi offers short support options (loans, eligibility, fees, EMI, apply,
   talk to a human) plus quick Call / WhatsApp / Apply actions.
3. Answers are grounded only in the content of the pages in this repository.
   Retrieval runs in the browser over the FAQ knowledge base and the built-in
   site facts. Free-form answers come from a free, keyless
   model (Pollinations, called by `server.js`), with streamed responses and a
   fast fallback to the matched page text.
4. The transcript and language choice survive page reloads for the browser
   session, long answers can be expanded in place, and chats restore where the
   visitor left off.
5. If no answer is found, sobhi offers to send the question to the team. On
   consent it collects name, mobile number, optional email and the question.
6. Leads are stored in `data/chat-leads.jsonl`, emailed to
   `services@sobhakrita.com`, and sent as a short SMS notification.

The `/api/chat/ask` endpoint streams model output when requested, caches
repeated answers for 30 minutes (keyed by the retrieved context), and limits
each IP to 40 model calls per 10 minutes. A short circuit breaker skips a model
that recently failed so fallback responses stay fast.

### Translated FAQ (optional)

Generate locally translated copies of the FAQ so non-English visitors get
faster answers without per-message translation:

```powershell
npm run translate-faqs
npm run translate-faqs -- te hi ta
```

The generated `data/chat-faqs.<lang>.txt` files are used automatically when
present; otherwise sobhi falls back to `data/chat-faqs.txt`.

### Chat configuration

All settings are optional environment variables for `server.js`:

| Variable | Purpose | Default |
| --- | --- | --- |
| `CONTACT_EMAIL` | Mailbox that receives chat queries | `services@sobhakrita.com` |
| `CHAT_NOTIFY_PHONES` | Comma-separated mobile numbers for SMS alerts | `+918886633118,+918886633119` |
| `LEAD_EMAIL_WEBHOOK` | POST endpoint that delivers email (for example a transactional email service) | — |
| `SMTP_PASSWORD` | SMTP mailbox password/app password; keep only in the server environment | — |
| `WHATSAPP_WEBHOOK_URL` | POST endpoint that sends a WhatsApp notification | — |
| `WHATSAPP_TO` | Comma-separated WhatsApp recipient numbers in international format | — |
| `TRUST_PROXY` | Set to `1` when running behind a trusted reverse proxy so rate limits use `X-Forwarded-For` | — |
| `WHATSAPP_PHONE_NUMBER_ID`, `WHATSAPP_ACCESS_TOKEN` | Meta WhatsApp Cloud API sender ID and access token | — |
| `WHATSAPP_API_VERSION` | Meta Graph API version | `v23.0` |
| `WHATSAPP_TEMPLATE_NAME`, `WHATSAPP_TEMPLATE_LANGUAGE` | Optional approved template and language (template body expects name, phone, email, language, question) | — |
| `SMS_WEBHOOK_URL` | POST endpoint that accepts `{ "to", "message" }` | — |
| `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_FROM` | Twilio SMS credentials | — |
| `PORT` | HTTP port | `3000` |

Email delivery priority is `LEAD_EMAIL_WEBHOOK`, then SMTP, then FormSubmit's
keyless relay. The first delivery through FormSubmit to a new inbox requires
clicking its activation link once. SMTP host, port, TLS mode, username, sender,
and recipient are configured in `config.js`; only `SMTP_PASSWORD` belongs in
the server environment. Update `config.js` if your mailbox provider gives you
different SMTP settings.
Open the site through HTTP(S), not as a local `file://` page, to submit chat
leads. Without an SMS provider, SMS alerts are skipped; the lead is still saved
to `data/chat-leads.jsonl`, while email delivery depends on the configured relay.
Configure either `WHATSAPP_WEBHOOK_URL` or the Meta Cloud API variables to send
chat queries to WhatsApp in the background. Meta credentials and all other
secrets belong in the hosting environment, not in source control. The form
reports success when at least one configured notification channel delivers the
query. Never commit chat leads or generated caches under `data/`; the FAQ
knowledge files themselves are safe to ship.

### Website enquiry forms

The callback, loan application, call booking, contact, and careers forms submit
to `/api/forms/submit`. Their recipients, required fields, parameterized email
subjects, and body templates are defined in `config.js` under `formEmails`;
`formFieldLabels` controls the labels for the complete submitted field list.
The server validates the form and only shows the success panel after the email
provider accepts the message. Careers submissions are sent to `hr@sobhakrita.com`.
Careers applicants can attach one PDF, DOC, or DOCX CV up to 5 MB; file
attachments require SMTP or an email webhook because the FormSubmit fallback
does not support them.

For local PowerShell testing, enter the mailbox password at the hidden prompt
and start the server in the same terminal:

```powershell
$secret = Read-Host "SMTP mailbox password" -AsSecureString
$pointer = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($secret)
try {
   $env:SMTP_PASSWORD = [Runtime.InteropServices.Marshal]::PtrToStringBSTR($pointer)
} finally {
   [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($pointer)
   $secret.Dispose()
}
node server.js
```
