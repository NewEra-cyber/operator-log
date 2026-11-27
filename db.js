import { ymd, num, uid, toast } from './utils.js';

/* =====================================================================
   OPERATOR LOG storage layer (v4 layout, data format still "version 3")

   - Main JSON (small)  -> object store "appData", key DB_KEY
   - Images (large)     -> object store "blobs"  (meal thumbnails + vault photos)
     Both stores are written in ONE transaction, so they never disagree.
   - In memory the app still sees plain data URLs (db.photos[ms][pose],
     meal.img), so view.js / app.js need no changes for storage.
   - saveDB() also stamps change times and records deletions (tombstones),
     which is what makes cross-device merge safe (see mergeDBsEx).
   ===================================================================== */

const DB_NAME = "OperatorLogDB";
const STORE_NAME = "appData";
const BLOB_STORE = "blobs";
const DB_KEY = "operatorlog.db.v3";
const DB_VERSION = 2;
const BLOB_MARK = "@blob";
const TOMB_TTL_MS = 120 * 24 * 60 * 60 * 1000;

let dbInstance = null;
export let memoryDB = null;

let shadow = null;                 // snapshot used to detect edits / deletions
let blobShadow = new Map();        // blob key -> value already persisted
let writing = false;
let dirty = false;
let lastErrToast = 0;

const isObj = (v) => !!v && typeof v === "object" && !Array.isArray(v);

/* ---------------------------------------------------------------- IDB */

function reqP(req) {
  return new Promise((resolve, reject) => {
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

function openIDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = (e) => {
      const d = e.target.result;
      if (!d.objectStoreNames.contains(STORE_NAME)) d.createObjectStore(STORE_NAME);
      if (!d.objectStoreNames.contains(BLOB_STORE)) d.createObjectStore(BLOB_STORE);
    };
    req.onsuccess = (e) => {
      const d = e.target.result;
      d.onversionchange = () => { try { d.close(); } catch (x) { } dbInstance = null; };
      resolve(d);
    };
    req.onerror = (e) => reject(e.target.error);
  });
}

async function loadStored() {
  const tx = dbInstance.transaction([STORE_NAME, BLOB_STORE], "readonly");
  const main = reqP(tx.objectStore(STORE_NAME).get(DB_KEY));
  const keys = reqP(tx.objectStore(BLOB_STORE).getAllKeys());
  const vals = reqP(tx.objectStore(BLOB_STORE).getAll());
  const [m, k, v] = await Promise.all([main, keys, vals]);
  const blobs = new Map();
  for (let i = 0; i < k.length; i++) blobs.set(k[i], v[i]);
  return { main: m, blobs };
}

function hydrate(parsed, blobs) {
  if (!isObj(parsed)) return;
  if (isObj(parsed.photos)) {
    Object.keys(parsed.photos).forEach((ms) => {
      const slots = parsed.photos[ms];
      if (!isObj(slots)) return;
      Object.keys(slots).forEach((pose) => {
        if (slots[pose] === BLOB_MARK) {
          const v = blobs.get("photo/" + ms + "/" + pose);
          if (typeof v === "string" && v) slots[pose] = v; else delete slots[pose];
        }
      });
    });
  }
  if (isObj(parsed.logs)) {
    Object.keys(parsed.logs).forEach((date) => {
      const log = parsed.logs[date];
      const meals = log && (Array.isArray(log) ? log : (log.meals || log.items));
      if (!Array.isArray(meals)) return;
      meals.forEach((m) => {
        if (m && m.img === BLOB_MARK) {
          const v = blobs.get("meal/" + m.id);
          m.img = (typeof v === "string" && v) ? v : null;
        }
      });
    });
  }
}

export async function initDB() {
  if (memoryDB) return memoryDB;
  try {
    dbInstance = await openIDB();
    try { if (navigator.storage && navigator.storage.persist) await navigator.storage.persist(); } catch (e) { }

    const stored = await loadStored();
    let parsed = null;
    if (stored.main) {
      try { parsed = JSON.parse(stored.main); } catch (e) { parsed = null; }
    }

    if (parsed) {
      hydrate(parsed, stored.blobs);
      memoryDB = migrate(parsed);
      blobShadow = new Map(stored.blobs);
    } else {
      let legacy = null;
      try { legacy = localStorage.getItem(DB_KEY); } catch (e) { }
      if (legacy) {
        try { memoryDB = migrate(JSON.parse(legacy)); } catch (e) { memoryDB = blankDB(); }
        shadow = scan(memoryDB, null, 0, false);
        persist();
      } else {
        memoryDB = blankDB();
      }
    }
  } catch (err) {
    console.error("IndexedDB failed. Falling back.", err);
    dbInstance = null;
    try {
      const raw = localStorage.getItem(DB_KEY);
      memoryDB = raw ? migrate(JSON.parse(raw)) : blankDB();
    } catch (e) { memoryDB = blankDB(); }
  }
  shadow = scan(memoryDB, null, 0, false);
  return memoryDB;
}

