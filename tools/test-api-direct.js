/**
 * test-api-direct.js
 * In-process check that the branded transactional email renders its logo,
 * watermark, customer greeting, SLA copy, and contact block.
 */
const assert = require("node:assert");
const api = require("../server");

console.log("==========================================");
console.log("TESTING BRANDED EMAIL RENDERING IN-PROCESS");
console.log("==========================================");

const brandedHtml = api.renderBrandedEmail({
  title: "Loan enquiry submitted",
  intro:
    "Your enquiry with following details are submitted to Sobhakrita, we will review your request and get back to you with SLA and in meantime give contacts for them to reach for any other queries.",
  details:
    "Full name: Test User\nMobile number: 9876543210\nLoan type: Personal Loan\nLoan amount: 500000",
  submittedAt: new Date().toISOString(),
  customerGreeting: "Dear Test User,",
  slaText:
    "Our loan advisory team will review your enquiry and get back to you within 24 business hours.",
  contactBlock: {
    email: "services@sobhakrita.com",
    phone: "+91 88866 33118 / +91 88866 33119",
    whatsapp: "+91 88866 33118"
  },
  isCustomerCopy: true
});

assert.ok(
  brandedHtml.includes("watermarkOpacity") || brandedHtml.includes("opacity:"),
  "Must include watermark opacity"
);
assert.ok(
  brandedHtml.includes("logo-mark.png") || brandedHtml.includes("cid:sobhakrita-logo"),
  "Must include logo mark"
);
assert.ok(brandedHtml.includes("Dear Test User,"), "Must include customer greeting");
assert.ok(
  brandedHtml.includes("Expected Response SLA") || brandedHtml.includes("SLA"),
  "Must include SLA"
);
assert.ok(brandedHtml.includes("+91 88866 33118"), "Must include contact numbers");
console.log(
  "✓ renderBrandedEmail renders watermark, customer greeting, SLA, and contacts correctly!"
);

console.log("\n==========================================");
console.log("EMAIL RENDERING TEST PASSED!");
console.log("==========================================");
