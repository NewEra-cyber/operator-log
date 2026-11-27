import { initDB, getDB, saveDB, mergeDBs, blankDB, migrate, clearDB } from './db.js';
import { $, $$, ymd, addDays, num, toast, compressImage, uid, pad2, esc } from './utils.js';
import { TRAINING, BLUEPRINTS, MEAL_PLAN, GROCERY_LIST, MILESTONES, POSES, formatPose, POSE_REFERENCES } from './data.js';
import { viewMission, viewRefuel, viewVault, viewBlueprint, viewSystem, getSession, getExState, scanResultHTML, dayProtein } from './view.js';

// === CHAT ENGINE ===
let currentChatId = null;
let chatHistory = [];
let chatImages = [];

function loadChatSidebar() {
  const db = getDB();
  const chatList = document.getElementById("chatList");
  const chats = db.chats || [];

  chats.sort((a, b) => b.timestamp - a.timestamp);

  if (chats.length === 0) {
    chatList.innerHTML = `<div class="dim small text-center mt-10">No past chats.</div>`;
    return;
  }

  chatList.innerHTML = chats.map(c => `
    <div style="padding: 12px; border-bottom: 1px solid #333; cursor: pointer; display: flex; justify-content: space-between; align-items: center;" 
         onclick="loadChat('${c.id}')">
      <div style="flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
        <div class="mono" style="font-size: 12px; color: #fff;">${esc(c.title)}</div>
        <div class="small color-muted" style="font-size: 10px;">${new Date(c.timestamp).toLocaleDateString()}</div>
      </div>
      <button onclick="deleteChat('${c.id}', event)" style="background: none; border: none; color: #ff4b4b; font-size: 16px; padding: 4px;">✕</button>
    </div>
  `).join("");
}

window.loadChat = function (id) {
  const db = getDB();
  const chat = (db.chats || []).find(c => c.id === id);
  if (!chat) return;

  currentChatId = chat.id;
  chatHistory = chat.messages;

  document.getElementById("currentChatTitle").textContent = chat.title.toUpperCase();
  document.getElementById("chatSidebar").style.transform = "translateX(-100%)";

  renderChatMessages();
}

window.deleteChat = function (id, event) {
  event.stopPropagation();
  if (!confirm("Delete this conversation?")) return;

  const db = getDB();
  db.chats = (db.chats || []).filter(c => c.id !== id);
  saveDB(db);

  if (currentChatId === id) {
    startNewChat();
  } else {
    loadChatSidebar();
  }
}

function renderChatMessages() {
  const historyDiv = document.getElementById("chatHistory");
  historyDiv.innerHTML = "";

  if (chatHistory.length === 0) {
    historyDiv.innerHTML = `<div class="dim small text-center mt-10">Ask the coach anything about your data.</div>`;
    return;
  }

  chatHistory.forEach(msg => {
    if (msg.role === "user") {
      historyDiv.innerHTML += `<div style="align-self: flex-end; background: var(--primary); color: #000; padding: 10px 16px; border-radius: 16px 16px 0 16px; max-width: 80%; font-weight: 600;">${esc(msg.content)}</div>`;
    } else {
      let formatted = msg.content
        .replace(/\*\*(.*?)\*\*/g, '<b>$1</b>')
        .replace(/\n/g, '<br>');
      historyDiv.innerHTML += `<div style="align-self: flex-start; background: #222; color: #fff; padding: 10px 16px; border-radius: 16px 16px 16px 0; max-width: 80%; line-height: 1.4;">${formatted}</div>`;
    }
  });

  historyDiv.scrollTop = historyDiv.scrollHeight;
}

function startNewChat() {
  currentChatId = null;
  chatHistory = [];
  document.getElementById("currentChatTitle").textContent = "NEW CONVERSATION";
  document.getElementById("chatSidebar").style.transform = "translateX(-100%)";
  renderChatMessages();
}

async function sendChatMessage() {
  const input = document.getElementById("chatInput");
  const text = input.value.trim();
  if (!text) return;

  const historyDiv = document.getElementById("chatHistory");
  const sendBtn = document.getElementById("chatSendBtn");

  // 1. Add user message to UI
  historyDiv.innerHTML += `<div style="align-self: flex-end; background: var(--primary); color: #000; padding: 10px 16px; border-radius: 16px 16px 0 16px; max-width: 80%; font-weight: 600;">${esc(text)}</div>`;
  input.value = "";
  historyDiv.scrollTop = historyDiv.scrollHeight;

  // 2. Add loading state
  const loadingId = "loading-" + Date.now();
  historyDiv.innerHTML += `<div id="${loadingId}" style="align-self: flex-start; background: #222; color: #fff; padding: 10px 16px; border-radius: 16px 16px 16px 0; max-width: 80%;"><span class="spinner"></span> Thinking...</div>`;
  historyDiv.scrollTop = historyDiv.scrollHeight;
  sendBtn.disabled = true;

  // 3. GATHER USER DATA
  const db = getDB();
  const todayKey = ymd();
  const day = getDay(state.dayKey);
  const session = getSession(db, day.key, todayKey);

  const meals = (db.logs[todayKey] && db.logs[todayKey].meals) || [];
  const workoutLog = [];

  day.exercises.forEach(ex => {
    const s = getExState(session, ex, db);
    if (s.sets.some(Boolean)) {
      workoutLog.push({ exercise: ex.name, weight: s.weight, reps: s.reps.filter((r, i) => s.sets[i]), rir: s.rir });
    }
  });

  const workoutTimeline = [];
  Object.keys(db.workouts).sort().forEach(k => {
    const parts = k.split("::");
    const dayKey = parts[0];
    const dateStr = parts[1] || k;

    const sess = db.workouts[k];
    if (sess.ex && Object.keys(sess.ex).length > 0) {
      const dayData = TRAINING.find(d => d.key === dayKey);
      const sessionName = dayData ? dayData.name : dayKey;
      const dateObj = new Date(dateStr + "T12:00:00");
      const dayOfWeek = dateObj.toLocaleDateString('en-US', { weekday: 'long' });

      const exercisesDone = [];
      Object.keys(sess.ex).forEach(exId => {
        const s = sess.ex[exId];
        const setsDone = s.sets ? s.sets.filter(Boolean).length : 0;
        if (setsDone > 0) {
          const exData = dayData?.exercises.find(e => e.id === exId);
          const exName = exData ? exData.name : exId;
          exercisesDone.push(`${exName} (${setsDone} sets @ ${s.weight}kg)`);
        }
      });

      if (exercisesDone.length > 0) {
        workoutTimeline.push(`[${dateStr} - ${dayOfWeek}] ${sessionName}: ${exercisesDone.join(", ")}`);
      }
    }
  });

  const photoInventory = {};
  Object.keys(db.photos).forEach(weekKey => {
    const weekPhotos = db.photos[weekKey];
    const posesAvailable = Object.keys(weekPhotos);
    if (posesAvailable.length > 0) {
      photoInventory[weekKey] = posesAvailable;
    }
  });

  const context = {
    date: todayKey,
    currentDayName: day.name,
    mealsLoggedToday: meals.map(m => `${m.name} (${m.p}g P, ${m.cal} kcal)`).join(", ") || "None",
    proteinTarget: db.settings.proteinTarget,
    currentSession: workoutLog,
    workoutHistory: workoutTimeline,
    personalRecords: db.history,
    currentWeight: db.weightLog && db.weightLog.length > 0 ? db.weightLog[db.weightLog.length - 1].weight : "Unknown",
    photoInventory: photoInventory
  };

  // 4. Send to API
  try {
    const recentHistory = chatHistory.slice(-6);

    const res = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        question: text,
        context: context,
        history: recentHistory,
        images: chatImages
      })
    });

    const data = await res.json();
    document.getElementById(loadingId).remove();

    if (data.tool_call) {
      const { weekA, weekB, pose } = data.args;
      const dbPhotos = getDB().photos;

      const imgA = (dbPhotos[weekA] || {})[pose];
      const imgB = (dbPhotos[weekB] || {})[pose];

      let requestedImages = [];
      if (imgA) requestedImages.push(imgA.split(",")[1]);
      if (imgB) requestedImages.push(imgB.split(",")[1]);

      if (requestedImages.length > 0) {
        const secondRes = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            question: text, // use original question
            context: context,
            history: chatHistory.slice(-6),
            images: requestedImages // Send the base64s
          })
        });
        const secondData = await secondRes.json();

        if (secondData.reply) {
          let formatted = secondData.reply.replace(/\*\*(.*?)\*\*/g, '<b>$1</b>').replace(/\n/g, '<br>');
          historyDiv.innerHTML += `<div style="align-self: flex-start; background: #222; color: #fff; padding: 10px 16px; border-radius: 16px 16px 16px 0; max-width: 80%; line-height: 1.4;">${formatted}</div>`;
          chatHistory.push({ role: "user", content: text });
          chatHistory.push({ role: "assistant", content: secondData.reply });
        } else {
          historyDiv.innerHTML += `<div style="color: red; align-self: flex-start;">Error: ${secondData.error || "AI Vision failed."}</div>`;
        }
      } else {
        historyDiv.innerHTML += `<div style="color: red; align-self: flex-start;">Error: Photos not found in DB.</div>`;
      }

    } else if (data.reply) {
      let formatted = data.reply.replace(/\*\*(.*?)\*\*/g, '<b>$1</b>').replace(/\n/g, '<br>');
      historyDiv.innerHTML += `<div style="align-self: flex-start; background: #222; color: #fff; padding: 10px 16px; border-radius: 16px 16px 16px 0; max-width: 80%; line-height: 1.4;">${formatted}</div>`;

      chatHistory.push({ role: "user", content: text });
      chatHistory.push({ role: "assistant", content: data.reply });

    } else {
      historyDiv.innerHTML += `<div style="color: red; align-self: flex-start;">Error: ${data.error || "AI failed to respond."}</div>`;
    }

    // SAVING LOGIC
    chatImages = [];
    document.getElementById("chatImagePreview").innerHTML = "";
    document.getElementById("chatImagePreview").style.display = "none";

    if (!currentChatId && chatHistory.length > 0) {
      currentChatId = uid();
      const title = text.substring(0, 30) + (text.length > 30 ? "..." : "");
      db.chats.push({
        id: currentChatId,
        title: title,
        timestamp: Date.now(),
        messages: chatHistory
      });
      document.getElementById("currentChatTitle").textContent = title.toUpperCase();
    } else if (currentChatId) {
      const chat = db.chats.find(c => c.id === currentChatId);
      if (chat) {
        chat.messages = chatHistory;
        chat.timestamp = Date.now();
      }
    }

    saveDB(db);
    triggerAutoSync();
    loadChatSidebar();

  } catch (err) {
    document.getElementById(loadingId).remove();
    historyDiv.innerHTML += `<div style="color: red; align-self: flex-start;">Network Error.</div>`;
  }

  sendBtn.disabled = false;
  historyDiv.scrollTop = historyDiv.scrollHeight;
}

