// functions/api/sync.js  (Cloudflare Pages Function, KV binding: OPERATOR_SYNC)
//
// Security model: the sync ID is the only credential, so it must be unguessable.
//  - NEW cloud entries may only be created under a strong ID (>= 22 URL-safe chars = 128 bits).
//  - EXISTING entries under old short/weak codes keep working, so nothing is stranded.
//  - A weak code can be retired (tombstoned) once its data has been moved to a strong one.
//  - Writes are shape-checked and size-capped. Error responses stay plain text, as before,
//    so the existing client code (r.json() -> catch) keeps showing "PULL/PUSH FAILED".

const MAX_ID_LEN = 200;
const STRONG_ID = /^[A-Za-z0-9_-]{22,128}$/;
const MAX_BYTES = 24 * 1024 * 1024;            // KV values max out at ~25 MiB
const RETIRED = '{"__retired":true}';

const JSON_HEADERS = { "Content-Type": "application/json", "Cache-Control": "no-store" };
const fail = (status, msg) => new Response(msg, { status, headers: { "Cache-Control": "no-store" } });
const ok = (body) => new Response(body, { status: 200, headers: JSON_HEADERS });

const validId = (id) => typeof id === "string" && id.length > 0 && id.length <= MAX_ID_LEN;

export async function onRequestGet(context) {
  const { request, env } = context;
  const syncId = new URL(request.url).searchParams.get("id");
  if (!validId(syncId)) return fail(400, "Missing or invalid Sync ID");

  try {
    const data = await env.OPERATOR_SYNC.get(syncId);
    if (!data || data === RETIRED) return ok("{}");
    return ok(data);
  } catch (err) {
    return fail(500, "Error");
  }
}

export async function onRequestPost(context) {
  const { request, env } = context;
  try {
    let body;
    try { body = await request.json(); } catch { return fail(400, "Invalid JSON"); }
    const { id, data } = body || {};

    if (!validId(id)) return fail(400, "Missing or invalid Sync ID");
    if (!data || typeof data !== "object" || Array.isArray(data)) return fail(400, "Missing data");

    const existing = await env.OPERATOR_SYNC.get(id);

    // A retired code can never be written to again (stale devices must switch to the new code).
    if (existing === RETIRED) return fail(410, "Sync code retired");

    // Empty object = "retire this code". Only allowed for a code that already exists.
    if (Object.keys(data).length === 0) {
      if (!existing) return fail(400, "Nothing to retire");
      await env.OPERATOR_SYNC.put(id, RETIRED);
      return ok(JSON.stringify({ success: true, retired: true }));
    }

    // Real payloads must look like an OP LOG database.
    if (!data.logs || typeof data.logs !== "object" || Array.isArray(data.logs)) {
      return fail(400, "Invalid data shape");
    }

    // New entries require a strong ID. Existing legacy entries are still writable.
    if (!existing && !STRONG_ID.test(id)) return fail(400, "Weak sync code: generate a secure one");

    const serialized = JSON.stringify(data);
    if (serialized.length > MAX_BYTES) return fail(413, "Payload too large");

    await env.OPERATOR_SYNC.put(id, serialized);
    return ok(JSON.stringify({ success: true }));
  } catch (err) {
    return fail(500, "Error");
  }
}