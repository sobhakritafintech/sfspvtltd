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

### Website enquiry forms & Email Notifications

The callback, loan application, call booking, contact, and careers forms submit
to `/api/forms/submit`. Their recipients, required fields, parameterized email
subjects, and body templates are defined in `config.js` under `formEmails`;
`formFieldLabels` controls the labels for the complete submitted field list.
The server validates the form and only shows the success panel after the email
provider accepts the message. Careers submissions are sent to `hr@sobhakrita.com`.
Careers applicants can attach one PDF, DOC, or DOCX CV up to 5 MB; file
attachments require SMTP or an email webhook because the FormSubmit fallback
does not support them.

**Email Enhancements & Customer Auto-Reply:**
1. **Watermark in Email Body**: Both internal notification emails and customer confirmation emails render the Sobhakrita brand logo as an elegant, low-opacity watermark behind the submitted-details table, designed with high cross-client compatibility across Gmail, Outlook, Apple Mail, and mobile clients.
   - Email images are embedded as **CID inline attachments** (`assets/img/logo-mark.png` for the header, `assets/img/logo-watermark.png` for the watermark). CID is the only embedding method Gmail, Outlook and Apple Mail all render reliably; `data:` URIs are blocked and hosted URLs require the logo to be reachable at send time.
   - The watermark PNG has ~10% alpha baked in because Outlook's Word rendering engine ignores CSS `opacity`. It is a card-sized canvas (640×340) with the emblem centred, so clients that ignore `background-size` do not tile it across the table.
   - The watermark is painted as the **background of the details card**, so the detail rows sit on top of it. It is applied both with the legacy `background="cid:…"` attribute (Outlook's Word engine) and CSS `background-image` (Gmail, Apple Mail, Windows Mail). No positioning or negative margins are involved, so a client that strips CSS cannot drop it into the flow and leave a gap.
   - Brand images are generated from the master artwork `assets/img/SFS_Logo_Black.jpg` with `powershell -ExecutionPolicy Bypass -File tools/generate-brand-assets.ps1`. It produces:
     - `assets/img/logo-mark.png` — the emblem on a transparent background (site header/footer, email header, favicons).
     - `assets/img/logo-full.png` — emblem + wordmark + tagline (structured-data logo).
     - `assets/img/logo-watermark.png` — pre-faded emblem, centred on a 640×340 transparent canvas, for email bodies.
     - `resources/brand/{favicon-32,icon-192,icon-512,apple-touch-icon}.png` — app icons on a dark rounded tile.
   - If an asset file is ever missing, the header falls back to `emailBrand.logoUrl` in `config.js` instead of rendering a broken image.
   - Preview locally with `node tools/preview-email.js` and open `tools/preview-email.html`.
2. **Customer Auto-Reply Acknowledgement**: When a user submits any enquiry or application and provides an email address, the system sends an automatic confirmation email back to the customer containing:
   - "Your enquiry with following details are submitted to Sobhakrita..."
   - A complete formatted table of all submitted details.
   - Transparent SLA expectations (e.g. 24 business hours for loan consultations; 2-3 business days for career applications).
   - Direct contact channels for urgent queries (Phone: `+91 88866 33118 / +91 88866 33119`, WhatsApp: `+91 88866 33118`, Email: `services@sobhakrita.com` / `hr@sobhakrita.com`, Office: Mittoor, Chittoor).

## Special day wish card

A single data-driven greeting card that floats below the header on Indian, Telugu,
national and global special days. It replaces the previous full-width wish strip,
and the brand lockup stays completely clean year-round (no badges or doodles).

- **Where it lives**: `public/css/special-days.css`,
  `public/js/special-days-data.js` (date registry + SVG library),
  `public/js/special-days-engine.js` (resolver, renderer, carousel).
  `public/` mirrors the GoDaddy `public_html/` root, so pages reference
  `/css/special-days.css` and `/js/special-days-*.js` directly.
- **Dates**: `special-days-data.js` uses `date: 'MM-DD'` for fixed annual days and
  `date: 'YYYY-MM-DD'` for lunar festivals. Today is evaluated in IST
  (`Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata' })`); exact dates win,
  then `MM-DD` fallbacks.
- **Preview**: append `?festival=<slug>` to any page, e.g. `?festival=deepavali`,
  `ugadi`, `republic-day`, `christmas`, `bathukamma`, `anniversary`. Preview mode
  ignores session dismissal so QA always works. `?festival=none` hides the card.
- **Content**: 45 registered days across six themes, two Telugu + English slides
  each, auto-advancing every 5.5s with a 250ms fade. Rotation pauses on hover and
  after a manual dot click.
- **Behaviour**: the engine injects only the active card. Dismissal is stored in
  `sessionStorage` under `sd_closed_<slug>`, so the card stays closed for the tab
  and `#special-day-root` collapses to `display: none`. Dots hide automatically
  when a day has a single slide.
- **Visuals**: deep multi-stop gradients per theme, a low-opacity cultural SVG
  pattern, a 68×68 layered gold emblem, and right-side lanterns/torans/diyas.
  Gold artwork is shared from one `<defs>` block using
  `#FEF3C7 → #FDE68A → #D97706` plus `feDropShadow`.
- **Accessibility**: `role="region"` with `aria-label="Special Day Greeting"`,
  a labelled close button and labelled slide dots.
- **Motion**: all animation is disabled under `prefers-reduced-motion: reduce`.
- **Payload**: three small static files, no image or font requests beyond the site
  fonts. Telugu copy uses the loaded Noto Sans Telugu family with a system fallback.

### Deploying to GoDaddy

Upload the generated root `*.html` files, `assets/`, and the contents of `public/`
to `public_html/` so the paths resolve as:

```
public_html/css/special-days.css
public_html/js/special-days-data.js
public_html/js/special-days-engine.js
```

Bump the `?v=` query string in `src/partials/header.html` after changing the
card CSS/JS or data, then rebuild. It is currently `?v=1.0`.

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