// === AUDIO CONTEXT ===
let audioCtx = null;
function playTone(freq, duration, type = 'sine') {
  if (!audioCtx) {
    try { audioCtx = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { return; }
  }
  if (audioCtx.state === 'suspended') audioCtx.resume();
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
  gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);
  osc.connect(gain);
  gain.connect(audioCtx.destination);
  osc.start();
  osc.stop(audioCtx.currentTime + duration);
}

const state = {
  tab: "mission",
  refuelView: "log",
  planDay: "mon",
  dayKey: todayDayKey(),
  missionDate: ymd(),
  nutDate: ymd(),
  scan: { status: "idle" },
  photoTarget: null,
  vaultMilestone: null,
  cmpA: "w0",
  cmpB: "w8",
  cmpPose: "front_relaxed",
  bpKey: null,
  calTarget: null,
  calMonth: new Date().getMonth(),
  calYear: new Date().getFullYear(),
  swappedExercises: {}
};

// === AUTO-SYNC ENGINE ===
let syncTimeout = null;
function triggerAutoSync() {
  const db = getDB();
  const syncId = db.settings.syncId;
  if (!syncId) return;

  if (syncTimeout) clearTimeout(syncTimeout);

  syncTimeout = setTimeout(() => {
    const payloadData = JSON.parse(JSON.stringify(db));
    if (!payloadData.settings.includePhotos) payloadData.photos = {};

    fetch("/api/sync", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: syncId, data: payloadData })
    })
      .then(r => r.json())
      .then(res => {
        if (res.success) console.log("[Auto-Sync] Success");
      })
      .catch(err => console.error("[Auto-Sync] Failed", err));
  }, 3000);
}

// === CAMERA ENGINE ===
let videoStream = null;

async function startLiveCamera() {
  const video = document.getElementById("cameraStream");
  const ghostImg = document.getElementById("cameraGhostImg");
  const ghostSrc = state.photoTarget ? (POSE_REFERENCES[state.photoTarget.pose] || "") : "";

  if (ghostImg) {
    if (ghostSrc) { ghostImg.src = ghostSrc; ghostImg.style.display = "block"; }
    else { ghostImg.removeAttribute("src"); ghostImg.style.display = "none"; }
  }

  try {
    videoStream = await navigator.mediaDevices.getUserMedia({
      video: {
        facingMode: "environment",
        width: { ideal: 1920 },
        height: { ideal: 1080 }
      }
    });
    video.srcObject = videoStream;
    document.getElementById("cameraChoiceModal").classList.remove("open");
    document.getElementById("liveCameraModal").classList.add("open");
  } catch (err) {
    toast("CAMERA ACCESS DENIED OR UNAVAILABLE", "red");
  }
}

function stopLiveCamera() {
  if (videoStream) {
    videoStream.getTracks().forEach(track => track.stop());
    videoStream = null;
  }
  document.getElementById("liveCameraModal").classList.remove("open");
}

function captureLivePhoto() {
  const video = document.getElementById("cameraStream");
  if (!video || !video.videoWidth) {
    toast("CAMERA NOT READY YET", "red");
    return;
  }

  const canvas = document.createElement("canvas");
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;
  const ctx = canvas.getContext("2d");

  ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

  const dataUrl = canvas.toDataURL("image/jpeg", 0.92);

  const byteString = atob(dataUrl.split(',')[1]);
  const ab = new ArrayBuffer(byteString.length);
  const ia = new Uint8Array(ab);
  for (let i = 0; i < byteString.length; i++) {
    ia[i] = byteString.charCodeAt(i);
  }
  const blob = new Blob([ab], { type: "image/jpeg" });
  const file = new File([blob], "camera-capture.jpg", { type: "image/jpeg" });

  toast("CAPTURING HD...", "cyan");

  handlePhotoFile(file);
  stopLiveCamera();
}

function todayDayKey() {
  const map = { 1: "upperA", 2: "lowerA", 3: "recoveryA", 4: "upperB", 5: "lowerB", 6: "recoveryB", 0: "recoveryC" };
  return map[new Date().getDay()];
}

function getDay(key) {
  let day = TRAINING.filter((d) => d.key === key)[0] || TRAINING[0];
  if (Object.keys(state.swappedExercises).length > 0) {
    day = JSON.parse(JSON.stringify(day));
    day.exercises = day.exercises.map(ex => {
      const swapId = state.swappedExercises[ex.id];
      if (swapId && ex.alternates) {
        const alt = ex.alternates.find(a => a.id === swapId);
        if (alt) return { ...alt, sets: ex.sets, min: ex.min, max: ex.max, inc: ex.inc, rest: ex.rest, cues: ex.cues, alternates: ex.alternates };
      }
      return ex;
    });
  }
  return day;
}

function render() {
  const db = getDB();
  const view = document.getElementById("view");
  let html = "";

  if (state.tab === "mission") html = viewMission(db, state);
  else if (state.tab === "refuel") html = viewRefuel(db, state);
  else if (state.tab === "vault") html = viewVault(db, state);
  else if (state.tab === "blueprint") html = viewBlueprint(db, state);
  else html = viewSystem(db, state);

  view.innerHTML = html;

  $$("#tabs button").forEach((b) => b.classList.toggle("active", b.dataset.tab === state.tab));
  document.querySelectorAll('.progress-bar').forEach(el => el.style.width = el.dataset.pct + '%');
  document.querySelectorAll('.ring-fg').forEach(el => {
    el.style.strokeDasharray = el.dataset.circumference;
    el.style.strokeDashoffset = el.dataset.offset;
  });
}

let wakeLock = null;
async function requestWakeLock() {
  try { if ('wakeLock' in navigator) wakeLock = await navigator.wakeLock.request('screen'); } catch (err) { console.log(err); }
}
function releaseWakeLock() {
  if (wakeLock !== null) { wakeLock.release(); wakeLock = null; }
}

const rest = { endAt: 0, total: 0, handle: null };
let timerProgress, timerContainer;
const circumference = 2 * Math.PI * 90;

function startRest(seconds) {
  if (!seconds || seconds <= 0) return;
  if (!timerContainer) {
    timerContainer = document.getElementById("fullscreenTimer");
    timerProgress = document.getElementById("timerProgress");
  }
  requestWakeLock();
  rest.total = seconds;
  rest.endAt = Date.now() + seconds * 1000;
  timerContainer.classList.add("show");
  timerProgress.style.strokeDasharray = circumference;
  timerProgress.style.strokeDashoffset = 0;
  document.querySelectorAll('.rest-preset-btn').forEach(b => b.classList.toggle('on', Number(b.dataset.s) === seconds));
  playTone(440, 0.1, 'sine');
  tickRest();
  if (rest.handle) clearInterval(rest.handle);
  rest.handle = setInterval(tickRest, 100);
}

let lastPlayedSecond = null;

function tickRest() {
  const now = Date.now();
  const left = Math.max(0, Math.round((rest.endAt - now) / 1000));
  const m = Math.floor(left / 60);
  const s = left % 60;
  document.getElementById("fullscreenClock").textContent = m + ":" + pad2(s);

  if (left !== lastPlayedSecond) {
    if (left === 10) {
      playTone(880, 0.05, 'sine');
      setTimeout(() => playTone(880, 0.05, 'sine'), 150);
      setTimeout(() => playTone(880, 0.05, 'sine'), 300);
    }
    lastPlayedSecond = left;
  }

  const elapsed = rest.total - left;
  const percentage = elapsed / rest.total;

  if (timerProgress) {
    timerProgress.style.strokeDashoffset = -(circumference * percentage);

    if (percentage < 0.5) {
      timerProgress.style.stroke = "var(--red)";
      timerProgress.style.filter = "drop-shadow(0 0 12px var(--red))";
    } else if (percentage < 0.85) {
      timerProgress.style.stroke = "var(--orange)";
      timerProgress.style.filter = "drop-shadow(0 0 12px var(--orange))";
    } else {
      timerProgress.style.stroke = "var(--primary)";
      timerProgress.style.filter = "drop-shadow(0 0 15px var(--primary))";
    }
  }

  if (left <= 0) finishRest();
}

function finishRest() {
  if (rest.handle) { clearInterval(rest.handle); rest.handle = null; }
  releaseWakeLock();
  if (document.getElementById("fullscreenClock")) document.getElementById("fullscreenClock").textContent = "GO";
  if (timerProgress) timerProgress.style.strokeDashoffset = -circumference;
  playTone(150, 0.3, 'triangle');
  if (navigator.vibrate) { try { navigator.vibrate([220, 110, 220, 110, 320]); } catch (e) { } }
  setTimeout(() => { if (timerContainer) timerContainer.classList.remove("show"); }, 2500);
}