export function getDB() {
  return memoryDB || blankDB();
}

/* --------------------------------------------------------- persistence */

function splitForStorage(db) {
  const blobs = new Map();
  const slim = Object.assign({}, db);

  slim.photos = {};
  Object.keys(db.photos || {}).forEach((ms) => {
    const slots = db.photos[ms];
    if (!isObj(slots)) return;
    const out = {};
    Object.keys(slots).forEach((pose) => {
      const v = slots[pose];
      if (typeof v === "string" && v) { blobs.set("photo/" + ms + "/" + pose, v); out[pose] = BLOB_MARK; }
    });
    slim.photos[ms] = out;
  });

  slim.logs = {};
  Object.keys(db.logs || {}).forEach((date) => {
    const log = db.logs[date];
    if (!log || !Array.isArray(log.meals) || !log.meals.some((m) => m && m.img)) { slim.logs[date] = log; return; }
    slim.logs[date] = Object.assign({}, log, {
      meals: log.meals.map((m) => {
        if (m && typeof m.img === "string" && m.img) {
          blobs.set("meal/" + m.id, m.img);
          return Object.assign({}, m, { img: BLOB_MARK });
        }
        return m;
      })
    });
  });
  return { slim, blobs };
}

function notifyWriteError(err) {
  console.error("[OPLOG] storage write failed", err);
  const now = Date.now();
  if (now - lastErrToast > 30000) {
    lastErrToast = now;
    try { toast("STORAGE ERROR - EXPORT A BACKUP NOW", "red"); } catch (e) { }
  }
}

function persist() {
  if (!dbInstance) {
    try { localStorage.setItem(DB_KEY, JSON.stringify(memoryDB)); }
    catch (e) { notifyWriteError(e); }
    return;
  }
  if (writing) { dirty = true; return; }
  writing = true;
  dirty = false;

  let finished = false;
  const done = (ok, err) => {
    if (finished) return;
    finished = true;
    writing = false;
    if (!ok) { blobShadow = new Map(); notifyWriteError(err); }
    if (dirty) persist();
  };

  try {
    const { slim, blobs } = splitForStorage(memoryDB);
    const tx = dbInstance.transaction([STORE_NAME, BLOB_STORE], "readwrite");
    const mainStore = tx.objectStore(STORE_NAME);
    const blobStore = tx.objectStore(BLOB_STORE);

    blobs.forEach((v, k) => { if (blobShadow.get(k) !== v) blobStore.put(v, k); });
    blobShadow.forEach((v, k) => { if (!blobs.has(k)) blobStore.delete(k); });
    mainStore.put(JSON.stringify(slim), DB_KEY);

    tx.oncomplete = () => { blobShadow = blobs; done(true); };
    tx.onerror = (e) => done(false, e && e.target && e.target.error);
    tx.onabort = (e) => done(false, tx.error || (e && e.target && e.target.error));
  } catch (e) {
    done(false, e);
    try { localStorage.setItem(DB_KEY, JSON.stringify(memoryDB)); } catch (x) { }
  }
}

/* ------------------------------------------- change tracking (stamps) */

function exSig(entry) {
  const c = Object.assign({}, entry);
  delete c.u;
  return JSON.stringify(c);
}

