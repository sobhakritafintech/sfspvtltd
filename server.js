const http = require("node:http");
const fs = require("node:fs");
const path = require("node:path");
const nodemailer = require("nodemailer");
const zlib = require("node:zlib");
const CONFIG = require("./config");

const ROOT = __dirname;
const PORT = process.env.PORT || 3000;
const DATA_DIR = path.join(ROOT, "data");
const LEAD_FILE = path.join(DATA_DIR, "chat-leads.jsonl");
const CONTACT_EMAIL = CONFIG.contactEmail;
const NOTIFY_PHONES = (process.env.CHAT_NOTIFY_PHONES || "+918886633118,+918886633119")
  .split(",")
  .map((phone) => phone.trim())
  .filter(Boolean);

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".ico": "image/x-icon",
  ".xml": "application/xml; charset=utf-8",
  ".txt": "text/plain; charset=utf-8",
  ".woff2": "font/woff2",
  ".pdf": "application/pdf",
  ".webmanifest": "application/manifest+json"
};

function sendJson(res, status, body) {
  res.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store",
    "X-Content-Type-Options": "nosniff"
  });
  res.end(JSON.stringify(body));
}

function readJsonBody(req, limit = 96 * 1024) {
  return new Promise((resolve, reject) => {
    let size = 0;
    const chunks = [];

    req.on("data", (chunk) => {
      size += chunk.length;
      if (size > limit) {
        reject(new Error("Request body too large"));
        req.destroy();
        return;
      }
      chunks.push(chunk);
    });

    req.on("end", () => {
      try {
        const raw = Buffer.concat(chunks).toString("utf8");
        resolve(raw ? JSON.parse(raw) : {});
      } catch {
        reject(new Error("Invalid JSON"));
      }
    });

    req.on("error", reject);
  });
}

const LOGO_PNG_PATH = path.join(ROOT, "assets", "img", "logo-mark.png");
// The watermark is the same lotus mark with ~10% alpha baked into the PNG.
// Baking the transparency in (instead of relying on CSS `opacity`) is what makes the
// watermark survive Outlook's Word rendering engine, which ignores CSS opacity.
const WATERMARK_PNG_PATH = path.join(ROOT, "assets", "img", "logo-watermark.png");

// CID inline attachment for logo — the ONLY method that works reliably in Gmail, Outlook, Apple Mail, and all major clients.
// Gmail blocks base64 data URIs in <img src>; external URLs require the domain to be reachable at send time.
// CID attachments embed the image directly in the email MIME payload and are universally supported.
const LOGO_CID = "sobhakrita-logo@sfspvtltd";
const WATERMARK_CID = "sobhakrita-watermark@sfspvtltd";

const INLINE_IMAGE_ASSETS = [
  { path: LOGO_PNG_PATH, cid: LOGO_CID, filename: "logo-mark.png" },
  { path: WATERMARK_PNG_PATH, cid: WATERMARK_CID, filename: "logo-watermark.png" }
];

function hasInlineAsset(filePath) {
  return fs.existsSync(filePath);
}

// Returns every inline image that exists on disk. Missing files are skipped (and logged)
// so a missing asset degrades to the hosted logoUrl instead of silently rendering a broken image.
function getLogoAttachments() {
  const attachments = [];
  for (const asset of INLINE_IMAGE_ASSETS) {
    if (hasInlineAsset(asset.path)) {
      attachments.push({
        filename: asset.filename,
        path: asset.path,
        cid: asset.cid,
        contentDisposition: "inline"
      });
    } else {
      console.warn("[email] Inline email image missing:", asset.path);
    }
  }
  return attachments;
}

function cleanText(value, maxLength) {
  return String(value == null ? "" : value)
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, maxLength);
}

function validateLead(payload) {
  const lead = {
    name: cleanText(payload.name, 120),
    phone: cleanText(payload.phone, 40),
    email: cleanText(payload.email, 160),
    language: cleanText(payload.language, 60) || "English",
    question: cleanText(payload.question, 2000),
    transcript: Array.isArray(payload.transcript)
      ? payload.transcript.slice(-24).map((item) => ({
          role: cleanText(item && item.role, 20),
          text: cleanText(item && item.text, 1200)
        }))
      : [],
    page: cleanText(payload.page, 200),
    createdAt: new Date().toISOString()
  };

  const digits = lead.phone.replace(/\D/g, "");
  if (lead.name.length < 2) throw new Error("Please enter your name.");
  if (digits.length < 10 || digits.length > 15) throw new Error("Please enter a valid mobile number.");
  if (lead.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(lead.email)) {
    throw new Error("Please enter a valid email address.");
  }
  if (lead.question.length < 3) throw new Error("Please enter your question.");

  return lead;
}

async function saveLead(lead) {
  await fs.promises.mkdir(DATA_DIR, { recursive: true });
  await fs.promises.appendFile(LEAD_FILE, JSON.stringify(lead) + "\n", "utf8");
}