function stopRest() {
  if (rest.handle) { clearInterval(rest.handle); rest.handle = null; }
  releaseWakeLock();
  if (timerContainer) timerContainer.classList.remove("show");
}

function currentEx(exId) {
  const day = getDay(state.dayKey);
  return day.exercises.filter((e) => e.id === exId)[0];
}

function withSession(mutator) {
  const db = getDB();
  const day = getDay(state.dayKey);
  const session = getSession(db, day.key, state.missionDate, true);
  mutator(db, session, day);
  saveDB(db);
  triggerAutoSync();
  return { db, session, day };
}

function toggleSet(exId, i) {
  const day = getDay(state.dayKey);
  const ex = day.exercises.filter((e) => e.id === exId)[0];
  if (!ex) return;
  const db = getDB();
  const session = getSession(db, day.key, state.missionDate, true);
  const s = getExState(session, ex, db);

  const weightInput = document.querySelector(`input[data-ex="${exId}"][data-act="ex-weight"]`);
  if (weightInput && weightInput.value) {
    s.weight = num(weightInput.value, 0);
  }

  const wasOn = !!s.sets[i];
  s.sets[i] = !wasOn;

  if (!wasOn) {
    const best = db.history[exId];
    const allDone = s.sets.every(Boolean);

    if (allDone) {
      const w = num(s.weight, 0);
      const topReps = s.reps.map((r) => num(r, 0)).reduce((a, b) => Math.max(a, b), 0);
      if (w > 0 && (!best || w > best.weight)) {
        db.history[exId] = { weight: w, reps: topReps, date: ymd() };
        saveDB(db);
        triggerAutoSync();
        toast("NEW BEST LOGGED · " + ex.name.toUpperCase(), "green");

        if (navigator.vibrate) { try { navigator.vibrate([100, 50, 100, 50, 300, 100, 300]); } catch (e) { } }
        const card = document.getElementById(`card-${exId}`);
        if (card) {
          card.style.boxShadow = "0 0 30px var(--primary)";
          setTimeout(() => card.style.boxShadow = "", 1500);
        }

        render();
        if (!wasOn && ex.rest > 0) {
          const nextSetIndex = i + 1;
          let nextWeight = s.weight;
          let nextReps = ex.max;

          if (nextSetIndex < s.reps.length) {
            nextReps = s.reps[nextSetIndex];
          }

          const nextSetLabel = document.getElementById("nextSetInfo");
          if (nextSetLabel) {
            nextSetLabel.innerHTML = `<span class="mono color-muted" style="font-size: 12px;">NEXT SET:</span> <span class="mono color-white" style="font-size: 18px; font-weight: bold;">${nextWeight}KG × ${nextReps} REPS</span>`;
          }

          startRest(ex.rest);
        }
        startRest(ex.rest);
        return;
      }
    }

    const doneSets = s.sets.filter(Boolean).length;
    const isCompound = ["squat", "bench", "rdl", "ohp"].includes(ex.id);

    if (isCompound && s.rir === 0 && doneSets === 1) {
      toast("EARLY FAILURE: Drop load by 5kg for remaining sets.", "red");
    } else if (allDone && s.rir === 2 && s.reps.every(r => num(r, 0) >= ex.max)) {
      toast("CAPACITY DETECTED: Auto-increment staged for next session.", "cyan");
    }
  }

  saveDB(db);
  triggerAutoSync();
  render();
  if (!wasOn && ex.rest > 0) startRest(ex.rest);
}

function recalcScan() {
  const d = state.scan && state.scan.data;
  if (!d || !Array.isArray(d.items)) return;
  let totalP = 0, totalCal = 0;
  const names = [], parts = [];
  d.items.forEach(item => {
    const w = Number(item.weight_g) || 0;
    const p = (w / 100) * num(item.p100, 0);
    const c = (w / 100) * num(item.cal100, 0);
    item.p = Math.round(p * 10) / 10;
    item.cal = Math.round(c);
    totalP += p; totalCal += c;
    names.push(item.name);
    parts.push(`${w}g ${item.name}: ${item.p.toFixed(1)}g P, ${item.cal} kcal`);
  });
  d.name = names.join(" & ");
  d.p = Math.round(totalP * 10) / 10;
  d.cal = Math.round(totalCal);
  d.breakdown = parts.join(" | ");
}

async function handleFoodFile(file) {
  if (!file) return;
  state.scan = { status: "loading" };
  render();

  try {
    const dataUrl = await compressImage(file, 1200, 0.9);
    const base64 = dataUrl.split(",")[1];
    const thumbnail = await compressImage(file, 800, 0.8);

    const res = await fetch("/api/plate-vision", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ image: base64 })
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`Backend HTTP ${res.status}: ${errText}`);
    }

    const rawText = await res.text();

    let data;
    try {
      data = JSON.parse(rawText);
    } catch (parseError) {
      throw new Error("Backend returned invalid JSON. Check Cloudflare logs.");
    }

    if (data && data.error) {
      state.scan = { status: "error", message: data.error };
    } else if (!data || data.is_food !== true) {
      state.scan = { status: "reject", data: data || {} };
    } else {
      const hasItems = Array.isArray(data.items) && data.items.length > 0;
      state.scan = { status: hasItems ? "verify" : "ok", data: data, img: thumbnail };
    }

  } catch (err) {
    state.scan = { status: "error", message: err.message };
  }
  render();
}

function addMealToDB(name, p, cal, breakdown, img) {
  const db = getDB();
  const key = state.nutDate;
  if (!db.logs[key] || typeof db.logs[key] !== "object") db.logs[key] = { meals: [] };
  if (!Array.isArray(db.logs[key].meals)) db.logs[key].meals = [];
  db.logs[key].meals.push({
    id: uid(), name: String(name || "Meal").slice(0, 90), p: num(p, 0), cal: num(cal, 0), breakdown: String(breakdown || "").slice(0, 240), img: img || null, at: Date.now()
  });
  saveDB(db);
  triggerAutoSync();
  return db;
}

async function handlePhotoFile(file) {
  if (!file || !state.photoTarget) return;
  const target = state.photoTarget;
  state.photoTarget = null;
  try {
    const dataUrl = await compressImage(file, 1080, 0.85);
    const db = getDB();
    if (!db.photos[target.ms] || typeof db.photos[target.ms] !== "object") db.photos[target.ms] = {};
    db.photos[target.ms][target.pose] = dataUrl;
    if (saveDB(db)) toast("HD PHOTO SAVED · " + target.ms.toUpperCase() + " " + formatPose(target.pose), "green");
  } catch (e) {
    console.error(e);
    toast("IMAGE PROCESSING FAILED", "red");
  }
  document.getElementById("photoModal").classList.remove("open");
  render();
}

async function exportJSON() {
  const db = getDB();
  db.settings.lastBackup = Date.now();
  saveDB(db);
  triggerAutoSync();

  const exportData = JSON.parse(JSON.stringify(db));
  if (!exportData.settings.includePhotos) exportData.photos = {};

  const jsonString = JSON.stringify(exportData);

  try {
    const blob = new Blob([jsonString], { type: "application/json" });
    const compressedStream = blob.stream().pipeThrough(new CompressionStream("gzip"));
    const compressedBlob = await new Response(compressedStream).blob();

    const a = document.createElement("a");
    a.href = URL.createObjectURL(compressedBlob);
    a.download = "operator-log-backup-" + ymd() + ".json.gz";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(a.href), 4000);
    toast("COMPRESSED BACKUP EXPORTED", "cyan");
  } catch (err) {
    console.error("Compression failed", err);
    const blob = new Blob([jsonString], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "operator-log-backup-" + ymd() + ".json";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(a.href), 4000);
    toast("BACKUP EXPORTED (UNCOMPRESSED)", "cyan");
  }
}

