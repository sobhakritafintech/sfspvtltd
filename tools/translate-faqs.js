#!/usr/bin/env node
/*
 * Pre-translates data/chat-faqs.txt into data/chat-faqs.<lang>.txt.
 *
 * The chat widget automatically prefers data/chat-faqs.<lang>.txt when it
 * exists and falls back to the English file. Run this after editing the FAQ:
 *
 *   npm run translate-faqs
 *   npm run translate-faqs -- te hi ta
 */
"use strict";

const fs = require("node:fs");
const path = require("node:path");

const ROOT = path.resolve(__dirname, "..");
const SOURCE = path.join(ROOT, "data", "chat-faqs.txt");
const CACHE_FILE = path.join(ROOT, "data", ".faq-translation-cache.json");
const LANGUAGES = ["te", "hi", "ta", "kn", "ml", "mr", "bn", "gu", "pa", "or", "ur"];
const CHUNK = 1400;

function hash(text) {
  let value = 5381;
  for (let i = 0; i < text.length; i += 1) value = ((value << 5) + value + text.charCodeAt(i)) >>> 0;
  return value.toString(36) + "-" + text.length;
}

function splitForTranslation(text, max = CHUNK) {
  const chunks = [];
  let rest = String(text);
  while (rest.length > max) {
    const cut = rest.slice(0, max);
    let at = Math.max(cut.lastIndexOf("\n"), cut.lastIndexOf(". "), cut.lastIndexOf("? "), cut.lastIndexOf("! "));
    if (at < max * 0.5) at = max;
    chunks.push(rest.slice(0, at));
    rest = rest.slice(at);
  }
  if (rest) chunks.push(rest);
  return chunks;
}

function readCache() {
  try {
    return JSON.parse(fs.readFileSync(CACHE_FILE, "utf8"));
  } catch {
    return {};
  }
}

function writeCache(cache) {
  fs.writeFileSync(CACHE_FILE, JSON.stringify(cache, null, 2), "utf8");
}

async function translateChunk(text, target) {
  const url = "https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=" +
    encodeURIComponent(target) + "&dt=t&q=" + encodeURIComponent(text);
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 15000);
  try {
    const response = await fetch(url, { signal: controller.signal });
    if (!response.ok) throw new Error("HTTP " + response.status);
    const body = await response.json();
    if (!body || !body[0]) throw new Error("Unexpected translation response");
    return body[0].map((part) => (part && part[0]) || "").join("");
  } finally {
    clearTimeout(timer);
  }
}

async function translateText(text, target, cache) {
  const key = target + "|" + hash(text);
  if (cache[key]) return cache[key];
  const parts = [];
  for (const chunk of splitForTranslation(text)) {
    let translated = "";
    for (let attempt = 0; attempt < 3 && !translated; attempt += 1) {
      try {
        translated = await translateChunk(chunk, target);
      } catch (error) {
        if (attempt === 2) throw error;
        await new Promise((resolve) => setTimeout(resolve, 800 * (attempt + 1)));
      }
    }
    parts.push(translated || chunk);
    await new Promise((resolve) => setTimeout(resolve, 150));
  }
  const result = parts.join("");
  cache[key] = result;
  return result;
}

async function translateFile(raw, target, cache) {
  const blocks = raw.split(/\r?\n---\r?\n/);
  const output = [];

  for (const block of blocks) {
    const lines = block.split(/\r?\n/);
    const translated = [];
    for (const line of lines) {
      if (/^Q:\s*/.test(line)) {
        translated.push("Q: " + await translateText(line.replace(/^Q:\s*/, ""), target, cache));
      } else if (/^A:\s*/.test(line)) {
        translated.push("A: " + await translateText(line.replace(/^A:\s*/, ""), target, cache));
      } else {
        translated.push(line);
      }
    }
    output.push(translated.join("\n"));
  }

  return "# Auto-translated FAQ knowledge base (" + target + ").\n" +
    "# Regenerate with: npm run translate-faqs -- " + target + "\n\n" +
    output.join("\n---\n");
}

async function main() {
  const requested = process.argv.slice(2).filter((code) => LANGUAGES.includes(code));
  const targets = requested.length ? requested : LANGUAGES;
  const raw = fs.readFileSync(SOURCE, "utf8");
  const cache = readCache();

  for (const target of targets) {
    process.stdout.write("Translating FAQ to " + target + " ... ");
    const translated = await translateFile(raw, target, cache);
    const out = path.join(ROOT, "data", "chat-faqs." + target + ".txt");
    fs.writeFileSync(out, translated, "utf8");
    writeCache(cache);
    console.log("written " + path.relative(ROOT, out));
  }

  console.log("Done. " + targets.length + " language(s) generated.");
}

main().catch((error) => {
  console.error("FAQ translation failed:", error.message);
  process.exitCode = 1;
});