function escapeEmailHtml(value) {
  return String(value == null ? "" : value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function renderBrandedEmail({ title, intro, introHtml, details, submittedAt, customerGreeting, slaText, contactBlock, footerNote, isCustomerCopy }) {
  const accent = CONFIG.emailBrand.accent;
  const rows = details.split("\n").filter(Boolean).map((line, index) => {
    const separator = line.indexOf(":");
    const label = separator < 0 ? "Detail" : line.slice(0, separator);
    const value = separator < 0 ? line : line.slice(separator + 1).trim();
    const border = index ? "border-top:1px solid #e6ece8;" : "";
    return "<tr><td style=\"" + border + "padding:11px 14px;color:#52635d;font-size:13px;width:34%;vertical-align:top;background:transparent\"><strong>" + escapeEmailHtml(label) + "</strong></td><td style=\"" + border + "padding:11px 14px;color:#1b2b26;font-size:13px;line-height:1.55;word-break:break-word;background:transparent\">" + escapeEmailHtml(value) + "</td></tr>";
  }).join("");

  // Use CID inline attachment reference — this is the ONLY method supported by Gmail, Outlook, Apple Mail simultaneously.
  // The actual logo file is passed as an inline attachment by sendConfiguredEmail() automatically.
  // If the file is missing on disk we fall back to the hosted URL so the header never renders a broken image.
  const logoSrc = hasInlineAsset(LOGO_PNG_PATH) ? "cid:" + LOGO_CID : CONFIG.emailBrand.logoUrl;
  // The watermark PNG already has its alpha baked in (Outlook ignores CSS `opacity`, and the value is
  // kept in config.js as `emailBrand.watermarkOpacity`), so it is safe to use as a background. If the
  // file is missing, skip the watermark instead of painting the full-colour logo behind the text.
  const watermarkSrc = hasInlineAsset(WATERMARK_PNG_PATH) ? "cid:" + WATERMARK_CID : "";

  const greetingHtml = customerGreeting
    ? "<div style=\"font-size:16px;font-weight:700;color:#1b2b26;margin-bottom:12px;\">" + escapeEmailHtml(customerGreeting) + "</div>"
    : "";

  const slaHtml = slaText
    ? "<div style=\"margin:20px 0;padding:14px 18px;background:#eef7f4;border-left:4px solid " + accent + ";border-radius:6px;\"><div style=\"font-size:12px;font-weight:700;color:" + accent + ";letter-spacing:0.5px;text-transform:uppercase;margin-bottom:4px;\">Expected Response SLA</div><div style=\"font-size:13px;line-height:1.6;color:#1b2b26;\">" + escapeEmailHtml(slaText) + "</div></div>"
    : "";

  const contactsHtml = contactBlock
    ? "<div style=\"margin:20px 0 10px 0;padding:16px 18px;background:#f7faf8;border:1px solid #dfe8e3;border-radius:8px;\"><div style=\"font-size:14px;font-weight:700;color:#1b2b26;margin-bottom:8px;\">Questions or Need Immediate Assistance?</div><div style=\"font-size:13px;line-height:1.75;color:#41534c;\">In the meantime, feel free to reach our team directly:<br>&#128222; <strong>Phone:</strong> <a href=\"tel:+918886633118\" style=\"color:" + accent + ";text-decoration:none;\">+91 88866 33118</a> / <a href=\"tel:+918886633119\" style=\"color:" + accent + ";text-decoration:none;\">+91 88866 33119</a><br>&#128172; <strong>WhatsApp:</strong> <a href=\"https://wa.me/918886633118\" style=\"color:" + accent + ";text-decoration:none;\">+91 88866 33118</a><br>&#9993; <strong>Email:</strong> <a href=\"mailto:" + escapeEmailHtml(contactBlock.email || CONFIG.contactEmail) + "\" style=\"color:" + accent + ";text-decoration:none;\">" + escapeEmailHtml(contactBlock.email || CONFIG.contactEmail) + "</a><br>&#128205; <strong>Office Address:</strong> #20-90B/1, Naidu Buildings, Behind Dominos, Mittoor, Chittoor, Andhra Pradesh, 517001<br>&#128344; <strong>Business Hours:</strong> Monday – Saturday: 9:00 AM – 6:00 PM IST (Closed Sundays & Public Holidays)<br>&#127760; <strong>Website:</strong> <a href=\"https://www.sobhakritafintech.com\" style=\"color:" + accent + ";text-decoration:none;\">www.sobhakritafintech.com</a></div></div>"
    : "";

  const footerText = footerNote || (isCustomerCopy
    ? "Submitted on " + escapeEmailHtml(submittedAt) + " · Sobhakrita Fintech Solutions Private Limited · Chittoor, Andhra Pradesh. This is an automated acknowledgement."
    : "Received " + escapeEmailHtml(submittedAt) + " · This message contains information submitted through the Sobhakrita website.");

  // Watermark: painted as the *background* of the submitted-details card, so the detail rows sit on
  // top of the faint emblem (the intended look). No positioning/negative margins are involved, so a
  // client that strips CSS cannot drop it into the flow or leave a gap. The emblem is applied twice:
  //   - the legacy `background="..."` attribute, which Outlook's Word rendering engine honours;
  //   - CSS `background-image`, used by Gmail, Apple Mail, Windows Mail and other modern clients.
  // The PNG is a card-sized canvas (640x340) with the emblem centred, so clients that ignore
  // `background-size` (Outlook) do not tile it across the table.
  const detailsBgAttr = watermarkSrc ? " background=\"" + watermarkSrc + "\"" : "";
  const detailsBgStyle = watermarkSrc
    ? "background-color:#ffffff;background-image:url('" + watermarkSrc + "');background-repeat:no-repeat;background-position:center center;background-size:cover;"
    : "background-color:#ffffff;";

  const headerHtml =
    "<tr><td style=\"padding:22px 26px;background:" + accent + ";color:#ffffff\">" +
      "<table role=\"presentation\" cellspacing=\"0\" cellpadding=\"0\"><tr>" +
        "<td style=\"vertical-align:middle;padding-right:14px\">" +
          "<img src=\"" + logoSrc + "\" width=\"61\" height=\"48\" alt=\"Sobhakrita Logo\" style=\"display:block;width:61px;height:48px;border:0\">" +
        "</td>" +
        "<td style=\"vertical-align:middle\">" +
          "<div style=\"font-size:12px;letter-spacing:1px;text-transform:uppercase;opacity:.85;color:#ffffff\">" + escapeEmailHtml(CONFIG.emailBrand.name) + "</div>" +
          "<div style=\"font-size:21px;font-weight:700;margin-top:4px;color:#ffffff\">" + escapeEmailHtml(title) + "</div>" +
        "</td>" +
      "</tr></table>" +
    "</td></tr>";

  // Intro copy is plain text by default and escaped. Callers that need a link can pass
  // pre-sanitised `introHtml` (trusted, server-authored markup only).
  const introBlock = introHtml || escapeEmailHtml(intro);

  const contentHtml =
    "<table role=\"presentation\" width=\"100%\" cellspacing=\"0\" cellpadding=\"0\" style=\"background:transparent\">" +
      "<tr><td style=\"padding:0 4px 14px;font-size:14px;line-height:1.65;color:#41534c;background:transparent\">" + greetingHtml + "<div>" + introBlock + "</div></td></tr>" +
      "<tr><td style=\"padding:6px 0 16px;background:transparent\">" +
        "<div style=\"font-size:12px;font-weight:700;letter-spacing:0.8px;text-transform:uppercase;color:#52635d;margin-bottom:8px\">Submitted Details</div>" +
        "<table role=\"presentation\" width=\"100%\" cellspacing=\"0\" cellpadding=\"0\"" + detailsBgAttr + " style=\"border:1px solid #e4ebe7;border-radius:8px;" + detailsBgStyle + "\">" + rows + "</table>" +
      "</td></tr>" +
      (slaHtml ? "<tr><td style=\"padding:0;background:transparent\">" + slaHtml + "</td></tr>" : "") +
      (contactsHtml ? "<tr><td style=\"padding:0;background:transparent\">" + contactsHtml + "</td></tr>" : "") +
    "</table>";

  const footerHtml =
    "<tr><td style=\"padding:15px 26px;background:#f7faf8;border-top:1px solid #e4ebe7;color:#66766f;font-size:11px;line-height:1.5\">" + footerText + "</td></tr>";

  return "<!doctype html><html><body style=\"margin:0;padding:24px 12px;background:#f1f5f3;font-family:Arial,Helvetica,sans-serif;color:#1b2b26\">" +
    "<table role=\"presentation\" width=\"100%\" cellspacing=\"0\" cellpadding=\"0\" style=\"max-width:680px;margin:0 auto;background:#ffffff;border:1px solid #dfe8e3;border-radius:12px;overflow:hidden;box-shadow:0 4px 12px rgba(0,0,0,0.04)\">" +
      headerHtml +
      "<tr><td style=\"background-color:#ffffff;padding:24px 22px 20px;position:relative\">" + contentHtml + "</td></tr>" +
      footerHtml +
    "</table></body></html>";
}

async function sendCustomerConfirmationEmail({ to, name, formType, details, submittedAt }) {
  const isCareers = formType === "careers";
  const title = isCareers
    ? "Careers Application Submitted"
    : "Enquiry Submitted to Sobhakrita";
  const subject = isCareers
    ? "Application received | Sobhakrita Careers — " + (name || "Candidate")
    : "We received your enquiry | Sobhakrita Fintech Solutions";
  const intro = isCareers
    ? "Thank you for your interest in Sobhakrita. Our hiring team will review your details and contact within 5–7 working days if your application is shortlisted. For any future queries, write to hr@sobhakrita.com."
    : "Your enquiry with following details are submitted to Sobhakrita, we will review your request and get back to you with SLA and in meantime give contacts for them to reach for any other queries.";
  // Trusted, server-authored HTML for the HTML part only (plain text above is used for the text part).
  const introHtml = isCareers
    ? "Thank you for your interest in Sobhakrita. Our hiring team will review your details and contact within 5–7 working days if your application is shortlisted. For any future queries, write to <a href=\"mailto:hr@sobhakrita.com\" style=\"color:" + CONFIG.emailBrand.accent + ";text-decoration:underline\">hr@sobhakrita.com</a>."
    : null;
  const customerGreeting = "Dear " + (name || "Customer") + ",";
  const slaText = (CONFIG.customerAutoReply && CONFIG.customerAutoReply.sla && CONFIG.customerAutoReply.sla[formType]) ||
    (CONFIG.customerAutoReply && CONFIG.customerAutoReply.sla && CONFIG.customerAutoReply.sla.default) ||
    "Our team will review your enquiry and get back to you within 24 business hours (Monday – Saturday, 9:00 AM – 6:00 PM IST).";
  const contactInfo = (CONFIG.customerAutoReply && CONFIG.customerAutoReply.contacts) || {};
  const supportEmail = isCareers ? (contactInfo.hrEmail || "hr@sobhakrita.com") : (contactInfo.email || CONFIG.contactEmail);

  const contactBlock = {
    email: supportEmail,
    phone: contactInfo.phone,
    whatsapp: contactInfo.whatsapp,
    address: contactInfo.address,
    hours: contactInfo.hours
  };

  const textLines = [
    customerGreeting,
    "",
    "Thank you for contacting Sobhakrita Fintech Solutions Private Limited.",
    intro,
    "",
    "--- SUBMITTED DETAILS ---",
    details,
    "",
    "--- ESTIMATED RESPONSE SLA ---",
    slaText,
    "",
    "--- CONTACT INFORMATION ---",
    "Phone: " + (contactInfo.phone || "+91 88866 33118 / +91 88866 33119"),
    "WhatsApp: " + (contactInfo.whatsapp || "+91 88866 33118"),
    "Email: " + supportEmail,
    "Address: #20-90B/1, Naidu Buildings, Behind Dominos, Mittoor, Chittoor, Andhra Pradesh, 517001",
    "Office Hours: Monday to Saturday, 9:00 AM to 6:00 PM IST",
    "Website: https://www.sobhakritafintech.com",
    "",
    "Received: " + submittedAt
  ];

  const html = renderBrandedEmail({
    title,
    intro,
    introHtml,
    details,
    submittedAt,
    customerGreeting,
    slaText,
    contactBlock,
    isCustomerCopy: true
  });

  return sendConfiguredEmail({
    to,
    subject,
    text: textLines.join("\n"),
    html,
    replyTo: supportEmail,
    payload: { customerConfirmation: true, formType, name, email: to, submittedAt }
  });
}

function toWebhookAttachment(attachment) {
  return {
    filename: attachment.filename,
    contentType: attachment.contentType,
    content: Buffer.from(attachment.content).toString("base64"),
    cid: attachment.cid,
    contentDisposition: attachment.contentDisposition
  };
}

async function sendConfiguredEmail({ to, subject, text, html, replyTo, payload, attachments = [] }) {
  // Always inject the logo (and watermark) as CID inline attachments when sending HTML email.
  // This is the ONLY method that makes the logo appear reliably in Gmail, Outlook, and Apple Mail.
  const inlineAttachments = html ? getLogoAttachments() : [];
  const allAttachments = [...inlineAttachments, ...attachments];
  const webhook = process.env.LEAD_EMAIL_WEBHOOK;
  if (webhook) {
    const response = await fetch(webhook, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        to,
        subject,
        text,
        html,
        replyTo,
        lead: payload,
        attachments: allAttachments.map(toWebhookAttachment)
      })
    });
    if (!response.ok) throw new Error("Email webhook returned " + response.status);
    return { ok: true, via: "webhook" };
  }

  const smtpPassword = process.env.SMTP_PASSWORD;
  if (smtpPassword && CONFIG.smtp.host && CONFIG.smtp.user) {
    const transporter = nodemailer.createTransport({
      host: CONFIG.smtp.host,
      port: CONFIG.smtp.port,
      secure: CONFIG.smtp.secure,
      requireTLS: !CONFIG.smtp.secure,
      auth: { user: CONFIG.smtp.user, pass: smtpPassword }
    });

    await transporter.sendMail({
      from: CONFIG.smtp.from || CONFIG.smtp.user,
      to,
      replyTo: replyTo || undefined,
      subject,
      text,
      html,
      attachments: allAttachments
    });
    return { ok: true, via: "smtp" };
  }

  if (attachments.length) {
    throw new Error("The FormSubmit fallback cannot send file attachments. Configure SMTP or an email webhook for Careers submissions.");
  }

  // Keyless fallback: FormSubmit delivers to the inbox after a one-time
  // activation click on the first submission.
  const response = await fetch(
    "https://formsubmit.co/ajax/" + encodeURIComponent(to),
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json"
      },
      body: JSON.stringify({
        _subject: subject,
        _template: "table",
        _captcha: "false",
        Name: payload.name || "Not provided",
        Phone: payload.phone || "Not provided",
        Email: payload.email || "Not provided",
        Page: payload.page || "Website",
        Details: text
      })
    }
  );

  const body = await response.json().catch(() => ({}));
  if (!response.ok || body.success === "false" || body.success === false) {
    throw new Error(body.message || "Email delivery failed");
  }
  return { ok: true, via: "formsubmit" };
}