function exportCSV() {
  const db = getDB();
  let csv = "Date,Exercise,Set,Weight (kg),Reps,RIR\n";

  Object.keys(db.workouts).forEach(k => {
    const dateStr = k.split("::")[1] || k;
    const session = db.workouts[k];
    if (session.ex) {
      Object.keys(session.ex).forEach(exId => {
        const s = session.ex[exId];
        if (s.sets) {
          s.sets.forEach((done, idx) => {
            if (done) {
              let exName = exId;
              TRAINING.forEach(d => {
                const found = d.exercises.find(e => e.id === exId);
                if (found) exName = found.name;
              });
              csv += `"${dateStr}","${exName}",${idx + 1},${s.weight},${s.reps[idx]},${s.rir}\n`;
            }
          });
        }
      });
    }
  });

  const blob = new Blob([csv], { type: "text/csv" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "operator-log-workouts-" + ymd() + ".csv";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(a.href), 4000);
  toast("CSV EXPORTED", "cyan");
}

async function importJSON(file) {
  if (!file) return;
  try {
    let text;
    if (file.name.endsWith(".gz")) {
      const stream = file.stream().pipeThrough(new DecompressionStream("gzip"));
      text = await new Response(stream).text();
    } else {
      text = await file.text();
    }

    const parsed = JSON.parse(text);
    if (!window.confirm("IMPORT WILL REPLACE ALL CURRENT DATA. CONTINUE?")) return;
    const db = migrate(parsed);
    if (saveDB(db)) {
      render();
      toast("DATA IMPORTED · v" + db.version, "green");
    }
  } catch (e) {
    console.error(e);
    toast("IMPORT FAILED — INVALID FILE", "red");
  }
}

const lb = { scale: 1, x: 0, y: 0, dragging: false, sx: 0, sy: 0, ox: 0, oy: 0, pointers: {}, pinchDist: 0 };

function applyLB() {
  const c = document.getElementById("lbContent");
  c.style.transform = `translate(${lb.x}px,${lb.y}px) scale(${lb.scale})`;
}

function openCalendar(target, currentDateStr) {
  state.calTarget = target;
  const d = new Date(currentDateStr + "T12:00:00");
  state.calMonth = d.getMonth();
  state.calYear = d.getFullYear();
  renderCalendar();
  document.getElementById("calendarModal").classList.add("open");
}

function renderCalendar() {
  const monthNames = ["JANUARY", "FEBRUARY", "MARCH", "APRIL", "MAY", "JUNE", "JULY", "AUGUST", "SEPTEMBER", "OCTOBER", "NOVEMBER", "DECEMBER"];
  document.getElementById("calMonthYear").textContent = monthNames[state.calMonth] + " " + state.calYear;

  const firstDay = new Date(state.calYear, state.calMonth, 1).getDay();
  const daysInMonth = new Date(state.calYear, state.calMonth + 1, 0).getDate();
  const startOffset = firstDay === 0 ? 6 : firstDay - 1;
  let html = "";

  for (let i = 0; i < startOffset; i++) html += '<div class="cal-day empty"></div>';

  const todayStr = ymd();
  const activeDateStr = state.calTarget === 'mission' ? state.missionDate : state.nutDate;
  const db = getDB();

  for (let i = 1; i <= daysInMonth; i++) {
    const dateStr = state.calYear + "-" + pad2(state.calMonth + 1) + "-" + pad2(i);
    const isToday = dateStr === todayStr;
    const isSelected = dateStr === activeDateStr;
    const hasMeal = db.logs[dateStr] && db.logs[dateStr].meals && db.logs[dateStr].meals.length > 0;
    const hasWorkout = Object.keys(db.workouts).some(k => k.includes("::" + dateStr) && db.workouts[k].ex && Object.keys(db.workouts[k].ex).length > 0);
    const hasLog = hasMeal || hasWorkout;

    let classes = "cal-day";
    if (isToday) classes += " today";
    if (isSelected) classes += " selected";
    if (hasLog) classes += " has-log";

    html += `<button class="${classes}" data-act="cal-pick" data-date="${dateStr}">${i}</button>`;
  }
  document.getElementById("calGrid").innerHTML = html;
}

function openHistory(exId) {
  const db = getDB();
  const day = getDay(state.dayKey);
  const ex = day.exercises.find(e => e.id === exId) || { name: "Unknown" };
  document.getElementById("histTitle").textContent = ex.name.toUpperCase() + " // HISTORY";

  let html = '<div style="display:flex; flex-direction:column; gap:8px;">';
  let found = false;

  Object.keys(db.workouts).sort().reverse().forEach(k => {
    const session = db.workouts[k];
    if (session.ex && session.ex[exId]) {
      const s = session.ex[exId];
      const dateStr = k.split("::")[1] || k;
      const doneSets = s.sets ? s.sets.filter(Boolean).length : 0;
      if (doneSets > 0) {
        found = true;
        const reps = s.reps ? s.reps.filter((r, i) => s.sets[i]).join(", ") : "?";
        html += `<div class="card" style="padding:10px; border-left:2px solid var(--cyan);">
          <div class="mono small color-muted mb-4">${dateStr}</div>
          <div class="mono color-white" style="font-size:14px;">${s.weight || 0} KG <span class="small color-muted">× ${reps} REPS</span></div>
        </div>`;
      }
    }
  });

  if (!found) html += '<div class="dim text-center" style="padding:20px;">NO PREVIOUS LOGS FOUND FOR THIS EXERCISE.</div>';
  html += '</div>';
  document.getElementById("histContent").innerHTML = html;
  document.getElementById("historyModal").classList.add("open");
}

function openLightbox(key) {
  const bp = BLUEPRINTS.find(b => b.key === key);
  if (!bp) return;
  state.bpKey = key;
  document.getElementById("lbTitle").textContent = bp.label.toUpperCase();

  let exercisesHTML = "";
  let dayKey = key;
  if (key === "weekend") dayKey = "recoveryB";
  if (key === "overview") {
    exercisesHTML = `<div class="lb-ex-list"><div class="dim text-center small">This is the complete weekly overview. Tap individual days in Mission to log.</div></div>`;
  } else {
    const dayData = TRAINING.find(d => d.key === dayKey);
    if (dayData) {
      exercisesHTML = `<div class="lb-ex-list">
        <div class="kicker mb-2">EXERCISES FOR THIS DAY</div>
        ${dayData.exercises.map(ex => `
          <div class="lb-ex-item">
            <div>
              <h4>${esc(ex.name)}</h4>
              <p>${ex.sets} sets × ${ex.min}-${ex.max} reps</p>
            </div>
            <button class="act-btn primary m-0" style="width:auto; padding:6px 12px; font-size:11px;" data-act="jump-to-workout" data-day="${dayKey}">LOG NOW</button>
          </div>
        `).join('')}
      </div>`;
    }
  }

  document.getElementById("lbContent").innerHTML = `
    <div style="display:flex; flex-direction:column; align-items:center; width:100%;">
      <img src="${bp.src}" alt="${esc(bp.label)}" style="max-height:60vh; object-fit:contain;" />
      ${exercisesHTML}
    </div>
  `;

  lb.scale = 1; lb.x = 0; lb.y = 0;
  applyLB();
  document.getElementById("lightbox").classList.add("open");
}

function closeLightbox() {
  document.getElementById("lightbox").classList.remove("open");
  state.bpKey = null;
}

document.addEventListener("click", function (ev) {
  const el = ev.target.closest("[data-act]");
  if (!el) return;
  const act = el.dataset.act;
  if (navigator.vibrate) navigator.vibrate(10);

  if (act === "close-camera-choice") { document.getElementById("cameraChoiceModal").classList.remove("open"); return; }
  if (act === "open-live-camera") { startLiveCamera(); return; }
  if (act === "close-live-camera") { stopLiveCamera(); return; }
  if (act === "capture-photo") { captureLivePhoto(); return; }
  if (act === "open-chat") {
    document.getElementById("chatModal").classList.add("open");
    loadChatSidebar();
    renderChatMessages();
    return;
  }
  if (act === "attach-chat-image") {
    document.getElementById("chatImageInput").click();
    return;
  }
  if (act === "close-chat") {
    document.getElementById("chatModal").classList.remove("open");
    return;
  }
  if (act === "toggle-sidebar") {
    const sidebar = document.getElementById("chatSidebar");
    const isOpen = sidebar.style.transform === "translateX(0px)";
    sidebar.style.transform = isOpen ? "translateX(-100%)" : "translateX(0px)";
    return;
  }
  if (act === "new-chat") {
    startNewChat();
    return;
  }
  if (act === "send-chat") {
    sendChatMessage();
    return;
  }

  if (act === "open-file-picker") {
    document.getElementById("cameraChoiceModal").classList.remove("open");
    const inp = document.getElementById("photoInput"); inp.value = ""; inp.click();
    return;
  }
  if (act === "jump-to-workout") {
    state.tab = "mission";
    state.dayKey = el.dataset.day;
    state.missionDate = ymd();
    closeLightbox();
    render();
    window.scrollTo({ top: 0, behavior: "instant" });
    return;
  }
  if (act === "edit-pill") {
    const idx = Number(el.dataset.idx);
    const item = state.scan.data.items[idx];
    const sheet = document.getElementById("ar-edit-sheet");

    sheet.innerHTML = `
      <div class="flex-between mb-4">
        <div class="kicker">EDIT ${esc(item.name).toUpperCase()}</div>
        <button data-act="close-edit-sheet" style="background:none; border:none; color:#fff; font-size:20px;">✕</button>
      </div>
      <div class="flex-row" style="gap: 12px; margin-bottom: 16px;">
        <input type="number" class="mono" data-act="edit-scanned-weight" data-idx="${idx}" value="${item.weight_g}" style="flex: 1; background: #000; border: 1px solid #444; color: #fff; padding: 12px; border-radius: 8px; font-size: 20px; font-weight: bold; text-align: center;" />
        <span class="mono" style="color: #888;">grams</span>
      </div>
      <button class="act-btn primary" data-act="close-edit-sheet">DONE</button>
    `;
    sheet.style.display = "block";
    return;
  }

  if (act === "close-edit-sheet") {
    document.getElementById("ar-edit-sheet").style.display = "none";
    render();
    return;
  }

  if (act === "remove-scanned-item") {
    const idx = Number(el.dataset.idx);
    if (state.scan && state.scan.data && Array.isArray(state.scan.data.items)) {
      state.scan.data.items.splice(idx, 1);
      if (state.scan.data.items.length === 0) state.scan = { status: "idle" };
      else recalcScan();
      render();
    }
    return;
  }

  if (act === "save-notes") {
    const text = document.getElementById("sessionNotesInput").value;
    const dateKey = el.dataset.date;
    const db = getDB();
    if (!db.logs[dateKey]) db.logs[dateKey] = { meals: [] };
    db.logs[dateKey].sessionNotes = text;
    saveDB(db);
    triggerAutoSync();
    render();
    toast("NOTES SAVED FOR " + dateKey, "green");
    return;
  }

  if (act === "prune-db") {
    if (!window.confirm("PRUNE STALE DATA? This deletes food photos older than 30 days and empty workout logs. Your core history and Vault photos are untouched.")) return;
    const db = getDB();
    let pruned = 0;

    const cutoff = addDays(ymd(), -30);
    Object.keys(db.logs).forEach(k => {
      if (k < cutoff) {
        db.logs[k].meals.forEach(m => {
          if (m.img) { m.img = null; pruned++; }
        });
      }
    });

    Object.keys(db.workouts).forEach(k => {
      const sess = db.workouts[k];
      if (!sess.ex || Object.keys(sess.ex).length === 0) {
        delete db.workouts[k];
        pruned++;
      }
    });

    saveDB(db);
    triggerAutoSync();
    render();
    toast("DB PRUNED · " + pruned + " ITEMS REMOVED", "cyan");
    return;
  }

  if (act === "open-warmup") {
    const weight = Number(el.dataset.weight);
    const content = document.getElementById("warmupContent");
    const bar = 0;
    const r1 = Math.round((weight * 0.5) / 2.5) * 2.5;
    const r2 = Math.round((weight * 0.7) / 2.5) * 2.5;
    const r3 = Math.round((weight * 0.85) / 2.5) * 2.5;

    content.innerHTML = `
      <div class="kicker mb-6">WARM-UP LADDER</div>
      <div class="warmup-row"><span class="warmup-label">Empty Bar</span><span class="warmup-val">${bar} kg × 10 reps</span></div>
      <div class="warmup-row"><span class="warmup-label">50% Working Load</span><span class="warmup-val">${r1} kg × 5 reps</span></div>
      <div class="warmup-row"><span class="warmup-label">70% Working Load</span><span class="warmup-val">${r2} kg × 3 reps</span></div>
      <div class="warmup-row"><span class="warmup-label">Primer (85%)</span><span class="warmup-val">${r3} kg × 1 rep</span></div>
      <div class="dim small mt-8 text-center">Do not log these. They are for neural priming only.</div>
    `;
    document.getElementById("warmupModal").classList.add("open");
    return;
  }
  if (act === "close-warmup") { document.getElementById("warmupModal").classList.remove("open"); return; }

  if (act === "swap-ex") {
    const exId = el.dataset.ex;
    const ex = currentEx(exId);
    const content = document.getElementById("swapContent");
    const buttons = ex.alternates.map(alt => `<button class="act-btn mb-8" data-act="do-swap" data-original="${exId}" data-swap="${alt.id}">${alt.name}</button>`).join("");
    content.innerHTML = `
      <div class="kicker mb-6">SELECT SUBSTITUTE</div>
      <div class="dim small mb-10">This swap only affects today's session. Your main program remains unchanged.</div>
      <button class="act-btn primary mb-8" data-act="do-swap" data-original="${exId}" data-swap="${exId}">Revert to Original (${ex.name})</button>
      ${buttons}
    `;
    document.getElementById("swapModal").classList.add("open");
    return;
  }
  if (act === "close-swap") { document.getElementById("swapModal").classList.remove("open"); return; }

  if (act === "do-swap") {
    const origId = el.dataset.original;
    const swapId = el.dataset.swap;
    if (origId === swapId) delete state.swappedExercises[origId];
    else state.swappedExercises[origId] = swapId;
    document.getElementById("swapModal").classList.remove("open");
    render();
    return;
  }

  if (act === "analyze-physique") {
    const mileA = document.getElementById("aiMileA").value;
    const mileB = document.getElementById("aiMileB").value;
    const pose = document.getElementById("aiPose").value;
    const db = getDB();
    const imgA = (db.photos[mileA] || {})[pose];
    const imgB = (db.photos[mileB] || {})[pose];
    if (!imgA || !imgB) { toast("MISSING PHOTOS FOR THIS COMPARISON", "red"); return; }

    const resultDiv = document.getElementById("aiAnalysisResult");
    resultDiv.style.display = "block";
    resultDiv.innerHTML = '<div class="mono color-cyan text-center"><span class="spinner"></span> ANALYZING MUSCLE PROGRESS...</div>';

    fetch("/api/analyze-physique", {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ image1: imgA.split(",")[1], image2: imgB.split(",")[1], pose })
    })
      .then(r => r.json())
      .then(data => {
        if (data.error) throw new Error(data.error);
        let html = `<div class="stat-title color-white mb-8" style="font-family:var(--head); font-size:12px;">${esc(data.overall)}</div>`;
        data.muscles.forEach(m => {
          let color = m.status === "Improved" ? "var(--green)" : (m.status === "Needs Work" ? "var(--red)" : "var(--muted)");
          html += `<div class="flex-between" style="border-bottom:1px dashed #1d2731; padding:6px 0;">
          <div><span class="small font-bold display-block" style="color:${color};">${m.group.toUpperCase()}</span>
          <span class="small color-muted">${esc(m.notes)}</span></div>
          <div class="mono" style="font-size:9px; color:${color};">${m.status.toUpperCase()}</div>
        </div>`;
        });
        resultDiv.innerHTML = html;
      })
      .catch(err => {
        console.error(err);
        resultDiv.innerHTML = `<div class="mono color-red small">FAILED TO ANALYZE:<br>${err.message}</div>`;
      });
    return;
  }

  if (act === "open-history") { openHistory(el.dataset.ex); return; }
  if (act === "close-history") { document.getElementById("historyModal").classList.remove("open"); return; }

  if (act === "open-calendar") { openCalendar(el.dataset.target, el.dataset.date); return; }
  if (act === "close-cal") { document.getElementById("calendarModal").classList.remove("open"); return; }
  if (act === "cal-prev") { state.calMonth--; if (state.calMonth < 0) { state.calMonth = 11; state.calYear--; } renderCalendar(); return; }
  if (act === "cal-next") { state.calMonth++; if (state.calMonth > 11) { state.calMonth = 0; state.calYear++; } renderCalendar(); return; }
  if (act === "cal-today") { const today = new Date(); state.calMonth = today.getMonth(); state.calYear = today.getFullYear(); renderCalendar(); return; }
  if (act === "cal-pick") {
    const dateStr = el.dataset.date;
    if (state.calTarget === 'mission') {
      state.missionDate = dateStr;
      const d = new Date(dateStr + "T12:00:00");
      const dayMap = { 1: "upperA", 2: "lowerA", 3: "recoveryA", 4: "upperB", 5: "lowerB", 6: "recoveryB", 0: "recoveryC" };
      state.dayKey = dayMap[d.getDay()];
    } else {
      state.nutDate = dateStr;
    }
    document.getElementById("calendarModal").classList.remove("open");
    render();
    return;
  }

  if (act === "add-water") {
    const count = Number(el.dataset.i);
    const db = getDB();
    if (!db.logs[state.nutDate]) db.logs[state.nutDate] = { meals: [] };
    const current = db.logs[state.nutDate].water || 0;
    db.logs[state.nutDate].water = (current === count) ? count - 1 : count;
    saveDB(db); triggerAutoSync(); render(); return;
  }
  if (act === "save-favorite") {
    const n = document.getElementById("mName");
    const p = document.getElementById("mP");
    const c = document.getElementById("mCal");
    if (!n || !n.value.trim()) { toast("ENTER A MEAL NAME FIRST", "red"); return; }
    const db = getDB();
    db.favorites.push({ name: n.value.trim(), p: num(p.value, 0), cal: num(c.value, 0) });
    saveDB(db); triggerAutoSync(); render(); toast("SAVED TO FAVORITES", "green"); return;
  }
  if (act === "save-weight") {
    const w = document.getElementById("weightInput");
    if (!w || !w.value) return;
    const db = getDB();
    if (!db.weightLog) db.weightLog = [];
    db.weightLog.push({ date: ymd(), weight: num(w.value, 0) });
    saveDB(db); triggerAutoSync(); render(); toast("WEIGHT LOGGED", "green"); return;
  }

  if (act === "save-sync") {
    const v = document.getElementById("syncIdInput").value.trim();
    if (!v) { toast("ENTER A SYNC CODE", "red"); return; }
    const db = getDB(); db.settings.syncId = v; saveDB(db); render(); toast("SYNC CODE SAVED", "green"); return;
  }
  if (act === "sync-push") {
    const db = getDB();
    const syncId = db.settings.syncId;
    if (!syncId) { toast("SAVE A SYNC CODE FIRST", "red"); return; }
    const statusEl = document.getElementById("syncStatus");
    statusEl.textContent = "STATUS: PUSHING TO CLOUD...";

    const payloadData = JSON.parse(JSON.stringify(db));
    if (!payloadData.settings.includePhotos) payloadData.photos = {};

    fetch("/api/sync", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: syncId, data: payloadData }) })
      .then(r => r.json()).then(res => {
        if (res.success) { statusEl.textContent = "STATUS: SYNCED AT " + new Date().toLocaleTimeString(); toast("DATA PUSHED TO CLOUD", "green"); }
        else throw new Error("Failed");
      }).catch(() => { statusEl.textContent = "STATUS: PUSH FAILED"; toast("PUSH FAILED", "red"); });
    return;
  }
  if (act === "sync-pull") {
    const db = getDB();
    const syncId = db.settings.syncId;
    if (!syncId) { toast("SAVE A SYNC CODE FIRST", "red"); return; }
    const statusEl = document.getElementById("syncStatus");
    statusEl.textContent = "STATUS: PULLING FROM CLOUD...";
    fetch("/api/sync?id=" + encodeURIComponent(syncId))
      .then(r => r.json()).then(remoteData => {
        if (Object.keys(remoteData).length === 0) { toast("NO CLOUD DATA FOUND FOR THIS CODE", "red"); statusEl.textContent = "STATUS: NO CLOUD DATA FOUND"; return; }
        const mergedDB = mergeDBs(db, remoteData);
        saveDB(mergedDB); render(); toast("DATA PULLED & MERGED", "green");
      }).catch(() => { statusEl.textContent = "STATUS: PULL FAILED"; toast("PULL FAILED", "red"); });
    return;
  }

  if (act === "open-legal") {
    const type = el.dataset.type;
    const titleEl = document.getElementById("legalTitle");
    const contentEl = document.getElementById("legalContent");
    if (type === "privacy") {
      titleEl.textContent = "PRIVACY POLICY";
      contentEl.innerHTML = `
        <h4>1. DATA COLLECTION</h4>
        <p>OPERATOR LOG is an offline-first application. Your workout logs, nutrition data, and progress photos are stored locally on your device (IndexedDB). If you utilize the Cloud Sync feature, your encrypted data is stored in Cloudflare KV, accessible only by your unique Sync Code.</p>
        <h4>2. AI VISION SCANNER</h4>
        <p>When you use the AI Plate Scanner or Text Logger, images or text are securely transmitted to our API endpoint which forwards it to Groq. Images are analyzed for macronutrients and are not permanently stored on our servers.</p>
        <h4>3. DATA SHARING</h4>
        <p>We do not sell, rent, or share your personal data, meal photos, or physique images with any third parties.</p>
        <h4>4. DATA DELETION</h4>
        <p>You have full control over your data. You can delete individual logs, or use the "Purge All Local Data" button in the System tab to instantly wipe the local database and disconnect from the cloud.</p>
      `;
    } else {
      titleEl.textContent = "TERMS & DISCLAIMER";
      contentEl.innerHTML = `
        <div class="danger-text">1. HEALTH & MEDICAL DISCLAIMER</div>
        <p class="white-text">The information and training programs provided by OPERATOR LOG are for educational and informational purposes only. They are not a substitute for professional medical advice, diagnosis, or treatment. Always consult a physician before starting any new exercise program or making dietary changes. You assume full responsibility for any injuries or health complications that may occur.</p>
        <h4>2. AI ESTIMATION ACCURACY</h4>
        <p>The macronutrient values provided by the AI Vision and Text scanners are estimates. Do not rely on them for strict medical or competitive purposes. We are not liable for discrepancies in calorie or protein tracking.</p>
        <h4>3. USE AT YOUR OWN RISK</h4>
        <p>This application is provided "as is" without warranty of any kind. By using this app, you agree that the creators are not responsible for any data loss, injuries, or damages incurred through its use.</p>
      `;
    }
    document.getElementById("legalModal").classList.add("open");
    return;
  }
  if (act === "close-legal") { document.getElementById("legalModal").classList.remove("open"); return; }

  if (act === "open-injury") {
    const content = document.getElementById("injuryContent");
    content.innerHTML = `
      <div class="kicker mb-6">SELECT AFFECTED AREA</div>
      <div class="injury-option" data-act="apply-injury" data-type="shoulder">
        <h4>Shoulder</h4>
        <p>Swaps OHP to DB Press, drops Bench load by 15%.</p>
      </div>
      <div class="injury-option" data-act="apply-injury" data-type="lower_back">
        <h4>Lower Back</h4>
        <p>Swaps Barbell RDL to Lying Hamstring Curls.</p>
      </div>
      <div class="injury-option" data-act="apply-injury" data-type="knee">
        <h4>Knee</h4>
        <p>Swaps Back Squat to Goblet Squats, drops Leg Press load by 20%.</p>
      </div>
    `;
    document.getElementById("injuryModal").classList.add("open");
    return;
  }
  if (act === "close-injury") { document.getElementById("injuryModal").classList.remove("open"); return; }

  if (act === "apply-injury") {
    const type = el.dataset.type;
    if (type === "shoulder") {
      state.swappedExercises["ohp"] = "db_ohp";
      state.swappedExercises["bench"] = "db_bench";
      toast("SHOULDER PROTOCOL ACTIVE: OHP swapped, Bench adjusted.", "cyan");
    } else if (type === "lower_back") {
      state.swappedExercises["rdl"] = "db_rdl";
      toast("LOWER BACK PROTOCOL ACTIVE: RDL swapped.", "cyan");
    } else if (type === "knee") {
      state.swappedExercises["squat"] = "goblet_squat";
      toast("KNEE PROTOCOL ACTIVE: Squat swapped.", "cyan");
    }
    document.getElementById("injuryModal").classList.remove("open");
    render();
    return;
  }

  if (act === "run-synthesis") {
    const btn = document.getElementById("synthesisBtn");
    const resultDiv = document.getElementById("synthesisResult");
    btn.disabled = true;
    btn.innerHTML = '<span class="spinner"></span> SYNTHESIZING...';
    resultDiv.style.display = "block";
    resultDiv.innerHTML = '<div class="mono color-cyan text-center">Analyzing 7-day window...</div>';

    const db = getDB();
    let tonnage = 0;
    let proteinHits = 0;
    let waterTotal = 0;

    for (let i = 0; i < 7; i++) {
      const dk = addDays(ymd(), -i);
      if (dayProtein(db, dk) >= (db.settings.proteinTarget || 105)) proteinHits++;
      waterTotal += (db.logs[dk]?.water || 0);

      Object.keys(db.workouts).forEach(k => {
        if (k.includes(dk)) {
          const sess = db.workouts[k];
          if (sess.ex) {
            Object.values(sess.ex).forEach(ex => {
              if (ex.sets) ex.sets.forEach((done, idx) => {
                if (done) tonnage += (num(ex.weight, 0) * num(ex.reps[idx], 0));
              });
            });
          }
        }
      });
    }

    const weekData = {
      totalTonnage: Math.round(tonnage),
      proteinDaysHit: proteinHits,
      avgWaterLiters: ((waterTotal * 0.5) / 7).toFixed(1),
      weightDelta: db.weightLog.length > 1 ? (db.weightLog[db.weightLog.length - 1].weight - db.weightLog[db.weightLog.length - 2].weight).toFixed(1) : 0
    };

    fetch("/api/weekly-synthesis", {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ weekData })
    })
      .then(r => r.json())
      .then(data => {
        if (data.error) throw new Error(data.error);
        const formatted = data.advice.replace(/\*\*(.*?)\*\*/g, '<span class="coach-highlight">$1</span>');
        resultDiv.innerHTML = `<div class="synthesis-text">${formatted}</div>`;
      })
      .catch(() => { resultDiv.innerHTML = '<div class="color-red small">Failed to synthesize. Check API key.</div>'; })
      .finally(() => {
        btn.disabled = false;
        btn.innerHTML = '🧠 RUN AI DEBRIEF';
      });
    return;
  }

  if (act === "tab") { state.tab = el.dataset.tab; render(); window.scrollTo({ top: 0, behavior: "instant" in window ? "instant" : "auto" }); return; }
  if (act === "pick-day") { state.dayKey = el.dataset.key; render(); return; }
  if (act === "toggle-set") { toggleSet(el.dataset.ex, Number(el.dataset.i)); return; }
  if (act === "repeat-set") {
    const exId = el.dataset.ex;
    const i = Number(el.dataset.i);

    if (i > 0) {
      withSession(function (db, session) {
        const ex = currentEx(exId);
        const s = getExState(session, ex, db);
        s.reps[i] = s.reps[i - 1];
      });
      render();
    }
    return;
  }
  if (act === "set-rir") {
    const exId = el.dataset.ex;
    withSession(function (db, session) {
      const ex = currentEx(exId);
      const s = getExState(session, ex, db);
      s.rir = Number(el.dataset.v);
    });
    render();
    return;
  }
  if (act === "rest-preset") { startRest(Number(el.dataset.s)); return; }
  if (act === "rest-skip") { stopRest(); return; }

  if (act === "nut-prev") { state.nutDate = addDays(state.nutDate, -1); render(); return; }
  if (act === "nut-next") { state.nutDate = addDays(state.nutDate, 1); render(); return; }
  if (act === "quick-add") {
    addMealToDB(el.dataset.name, el.dataset.p, el.dataset.cal, "Quick staple entry.");
    render();
    toast("LOGGED · " + el.dataset.name.toUpperCase(), "green");
    return;
  }
  if (act === "del-meal") {
    const id = el.dataset.id;
    const db = getDB();
    const log = db.logs[state.nutDate];
    if (log && Array.isArray(log.meals)) {
      log.meals = log.meals.filter((m) => m.id !== id);
      saveDB(db);
      triggerAutoSync();
    }
    render();
    return;
  }
  if (act === "manual-add") {
    const n = document.getElementById("mName");
    const p = document.getElementById("mP");
    const c = document.getElementById("mCal");
    if (!n || !n.value.trim()) { toast("ENTER A MEAL NAME", "red"); return; }
    addMealToDB(n.value.trim(), p ? p.value : 0, c ? c.value : 0, "Manual entry.");
    render();
    toast("MEAL ADDED", "green");
    return;
  }
  if (act === "scan") { const inp = document.getElementById("foodInput"); inp.value = ""; inp.click(); return; }
  if (act === "ai-text-log") {
    const input = document.getElementById("aiTextInput");
    const text = input ? input.value.trim() : "";
    if (!text) { toast("TYPE A MEAL FIRST", "red"); return; }

    const btn = el;
    const originalText = btn.textContent;

    btn.textContent = "...";
    btn.disabled = true;

    fetch("/api/text-macros", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text })
    })
      .then(async (r) => {
        if (!r.ok) {
          const errText = await r.text();
          throw new Error(`HTTP ${r.status}: ${errText}`);
        }
        return r.json();
      })
      .then(data => {
        if (data && data.p > 0) {
          addMealToDB(data.name, data.p, data.cal, data.breakdown || "");
          if (input) input.value = "";
          render();
          toast("LOGGED VIA AI", "green");
        } else {
          toast("AI couldn't find food macros", "red");
        }
      })
      .catch((err) => {
        console.error("Text AI Error:", err);
        toast("AI ERROR - CHECK CONSOLE", "red");
      })
      .finally(() => {
        btn.textContent = originalText;
        btn.disabled = false;
      });

    return;
  }
  if (act === "scan-clear") {
    state.scan = { status: "idle" };
    document.body.classList.remove("scanning-active");
    render();
    return;
  }
  if (act === "scan-confirm") {
    const d = state.scan.data || {};
    const img = state.scan.img || null;
    addMealToDB(d.name || "Scanned Meal", d.p, d.cal, d.breakdown || "", img);
    state.scan = { status: "idle" };
    document.body.classList.remove("scanning-active");
    render();
    toast("MEAL LOGGED · +" + num(d.p, 0) + "G PROTEIN", "green");
    return;
  }
  if (act === "ask-coach") {
    const db = getDB();
    const day = getDay(state.dayKey);
    const session = getSession(db, day.key, state.missionDate);

    const sessionNotes = db.logs[state.missionDate]?.sessionNotes || "";

    let hasData = false;
    const workoutLog = [];

    day.exercises.forEach(ex => {
      const s = getExState(session, ex, db);
      const doneSets = s.sets.filter(Boolean).length;
      if (doneSets > 0) {
        hasData = true;
        const repsDone = s.reps.filter((r, i) => s.sets[i]);
        workoutLog.push({
          exercise: ex.name, weight: s.weight, setsCompleted: doneSets, repsPerSet: repsDone, rir: s.rir
        });
      }
    });

    if (!hasData) { toast("LOG AT LEAST ONE SET BEFORE ASKING THE COACH", "red"); return; }

    const btn = document.getElementById("askCoachBtn");
    const resultDiv = document.getElementById("coachResult");
    btn.disabled = true;
    btn.innerHTML = '<span class="spinner"></span> ANALYZING...';
    resultDiv.style.display = "block";
    resultDiv.innerHTML = '<div class="mono color-cyan text-center">Consulting the AI Coach...</div>';

    fetch("/api/mission-coach", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        workoutData: {
          day: day.name,
          date: state.missionDate,
          exercises: workoutLog,
          sessionNotes: sessionNotes
        }
      })
    })
      .then(r => r.json())
      .then(data => {
        let formattedAdvice = data.advice.replace(/\*\*(.*?)\*\*/g, '<span class="coach-highlight">$1</span>').replace(/\n/g, '<br>');
        const color = formattedAdvice.includes("ERROR") || formattedAdvice.includes("Error") ? "var(--red)" : "var(--txt)";
        resultDiv.innerHTML = `<div class="coach-text" style="color: ${color};">${formattedAdvice}</div>`;
      })
      .catch((err) => {
        console.error(err);
        resultDiv.innerHTML = '<div class="mono color-red small">FAILED TO CONNECT TO COACH. CHECK CONSOLE.</div>';
      })
      .finally(() => {
        btn.disabled = false;
        btn.innerHTML = '<svg viewBox="0 0 24 24"><path d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2zm0 18a8 8 0 1 1 8-8 8 8 0 0 1-8 8z"/><path d="M12 6a1 1 0 0 0-1 1v5a1 1 0 0 0 .293.707l3 3a1 1 0 0 0 1.414-1.414L13 11.586V7a1 1 0 0 0-1-1z"/></svg> ANALYZE PERFORMANCE';
      });
    return;
  }

  if (act === "toggle-vault") {
    const key = el.dataset.key;
    state.vaultMilestone = (state.vaultMilestone === key) ? null : key;
    render();
    return;
  }
  if (act === "apply-overload") {
    const exId = el.dataset.ex;
    const target = Number(el.dataset.target);
    const db = getDB();
    const day = getDay(state.dayKey);
    const session = getSession(db, day.key, state.missionDate, true);
    const ex = currentEx(exId);
    const s = getExState(session, ex, db);

    s.weight = target;
    s.sets = s.sets.map(() => false);
    s.reps = s.reps.map(() => ex.max);

    saveDB(db);
    render();
    toast("WEIGHT INCREASED TO " + target + "KG", "green");
    return;
  }
  if (act === "open-photo-modal") {
    const ms = el.dataset.ms;
    const pose = el.dataset.pose;
    state.photoTarget = { ms, pose };

    const ghostSrc = POSE_REFERENCES[pose] || "";
    const ghostImg = document.getElementById("ghostImg");
    if (ghostImg) {
      if (ghostSrc) { ghostImg.src = ghostSrc; ghostImg.style.display = "block"; }
      else { ghostImg.removeAttribute("src"); ghostImg.style.display = "none"; }
    }

    document.getElementById("photoModalTitle").textContent = `ALIGNMENT: ${ms.toUpperCase()} ${formatPose(pose)}`;

    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      document.getElementById("cameraChoiceModal").classList.add("open");
    } else {
      const inp = document.getElementById("photoInput"); inp.value = ""; inp.click();
    }
    return;
  }
  if (act === "close-photo-modal") { document.getElementById("photoModal").classList.remove("open"); return; }
  if (act === "trigger-photo-upload") { const inp = document.getElementById("photoInput"); inp.value = ""; inp.click(); return; }

  if (act === "open-bp") { openLightbox(el.dataset.key); return; }
  if (act === "lb-close") { closeLightbox(); return; }
  if (act === "lb-in") { lb.scale = Math.min(4, lb.scale * 1.25); applyLB(); return; }
  if (act === "lb-out") { lb.scale = Math.max(0.5, lb.scale / 1.25); applyLB(); return; }
  if (act === "lb-reset") { lb.scale = 1; lb.x = 0; lb.y = 0; applyLB(); return; }

  if (act === "save-target") {
    const v = document.getElementById("targetInput");
    const db = getDB();
    db.settings.proteinTarget = Math.max(20, Math.min(400, num(v.value, 105)));
    saveDB(db); render(); toast("TARGET UPDATED · " + db.settings.proteinTarget + "G", "green"); return;
  }
  if (act === "export") { exportJSON(); return; }
  if (act === "export-csv") { exportCSV(); return; }
  if (act === "import") { const inp = document.getElementById("importInput"); inp.value = ""; inp.click(); return; }

  if (act === "reset") {
    if (!window.confirm("PURGE ALL LOCAL DATA? This cannot be undone. Export a backup first.")) return;
    clearDB().then(() => window.location.reload());
    return;
  }

  if (act === "toggle-photo-sync") {
    const db = getDB();
    db.settings.includePhotos = !db.settings.includePhotos;
    saveDB(db); render();
    toast(db.settings.includePhotos ? "PHOTOS INCLUDED" : "PHOTOS EXCLUDED", "cyan");
    return;
  }

  if (act === "open-grocery") {
    const content = document.getElementById("groceryContent");
    const items = GROCERY_LIST.map((item, idx) => `
      <div class="grocery-item">
        <div>
          <div style="font-weight:600; color:#fff; font-size:14px;">${item.name}</div>
          <div class="mono small color-muted">${item.qty}</div>
        </div>
        <button class="grocery-check" data-idx="${idx}">✓</button>
      </div>
    `).join("");
    content.innerHTML = `
      <div class="kicker mb-6">MARKET PROCUREMENT</div>
      <div class="dim small mb-8">Tap to mark items off your list.</div>
      ${items}
    `;
    document.getElementById("groceryModal").classList.add("open");
    return;
  }
  if (act === "close-grocery") { document.getElementById("groceryModal").classList.remove("open"); return; }
  if (el.classList.contains("grocery-check")) { el.classList.toggle("checked"); return; }

  if (act === "request-notifications") {
    if (!("Notification" in window)) { toast("Notifications not supported", "red"); return; }
    Notification.requestPermission().then(perm => {
      if (perm === "granted") { toast("NOTIFICATIONS ENABLED", "green"); schedulePrepReminder(); }
      else { toast("NOTIFICATIONS DENIED", "red"); }
    });
    return;
  }
  if (act === "refuel-toggle") { state.refuelView = el.dataset.view; render(); return; }
  if (act === "plan-day") { state.planDay = el.dataset.key; render(); return; }
});