// Walks the DB, returning a snapshot. When `stamp` is true it also records edits
// (timestamps) and deletions (tombstones) relative to the previous snapshot.
function scan(db, prev, now, stamp) {
  const next = { meals: new Set(), chats: new Set(), water: new Map(), notes: new Map(), ex: new Map(), photos: new Map() };
  if (stamp) { if (!isObj(db.tomb)) db.tomb = {}; if (!isObj(db.photoAt)) db.photoAt = {}; }

  Object.keys(db.logs || {}).forEach((date) => {
    const log = db.logs[date];
    if (!isObj(log)) return;
    (log.meals || []).forEach((m) => { if (m && m.id) next.meals.add(m.id); });

    const w = num(log.water, 0);
    const n = typeof log.sessionNotes === "string" ? log.sessionNotes : "";
    next.water.set(date, w);
    next.notes.set(date, n);
    if (stamp && prev) {
      const pw = prev.water.has(date) ? prev.water.get(date) : 0;
      if (pw !== w) log.waterAt = now;
      const pn = prev.notes.has(date) ? prev.notes.get(date) : "";
      if (pn !== n) log.sessionNotesAt = now;
    }
  });

  Object.keys(db.workouts || {}).forEach((sk) => {
    const sess = db.workouts[sk];
    if (!isObj(sess) || !isObj(sess.ex)) return;
    Object.keys(sess.ex).forEach((id) => {
      const e = sess.ex[id];
      if (!isObj(e)) return;
      const sig = exSig(e);
      const key = sk + "/" + id;
      next.ex.set(key, sig);
      if (stamp && prev && prev.ex.get(key) !== sig) e.u = now;
    });
  });

  Object.keys(db.photos || {}).forEach((ms) => {
    const slots = db.photos[ms];
    if (!isObj(slots)) return;
    Object.keys(slots).forEach((pose) => {
      const v = slots[pose];
      if (typeof v !== "string" || !v) return;
      const key = ms + "/" + pose;
      next.photos.set(key, v);
      if (stamp && prev && prev.photos.get(key) !== v) db.photoAt[key] = now;
    });
  });

  (db.chats || []).forEach((c) => { if (c && c.id) next.chats.add(c.id); });

  if (stamp && prev) {
    prev.meals.forEach((id) => { if (!next.meals.has(id)) db.tomb["m:" + id] = now; });
    prev.chats.forEach((id) => { if (!next.chats.has(id)) db.tomb["c:" + id] = now; });
    (db.weightLog || []).forEach((w) => { if (isObj(w) && w.at == null) w.at = now; });
  }
  return next;
}

export function saveDB(db, opts) {
  try {
    memoryDB = db;
    if (opts && opts.noStamp) shadow = scan(db, null, 0, false);
    else shadow = scan(db, shadow, Date.now(), true);
    persist();
    return true;
  } catch (e) {
    console.error("[OPLOG] save failed", e);
    return false;
  }
}

// Save a database produced by mergeDBsEx() / import: no edit stamps, no new tombstones.
export function saveMerged(db) {
  return saveDB(db, { noStamp: true });
}

/* ------------------------------------------------------------ blank/migrate */

export function blankDB() {
  return {
    version: 3,
    created: Date.now(),
    settings: {
      proteinTarget: 105,
      operator: "OPERATOR",
      syncId: "OPLOG", // <--- CHANGED: Default code is now OPLOG
      includePhotos: true
    },
    logs: {},
    workouts: {},
    history: {},
    photos: {},
    favorites: [],
    weightLog: [],
    chats: []
  };
}

const KNOWN_TOP = new Set([
  "version", "created", "settings", "logs", "workouts", "history", "photos", "photoAt", "tomb",
  "favorites", "weightLog", "chats"
]);
const LEGACY_TOP = new Set([
  "config", "prefs", "proteinTarget", "nutrition", "meals", "food", "diary", "sessions", "training",
  "exercises", "bests", "prs", "records", "vault", "milestones", "progress"
]);

