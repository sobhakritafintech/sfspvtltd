const assert = require("node:assert");
const CONFIG = require("../config");

console.log("Testing email rendering and config...");
assert.ok(CONFIG.customerAutoReply, "customerAutoReply config must exist");
assert.ok(CONFIG.customerAutoReply.sla.careers, "Careers SLA must exist");
assert.ok(CONFIG.customerAutoReply.sla.default, "Default SLA must exist");
assert.ok(CONFIG.customerAutoReply.contacts.phone, "Contact phone must exist");

console.log("✓ Email configuration validated successfully!");