document.addEventListener("input", function (ev) {
  const el = ev.target.closest("[data-act]");
  if (!el) return;
  const act = el.dataset.act;

  if (el.id === "sessionNotesInput") {
    const dateKey = el.dataset.date;
    const db = getDB();
    if (!db.logs[dateKey]) db.logs[dateKey] = { meals: [] };
    db.logs[dateKey].sessionNotes = el.value;
    saveDB(db);
    triggerAutoSync();

    const card = el.closest('.card');
    if (card && el.value.trim().length > 0) {
      card.style.borderLeft = "3px solid var(--green)";
      const savedBadge = card.querySelector('.color-green');
      if (!savedBadge) {
        const kickerDiv = card.querySelector('.flex-between');
        if (kickerDiv) kickerDiv.innerHTML += '<span class="mono small color-green">✓ SAVED</span>';
      }
    }
    return;
  }

  if (act === "ex-reps") {
    const exId = el.dataset.ex;
    const idx = Number(el.dataset.i);
    const db = getDB();
    const day = getDay(state.dayKey);
    const ex = day.exercises.filter((e) => e.id === exId)[0];
    if (!ex) return;
    const session = getSession(db, day.key, state.missionDate, true);
    const s = getExState(session, ex, db);
    const val = num(el.value, 0);
    s.reps[idx] = val;
    saveDB(db);
    triggerAutoSync();

    const lastReps = Number(el.dataset.last);
    const lastWeight = Number(el.dataset.lastWeight);
    const currentWeight = num(s.weight, 0);
    const deltaEl = document.getElementById(`delta-${exId}-${idx}`);

    if (deltaEl) {
      if (lastReps > 0) {
        if (val > lastReps) deltaEl.innerHTML = `<span class="delta-badge">+${val - lastReps} REP</span>`;
        else if (val === lastReps && currentWeight > lastWeight) deltaEl.innerHTML = `<span class="delta-badge">+${currentWeight - lastWeight} KG</span>`;
        else deltaEl.innerHTML = "";
      }
    }
    return;
  }

  if (act === "ex-weight") {
    const exId = el.dataset.ex;
    const db = getDB();
    const day = getDay(state.dayKey);
    const ex = day.exercises.filter((e) => e.id === exId)[0];
    if (!ex) return;
    const session = getSession(db, day.key, state.missionDate, true);
    const s = getExState(session, ex, db);
    s.weight = num(el.value, 0);
    saveDB(db);
    triggerAutoSync();
    return;
  }

  if (act === "edit-scanned-weight") {
    const idx = Number(el.dataset.idx);
    if (state.scan && state.scan.data && state.scan.data.items && state.scan.data.items[idx]) {
      state.scan.data.items[idx].weight_g = Number(el.value) || 0;
      recalcScan();
      const it = state.scan.data.items[idx];
      const lineDiv = document.querySelector('[data-item-macros="' + idx + '"]');
      if (lineDiv) lineDiv.textContent = num(it.p, 0) + "g P · " + num(it.cal, 0) + " kcal";
      const totalDiv = document.getElementById("scan-total-display");
      if (totalDiv) totalDiv.innerHTML = `${state.scan.data.p}g P &nbsp; ${state.scan.data.cal} KCAL`;
    }
    return;
  }
});