async function sendLeadEmail(lead) {
  const submittedAt = lead.createdAt || new Date().toISOString();
  const title = "Website chat enquiry";
  const intro = "A visitor has sent a question through Agent Sobhi. Please review their contact details and request below.";
  const text = [
    title,
    intro,
    "",
    "Name: " + lead.name,
    "Phone: " + lead.phone,
    "Email: " + (lead.email || "Not provided"),
    "Language: " + lead.language,
    "Received: " + submittedAt,
    "Question:",
    lead.question
  ].join("\n");

  const leadResult = await sendConfiguredEmail({
    to: CONTACT_EMAIL,
    subject: "General enquiry | " + lead.name,
    text,
    html: renderBrandedEmail({
      title,
      intro,
      details: [
        "Full name: " + lead.name,
        "Mobile number: " + lead.phone,
        "Email address: " + (lead.email || "Not provided"),
        "Preferred language: " + lead.language,
        "Question: " + lead.question
      ].join("\n"),
      submittedAt
    }),
    replyTo: lead.email,
    payload: lead
  });

  if (lead.email) {
    try {
      await sendCustomerConfirmationEmail({
        to: lead.email,
        name: lead.name,
        formType: "contact",
        details: [
          "Full name: " + lead.name,
          "Mobile number: " + lead.phone,
          "Email address: " + lead.email,
          "Preferred language: " + lead.language,
          "Question: " + lead.question
        ].join("\n"),
        submittedAt
      });
    } catch (custError) {
      console.warn("Chat customer confirmation email could not be sent:", custError.message);
    }
  }

  return leadResult;
}

