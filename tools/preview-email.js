/**
 * Preview email HTML with CID logo replaced by real base64 data URI
 * so we can visually verify in browser.
 * Run: node tools/preview-email.js
 * Then open tools/preview-email.html in a browser.
 */
"use strict";
const path = require("path");
const fs = require("fs");

const ROOT = path.join(__dirname, "..");
const { renderBrandedEmail, LOGO_CID, WATERMARK_CID } = require("../server");

// Render the branded email HTML (uses cid: references)
const html = renderBrandedEmail({
  title: "General Enquiry Received",
  intro: "Your enquiry with following details are submitted to Sobhakrita, we will review your request and get back to you shortly.",
  details: [
    "Full name: Test Customer",
    "Mobile number: 9876543210",
    "Email address: test@example.com",
    "Service: Mutual Funds",
    "Message: Looking for SIP investment options"
  ].join("\n"),
  submittedAt: new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" }),
  customerGreeting: "Dear Test Customer,",
  slaText: "Our team will review your enquiry and get back to you within 24 business hours (Monday – Saturday, 9:00 AM – 6:00 PM IST).",
  contactBlock: { email: "services@sobhakritafintech.com" },
  isCustomerCopy: true
});

// For browser preview: replace each cid: with the matching base64 data URI.
const cidSources = [
  { cid: LOGO_CID, file: path.join(ROOT, "assets", "img", "logo-mark.png") },
  { cid: WATERMARK_CID, file: path.join(ROOT, "assets", "img", "logo-watermark.png") }
];

let previewHtml = html;
for (const source of cidSources) {
  if (!fs.existsSync(source.file)) {
    console.warn("Missing asset, skipping preview swap:", source.file);
    continue;
  }
  const b64 = "data:image/png;base64," + fs.readFileSync(source.file).toString("base64");
  const pattern = new RegExp("cid:" + source.cid.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "g");
  previewHtml = previewHtml.replace(pattern, b64);
}

const outPath = path.join(__dirname, "preview-email.html");
fs.writeFileSync(outPath, previewHtml, "utf8");
console.log("✅ Preview written to:", outPath);
console.log("   Open it in a browser to verify logo appears in header and as watermark.");
console.log("\nHTML length:", html.length, "bytes");
console.log("CIDs used:", "cid:" + LOGO_CID, "and", "cid:" + WATERMARK_CID);
console.log("Header CID occurrences:", (html.match(new RegExp("cid:" + LOGO_CID.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "g")) || []).length, "(should be 1)");
console.log("Watermark CID occurrences:", (html.match(new RegExp("cid:" + WATERMARK_CID.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "g")) || []).length, "(should be 2: background attribute + CSS background-image)");
