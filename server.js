const http = require("node:http");
const fs = require("node:fs");
const path = require("node:path");

const ROOT = __dirname;
const PORT = process.env.PORT || 3000;
const DATA_DIR = path.join(ROOT, "data");
const LEAD_FILE = path.join(DATA_DIR, "chat-leads.jsonl");
const CONTACT_EMAIL = process.env.CONTACT_EMAIL || "services@sobhakrita.com";
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

async function sendLeadEmail(lead) {
  const text = [
    "New sobhi chat query",
    "",
    "Name: " + lead.name,
    "Phone: " + lead.phone,
    "Email: " + (lead.email || "Not provided"),
    "Language: " + lead.language,
    "Page: " + (lead.page || "Homepage chatbot"),
    "Submitted: " + lead.createdAt,
    "",
    "Question:",
    lead.question
  ].join("\n");

  const webhook = process.env.LEAD_EMAIL_WEBHOOK;
  if (webhook) {
    const response = await fetch(webhook, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        to: CONTACT_EMAIL,
        subject: "sobhi chat query from " + lead.name,
        text,
        lead
      })
    });
    if (!response.ok) throw new Error("Email webhook returned " + response.status);
    return { ok: true, via: "webhook" };
  }

  // Keyless fallback: FormSubmit delivers to the inbox after a one-time
  // activation click on the first submission.
  const response = await fetch(
    "https://formsubmit.co/ajax/" + encodeURIComponent(CONTACT_EMAIL),
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json"
      },
      body: JSON.stringify({
        _subject: "sobhi chat query from " + lead.name,
        _template: "table",
        _captcha: "false",
        Name: lead.name,
        Phone: lead.phone,
        Email: lead.email || "Not provided",
        Language: lead.language,
        Page: lead.page || "Homepage chatbot",
        Question: lead.question,
        Transcript: lead.transcript.map((item) => item.role + ": " + item.text).join("\n")
      })
    }
  );

  const body = await response.json().catch(() => ({}));
  if (!response.ok || body.success === "false" || body.success === false) {
    throw new Error(body.message || "Email delivery failed");
  }
  return { ok: true, via: "formsubmit" };
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

  const [email, sms] = await Promise.allSettled([
    sendLeadEmail(lead),
    Promise.allSettled(NOTIFY_PHONES.map((phone) => sendSms(phone, safeSummary)))
  ]);

  return {
    email: email.status === "fulfilled" ? email.value : { ok: false, error: email.reason.message },
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

  return sendJson(res, 200, { ok: true, emailSent: notifications.email.ok });
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

  if (question.length < 2) {
    return sendJson(res, 422, { ok: false, error: "Please ask a question." });
  }
  if (!context) {
    return sendJson(res, 422, { ok: false, error: "No context available." });
  }

  const ip = (req.socket.remoteAddress || "unknown").replace(/^::ffff:/, "");
  if (!allowAsk(ip)) {
    return sendJson(res, 429, { ok: false, error: "Too many questions. Please try again in a few minutes." });
  }

  const cached = readCache(question, language);
  if (cached) return sendJson(res, 200, { ok: true, answer: cached });

  try {
    const answer = await askFreeModel(question, context, language);
    if (!isNoContextAnswer(answer)) writeCache(question, language, answer);
    return sendJson(res, 200, { ok: true, answer });
  } catch (error) {
    console.error("sobhi answer failed:", error.message);
    return sendJson(res, 502, { ok: false, error: "The assistant is unavailable right now." });
  }
}

const ASK_WINDOW_MS = 10 * 60 * 1000;
const ASK_MAX = 40;
const askHits = new Map();
const answerCache = new Map();
const ANSWER_TTL_MS = 30 * 60 * 1000;

function answerKey(question, language) {
  return (language + "\n" + question).toLowerCase().replace(/\s+/g, " ").slice(0, 400);
}