function renderEmailTemplate(template, values) {
  return template.replace(/\{\{([a-zA-Z0-9_]+)\}\}/g, function (match, key) {
    return Object.prototype.hasOwnProperty.call(values, key) ? String(values[key] || "") : "";
  });
}

function normalizeFormFields(rawFields) {
  if (!rawFields || typeof rawFields !== "object" || Array.isArray(rawFields)) return null;
  const fields = {};
  Object.entries(rawFields).slice(0, 40).forEach(([key, value]) => {
    if (!/^[a-zA-Z0-9_-]{1,60}$/.test(key)) return;
    fields[key] = cleanText(value, 3000);
  });
  return fields;
}

function humanizeFieldName(name) {
  return name
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/[_-]+/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function parseResumeAttachment(rawAttachment) {
  if (!rawAttachment) return null;
  if (typeof rawAttachment !== "object" || Array.isArray(rawAttachment)) {
    throw new Error("Invalid CV attachment.");
  }

  const filename = cleanText(String(rawAttachment.filename || "").replace(/\\/g, "/").split("/").pop(), 180);
  const extension = path.extname(filename).toLowerCase();
  const contentTypes = {
    ".pdf": "application/pdf",
    ".doc": "application/msword",
    ".docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
  };
  if (!filename || !contentTypes[extension]) {
    throw new Error("Attach a PDF, DOC, or DOCX CV file.");
  }

  const encoded = String(rawAttachment.content || "");
  if (!encoded || encoded.length > 7 * 1024 * 1024 || !/^[A-Za-z0-9+/]*={0,2}$/.test(encoded)) {
    throw new Error("The CV attachment is invalid or too large.");
  }
  const content = Buffer.from(encoded, "base64");
  const maxBytes = 5 * 1024 * 1024;
  if (!content.length || content.length > maxBytes || Number(rawAttachment.size) !== content.length) {
    throw new Error("CV files must be no larger than 5 MB.");
  }

  return {
    filename,
    content,
    contentType: contentTypes[extension],
    contentDisposition: "attachment"
  };
}

async function handleFormSubmission(req, res) {
  let payload;
  try {
    payload = await readJsonBody(req, 8 * 1024 * 1024);
  } catch (error) {
    return sendJson(res, 400, { ok: false, error: error.message });
  }

  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    return sendJson(res, 400, { ok: false, error: "Invalid enquiry form." });
  }

  const formType = cleanText(payload.formType, 40);
  const template = Object.prototype.hasOwnProperty.call(CONFIG.formEmails, formType)
    ? CONFIG.formEmails[formType]
    : null;
  const fields = normalizeFormFields(payload.fields);
  if (!template || !fields) {
    return sendJson(res, 400, { ok: false, error: "Invalid enquiry form." });
  }

  if (fields.company_website) return sendJson(res, 200, { ok: true, emailSent: true });

  for (const field of template.requiredFields) {
    if (!fields[field]) {
      return sendJson(res, 422, { ok: false, error: "Please complete all required fields." });
    }
  }

  const phoneDigits = String(fields.phone || "").replace(/\D/g, "");
  if (phoneDigits.length < 10 || phoneDigits.length > 15) {
    return sendJson(res, 422, { ok: false, error: "Please enter a valid mobile number." });
  }
  if (fields.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(fields.email)) {
    return sendJson(res, 422, { ok: false, error: "Please enter a valid email address." });
  }

  let resumeAttachment;
  try {
    resumeAttachment = parseResumeAttachment(payload.attachment);
    if (resumeAttachment && formType !== "careers") {
      return sendJson(res, 400, { ok: false, error: "File attachments are only accepted on the careers form." });
    }
    if (resumeAttachment) fields.resume_file = resumeAttachment.filename;
  } catch (error) {
    return sendJson(res, 422, { ok: false, error: error.message });
  }

  const submittedAt = new Date().toISOString();
  const details = Object.entries(fields)
    .filter(([key]) => key !== "company_website")
    .map(([key, value]) => {
      const label = CONFIG.formFieldLabels[key] || humanizeFieldName(key);
      return label + ": " + (key === "consent" ? "Yes" : value || "Not provided");
    })
    .join("\n");
  const values = Object.assign({}, fields, { details, submittedAt });
  const subject = renderEmailTemplate(template.subject, values);
  const intro = renderEmailTemplate(template.body, values);
  const text = [template.title, intro, "", details, "", "Received: " + submittedAt].join("\n");
  const html = renderBrandedEmail({ title: template.title, intro, details, submittedAt });

  try {
    await sendConfiguredEmail({
      to: template.to,
      subject,
      text,
      html,
      replyTo: fields.email,
      payload: { formType, submittedAt, fields },
      attachments: resumeAttachment ? [resumeAttachment] : []
    });

    if (fields.email) {
      try {
        await sendCustomerConfirmationEmail({
          to: fields.email,
          name: fields.name,
          formType,
          fields,
          details,
          submittedAt
        });
      } catch (custError) {
        console.warn("Customer confirmation email could not be sent:", custError.message);
      }
    }

    return sendJson(res, 200, { ok: true, emailSent: true });
  } catch (error) {
    console.error("Website form email failed:", error.message);
    return sendJson(res, 502, { ok: false, error: "We could not submit your request. Please try again or contact us by phone or email." });
  }
}