export function migrate(raw) {
  const db = blankDB();
  if (!raw || typeof raw !== "object") return db;

  if (num(raw.created, 0) > 0) db.created = num(raw.created, db.created);

  // settings: keep EVERY stored key (syncId, lastBackup, ...), normalise the known ones
  const s = isObj(raw.settings) ? raw.settings : (isObj(raw.config) ? raw.config : (isObj(raw.prefs) ? raw.prefs : {}));
  db.settings = Object.assign({}, db.settings, s);
  db.settings.proteinTarget = num(s.proteinTarget != null ? s.proteinTarget : raw.proteinTarget, 105) || 105;
  db.settings.operator = s.operator || s.name || "OPERATOR";
  db.settings.includePhotos = s.includePhotos !== false;
  if (typeof db.settings.syncId !== "string") db.settings.syncId = "";

  const rawLogs = raw.logs || raw.nutrition || raw.meals || raw.food || raw.diary || {};
  if (Array.isArray(rawLogs)) {
    db.logs[ymd()] = { meals: normaliseMeals(rawLogs) };
  } else if (rawLogs && typeof rawLogs === "object") {
    Object.keys(rawLogs).forEach((k) => {
      const v = rawLogs[k];
      if (Array.isArray(v)) {
        db.logs[k] = { meals: normaliseMeals(v), water: 0 };
      } else if (v && typeof v === "object") {
        const extra = Object.assign({}, v);
        delete extra.meals; delete extra.items;
        db.logs[k] = Object.assign({}, extra, { meals: normaliseMeals(v.meals || v.items || []), water: num(v.water, 0) });
      }
    });
  }

  const rawW = raw.workouts || raw.sessions || raw.training || raw.exercises || {};
  if (rawW && typeof rawW === "object") {
    Object.keys(rawW).forEach((k) => {
      const v = rawW[k] || {};
      const ex = v.ex || v.exercises || v.data || {};
      const extra = isObj(v) ? Object.assign({}, v) : {};
      delete extra.exercises; delete extra.data;
      db.workouts[k] = Object.assign({}, extra, { ex: (ex && typeof ex === "object") ? ex : {} });
    });
  }

  const rawH = raw.history || raw.bests || raw.prs || raw.records || {};
  if (rawH && typeof rawH === "object") {
    Object.keys(rawH).forEach((k) => {
      const v = rawH[k];
      if (v == null) return;
      if (typeof v === "number") {
        db.history[k] = { weight: v, reps: null, date: null };
      } else if (typeof v === "object") {
        db.history[k] = { weight: num(v.weight != null ? v.weight : v.w, 0), reps: v.reps != null ? num(v.reps, null) : null, date: v.date || v.at || null };
      }
    });
  }

  const rawP = raw.photos || raw.vault || raw.milestones || raw.progress || {};
  if (rawP && typeof rawP === "object") {
    Object.keys(rawP).forEach((k) => {
      const v = rawP[k];
      if (!v || typeof v !== "object") return;
      db.photos[k] = v;
    });
  }

  if (Array.isArray(raw.favorites)) db.favorites = raw.favorites.filter(isObj);
  if (Array.isArray(raw.weightLog)) {
    db.weightLog = raw.weightLog.filter((w) => isObj(w) && w.date).map((w) => Object.assign({}, w, { at: num(w.at, 0) }));
  }
  if (Array.isArray(raw.chats)) db.chats = raw.chats.filter((c) => isObj(c) && c.id);
  if (isObj(raw.tomb)) db.tomb = Object.assign({}, raw.tomb);
  if (isObj(raw.photoAt)) db.photoAt = Object.assign({}, raw.photoAt);

  // photos that predate timestamps get a tiny, identical stamp on every device
  Object.keys(db.photos).forEach((ms) => {
    const slots = db.photos[ms];
    if (!isObj(slots)) return;
    Object.keys(slots).forEach((pose) => {
      if (typeof slots[pose] === "string" && slots[pose] && db.photoAt[ms + "/" + pose] == null) db.photoAt[ms + "/" + pose] = 1;
    });
  });

  // keep unknown top-level fields written by newer/other builds
  Object.keys(raw).forEach((k) => {
    if (!KNOWN_TOP.has(k) && !LEGACY_TOP.has(k) && !(k in db)) db[k] = raw[k];
  });

  const idMap = { "calf": "calfA", "calfB": "calfB", "legcurl": "legcurlA", "legcurlB": "legcurlB", "walk": "walkA", "walkB": "walkB", "stretch": "stretchA", "stretchB": "stretchB" };
  if (db.history) {
    Object.keys(idMap).forEach((oldId) => {
      if (db.history[oldId]) {
        db.history[idMap[oldId]] = db.history[oldId];
        delete db.history[oldId];
      }
    });
  }
  db.version = 3;
  return db;
}

function normaliseMeals(arr) {
  if (!Array.isArray(arr)) return [];
  return arr.map((m) => ({
    id: m.id || uid(),
    name: String(m.name || m.title || "Meal").slice(0, 90),
    p: num(m.p != null ? m.p : m.protein, 0),
    cal: num(m.cal != null ? m.cal : (m.kcal != null ? m.kcal : m.calories), 0),
    breakdown: String(m.breakdown || m.notes || "").slice(0, 240),
    img: m.img || m.image || null,
    at: m.at || m.time || Date.now()
  }));
}