document.addEventListener("change", function (ev) {
  const el = ev.target.closest("[data-act]");
  if (!el) return;
  const act = el.dataset.act;

  if (act === "cmp-a") { state.cmpA = el.value; render(); return; }
  if (act === "cmp-b") { state.cmpB = el.value; render(); return; }
  if (act === "cmp-pose") { state.cmpPose = el.value; render(); return; }

  if (act === "swap-scanned-item") {
    const idx = Number(el.dataset.idx);
    const d = state.scan && state.scan.data;
    const food = d && Array.isArray(d.catalog) ? d.catalog.find(c => c.key === el.value) : null;
    if (food && Array.isArray(d.items) && d.items[idx]) {
      const it = d.items[idx];
      it.key = food.key; it.name = food.name; it.p100 = food.p100; it.cal100 = food.cal100; it.estimated = false;
      recalcScan();
      render();
    }
    return;
  }
});

document.getElementById("foodInput").addEventListener("change", function (e) {
  const f = e.target.files && e.target.files[0];
  if (f) handleFoodFile(f);
});
document.getElementById("photoInput").addEventListener("change", function (e) {
  const f = e.target.files && e.target.files[0];
  if (f) handlePhotoFile(f);
  else state.photoTarget = null;
});
document.getElementById("importInput").addEventListener("change", function (e) {
  const f = e.target.files && e.target.files[0];
  if (f) importJSON(f);
});