async function sendWhatsAppNotification(lead) {
  const message = [
    "New Sobhakrita chat query",
    "Name: " + lead.name,
    "Phone: " + lead.phone,
    "Email: " + (lead.email || "Not provided"),
    "Language: " + lead.language,
    "Page: " + (lead.page || "Homepage chatbot"),
    "Question: " + lead.question
  ].join("\n");

  const webhook = process.env.WHATSAPP_WEBHOOK_URL;
  const recipients = (process.env.WHATSAPP_TO || "")
    .split(",")
    .map((phone) => phone.trim().replace(/\D/g, ""))
    .filter(Boolean);

  if (webhook) {
    const response = await fetch(webhook, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ to: recipients, message, lead })
    });
    if (!response.ok) throw new Error("WhatsApp webhook returned " + response.status);
    return { ok: true, via: "webhook" };
  }

  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  const accessToken = process.env.WHATSAPP_ACCESS_TOKEN;
  if (!phoneNumberId || !accessToken || !recipients.length) {
    throw new Error("WhatsApp Cloud API is not configured");
  }

  const apiVersion = process.env.WHATSAPP_API_VERSION || "v23.0";
  const templateName = process.env.WHATSAPP_TEMPLATE_NAME;
  const languageCode = process.env.WHATSAPP_TEMPLATE_LANGUAGE || "en_US";
  const results = await Promise.allSettled(recipients.map(async (to) => {
    const payload = templateName
      ? {
          messaging_product: "whatsapp",
          to,
          type: "template",
          template: {
            name: templateName,
            language: { code: languageCode },
            components: [{
              type: "body",
              parameters: [lead.name, lead.phone, lead.email || "Not provided", lead.language, lead.question]
                .map((text) => ({ type: "text", text }))
            }]
          }
        }
      : {
          messaging_product: "whatsapp",
          recipient_type: "individual",
          to,
          type: "text",
          text: { preview_url: false, body: message }
        };

    const response = await fetch(
      "https://graph.facebook.com/" + apiVersion + "/" + encodeURIComponent(phoneNumberId) + "/messages",
      {
        method: "POST",
        headers: {
          Authorization: "Bearer " + accessToken,
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
      }
    );
    if (!response.ok) throw new Error("WhatsApp Cloud API returned " + response.status);
  }));

  const sent = results.filter((result) => result.status === "fulfilled").length;
  if (!sent) throw new Error("WhatsApp message could not be delivered");
  return { ok: true, via: "cloud-api", recipientsSent: sent };
}

async function sendSms(to, message) {
  if (process.env.SMS_WEBHOOK_URL) {
    const response = await fetch(process.env.SMS_WEBHOOK_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ to, message })
    });
    if (!response.ok) throw new Error("SMS webhook returned " + response.status);
    return { ok: true, via: "webhook" };
  }

  const sid = process.env.TWILIO_ACCOUNT_SID;
  const token = process.env.TWILIO_AUTH_TOKEN;
  const from = process.env.TWILIO_FROM;
  if (sid && token && from) {
    const auth = Buffer.from(sid + ":" + token).toString("base64");
    const body = new URLSearchParams({ To: to, From: from, Body: message });
    const response = await fetch(
      "https://api.twilio.com/2010-04-01/Accounts/" + encodeURIComponent(sid) + "/Messages.json",
      {
        method: "POST",
        headers: {
          Authorization: "Basic " + auth,
          "Content-Type": "application/x-www-form-urlencoded"
        },
        body
      }
    );
    if (!response.ok) throw new Error("Twilio returned " + response.status);
    return { ok: true, via: "twilio" };
  }

  throw new Error("SMS provider not configured");
}

async function notifyTeam(lead) {
  const summary =
    "New sobhi query from " + lead.name + " (" + lead.phone + "): " + lead.question;
  const safeSummary = summary.length > 300 ? summary.slice(0, 297) + "..." : summary;
  const smsConfigured = Boolean(
    process.env.SMS_WEBHOOK_URL ||
    (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN && process.env.TWILIO_FROM)
  );
  const whatsappConfigured = Boolean(
    process.env.WHATSAPP_WEBHOOK_URL ||
    (process.env.WHATSAPP_PHONE_NUMBER_ID && process.env.WHATSAPP_ACCESS_TOKEN && process.env.WHATSAPP_TO)
  );

  const [email, sms, whatsapp] = await Promise.allSettled([
    sendLeadEmail(lead),
    smsConfigured
      ? Promise.allSettled(NOTIFY_PHONES.map((phone) => sendSms(phone, safeSummary)))
      : Promise.resolve([]),
    whatsappConfigured ? sendWhatsAppNotification(lead) : Promise.resolve({ ok: false, skipped: true })
  ]);

  return {
    email: email.status === "fulfilled" ? email.value : { ok: false, error: email.reason.message },
    smsConfigured,
    whatsappConfigured,
    whatsapp: whatsapp.status === "fulfilled"
      ? whatsapp.value
      : { ok: false, error: whatsapp.reason.message },
    sms:
      sms.status === "fulfilled"
        ? sms.value.map((result) =>
            result.status === "fulfilled" ? result.value : { ok: false, error: result.reason.message }
          )
        : [{ ok: false, error: sms.reason.message }]
  };
}