/* ------------------------------------------------------------------ merge */

function exDone(e) {
  return Array.isArray(e && e.sets) ? e.sets.filter(Boolean).length : 0;
}

function preferRemoteEx(l, r) {
  const dl = exDone(l), dr = exDone(r);
  if (dl === 0 && dr > 0) return true;      // a default/untouched entry never beats real work
  if (dr === 0 && dl > 0) return false;
  const ul = num(l.u, 0), ur = num(r.u, 0);
  if (ur !== ul) return ur > ul;
  return dr > dl;                           // legacy rule: more completed sets wins; tie keeps local
}

const wKey = (w) => w.date + "|" + num(w.at, 0) + "|" + num(w.weight, 0);
const fKey = (f) => String((f && f.name) || "").trim().toLowerCase();

function mergePhotoSlots(m, remotePhotos, remoteAt) {
  let changed = false;
  if (!isObj(remotePhotos)) return false;
  const rat = isObj(remoteAt) ? remoteAt : {};
  Object.keys(remotePhotos).forEach((ms) => {
    const slots = remotePhotos[ms];
    if (!isObj(slots)) return;
    Object.keys(slots).forEach((pose) => {
      const v = slots[pose];
      if (typeof v !== "string" || !v) return;
      const key = ms + "/" + pose;
      const lv = (m.photos[ms] || {})[pose];
      const lt = num(m.photoAt[key], lv ? 1 : 0);
      const rt = num(rat[key], 1);
      if (!lv || rt > lt) {
        m.photos[ms] = Object.assign({}, m.photos[ms], { [pose]: v });
        m.photoAt[key] = rt;
        changed = true;
      }
    });
  });
  return changed;
}

function cloneForMerge(local) {
  const m = Object.assign({}, local);
  m.logs = Object.assign({}, local.logs);
  m.workouts = Object.assign({}, local.workouts);
  m.history = Object.assign({}, local.history);
  m.photos = Object.assign({}, local.photos);
  m.photoAt = Object.assign({}, local.photoAt);
  m.tomb = Object.assign({}, local.tomb);
  m.favorites = (local.favorites || []).slice();
  m.weightLog = (local.weightLog || []).slice();
  m.chats = (local.chats || []).slice();
  return m;
}