function isNoContextAnswer(answer) {
  return /\[NO_CONTEXT\]/i.test(answer) ||
    /not (?:listed|available) (?:on|in) (?:the|our) (?:site|website)/i.test(answer) ||
    /(?:don't|do not) have (?:that|this) information/i.test(answer);
}

function readCache(question, language) {
  const entry = answerCache.get(answerKey(question, language));
  if (!entry) return "";
  if (Date.now() - entry.time > ANSWER_TTL_MS) {
    answerCache.delete(answerKey(question, language));
    return "";
  }
  return entry.answer;
}

function writeCache(question, language, answer) {
  if (answerCache.size > 200) {
    const oldest = answerCache.keys().next().value;
    answerCache.delete(oldest);
  }
  answerCache.set(answerKey(question, language), { answer, time: Date.now() });
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

const MODEL_NAMES = ["openai-fast", "openai"];

function retryDelayMs(body, headers) {
  const header = headers && (headers.get("retry-after") || headers.get("x-retry-after"));
  if (header && /^\d+$/.test(header.trim())) return Number(header.trim()) * 1000;
  const text = typeof body === "string" ? body : JSON.stringify(body || {});
  const match = /retry after (\d+)\s*s/i.exec(text);
  return match ? Number(match[1]) * 1000 : 0;
}

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function askFreeModel(question, context, language) {
  const system = [
    "You are sobhi, the friendly customer-support assistant for Sobhakrita Fintech Solutions Private Limited, a loan facilitator and Direct Selling Agent based in Chittoor, Andhra Pradesh.",
    "Answer ONLY from the WEBSITE CONTEXT provided. Never invent or guess loan amounts, rates, fees, eligibility, policies, phone numbers or addresses.",
    "If the answer is not clearly present in the context, reply with exactly [NO_CONTEXT] and nothing else.",
    "If the context contains general or partial eligibility or document information, share it and say the lender confirms the final criteria. Do not claim information is missing when relevant context is present.",
    "Keep replies short, warm and practical, ideally under 100 words. Use simple sentences.",
    "Always reply in " + language + ", even if the context is in English.",
    "Do not mention that you are an AI, that you use a context, or that you cannot browse. Do not give legal or financial advice. For final terms, ask the customer to confirm with the lender.",
    "Write the answer in your own words and do not add source labels. When useful, refer to a full page link such as https://www.sobhakritafintech.com/apply.html or https://www.sobhakritafintech.com/book-a-call.html."
  ].join(" ");

  let lastError = null;
  const deadline = Date.now() + 8000;

  for (const model of MODEL_NAMES) {
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
            messages: [
              { role: "system", content: system },
              {
                role: "user",
                content: "WEBSITE CONTEXT:\n" + context + "\n\nCUSTOMER QUESTION:\n" + question
              }
            ]
          }),
          signal: controller.signal
        });

        if (!response.ok) {
          const text = await response.text().catch(() => "");
          lastError = new Error("Model returned " + response.status + " (" + model + ")");
          const delay = retryDelayMs(text, response.headers);
          // Only wait for short rate-limit windows; otherwise fail fast and let
          // the browser model or the site content answer instead.
          if ((response.status === 402 || response.status === 429) && delay > 0 && delay <= 3000 && attempt === 0 && deadline - Date.now() > delay + 1500) {
            await wait(delay + 250);
            continue;
          }
          break;
        }

        const body = await response.json();
        const message = body && body.choices && body.choices[0] && body.choices[0].message;
        const answer = message && typeof message.content === "string" ? message.content.trim() : "";
        if (!answer) {
          lastError = new Error("Model returned an empty answer");
          break;
        }
        return answer;
      } catch (error) {
        lastError = error;
        break;
      } finally {
        clearTimeout(timer);
      }
    }
  }

  throw lastError || new Error("Assistant unavailable");
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

  const filePath = path.resolve(ROOT, "." + pathname);

  if (!filePath.startsWith(ROOT + path.sep) || filePath === ROOT) {
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

    res.writeHead(200, {
      "Content-Type": MIME[path.extname(filePath).toLowerCase()] ||
        "application/octet-stream",
      "X-Content-Type-Options": "nosniff"
    });

    if (req.method === "HEAD") return res.end();

    fs.createReadStream(filePath)
      .on("error", () => {
        if (!res.headersSent) res.writeHead(500);
        res.end();
      })
      .pipe(res);
  });
});

server.listen(PORT, () => {
  console.log(`Sobha Krita website: http://localhost:${PORT}`);
  console.log("Press Ctrl+C to stop.");
});