async function handleChatLead(req, res) {
  let payload;
  try {
    payload = await readJsonBody(req);
  } catch (error) {
    return sendJson(res, 400, { ok: false, error: error.message });
  }

  // Honeypot used by bots; accept silently so they do not retry.
  if (payload.company_website) return sendJson(res, 200, { ok: true });

  let lead;
  try {
    lead = validateLead(payload);
  } catch (error) {
    return sendJson(res, 422, { ok: false, error: error.message });
  }

  try {
    await saveLead(lead);
  } catch (error) {
    console.error("Could not save chat lead:", error);
    return sendJson(res, 500, { ok: false, error: "Could not save your query. Please try again." });
  }

  const notifications = await notifyTeam(lead);
  if (!notifications.email.ok) {
    console.error("Chat lead email failed:", notifications.email.error);
  }
  notifications.sms.forEach((result) => {
    if (!result.ok) console.error("Chat lead SMS failed:", result.error);
  });
  if (notifications.whatsappConfigured && !notifications.whatsapp.ok) {
    console.error("Chat lead WhatsApp failed:", notifications.whatsapp.error);
  }

  return sendJson(res, 200, {
    ok: true,
    emailSent: notifications.email.ok,
    smsConfigured: notifications.smsConfigured,
    smsSent: notifications.sms.some((result) => result.ok),
    whatsappConfigured: notifications.whatsappConfigured,
    whatsappSent: notifications.whatsapp.ok
  });
}

const ASK_WINDOW_MS = 10 * 60 * 1000;
const ASK_MAX = 40;
const askHits = new Map();
const answerCache = new Map();
const ANSWER_TTL_MS = 30 * 60 * 1000;
const ANSWER_CACHE_MAX = 300;
const MODEL_NAMES = ["openai-fast", "openai"];
const MODEL_COOLDOWN_MS = 30 * 1000;
const modelCooldown = new Map();

function hashString(value) {
  const text = String(value || "");
  let hash = 5381;
  for (let i = 0; i < text.length; i += 1) {
    hash = ((hash << 5) + hash + text.charCodeAt(i)) >>> 0;
  }
  return hash.toString(36);
}

function clientIp(req) {
  if (process.env.TRUST_PROXY === "1") {
    const forwarded = req.headers["x-forwarded-for"];
    if (typeof forwarded === "string" && forwarded.trim()) {
      return forwarded.split(",")[0].trim();
    }
  }
  return (req.socket.remoteAddress || "unknown").replace(/^::ffff:/, "");
}

function answerKey(question, language, context) {
  return language.toLowerCase() + "|" + hashString(context) + "|" +
    question.toLowerCase().replace(/\s+/g, " ").slice(0, 400);
}

function isNoContextAnswer(answer) {
  return /\[NO_CONTEXT\]/i.test(answer) ||
    /\[OFF_TOPIC\]/i.test(answer) ||
    /not (?:listed|available) (?:on|in) (?:the|our) (?:site|website)/i.test(answer) ||
    /(?:don't|do not) have (?:that|this) information/i.test(answer);
}

function readCache(key) {
  const entry = answerCache.get(key);
  if (!entry) return "";
  if (Date.now() - entry.time > ANSWER_TTL_MS) {
    answerCache.delete(key);
    return "";
  }
  // Refresh insertion order so the map behaves like an LRU cache.
  answerCache.delete(key);
  answerCache.set(key, entry);
  return entry.answer;
}

function writeCache(key, answer) {
  if (answerCache.size >= ANSWER_CACHE_MAX) {
    const oldest = answerCache.keys().next().value;
    answerCache.delete(oldest);
  }
  answerCache.set(key, { answer, time: Date.now() });
}

function allowAsk(ip) {
  const now = Date.now();
  const entry = askHits.get(ip);
  if (!entry || now - entry.start > ASK_WINDOW_MS) {
    askHits.set(ip, { start: now, count: 1 });
    if (askHits.size > 2000) {
      for (const [key, value] of askHits) {
        if (now - value.start > ASK_WINDOW_MS) askHits.delete(key);
      }
    }
    return true;
  }
  entry.count += 1;
  return entry.count <= ASK_MAX;
}

function modelAvailable(model) {
  const until = modelCooldown.get(model);
  return !until || until <= Date.now();
}

function markModelFailure(model) {
  modelCooldown.set(model, Date.now() + MODEL_COOLDOWN_MS);
}

function markModelSuccess(model) {
  modelCooldown.delete(model);
}

function retryDelayMs(body, headers) {
  const header = headers && (headers.get("retry-after") || headers.get("x-retry-after"));
  if (header && /^\d+$/.test(header.trim())) return Number(header.trim()) * 1000;
  const text = typeof body === "string" ? body : JSON.stringify(body || {});
  const match = /retry after (\d+)\s*(ms|s)\b/i.exec(text);
  if (match) return Number(match[1]) * (match[2].toLowerCase() === "ms" ? 1 : 1000);
  return 0;
}

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function chatSystemPrompt(language) {
  return [
    "You are sobhi, the friendly customer-support assistant for Sobhakrita Fintech Solutions Private Limited, a loan facilitator and Direct Selling Agent based in Chittoor, Andhra Pradesh.",
    "Answer ONLY from the WEBSITE CONTEXT provided. Never invent or guess loan amounts, rates, fees, eligibility, policies, phone numbers or addresses.",
    "If the answer is not clearly present in the context, reply with exactly [NO_CONTEXT] and nothing else.",
    "If the CUSTOMER QUESTION is unrelated to Sobhakrita, loans, eligibility, documents, fees, EMI, applying, or contacting the team, reply with exactly [OFF_TOPIC] and nothing else. Never respond with a general list of loan products or rates for an unrelated question.",
    "If the context contains general or partial eligibility or document information, share it and say the lender confirms the final criteria. Do not claim information is missing when relevant context is present.",
    "Keep replies short, warm and practical, ideally under 100 words. Use simple sentences and plain text bullet points. Do not use markdown headings or tables.",
    "Always reply in " + language + ", even if the context is in English.",
    "Do not mention that you are an AI, that you use a context, or that you cannot browse. Do not give legal or financial advice. For final terms, ask the customer to confirm with the lender.",
    "Write the answer in your own words and do not add source labels. When useful, refer to a full page link such as https://www.sobhakritafintech.com/apply.html or https://www.sobhakritafintech.com/book-a-call.html."
  ].join(" ");
}

function chatMessages(question, context, language) {
  return [
    { role: "system", content: chatSystemPrompt(language) },
    { role: "user", content: "WEBSITE CONTEXT:\n" + context + "\n\nCUSTOMER QUESTION:\n" + question }
  ];
}

async function handleChatAsk(req, res) {
  let payload;
  try {
    payload = await readJsonBody(req, 64 * 1024);
  } catch (error) {
    return sendJson(res, 400, { ok: false, error: error.message });
  }

  const question = cleanText(payload.question, 1500);
  const context = cleanText(payload.context, 12000);
  const language = cleanText(payload.language, 60) || "English";
  const wantsStream = payload.stream === true;

  if (question.length < 2) {
    return sendJson(res, 422, { ok: false, error: "Please ask a question." });
  }
  if (!context) {
    return sendJson(res, 422, { ok: false, error: "No context available." });
  }

  const ip = clientIp(req);
  if (!allowAsk(ip)) {
    return sendJson(res, 429, { ok: false, error: "Too many questions. Please try again in a few minutes." });
  }

  const key = answerKey(question, language, context);
  const cached = readCache(key);
  if (cached) {
    if (!wantsStream) return sendJson(res, 200, { ok: true, answer: cached });
    res.writeHead(200, {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-store",
      "Connection": "keep-alive",
      "X-Accel-Buffering": "no",
      "X-Content-Type-Options": "nosniff"
    });
    res.write("data: " + JSON.stringify({ delta: cached }) + "\n\n");
    res.end("data: " + JSON.stringify({ done: true, answer: cached }) + "\n\n");
    return;
  }

  try {
    if (wantsStream) {
      await streamFreeModel(req, res, question, context, language, key);
      return;
    }
    const answer = await askFreeModel(question, context, language);
    if (!isNoContextAnswer(answer)) writeCache(key, answer);
    return sendJson(res, 200, { ok: true, answer });
  } catch (error) {
    console.error("sobhi answer failed:", error.message);
    return sendJson(res, 502, { ok: false, error: "The assistant is unavailable right now." });
  }
}

async function askFreeModel(question, context, language) {
  let lastError = null;
  const deadline = Date.now() + 6500;

  for (const model of MODEL_NAMES) {
    if (!modelAvailable(model)) continue;
    for (let attempt = 0; attempt < 2; attempt += 1) {
      const remaining = deadline - Date.now();
      if (remaining < 1500) break;

      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), remaining);

      try {
        const response = await fetch("https://text.pollinations.ai/openai", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            model: model,
            temperature: 0.2,
            messages: chatMessages(question, context, language)
          }),
          signal: controller.signal
        });

        if (!response.ok) {
          const text = await response.text().catch(() => "");
          lastError = new Error("Model returned " + response.status + " (" + model + ")");
          const delay = retryDelayMs(text, response.headers);
          if ((response.status === 402 || response.status === 429) && delay > 0 && delay <= 3000 && attempt === 0 && deadline - Date.now() > delay + 1500) {
            await wait(delay + 250);
            continue;
          }
          markModelFailure(model);
          break;
        }

        const body = await response.json();
        const message = body && body.choices && body.choices[0] && body.choices[0].message;
        const answer = message && typeof message.content === "string" ? message.content.trim() : "";
        if (!answer) {
          lastError = new Error("Model returned an empty answer");
          markModelFailure(model);
          break;
        }
        markModelSuccess(model);
        return answer;
      } catch (error) {
        lastError = error;
        markModelFailure(model);
        break;
      } finally {
        clearTimeout(timer);
      }
    }
  }

  throw lastError || new Error("Assistant unavailable");
}

