// functions/api/_middleware.js
// Runs in front of EVERY /api/* function (Cloudflare Pages). The other 7 files stay untouched.
//
// What it does:
//  1. Blocks browser requests that come from another website (cross-site abuse of your Groq key).
//  2. Rejects oversized POST bodies before they reach a function.
//  3. Strips the "Access-Control-Allow-*" headers the functions add, so other sites can't read responses.
//
// What it does NOT do: stop a script (curl etc.) that fakes headers. For that, add the
// Cloudflare rate-limiting rule described in the instructions.

const MB = 1024 * 1024;
const MAX_BODY = { "/api/sync": 24 * MB };   // sync carries the whole DB (KV limit is ~25 MB)
const DEFAULT_MAX_BODY = 8 * MB;             // plate / chat / coach payloads are well under 2 MB
const ALLOWED_METHODS = new Set(["GET", "POST", "OPTIONS"]);

function deny(status, message) {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
  });
}

export async function onRequest(context) {
  const { request } = context;
  const url = new URL(request.url);

  if (!ALLOWED_METHODS.has(request.method)) return deny(405, "Method not allowed");

  // Browsers always send Sec-Fetch-Site / Origin on cross-site requests. Your own app's
  // fetch("/api/...") is "same-origin", so it passes. Requests with neither header
  // (older browsers, non-browser clients) are let through so nothing legitimate breaks.
  const site = request.headers.get("Sec-Fetch-Site");
  if (site && site !== "same-origin" && site !== "none") return deny(403, "Forbidden origin");

  const origin = request.headers.get("Origin");
  if (origin && origin !== url.origin) return deny(403, "Forbidden origin");

  if (request.method === "POST") {
    const path = url.pathname.replace(/\/+$/, "");
    const max = MAX_BODY[path] || DEFAULT_MAX_BODY;
    const len = Number(request.headers.get("Content-Length"));
    if (len && len > max) return deny(413, "Payload too large");
  }

  const res = await context.next();

  const headers = new Headers(res.headers);
  headers.delete("Access-Control-Allow-Origin");
  headers.delete("Access-Control-Allow-Headers");
  headers.delete("Access-Control-Allow-Methods");
  return new Response(res.body, { status: res.status, statusText: res.statusText, headers });
}