(function initLightboxGestures() {
  const stage = document.getElementById("lbStage");
  stage.addEventListener("wheel", function (e) {
    if (!document.getElementById("lightbox").classList.contains("open")) return;
    e.preventDefault();
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    lb.scale = Math.max(0.5, Math.min(4, lb.scale * delta));
    applyLB();
  }, { passive: false });

  stage.addEventListener("pointerdown", function (e) {
    if (e.pointerType === "mouse" && e.button !== 0) return;
    stage.setPointerCapture(e.pointerId);
    lb.pointers[e.pointerId] = { x: e.clientX, y: e.clientY };
    const ids = Object.keys(lb.pointers);
    if (ids.length === 1) {
      lb.dragging = true;
      lb.sx = e.clientX; lb.sy = e.clientY;
      lb.ox = lb.x; lb.oy = lb.y;
    } else if (ids.length === 2) {
      lb.dragging = false;
      const a = lb.pointers[ids[0]], b = lb.pointers[ids[1]];
      lb.pinchDist = Math.hypot(a.x - b.x, a.y - b.y);
    }
  });

  stage.addEventListener("pointermove", function (e) {
    if (!lb.pointers[e.pointerId]) return;
    lb.pointers[e.pointerId] = { x: e.clientX, y: e.clientY };
    const ids = Object.keys(lb.pointers);

    if (ids.length >= 2) {
      const a = lb.pointers[ids[0]], b = lb.pointers[ids[1]];
      const d = Math.hypot(a.x - b.x, a.y - b.y);
      if (lb.pinchDist > 0) {
        const ratio = d / lb.pinchDist;
        lb.scale = Math.max(0.5, Math.min(4, lb.scale * ratio));
        lb.pinchDist = d;
        applyLB();
      }
      return;
    }

    if (lb.dragging) {
      lb.x = lb.ox + (e.clientX - lb.sx);
      lb.y = lb.oy + (e.clientY - lb.sy);
      applyLB();
    }
  });

  function release(e) {
    delete lb.pointers[e.pointerId];
    if (Object.keys(lb.pointers).length < 2) lb.pinchDist = 0;
    if (Object.keys(lb.pointers).length === 0) lb.dragging = false;
  }
  stage.addEventListener("pointerup", release);
  stage.addEventListener("pointercancel", release);
  stage.addEventListener("pointerleave", function (e) {
    if (e.pointerType === "mouse") release(e);
  });
})();