// Pure: never mutates `local` or `remote`. Returns { db, changed }.
// changed === true means remote content was adopted (worth re-rendering).
export function mergeDBsEx(local, remote) {
  if (!isObj(remote) || Object.keys(remote).length === 0 || remote.__retired) return { db: local, changed: false };

  let changed = false;
  let touched = false;
  const m = cloneForMerge(local);
  const now = Date.now();

  // 1. tombstones (union, newest wins, old ones expire)
  const rt = isObj(remote.tomb) ? remote.tomb : {};
  Object.keys(rt).forEach((k) => {
    const t = num(rt[k], 0);
    if (t > num(m.tomb[k], 0)) { m.tomb[k] = t; touched = true; }
  });
  Object.keys(m.tomb).forEach((k) => {
    if (now - num(m.tomb[k], 0) > TOMB_TTL_MS) { delete m.tomb[k]; touched = true; }
  });

  // 2. nutrition logs, water, notes
  const rlogs = isObj(remote.logs) ? remote.logs : {};
  Object.keys(rlogs).forEach((date) => {
    const rl = rlogs[date];
    if (!isObj(rl)) return;
    const ll = m.logs[date];
    if (!isObj(ll)) {
      m.logs[date] = Object.assign({}, rl, { meals: Array.isArray(rl.meals) ? rl.meals.filter((x) => x && x.id) : [] });
      changed = true;
      return;
    }
    const out = Object.assign({}, ll);

    const byId = new Map();
    (ll.meals || []).forEach((x) => { if (x && x.id) byId.set(x.id, x); });
    let added = false;
    (Array.isArray(rl.meals) ? rl.meals : []).forEach((x) => {
      if (x && x.id && !byId.has(x.id)) { byId.set(x.id, x); added = true; }
    });
    if (added) { out.meals = Array.from(byId.values()); changed = true; }

    const lw = num(ll.waterAt, 0), rw = num(rl.waterAt, 0);
    if (rw > lw) {
      if (num(rl.water, 0) !== num(ll.water, 0)) changed = true;
      out.water = num(rl.water, 0); out.waterAt = rw;
    } else if (rw === lw) {
      const mx = Math.max(num(ll.water, 0), num(rl.water, 0));
      if (mx !== num(ll.water, 0)) { out.water = mx; changed = true; }
    }

    const ln = typeof ll.sessionNotes === "string" ? ll.sessionNotes : "";
    const rn = typeof rl.sessionNotes === "string" ? rl.sessionNotes : "";
    const lnt = num(ll.sessionNotesAt, 0), rnt = num(rl.sessionNotesAt, 0);
    if (rn !== ln && (rnt > lnt || (rnt === lnt && lnt === 0 && rn.length > 0))) {
      out.sessionNotes = rn; out.sessionNotesAt = rnt; changed = true;
    }
    m.logs[date] = out;
  });

  // 3. workouts (per-exercise, timestamp aware, null-safe)
  const rw = isObj(remote.workouts) ? remote.workouts : {};
  Object.keys(rw).forEach((sk) => {
    const rs = rw[sk];
    if (!isObj(rs)) return;
    const ls = m.workouts[sk];
    if (!isObj(ls)) { m.workouts[sk] = rs; changed = true; return; }
    const rex = isObj(rs.ex) ? rs.ex : {};
    const lex = isObj(ls.ex) ? ls.ex : {};
    const outEx = Object.assign({}, lex);
    let any = false;
    Object.keys(rex).forEach((id) => {
      const r = rex[id];
      if (!isObj(r)) return;
      const l = lex[id];
      if (!isObj(l) || preferRemoteEx(l, r)) { outEx[id] = r; any = true; }
    });
    if (any) { m.workouts[sk] = Object.assign({}, ls, { ex: outEx }); changed = true; }
  });

  // 4. personal bests (higher weight wins)
  const rh = isObj(remote.history) ? remote.history : {};
  Object.keys(rh).forEach((id) => {
    const r = rh[id];
    if (!isObj(r)) return;
    const l = m.history[id];
    if (!l || num(r.weight, 0) > num(l.weight, 0)) { m.history[id] = r; changed = true; }
  });

  // 5. body weight (union by date+time+value)
  const seenW = new Set(m.weightLog.filter(isObj).map(wKey));
  (Array.isArray(remote.weightLog) ? remote.weightLog : []).forEach((w) => {
    if (!isObj(w) || !w.date) return;
    const k = wKey(w);
    if (!seenW.has(k)) { m.weightLog.push(w); seenW.add(k); changed = true; }
  });
  m.weightLog.sort((a, b) => String(a.date).localeCompare(String(b.date)) || num(a.at, 0) - num(b.at, 0));

  // 6. favourites (union by name)
  const seenF = new Set(m.favorites.map(fKey));
  (Array.isArray(remote.favorites) ? remote.favorites : []).forEach((f) => {
    if (!isObj(f) || !fKey(f)) return;
    if (!seenF.has(fKey(f))) { m.favorites.push(f); seenF.add(fKey(f)); changed = true; }
  });

  // 7. photos still living inside an older cloud blob (newer builds keep them in a separate blob)
  if (mergePhotoSlots(m, remote.photos, remote.photoAt)) changed = true;

  // 8. chats (union by id, newest copy wins)
  const cidx = new Map();
  m.chats.forEach((c, i) => { if (c && c.id) cidx.set(c.id, i); });
  (Array.isArray(remote.chats) ? remote.chats : []).forEach((c) => {
    if (!isObj(c) || !c.id || m.tomb["c:" + c.id]) return;
    const i = cidx.get(c.id);
    if (i === undefined) { m.chats.push(c); cidx.set(c.id, m.chats.length - 1); changed = true; }
    else if (num(c.timestamp, 0) > num(m.chats[i].timestamp, 0)) { m.chats[i] = c; changed = true; }
  });

  // 9. apply deletions
  Object.keys(m.logs).forEach((date) => {
    const lg = m.logs[date];
    if (!isObj(lg) || !Array.isArray(lg.meals)) return;
    const kept = lg.meals.filter((x) => !(x && m.tomb["m:" + x.id]));
    if (kept.length !== lg.meals.length) { m.logs[date] = Object.assign({}, lg, { meals: kept }); changed = true; }
  });
  const keptChats = m.chats.filter((c) => !(c && m.tomb["c:" + c.id]));
  if (keptChats.length !== m.chats.length) { m.chats = keptChats; changed = true; }

  if (!changed && !touched) return { db: local, changed: false };
  return { db: m, changed };
}