async function streamFreeModel(req, res, question, context, language, cacheKey) {
  let started = false;
  let clientGone = false;
  let lastError = null;
  const deadline = Date.now() + 6500;

  res.on("close", () => {
    if (!res.writableEnded) clientGone = true;
  });

  function begin() {
    if (started) return;
    started = true;
    res.writeHead(200, {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-store",
      "Connection": "keep-alive",
      "X-Accel-Buffering": "no",
      "X-Content-Type-Options": "nosniff"
    });
  }

  function send(payload) {
    if (!clientGone) res.write("data: " + JSON.stringify(payload) + "\n\n");
  }

  for (const model of MODEL_NAMES) {
    if (!modelAvailable(model)) continue;
    for (let attempt = 0; attempt < 2; attempt += 1) {
      const remaining = deadline - Date.now();
      if (remaining < 1500) break;

      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), remaining);
      let answer = "";
      let modelStarted = false;

      try {
        const response = await fetch("https://text.pollinations.ai/openai", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            model: model,
            temperature: 0.2,
            stream: true,
            messages: chatMessages(question, context, language)
          }),
          signal: controller.signal
        });

        if (!response.ok) {
          const text = await response.text().catch(() => "");
          lastError = new Error("Model returned " + response.status + " (" + model + ")");
          const delay = retryDelayMs(text, response.headers);
          if ((response.status === 402 || response.status === 429) && delay > 0 && delay <= 3000 && attempt === 0 && deadline - Date.now() > delay + 1500) {
            await wait(delay + 250);
            continue;
          }
          markModelFailure(model);
          break;
        }

        const contentType = response.headers.get("content-type") || "";
        if (contentType.includes("application/json")) {
          const body = await response.json();
          const message = body && body.choices && body.choices[0] && body.choices[0].message;
          const answer = message && typeof message.content === "string" ? message.content.trim() : "";
          if (!answer) {
            lastError = new Error("Model returned an empty answer");
            markModelFailure(model);
            break;
          }
          markModelSuccess(model);
          if (!isNoContextAnswer(answer)) writeCache(cacheKey, answer);
          begin();
          send({ delta: answer });
          send({ done: true, answer });
          if (!clientGone) res.end();
          return;
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";

        while (true) {
          if (clientGone) {
            controller.abort();
            break;
          }
          const chunk = await reader.read();
          if (chunk.done) break;
          buffer += decoder.decode(chunk.value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() || "";

          for (const line of lines) {
            if (!line.startsWith("data:")) continue;
            const data = line.slice(5).trim();
            if (!data || data === "[DONE]") continue;
            let parsed;
            try { parsed = JSON.parse(data); } catch { continue; }
            const choice = parsed.choices && parsed.choices[0];
            const delta = choice && choice.delta && typeof choice.delta.content === "string"
              ? choice.delta.content
              : "";
            if (!delta) continue;
            if (!modelStarted) {
              modelStarted = true;
              if (!started) begin();
            }
            answer += delta;
            send({ delta });
          }
        }

        if (!answer) {
          lastError = new Error("Model returned an empty answer");
          markModelFailure(model);
          break;
        }

        markModelSuccess(model);
        if (!isNoContextAnswer(answer)) writeCache(cacheKey, answer);
        if (!started) {
          begin();
          send({ delta: answer });
        }
        send({ done: true, answer });
        if (!clientGone) res.end();
        return;
      } catch (error) {
        lastError = error;
        markModelFailure(model);
        break;
      } finally {
        clearTimeout(timer);
      }
    }
    if (started) break;
  }

  if (!started) {
    console.error("sobhi stream failed:", lastError ? lastError.message : "unknown error");
    if (!res.headersSent) {
      return sendJson(res, 502, { ok: false, error: "The assistant is unavailable right now." });
    }
  }
  send({ error: "The assistant is unavailable right now." });
  if (!clientGone) res.end();
}