let waterPressTimer = null;
document.addEventListener("pointerdown", (e) => {
  const el = e.target.closest('[data-act="add-water"]');
  if (!el) return;
  waterPressTimer = setTimeout(() => {
    const db = getDB();
    if (db.logs[state.nutDate]) {
      db.logs[state.nutDate].water = 0;
      saveDB(db);
      triggerAutoSync();
      render();
      toast("WATER LOG RESET", "cyan");
    }
  }, 800);
});
document.addEventListener("pointerup", () => { clearTimeout(waterPressTimer); });
document.addEventListener("pointercancel", () => { clearTimeout(waterPressTimer); });
document.addEventListener("pointerleave", () => { clearTimeout(waterPressTimer); });

function schedulePrepReminder() {
  if (Notification.permission !== "granted") return;
  const now = new Date();
  const target = new Date();
  target.setHours(20, 30, 0, 0);
  if (now > target) return;
  const msUntil = target.getTime() - now.getTime();
  setTimeout(() => {
    const tomorrowDate = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    const tomorrowKey = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'][tomorrowDate.getDay()];
    const tomorrowPlan = MEAL_PLAN[tomorrowKey];
    if (tomorrowPlan && tomorrowPlan.prep) {
      new Notification("Tactical Prep Alert", { body: tomorrowPlan.prep, icon: "/images/logo.jpg" });
    }
  }, msUntil);
}

if ("Notification" in window && Notification.permission === "granted") {
  schedulePrepReminder();
}

document.addEventListener("pointerdown", function (e) {
  const handle = e.target.closest("#splitHandle");
  if (!handle) return;
  e.preventDefault();

  const container = document.getElementById("splitSlider");
  const topImg = document.getElementById("imgTop");

  function move(clientX) {
    const rect = container.getBoundingClientRect();
    let x = clientX - rect.left;
    x = Math.max(0, Math.min(x, rect.width));
    const pct = (x / rect.width) * 100;
    handle.style.left = pct + "%";
    topImg.style.clipPath = `inset(0 ${100 - pct}% 0 0)`;
  }

  function onPointerMove(e) { move(e.clientX); }
  function onPointerUp() {
    document.removeEventListener("pointermove", onPointerMove);
    document.removeEventListener("pointerup", onPointerUp);
  }

  document.addEventListener("pointermove", onPointerMove);
  document.addEventListener("pointerup", onPointerUp);
});

(function initGhostOpacitySlider() {
  const slider = document.getElementById("ghostOpacitySlider");
  const ghostImg = document.getElementById("cameraGhostImg");
  if (!slider || !ghostImg) return;
  slider.addEventListener("input", function (e) {
    ghostImg.style.opacity = String(Number(e.target.value) / 100);
  });
})();

function tickClock() {
  const d = new Date();
  const el = document.getElementById("sysClock");
  if (el) el.textContent = pad2(d.getHours()) + ":" + pad2(d.getMinutes());
}

async function boot() {
  await initDB();
  const db = getDB();

  migrateOldPhotos(db);

  if (db.settings.syncId) {
    try {
      const res = await fetch("/api/sync?id=" + encodeURIComponent(db.settings.syncId));
      const remoteData = await res.json();

      if (Object.keys(remoteData).length > 0) {
        const mergedDB = mergeDBs(db, remoteData);
        saveDB(mergedDB);
      }
    } catch (err) {
      console.warn("[Auto-Pull] Offline or failed, using local data.");
    }
  }
  const urlParams = new URLSearchParams(window.location.search);
  const urlTab = urlParams.get('tab');
  if (urlTab && ["mission", "refuel", "vault", "blueprint", "system"].includes(urlTab)) state.tab = urlTab;
  state.nutDate = ymd();
  state.dayKey = todayDayKey();
  render();
  tickClock();
  setInterval(tickClock, 20000);

  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("/sw.js").then(function (reg) {
      reg.update();
      reg.onupdatefound = function () {
        const installingWorker = reg.installing;
        installingWorker.onstatechange = function () {
          if (installingWorker.state === 'installed' && navigator.serviceWorker.controller) {
            if (document.getElementById("fullscreenTimer").classList.contains("show")) toast("UPDATE READY - REFRESH WHEN DONE", "cyan");
            else window.location.reload();
          }
        };
      };
    }).catch(function (e) { console.warn("[OPLOG] SW registration failed", e); });
  }

  document.addEventListener("touchmove", function (e) {
    if (document.getElementById("lightbox").classList.contains("open")) e.preventDefault();
  }, { passive: false });

  document.getElementById("chatImageInput").addEventListener("change", async function (e) {
    const files = Array.from(e.target.files);
    if (!files.length) return;

    const previewContainer = document.getElementById("chatImagePreview");
    previewContainer.style.display = "flex";

    for (const file of files) {
      const base64 = await compressImage(file, 800, 0.7);
      chatImages.push(base64.split(",")[1]);

      const img = document.createElement("img");
      img.src = base64;
      img.style.height = "40px";
      img.style.borderRadius = "4px";
      img.style.border = "1px solid #444";
      previewContainer.appendChild(img);
    }
    e.target.value = "";
  });
}

if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", () => { boot(); });
else boot();