// Legacy signature (returns just the merged DB).
export function mergeDBs(local, remote) {
  return mergeDBsEx(local, remote).db;
}

/* --------------------------------------------------------- cloud payloads */

export function photoRevOf(db) {
  let rev = 0;
  Object.keys(db.photos || {}).forEach((ms) => {
    const slots = db.photos[ms];
    if (!isObj(slots)) return;
    Object.keys(slots).forEach((pose) => {
      if (typeof slots[pose] === "string" && slots[pose]) rev = Math.max(rev, num((db.photoAt || {})[ms + "/" + pose], 1));
    });
  });
  return rev;
}

// Main cloud blob: no images at all (photos travel in a separate blob), no sync code.
export function getSyncPayload(db) {
  const logs = {};
  Object.keys(db.logs || {}).forEach((date) => {
    const log = db.logs[date];
    if (!isObj(log)) return;
    logs[date] = Array.isArray(log.meals) && log.meals.some((m) => m && m.img)
      ? Object.assign({}, log, { meals: log.meals.map((m) => { if (!m || !m.img) return m; const c = Object.assign({}, m); delete c.img; return c; }) })
      : log;
  });
  const settings = Object.assign({}, db.settings);
  delete settings.syncId;
  const payload = Object.assign({}, db, { logs, settings, photos: {} });
  payload.photoAt = {};
  payload.photoRev = (db.settings && db.settings.includePhotos === false) ? 0 : photoRevOf(db);
  return payload;
}

export function getPhotosPayload(db) {
  const photos = {};
  const photoAt = {};
  Object.keys(db.photos || {}).forEach((ms) => {
    const slots = db.photos[ms];
    if (!isObj(slots)) return;
    Object.keys(slots).forEach((pose) => {
      const v = slots[pose];
      if (typeof v !== "string" || !v) return;
      if (!photos[ms]) photos[ms] = {};
      photos[ms][pose] = v;
      photoAt[ms + "/" + pose] = num((db.photoAt || {})[ms + "/" + pose], 1);
    });
  });
  return { kind: "photos", logs: {}, photos, photoAt };
}

export function mergePhotoBlob(local, remote) {
  if (!isObj(remote) || !isObj(remote.photos)) return { db: local, changed: false };
  const m = cloneForMerge(local);
  const changed = mergePhotoSlots(m, remote.photos, remote.photoAt);
  return changed ? { db: m, changed: true } : { db: local, changed: false };
}

// true when this device has a photo the remote photo blob lacks or has an older copy of
export function photosAheadOf(db, remote) {
  const rp = isObj(remote && remote.photos) ? remote.photos : {};
  const rat = isObj(remote && remote.photoAt) ? remote.photoAt : {};
  const ms = Object.keys(db.photos || {});
  for (let i = 0; i < ms.length; i++) {
    const slots = db.photos[ms[i]];
    if (!isObj(slots)) continue;
    const poses = Object.keys(slots);
    for (let j = 0; j < poses.length; j++) {
      if (typeof slots[poses[j]] !== "string" || !slots[poses[j]]) continue;
      const key = ms[i] + "/" + poses[j];
      const has = isObj(rp[ms[i]]) && rp[ms[i]][poses[j]];
      if (!has) return true;
      if (num((db.photoAt || {})[key], 1) > num(rat[key], 1)) return true;
    }
  }
  return false;
}

/* -------------------------------------------------------------- clearDB */

export function clearDB() {
  return new Promise((resolve) => {
    memoryDB = blankDB();
    shadow = scan(memoryDB, null, 0, false);
    blobShadow = new Map();
    try { localStorage.removeItem(DB_KEY); } catch (e) { }
    if (dbInstance) {
      try {
        const tx = dbInstance.transaction([STORE_NAME, BLOB_STORE], "readwrite");
        tx.objectStore(STORE_NAME).clear();
        tx.objectStore(BLOB_STORE).clear();
        tx.oncomplete = () => resolve();
        tx.onerror = () => resolve();
        tx.onabort = () => resolve();
      } catch (e) { resolve(); }
    } else {
      resolve();
    }
  });
}