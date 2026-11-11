import { ymd, num, uid } from './utils.js';

const DB_NAME = "OperatorLogDB";
const STORE_NAME = "appData";
const DB_KEY = "operatorlog.db.v3";

let dbInstance = null;
export let memoryDB = null;

function openIDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = (e) => e.target.result.createObjectStore(STORE_NAME);
    req.onsuccess = (e) => resolve(e.target.result);
    req.onerror = (e) => reject(e.target.error);
  });
}

export async function initDB() {
  if (memoryDB) return memoryDB;
  try {
    dbInstance = await openIDB();
    if (navigator.storage && navigator.storage.persist) await navigator.storage.persist();

    const dataStr = await new Promise((resolve) => {
      const tx = dbInstance.transaction(STORE_NAME, "readonly");
      const req = tx.objectStore(STORE_NAME).get(DB_KEY);
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => resolve(null);
    });

    let parsedData = null;
    if (dataStr) {
      try { parsedData = JSON.parse(dataStr); } catch (e) { }
    }

    if (!parsedData) {
      const legacyStr = localStorage.getItem(DB_KEY);
      if (legacyStr) {
        try {
          memoryDB = migrate(JSON.parse(legacyStr));
          saveDB(memoryDB);
        } catch (e) { memoryDB = blankDB(); }
      } else {
        memoryDB = blankDB();
      }
    } else {
      memoryDB = migrate(parsedData);
    }
  } catch (err) {
    console.error("IndexedDB failed. Falling back.", err);
    const raw = localStorage.getItem(DB_KEY);
    memoryDB = raw ? migrate(JSON.parse(raw)) : blankDB();
  }
  return memoryDB;
}

export function getDB() {
  return memoryDB || blankDB();
}

export function saveDB(db) {
  memoryDB = db;
  try {
    if (dbInstance) {
      const tx = dbInstance.transaction(STORE_NAME, "readwrite");
      const req = tx.objectStore(STORE_NAME).put(JSON.stringify(db), DB_KEY);
      req.onerror = (e) => {
        console.error("IDB Save Error", e);
        localStorage.setItem(DB_KEY, JSON.stringify(db));
      };
    } else {
      localStorage.setItem(DB_KEY, JSON.stringify(db));
    }
    return true;
  } catch (e) {
    console.error("[OPLOG] save failed", e);
    return false;
  }
}

export function blankDB() {
  return {
    version: 3,
    created: Date.now(),
    settings: { proteinTarget: 105, operator: "OPERATOR", syncId: "", includePhotos: false },
    logs: {},
    workouts: {},
    history: {},
    photos: {},
    favorites: [],
    weightLog: [],
  };
}

export function migrate(raw) {
  const db = blankDB();
  if (!raw || typeof raw !== "object") return db;

  const s = raw.settings || raw.config || raw.prefs || {};
  db.settings.proteinTarget = num(s.proteinTarget != null ? s.proteinTarget : raw.proteinTarget, 105) || 105;
  db.settings.operator = s.operator || s.name || "OPERATOR";
  if (raw.proteinTarget && !s.proteinTarget) db.settings.proteinTarget = num(raw.proteinTarget, 105) || 105;

  const rawLogs = raw.logs || raw.nutrition || raw.meals || raw.food || raw.diary || {};
  if (Array.isArray(rawLogs)) {
    db.logs[ymd()] = { meals: normaliseMeals(rawLogs) };
  } else if (rawLogs && typeof rawLogs === "object") {
    Object.keys(rawLogs).forEach((k) => {
      const v = rawLogs[k];
      if (Array.isArray(v)) {
        db.logs[k] = { meals: normaliseMeals(v), water: 0 };
      } else if (v && typeof v === "object") {
        db.logs[k] = { meals: normaliseMeals(v.meals || v.items || []), water: v.water || 0 };
      }
    });
  }

  const rawW = raw.workouts || raw.sessions || raw.training || raw.exercises || {};
  if (rawW && typeof rawW === "object") {
    Object.keys(rawW).forEach((k) => {
      const v = rawW[k] || {};
      const ex = v.ex || v.exercises || v.data || {};
      db.workouts[k] = { ex: (ex && typeof ex === "object") ? ex : {} };
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
  if (Array.isArray(raw.favorites)) db.favorites = raw.favorites;
  if (Array.isArray(raw.weightLog)) db.weightLog = raw.weightLog;

  const idMap = { "calf": "calfA", "calfB": "calfB", "legcurl": "legcurlA", "legcurlB": "legcurlB", "walk": "walkA", "walkB": "walkB", "stretch": "stretchA", "stretchB": "stretchB" };
  if (db.history) {
    Object.keys(idMap).forEach(oldId => {
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

export function mergeDBs(local, remote) {
  if (!remote || Object.keys(remote).length === 0) return local;
  const merged = JSON.parse(JSON.stringify(local));

  Object.keys(remote.logs || {}).forEach(date => {
    if (!merged.logs[date]) {
      merged.logs[date] = remote.logs[date];
    } else {
      const localMeals = merged.logs[date].meals || [];
      const remoteMeals = remote.logs[date].meals || [];
      const mealMap = new Map();
      localMeals.forEach(m => mealMap.set(m.id, m));
      remoteMeals.forEach(m => mealMap.set(m.id, m));
      merged.logs[date].meals = Array.from(mealMap.values());
      merged.logs[date].water = Math.max(merged.logs[date].water || 0, remote.logs[date].water || 0);
    }
  });

  Object.keys(remote.workouts || {}).forEach(sessionKey => {
    if (!merged.workouts[sessionKey]) {
      merged.workouts[sessionKey] = remote.workouts[sessionKey];
    } else {
      const localEx = merged.workouts[sessionKey].ex || {};
      const remoteEx = remote.workouts[sessionKey].ex || {};
      Object.keys(remoteEx).forEach(exId => {
        if (!localEx[exId]) {
          localEx[exId] = remoteEx[exId];
        } else {
          const localDone = localEx[exId].sets.filter(Boolean).length;
          const remoteDone = remoteEx[exId].sets.filter(Boolean).length;
          if (remoteDone > localDone) localEx[exId] = remoteEx[exId];
        }
      });
      merged.workouts[sessionKey].ex = localEx;
    }
  });

  Object.keys(remote.history || {}).forEach(exId => {
    const localPR = merged.history[exId];
    const remotePR = remote.history[exId];
    if (!localPR || (remotePR && remotePR.weight > localPR.weight)) {
      merged.history[exId] = remotePR;
    }
  });

  if (remote.weightLog) {
    const weightMap = new Map();
    (merged.weightLog || []).forEach(w => weightMap.set(w.date, w));
    remote.weightLog.forEach(w => weightMap.set(w.date, w));
    merged.weightLog = Array.from(weightMap.values()).sort((a, b) => a.date.localeCompare(b.date));
  }

  Object.keys(remote.photos || {}).forEach(ms => {
    if (!merged.photos[ms]) merged.photos[ms] = {};
    Object.keys(remote.photos[ms]).forEach(pose => {
      if (remote.photos[ms][pose]) {
        merged.photos[ms][pose] = remote.photos[ms][pose];
      }
    });
  });

  return merged;
}
// Add this to the bottom of db.js:
export function clearDB() {
  return new Promise((resolve) => {
    memoryDB = blankDB();
    if (dbInstance) {
      const tx = dbInstance.transaction(STORE_NAME, "readwrite");
      const req = tx.objectStore(STORE_NAME).clear();
      req.onsuccess = () => resolve();
    } else {
      localStorage.removeItem(DB_KEY);
      resolve();
    }
  });
}