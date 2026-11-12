const http = require("node:http");
const fs = require("node:fs");
const path = require("node:path");

const ROOT = __dirname;
const PORT = process.env.PORT || 3000;

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

const server = http.createServer((req, res) => {
  if (req.method !== "GET" && req.method !== "HEAD") {
    res.writeHead(405, { "Content-Type": "text/plain" });
    return res.end("Method Not Allowed");
  }

  let pathname;

  try {
    pathname = decodeURIComponent(
      new URL(req.url, "http://localhost").pathname
    );
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