const COMPRESSIBLE = new Set([".html", ".css", ".js", ".json", ".svg", ".txt", ".xml", ".webmanifest"]);
const compressedCache = new Map();
const COMPRESSED_CACHE_MAX = 80;

function cacheControlFor(extension) {
  if (extension === ".html") return "no-cache";
  if (extension === ".js" || extension === ".css" || extension === ".txt") {
    return "public, max-age=86400, must-revalidate";
  }
  if (extension === ".png" || extension === ".jpg" || extension === ".jpeg" ||
      extension === ".webp" || extension === ".svg" || extension === ".woff2" ||
      extension === ".ico") {
    return "public, max-age=2592000";
  }
  return "public, max-age=3600";
}

function etagFor(stat) {
  return 'W/"' + stat.size.toString(16) + "-" + Math.floor(stat.mtimeMs || 0).toString(16) + '"';
}

function compressAsset(filePath, stat, encoding) {
  const key = filePath + "|" + stat.size + "|" + stat.mtimeMs + "|" + encoding;
  if (compressedCache.has(key)) return compressedCache.get(key);
  const source = fs.readFileSync(filePath);
  const body = encoding === "br"
    ? zlib.brotliCompressSync(source, { params: { [zlib.constants.BROTLI_PARAM_QUALITY]: 5 } })
    : zlib.gzipSync(source, { level: 6 });
  if (compressedCache.size >= COMPRESSED_CACHE_MAX) {
    compressedCache.delete(compressedCache.keys().next().value);
  }
  compressedCache.set(key, body);
  return body;
}

function preferredEncoding(req) {
  const header = String(req.headers["accept-encoding"] || "").toLowerCase();
  if (header.includes("br") && typeof zlib.brotliCompressSync === "function") return "br";
  if (header.includes("gzip")) return "gzip";
  return "";
}

const server = http.createServer((req, res) => {
  let url;
  try {
    url = new URL(req.url, "http://localhost");
  } catch {
    res.writeHead(400);
    return res.end("Bad Request");
  }

  if (url.pathname === "/api/chat/ask") {
    if (req.method !== "POST") {
      return sendJson(res, 405, { ok: false, error: "Method Not Allowed" });
    }
    return handleChatAsk(req, res);
  }

  if (url.pathname === "/api/chat/lead") {
    if (req.method !== "POST") {
      return sendJson(res, 405, { ok: false, error: "Method Not Allowed" });
    }
    return handleChatLead(req, res);
  }

  if (url.pathname === "/api/forms/submit") {
    if (req.method !== "POST") {
      return sendJson(res, 405, { ok: false, error: "Method Not Allowed" });
    }
    return handleFormSubmission(req, res);
  }

  if (req.method !== "GET" && req.method !== "HEAD") {
    res.writeHead(405, { "Content-Type": "text/plain" });
    return res.end("Method Not Allowed");
  }

  let pathname;
  try {
    pathname = decodeURIComponent(url.pathname);
  } catch {
    res.writeHead(400);
    return res.end("Bad Request");
  }

  if (pathname === "/") pathname = "/index.html";

  // `/index.html/` (or any `page.html/` URL) breaks every relative asset path.
  // Redirect to the canonical file URL, keeping the query string.
  if (/\.html\/+$/i.test(pathname) || /\/\.html$/i.test(pathname)) {
    res.writeHead(301, { Location: pathname.replace(/\/+$/, "") + url.search });
    return res.end();
  }

  // Resolve safely inside a base directory. Returns null when escaping the base.
  const resolveInside = (base, target) => {
    const resolved = path.resolve(base, "." + target);
    if (!resolved.startsWith(base + path.sep) || resolved === base) return null;
    return resolved;
  };

  // `public/` mirrors the GoDaddy `public_html/` root, so versioned
  // /css/*.css and /js/*.js assets fall back there when not in the project root.
  const PUBLIC_ROOT = path.join(ROOT, "public");
  let filePath = resolveInside(ROOT, pathname);

  if (
    filePath &&
    !fs.existsSync(filePath) &&
    (pathname.startsWith("/css/") || pathname.startsWith("/js/"))
  ) {
    filePath = resolveInside(PUBLIC_ROOT, pathname) || filePath;
  }

  if (!filePath) {
    res.writeHead(403);
    return res.end("Forbidden");
  }

  fs.stat(filePath, (err, stat) => {
    if (err || !stat.isFile()) {
      res.writeHead(404, {
        "Content-Type": "text/html; charset=utf-8"
      });
      return res.end(
        "<!doctype html><html><body><h1>404 - Page not found</h1>" +
        '<p><a href="/">Return home</a></p></body></html>'
      );
    }

    const extension = path.extname(filePath).toLowerCase();
    const etag = etagFor(stat);
    const headers = {
      "Content-Type": MIME[extension] || "application/octet-stream",
      "X-Content-Type-Options": "nosniff",
      "Cache-Control": cacheControlFor(extension),
      "ETag": etag,
      "Last-Modified": new Date(stat.mtimeMs || Date.now()).toUTCString()
    };

    if (req.headers["if-none-match"] === etag) {
      res.writeHead(304, headers);
      return res.end();
    }

    const encoding = COMPRESSIBLE.has(extension) ? preferredEncoding(req) : "";
    if (encoding) {
      headers["Content-Encoding"] = encoding;
      headers["Vary"] = "Accept-Encoding";
    }

    if (req.method === "HEAD") {
      res.writeHead(200, headers);
      return res.end();
    }

    if (encoding) {
      try {
        const body = compressAsset(filePath, stat, encoding);
        headers["Content-Length"] = body.length;
        res.writeHead(200, headers);
        return res.end(body);
      } catch {
        // Fall through to the uncompressed stream below.
        delete headers["Content-Encoding"];
        delete headers["Vary"];
      }
    }

    res.writeHead(200, headers);
    fs.createReadStream(filePath)
      .on("error", () => {
        if (!res.headersSent) res.writeHead(500);
        res.end();
      })
      .pipe(res);
  });
});

if (require.main === module) {
  server.listen(PORT, () => {
    console.log(`Sobha Krita website: http://localhost:${PORT}`);
    console.log("Press Ctrl+C to stop.");
  });
}

module.exports = {
  server,
  renderBrandedEmail,
  sendCustomerConfirmationEmail,
  getLogoAttachments,
  LOGO_CID,
  WATERMARK_CID
};
