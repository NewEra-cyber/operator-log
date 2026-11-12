import { TRAINING, STAPLES, MEAL_PLAN, MILESTONES, POSES, BLUEPRINTS, PLATES, BAR_WEIGHT, formatPose, QUICK_STASH, GROCERY_LIST } from './data.js';
import { esc, fmtDate, dayLetter, num, fmtRest, addDays, ymd, pad2 } from './utils.js';

function getPlanKey(d) {
  return ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'][d.getDay()];
}

function getMuscleGroup(exId) {
  if (["bench", "incdb", "cablefly", "dips"].includes(exId)) return "Chest";
  if (["row", "rowB", "pulldown", "pulldownB", "pullup"].includes(exId)) return "Back";
  if (["squat", "legpress", "legext", "lunge", "bss"].includes(exId)) return "Quads";
  if (["rdl", "legcurlA", "legcurlB"].includes(exId)) return "Hamstrings";
  if (["ohp", "latraise", "facepull", "reardelt"].includes(exId)) return "Delts";
  if (["curl", "curlB", "hammer", "supersetA"].includes(exId)) return "Arms";
  if (["calfA", "calfB"].includes(exId)) return "Calves";
  if (["cablecr", "hlr", "plank"].includes(exId)) return "Core";
  return "Other";
}

function generateSparkline(data) {
  if (data.length < 2) return "";
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const width = 50;
  const height = 16;
  const step = width / (data.length - 1);

  let pathD = "";
  data.forEach((val, i) => {
    const x = i * step;
    const y = height - ((val - min) / range) * height;
    pathD += (i === 0 ? "M" : "L") + x + "," + y + " ";
  });

  const isUp = data[data.length - 1] >= data[0];
  return `
    <div class="sparkline-container">
      <svg class="sparkline ${isUp ? 'up' : 'flat'}" viewBox="0 0 ${width} ${height}">
        <path d="${pathD}" />
      </svg>
    </div>
  `;
}

export function viewMission(db, state) {
  const dateKey = state.missionDate || ymd();
  const day = TRAINING.filter((d) => d.key === state.dayKey)[0] || TRAINING[0];
  const session = getSession(db, day.key, dateKey);

  // Phase 5.4: Smart Deload Predictor
  let isDeload = false;
  let recentRIRs = [];
  Object.keys(db.workouts).forEach(k => {
    const d = new Date(k.split("::")[1] + "T12:00:00");
    if ((new Date() - d) / (1000 * 60 * 60 * 24) <= 14) {
      const sess = db.workouts[k];
      if (sess.ex) {
        Object.values(sess.ex).forEach(ex => {
          if (ex.rir !== undefined) recentRIRs.push(Number(ex.rir));
        });
      }
    }
  });
  if (recentRIRs.length > 5) {
    const avgRIR = recentRIRs.reduce((a, b) => a + b, 0) / recentRIRs.length;
    if (avgRIR <= 0.5) isDeload = true;
  }

  let totalSets = 0, doneSets = 0;
  day.exercises.forEach((ex) => {
    const s = getExState(session, ex, db);
    totalSets += ex.sets;
    doneSets += s.sets.filter(Boolean).length;
  });
  const pct = totalSets ? Math.round((doneSets / totalSets) * 100) : 0;

  const pills = TRAINING.map((d) =>
    `<button class="day-pill ${d.key === day.key ? "on" : ""}" data-act="pick-day" data-key="${d.key}">
      <b>${d.tag}</b><span>${d.short}</span>
    </button>`
  ).join("");

  const cards = day.exercises.map((ex) => exCardHTML(db, session, ex)).join("");

  const dayMap = { 1: "upperA", 2: "lowerA", 3: "recoveryA", 4: "upperB", 5: "lowerB", 6: "recoveryB", 0: "recoveryC" };
  const nextDayKey = dayMap[(new Date(dateKey + "T12:00:00").getDay() + 1) % 7];
  const nextDay = TRAINING.find(d => d.key === nextDayKey) || TRAINING[0];

  // Phase 6: Session Micro-Journal (Date-Aware)
  const sessionNotes = db.logs[dateKey]?.sessionNotes || "";
  const hasNotes = sessionNotes.trim().length > 0;

  const notesHTML = `
    <div class="card" style="margin-top: 16px; ${hasNotes ? 'border-left: 3px solid var(--green);' : ''}">
      <div class="flex-between mb-4">
        <div class="kicker">SESSION MICRO-JOURNAL</div>
        ${hasNotes ? '<span class="mono small color-green">✓ SAVED</span>' : ''}
      </div>
      <div class="small color-muted mb-8">Log how this session felt (form cues, energy, tweaks).</div>
      <textarea id="sessionNotesInput" class="manual w-full" style="height: 80px; resize: vertical; background: rgba(0,0,0,0.2); border: 1px solid var(--border); color: var(--txt); font-size: 14px; padding: 10px; border-radius: 8px; outline: none;" placeholder="e.g. Felt strong, shoulder tight on OHP...">${esc(sessionNotes)}</textarea>
      <button class="act-btn primary mt-8" data-act="save-notes" data-date="${dateKey}">SAVE NOTES FOR ${dateKey}</button>
    </div>
  `;

  return `
    <section class="pad">
      <div class="day-strip">${pills}</div>
      
      ${isDeload ? `
        <div class="deload-banner">
          <div class="kicker color-red mb-2">⚠️ SYSTEMIC FATIGUE DETECTED</div>
          <div style="font-size: 13px; color: #fff;">TACTICAL DELOAD ACTIVE. Drop all loads by 15% and limit sets to 2 this week.</div>
        </div>
      ` : ''}

      <div class="card">
        <div class="row between">
          <div>
            <div class="kicker flex-between">
              ${day.tag} · ${dateKey}
              <div class="flex-row">
                <button class="mono btn-date" data-act="open-injury" style="border-color: var(--red); color: var(--red);">🚑 TWEAK</button>
                <button class="mono btn-date" data-act="open-calendar" data-target="mission" data-date="${dateKey}">${dateKey} 📅</button>
              </div>
            </div>
            <h2 class="day-title">${esc(day.name)}</h2>
            <div class="focus">${esc(day.focus)}</div>
          </div>
          <div class="text-right">
            <div class="mono stat-pct">${pct}%</div>
            <div class="mono stat-label">COMPLETE</div>
          </div>
        </div>
        <div class="progress"><i class="progress-bar" data-pct="${pct}"></i></div>
        <div class="row between mono small dim">
          <span>${doneSets} / ${totalSets} SETS</span>
          <span>${pct === 100 ? "SESSION COMPLETE ✓" : "IN PROGRESS"}</span>
        </div>
      </div>
      
      ${cards}

      <div class="card" style="margin-top: 16px; border-left: 3px solid var(--primary);">
        <div class="kicker mb-4">AI TACTICAL COACH</div>
        <div class="small color-muted mb-8">Log your sets and reps above, then ask the coach for next week's progression.</div>
        <button class="scan-btn" data-act="ask-coach" id="askCoachBtn" style="background: rgba(0, 229, 255, 0.1); color: var(--primary); border: 1px solid var(--primary);">
          <svg viewBox="0 0 24 24"><path d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2zm0 18a8 8 0 1 1 8-8 8 8 0 0 1-8 8z"/><path d="M12 6a1 1 0 0 0-1 1v5a1 1 0 0 0 .293.707l3 3a1 1 0 0 0 1.414-1.414L13 11.586V7a1 1 0 0 0-1-1z"/></svg>
          ANALYZE PERFORMANCE
        </button>
        <div id="coachResult" class="ai-result" style="margin-top: 16px;"></div>
      </div>

      ${notesHTML}

      <div class="card" style="border-left: 3px solid var(--muted); margin-top: 16px;">
        <div class="kicker mb-2">UP NEXT · ${nextDay.tag}</div>
        <h3 style="font-size: 16px; color: #fff; margin: 0;">${nextDay.name}</h3>
        <div class="focus" style="margin-top: 2px;">${nextDay.focus}</div>
      </div>
    </section>
  `;
}

function exCardHTML(db, session, ex) {
  const s = getExState(session, ex, db);
  let lastSession = null;

  // Phase 6.1: Sparkline Data
  let historyPoints = [];
  const sessionKeys = Object.keys(db.workouts).sort();
  for (let k of sessionKeys) {
    if (k.includes(ex.id) && db.workouts[k].ex[ex.id]?.sets.some(Boolean)) {
      lastSession = db.workouts[k].ex[ex.id];
      const w = num(lastSession.weight, 0);
      const topReps = lastSession.reps.map(r => num(r, 0)).reduce((a, b) => Math.max(a, b), 0);
      if (w > 0 && topReps > 0) {
        historyPoints.push(Math.round(w * (1 + (topReps / 30))));
      }
    }
  }
  const sparklineHTML = generateSparkline(historyPoints.slice(-6));

  const best = db.history[ex.id];
  const allDone = s.sets.every(Boolean) && s.sets.length > 0;
  const overload = allDone && s.reps.every((r) => num(r, 0) >= ex.max);
  const target = num(s.weight, 0) + ex.inc;

  const bestHTML = best
    ? `<div class="best-badge">◈ PREVIOUS BEST <b>${best.weight}KG</b>${best.reps != null ? " × " + best.reps : ""}${best.date ? " · " + esc(best.date) : ""}</div>`
    : "";

  const setsHTML = s.sets.map((on, i) => {
    const lastReps = lastSession ? lastSession.reps[i] : null;
    const lastWeight = lastSession ? lastSession.weight : null;
    const ghost = lastReps
      ? `<span class="ghost-text">Prev: ${lastWeight}kg × ${lastReps}</span>`
      : "";

    const currentWeight = num(s.weight, 0);
    const currentReps = num(s.reps[i], 0);
    const e1rm = currentWeight > 0 && currentReps > 0
      ? Math.round(currentWeight * (1 + (currentReps / 30)))
      : 0;
    const e1rmHTML = e1rm > 0 ? `<div class="e1rm-badge">e1RM: ~${e1rm}kg</div>` : "";

    return `<div class="set-item ${on ? "done" : ""}">
      <div class="flex-row">
        <button class="set-btn" data-act="toggle-set" data-ex="${ex.id}" data-i="${i}">${on ? "✓" : (i + 1)}</button>
        <input class="reps-in mono" type="number" inputmode="numeric" min="0" max="99" value="${s.reps[i]}" data-act="ex-reps" data-ex="${ex.id}" data-i="${i}" data-last="${lastReps || 0}" data-last-weight="${lastWeight || 0}" />
        <span id="delta-${ex.id}-${i}"></span>
      </div>
      ${ghost}
      ${e1rmHTML}
    </div>`;
  }).join("");

  const rirHTML = [2, 1, 0].map((v) =>
    `<button class="${num(s.rir) === v ? "on" : ""}" data-act="set-rir" data-ex="${ex.id}" data-v="${v}">${v}</button>`
  ).join("");

  const swapBtn = ex.alternates && ex.alternates.length > 0
    ? `<button class="swap-btn" data-act="swap-ex" data-ex="${ex.id}">⇄</button>`
    : "";

  const warmupBtn = ex.equipment === 'barbell'
    ? `<button class="mono btn-date" style="margin-left:8px;" data-act="open-warmup" data-ex="${ex.id}" data-weight="${s.weight}">🔥 WARM-UP</button>`
    : "";

  return `
    <article class="ex-card" id="card-${ex.id}">
      <div class="ex-top">
        <div class="ex-id">
          <h3 class="ex-name" data-act="open-history" data-ex="${ex.id}">
            ${esc(ex.name)} ${swapBtn} ${sparklineHTML}
          </h3>
          <div class="ex-meta flex-row">
            <span>${ex.sets} × ${ex.min}–${ex.max}${ex.recovery ? " REPS/MIN" : " REPS"}</span>
            ${warmupBtn}
          </div>
        </div>
        <div class="ex-target">
          <span>LOAD</span>
          <input class="load-in mono" type="number" step="2.5" value="${s.weight}" data-act="ex-weight" data-ex="${ex.id}" />
          <em>KG</em>
        </div>
      </div>
      ${bestHTML}
      <p class="cues">${esc(ex.cues)}</p>
      <div class="tools">
        ${ex.equipment === 'barbell' ? `
          <div class="plate-box">
            <span class="lbl">PLATE CALC · PER SIDE (0KG BAR)</span>
            <div class="plates" id="plates-${ex.id}">${plateHTML(platesFor(s.weight))}</div>
          </div>
        ` : ''}
        <div class="rir-box">
          <span class="lbl">RIR</span>
          <div class="rir-sel">${rirHTML}</div>
        </div>
      </div>
      <div class="sets" id="sets-${ex.id}">${setsHTML}</div>
      <div class="overload ${overload ? 'show' : ''}" id="ovl-${ex.id}">
        ⚠ OVERLOAD DETECTED — ALL SETS AT ${ex.max} REPS. UNLOCK <b>${ex.inc > 0 ? target + "KG" : "PROGRESSION"}</b> NEXT WEEK.
      </div>
    </article>
  `;
}

export function viewRefuel(db, state) {
  const navButtons = `
    <div class="flex-row mb-4">
      <button class="act-btn ${state.refuelView === 'log' ? 'primary' : ''} btn-tab" data-act="refuel-toggle" data-view="log">DAILY LOG</button>
      <button class="act-btn ${state.refuelView === 'plan' ? 'primary' : ''} btn-tab" data-act="refuel-toggle" data-view="plan">MEAL PROTOCOL</button>
    </div>
  `;

  if (state.refuelView === 'plan') {
    return `
      <section class="pad">
        ${navButtons}
        ${viewMealPlan(state)}
      </section>
    `;
  }

  const key = state.nutDate;
  const log = db.logs[key] || { meals: [] };
  const meals = Array.isArray(log.meals) ? log.meals : [];
  const target = num(db.settings.proteinTarget, 105) || 105;
  const p = meals.reduce((a, m) => a + num(m.p, 0), 0);
  const cal = meals.reduce((a, m) => a + num(m.cal, 0), 0);
  const pct = Math.max(0, Math.min(1, p / target));
  const deficit = target - p;
  const waterMl = (log.water || 0) * 500;

  let streak = 0;
  let checkDate = new Date(key + "T12:00:00");
  while (true) {
    const checkKey = ymd(checkDate);
    if (dayProtein(db, checkKey) >= target) {
      streak++;
      checkDate.setDate(checkDate.getDate() - 1);
    } else break;
  }
  const streakHTML = streak > 0 ? `<div class="streak-badge">🔥 ${streak}-DAY PROTEIN STREAK</div>` : "";

  const now = new Date();
  const tomorrowDate = new Date(now.getTime() + 24 * 60 * 60 * 1000);
  const tomorrowKey = getPlanKey(tomorrowDate);
  const tomorrowPlan = MEAL_PLAN[tomorrowKey];
  const showPrepAlert = now.getHours() >= 19 && tomorrowPlan && tomorrowPlan.prep;

  const snackTray = QUICK_STASH.map(s =>
    `<button class="snack-pill" data-act="quick-add" data-name="${esc(s.name)}" data-p="${s.p}" data-cal="${s.cal}">
      +${s.name} <span>${s.p}g P</span>
    </button>`
  ).join("");

  let deficitHTML = "";
  if (deficit > 0) {
    let suggestions = [];
    if (deficit <= 12) {
      suggestions = [
        { name: "Milk", p: 8, cal: 150, desc: "1 glass fresh milk" },
        { name: "Egg", p: 6, cal: 75, desc: "1 hard-boiled egg" }
      ];
    } else if (deficit <= 25) {
      suggestions = [
        { name: "Eggs", p: 18, cal: 225, desc: "3 eggs scrambled / boiled" },
        { name: "Ndengu", p: 18, cal: 230, desc: "1 cup cooked ndengu" }
      ];
    } else {
      suggestions = [
        { name: "Omena", p: 45, cal: 350, desc: "1 plate fried omena" },
        { name: "Omena + 2 eggs", p: 57, cal: 425, desc: "Omena + 2 eggs combo" }
      ];
    }

    const options = suggestions.slice(0, 2).map(s => `
      <div class="deficit-option">
        <div>
          <div style="font-weight:600; font-size:13px; color:#fff;">${s.desc}</div>
          <div class="mono small color-muted">+${s.p}g P · ${s.cal} kcal</div>
        </div>
        <button class="act-btn primary m-0" style="width:auto; padding:6px 12px; font-size:11px;" data-act="quick-add" data-name="${esc(s.name)}" data-p="${s.p}" data-cal="${s.cal}">LOG</button>
      </div>
    `).join("");

    deficitHTML = `
      <div class="card deficit-card">
        <div class="kicker color-red mb-4">BRIDGE THE DEFICIT · ${Math.round(deficit)}G REMAINING</div>
        ${options}
      </div>
    `;
  }

  const R = 52;
  const C = 2 * Math.PI * R;
  const offset = C * (1 - pct);

  let matrix = "";
  for (let i = 6; i >= 0; i--) {
    const k = addDays(key, -i);
    const v = dayProtein(db, k);
    const hit = v >= target;
    matrix += `<div class="mcell ${hit ? "hit " : ""}${k === ymd() ? "today" : ""}">
      <span class="d">${dayLetter(k)}</span>
      <span class="v">${Math.round(v)}</span>
    </div>`;
  }

  const favs = db.favorites || [];
  const quick = STAPLES.concat(favs).map((s) =>
    `<button class="qbtn" data-act="quick-add" data-name="${esc(s.name)}" data-p="${s.p}" data-cal="${s.cal}">
      <span class="qn">${esc(s.name)}</span>
      <span class="qp">+${s.p}g</span>
    </button>`
  ).join("");

  const mealList = meals.length
    ? meals.map((m) =>
      `<div class="meal">
        <div class="meal-content">
          ${m.img ? `<img src="${m.img}" class="meal-img" />` : ''}
          <div class="min-w-0">
            <div class="mn">${esc(m.name)}</div>
            ${m.breakdown ? `<div class="mb">${esc(m.breakdown)}</div>` : ""}
          </div>
        </div>
        <div class="meal-actions">
          <div class="mv">+${num(m.p, 0)}g<em>${num(m.cal, 0)} kcal</em></div>
          <button class="del" data-act="del-meal" data-id="${m.id}">✕</button>
        </div>
      </div>`
    ).join("")
    : '<div class="empty-msg">NO MEALS LOGGED FOR THIS DATE.</div>';

  return `
    <section class="pad">
      ${navButtons}
      ${streakHTML}

      ${showPrepAlert ? `
        <div class="card prep-alert">
          <div class="kicker color-orange mb-4">🌙 PREP ALERT · FOR TOMORROW</div>
          <div style="font-size: 13px; font-weight: 600; color: #fff;">${tomorrowPlan.prep}</div>
        </div>
      ` : ''}

      <div class="date-nav date-nav-2col">
        <button data-act="nut-prev" class="w-full">◀ PREV</button>
        <button data-act="nut-next" class="w-full">NEXT ▶</button>
      </div>

      <div class="card">
        <div class="kicker mb-8">DAILY PROTEIN PROGRESS · ${esc(fmtDate(key))}</div>
        <div class="ring-wrap">
          <div class="ring-box">
            <svg class="ring" viewBox="0 0 120 120">
              <defs>
                <linearGradient id="ringGrad" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stop-color="#f0a030"/>
                  <stop offset="100%" stop-color="#3fb27f"/>
                </linearGradient>
              </defs>
              <circle class="ring-bg" cx="60" cy="60" r="${R}"/>
              <circle class="ring-fg" cx="60" cy="60" r="${R}" data-circumference="${C.toFixed(2)}" data-offset="${offset.toFixed(2)}"/>
            </svg>
            <div class="ring-center">
              <div class="big">${Math.round(p)}</div>
              <div class="of">/ ${target}G PROTEIN</div>
              <div class="kcal">${Math.round(cal)} KCAL</div>
            </div>
          </div>
          <div class="ring-stats">
            <div class="stat-line"><span>PROTEIN</span><b class="${p >= target ? "ok" : "bad"}">${Math.round(p)} / ${target}g</b></div>
            <div class="stat-line"><span>REMAINING</span><b>${Math.max(0, Math.round(target - p))}g</b></div>
            <div class="stat-line"><span>ENERGY</span><b>${Math.round(cal)} kcal</b></div>
            <div class="stat-line"><span>MEALS</span><b>${meals.length}</b></div>
            <div class="stat-line"><span>TARGET</span><b class="ok">${p >= target ? "HIT ✓" : "PENDING"}</b></div>
          </div>
        </div>
      </div>

      ${deficitHTML}

      <button class="mono btn-calendar mb-4" data-act="open-calendar" data-target="nut" data-date="${key}">${fmtDate(key)} 📅</button>

      <div class="card">
        <div class="kicker mb-9">WATER INTAKE</div>
        <div class="water-row">
          ${Array.from({ length: 5 }).map((_, i) => {
    const active = (log.water || 0) > i;
    return `<button data-act="add-water" data-i="${i + 1}" class="water-btn ${active ? '' : 'inactive'}" style="user-select: none; -webkit-user-select: none;">💧</button>`;
  }).join('')}
        </div>
        <div class="water-display">${waterMl} / 2500 ml</div>
      </div>

      <div class="card">
        <div class="kicker mb-8">7-DAY PERFORMANCE MATRIX</div>
        <div class="matrix">${matrix}</div>
        <div class="mono stat-label mt-8">GREEN = 105G PROTEIN TARGET ACHIEVED</div>
      </div>

      <div class="kicker mb-4 mt-8">QUICK STASH</div>
      <div class="snack-tray">${snackTray}</div>

      <div class="card">
        <div class="kicker mb-9">1-TAP STAPLES</div>
        <div class="quick-grid">${quick}</div>
      </div>

      <div class="card">
        <div class="kicker mb-9">AI PLATE SCANNER</div>
        <button class="scan-btn" data-act="scan">
          <svg viewBox="0 0 24 24"><path d="M3 8V5a2 2 0 0 1 2-2h3M16 3h3a2 2 0 0 1 2 2v3M21 16v3a2 2 0 0 1-2 2h-3M8 21H5a2 2 0 0 1-2-2v-3"/><circle cx="12" cy="12" r="3.5"/></svg>
          SCAN MEAL
        </button>
        <div class="manual">
          <input id="aiTextInput" type="text" placeholder="Or type: '2 eggs and toast'..." class="span-3" />
          <button data-act="ai-text-log">ASK AI</button>
        </div>
        <div id="scanResultContainer">${scanResultHTML(state)}</div>
      </div>

      <div class="card">
        <div class="kicker mb-9">MANUAL ENTRY</div>
        <div class="manual">
          <input id="mName" type="text" placeholder="Meal name" maxlength="60" />
          <input id="mP" type="number" placeholder="P (g)" min="0" max="500" />
          <input id="mCal" type="number" placeholder="kcal" min="0" max="5000" />
          <button data-act="manual-add">ADD</button>
        </div>
        <button class="act-btn primary mt-8" data-act="save-favorite">⭐ SAVE TO MY FAVORITES</button>
      </div>

      <div class="card">
        <div class="kicker mb-4">LOG · ${esc(key)}</div>
        ${mealList}
      </div>
    </section>
  `;
}

function viewMealPlan(state) {
  const day = MEAL_PLAN[state.planDay] || MEAL_PLAN.mon;
  const dayPills = Object.keys(MEAL_PLAN).map((k) => {
    const d = MEAL_PLAN[k];
    return `<button class="day-pill ${state.planDay === k ? 'on' : ''}" data-act="plan-day" data-key="${k}">
      <b>${d.label.substring(0, 3)}</b><span>${d.focus.split(' ')[0]}</span>
    </button>`;
  }).join('');

  const mealCards = day.meals.map(m =>
    `<div class="card meal-card">
      <div class="flex-between align-start mb-6">
        <div class="meal-title">${m.name}</div>
        <div class="mono meal-time">${m.time}</div>
      </div>
      <div class="meal-desc">${esc(m.desc)}</div>
      <div class="flex-row">
        <div class="mono color-green stat-macro">+${m.p}g P</div>
        <div class="mono color-cyan stat-macro">+${m.cal} kcal</div>
      </div>
    </div>`
  ).join('');

  return `
    <div class="mt-10">
      <button class="scan-btn mb-12" data-act="open-grocery" style="background: var(--card); color: var(--primary); border: 1px solid var(--primary);">
        🛒 GENERATE WEEKLY GROCERY LIST
      </button>

      <div class="card" style="border-left: 3px solid var(--primary); background: rgba(0, 229, 255, 0.05);">
        <div class="kicker color-orange mb-4">RULES FOR THE WHOLE WEEK</div>
        <ul style="list-style: none; padding: 0; margin: 0; font-size: 12px; color: var(--muted); line-height: 1.6;">
          <li>• <b>Weights:</b> Starting guesses. Use RPE (about 2 reps left on the last rep).</li>
          <li>• <b>Progression:</b> Keep weight until you hit top of rep range on all sets, then add 2.5 kg.</li>
          <li>• <b>Weigh-in:</b> Once a week, same morning.</li>
          <li>• <b>Never skip:</b> The 6am uji and the supper after training.</li>
        </ul>
      </div>

      <div class="day-strip mb-12 mt-12">${dayPills}</div>
      
      <div class="card">
        <div class="row between">
          <div>
            <div class="kicker">DAILY TARGET PROTOCOL</div>
            <h2 class="day-title">${day.label}</h2>
            <div class="focus">${day.focus}</div>
          </div>
          <div class="text-right">
            <div class="mono stat-big">${day.totalP}g</div>
            <div class="mono stat-label">PROTEIN</div>
            <div class="mono stat-sub">${day.totalCal} kcal</div>
          </div>
        </div>
      </div>
      
      <div class="kicker mt-16 mb-4">MEAL TIMELINE</div>
      ${mealCards}

      <div class="card" style="border: 1px solid var(--primary); background: rgba(0, 229, 255, 0.05); margin-top: 16px;">
        <div class="kicker color-orange mb-4">🌙 PREP TONIGHT</div>
        <div style="font-size: 14px; font-weight: 600; color: #fff;">
          ${day.prep}
        </div>
      </div>
    </div>
  `;
}

export function scanResultHTML(state) {
  const s = state.scan || { status: "idle" };
  if (s.status === "loading") {
    return `<div class="scan-result load"><h4><span class="spinner"></span> ANALYSING IMAGE…</h4>
      <div class="dim small">Sending to plate-vision. Non-food items will be rejected.</div></div>`;
  }
  if (s.status === "reject") {
    return `<div class="scan-result bad"><h4>✕ NON-FOOD DETECTED</h4>
      <div class="dim small">${esc((s.data && s.data.breakdown) || "Rejected: not a food item.")}</div>
      <div class="mono color-red mt-8 small">0G PROTEIN LOGGED</div>
      <button class="act-btn" data-act="scan-clear">DISMISS</button></div>`;
  }
  if (s.status === "error") {
    return `<div class="scan-result bad"><h4>⚠ SCAN FAILED</h4>
      <div class="dim small">${esc(s.message || "Vision service unavailable. Enter manually.")}</div>
      <button class="act-btn" data-act="scan-clear">DISMISS</button></div>`;
  }
  if (s.status === "ok") {
    const d = s.data || {};
    return `<div class="scan-result ok">
      <h4>✓ ${esc(d.name || "Meal Detected")}</h4>
      ${s.img ? `<img src="${s.img}" class="w-full mb-8" style="height:160px; object-fit:cover; border-radius:4px; border:1px solid rgba(63,178,127,0.3);" />` : ''}
      <div class="scan-macros"><span class="p">${num(d.p, 0)}g P</span><span class="c">${num(d.cal, 0)} KCAL</span></div>
      <div class="dim small">${esc(d.breakdown || "")}</div>
      <button class="confirm-btn" data-act="scan-confirm">✓ CONFIRM &amp; LOG</button>
      <button class="act-btn mt-8" data-act="scan-clear">CANCEL</button>
    </div>`;
  }
  return "";
}

export function viewVault(db, state) {
  const blocks = MILESTONES.map((m) => {
    const p = db.photos[m.k] || {};
    const photoCount = POSES.filter(pose => p[pose]).length;
    const isOpen = state.vaultMilestone === m.k;

    if (!isOpen) {
      return `
        <div class="card folder-card" data-act="toggle-vault" data-key="${m.k}">
          <div class="flex-between w-full">
            <div class="flex-row" style="gap: 12px;">
              <div class="folder-icon">📁</div>
              <div>
                <h3 class="day-title" style="font-size: 18px; margin: 0;">${m.label}</h3>
                <div class="focus" style="margin-top: 2px;">${m.sub}</div>
              </div>
            </div>
            <div class="text-right">
              <div class="mono color-cyan font-bold" style="font-size: 14px;">${photoCount}/9</div>
              <div class="small color-muted">PHOTOS</div>
            </div>
          </div>
        </div>
      `;
    }

    const slots = POSES.map((pose) =>
      `<button class="photo-slot" data-act="open-photo-modal" data-ms="${m.k}" data-pose="${pose}">
        ${p[pose] ? `<img src="${p[pose]}" alt="${m.label} ${pose}" loading="lazy" />` : `<span class="ph-empty"><span>+</span><em>${formatPose(pose)}</em></span>`}
      </button>`
    ).join("");

    return `
      <div class="ms-block open">
        <div class="ms-head" data-act="toggle-vault" data-key="${m.k}" style="cursor: pointer;">
          <div class="flex-row">
            <div class="folder-icon" style="opacity: 0.5;">📂</div>
            <h3>${m.label}</h3>
          </div>
          <span class="mono color-cyan">${m.sub} · TAP TO CLOSE</span>
        </div>
        <div class="ms-grid">${slots}</div>
      </div>
    `;
  }).join("");

  const poseOpts = POSES.map((p) =>
    `<option value="${p}"${state.cmpPose === p ? " selected" : ""}>${formatPose(p)}</option>`
  ).join("");

  const imgA = (db.photos[state.cmpA] || {})[state.cmpPose] || "";
  const imgB = (db.photos[state.cmpB] || {})[state.cmpPose] || "";

  let weightRateHTML = "";
  if (db.weightLog && db.weightLog.length > 0) {
    const currentWeight = db.weightLog[db.weightLog.length - 1].weight;
    const twoWeeksAgoStr = addDays(ymd(), -14);
    const pastLog = db.weightLog.filter(w => w.date <= twoWeeksAgoStr).pop();
    const pastWeight = pastLog ? pastLog.weight : currentWeight;
    const rate = ((currentWeight - pastWeight) / 2).toFixed(1);
    const squatPR = db.history["squat"] ? db.history["squat"].weight : 0;
    const benchPR = db.history["bench"] ? db.history["bench"].weight : 0;

    weightRateHTML = `
      <div class="mono stat-line" style="border-bottom:0; padding-top:8px;">
        <span>2-WEEK RATE</span>
        <b class="${rate >= 0 ? 'ok' : 'bad'}">${rate > 0 ? '+' : ''}${rate} kg/wk</b>
      </div>
      <div class="mono small color-muted flex-between" style="margin-top:4px;">
        <span>Squat PR: ${squatPR}kg</span>
        <span>Bench PR: ${benchPR}kg</span>
      </div>
    `;
  }

  return `
    <section class="pad">
      <div class="card">
        <div class="kicker">8-WEEK PHYSIQUE VAULT</div>
        <h2 class="day-title mt-4">BI-WEEKLY MILESTONES</h2>
        <div class="dim small mt-5">Tap a folder to open your progress photos for that week.</div>
      </div>
      
      <div class="flex-col" style="gap: 8px; margin-top: 8px;">
        ${blocks}
      </div>

      <div class="card">
        <div class="kicker mb-9">BODY WEIGHT & PROGRESSION CORRELATOR</div>
        <div class="row between mb-12">
          <div class="mono color-orange stat-pct">
            ${db.weightLog && db.weightLog.length > 0 ? db.weightLog[db.weightLog.length - 1].weight : '--'}
            <span class="stat-label color-muted">KG</span>
          </div>
          <div class="flex-row">
            <input id="weightInput" type="number" step="0.1" placeholder="e.g. 65.5" class="weight-input" />
            <button data-act="save-weight" class="weight-btn">LOG</button>
          </div>
        </div>
        ${weightRateHTML}
      </div>

      <div class="card">
        <div class="kicker mb-9">AI MUSCLE ANALYZER</div>
        <div class="sel-row">
          <select id="aiMileA">${MILESTONES.map((m) => `<option value="${m.k}">${m.label} (BEFORE)</option>`).join("")}</select>
          <select id="aiMileB">${MILESTONES.map((m) => `<option value="${m.k}"${m.k === "w8" ? " selected" : ""}>${m.label} (AFTER)</option>`).join("")}</select>
          <select id="aiPose">${POSES.map(p => `<option value="${p}">${formatPose(p)}</option>`).join("")}</select>
        </div>
        <button class="act-btn primary mt-8" data-act="analyze-physique">⚡ ANALYZE PROGRESS</button>
        <div id="aiAnalysisResult" class="ai-result"></div>
      </div>

      <div class="card">
        <div class="kicker mb-9">SPLIT-SLIDER COMPARISON</div>
        <div class="sel-row" style="margin-bottom: 12px;">
          <select data-act="cmp-a">${MILESTONES.map((m) => `<option value="${m.k}"${state.cmpA === m.k ? " selected" : ""}>${m.label}</option>`).join("")}</select>
          <select data-act="cmp-pose">${poseOpts}</select>
          <select data-act="cmp-b">${MILESTONES.map((m) => `<option value="${m.k}"${state.cmpB === m.k ? " selected" : ""}>${m.label}</option>`).join("")}</select>
        </div>
        
        <div class="split-container" id="splitSlider">
          ${imgA ? `<img src="${imgA}" class="split-img split-top" id="imgTop" />` : '<div class="split-img split-top" style="background:#16161C; display:grid; place-items:center;"><span class="dim small">NO PHOTO</span></div>'}
          ${imgB ? `<img src="${imgB}" class="split-img split-bottom" />` : '<div class="split-img split-bottom" style="background:#0a0a0f; display:grid; place-items:center;"><span class="dim small">NO PHOTO</span></div>'}
          
          <div class="split-label label-before">${state.cmpA.toUpperCase()} (BEFORE)</div>
          <div class="split-label label-after">${state.cmpB.toUpperCase()} (AFTER)</div>
          
          ${imgA && imgB ? `<div class="split-handle" id="splitHandle" style="left: 50%;"></div>` : ''}
        </div>
      </div>
    </section>
  `;
}

export function viewBlueprint(db, state) {
  const volumeMap = { "Chest": 0, "Back": 0, "Quads": 0, "Hamstrings": 0, "Delts": 0, "Arms": 0, "Calves": 0, "Core": 0 };
  const startOfWeek = addDays(ymd(), -new Date().getDay() + 1);

  Object.keys(db.workouts).forEach(k => {
    const dateStr = k.split("::")[1] || "";
    if (dateStr >= startOfWeek) {
      const sess = db.workouts[k];
      if (sess.ex) {
        Object.keys(sess.ex).forEach(exId => {
          const s = sess.ex[exId];
          if (s.sets) {
            const done = s.sets.filter(Boolean).length;
            const group = getMuscleGroup(exId);
            if (volumeMap[group] !== undefined) volumeMap[group] += done;
            else volumeMap["Other"] = (volumeMap["Other"] || 0) + done;
          }
        });
      }
    }
  });

  const radarBars = Object.keys(volumeMap).map(group => {
    const sets = volumeMap[group];
    if (sets === 0) return "";
    const pct = Math.min((sets / 20) * 100, 100);
    let colorClass = "optimal";
    if (sets < 10) colorClass = "under";
    return `
      <div class="radar-row">
        <div class="radar-label">${group}</div>
        <div class="radar-bar-bg"><div class="radar-bar-fill ${colorClass}" style="width: ${pct}%;"></div></div>
        <div class="radar-val">${sets} sets</div>
      </div>
    `;
  }).join("");

  let maxVol = 0;
  const eqData = [];
  for (let i = 6; i >= 0; i--) {
    const dk = addDays(ymd(), -i);
    let dayVol = 0;
    Object.keys(db.workouts).forEach(k => {
      if (k.includes(dk)) {
        const sess = db.workouts[k];
        if (sess.ex) {
          Object.values(sess.ex).forEach(ex => {
            if (ex.sets) ex.sets.forEach((done, idx) => {
              if (done) dayVol += (num(ex.weight, 0) * num(ex.reps[idx], 0));
            });
          });
        }
      }
    });
    const target = num(db.settings.proteinTarget, 105) || 105;
    const hit = dayProtein(db, dk) >= target;
    eqData.push({ label: dayLetter(dk), vol: dayVol, hit });
    if (dayVol > maxVol) maxVol = dayVol;
  }

  const eqCols = eqData.map(d => {
    const h = maxVol > 0 ? (d.vol / maxVol) * 100 : 0;
    return `
      <div class="eq-col">
        <div class="eq-vol-bar" style="height: ${h}%;"></div>
        <div class="eq-protein-dot ${d.hit ? 'hit' : ''}"></div>
        <div class="mono" style="font-size: 9px; color: var(--muted);">${d.label}</div>
      </div>
    `;
  }).join("");

  const cards = BLUEPRINTS.map((bp) =>
    `<button class="bp-card ${bp.full ? 'full-width' : ''}" data-act="open-bp" data-key="${bp.key}">
      <img class="bp-img" src="${bp.src}" alt="${esc(bp.label)}" loading="lazy" />
      <span class="bp-label">${esc(bp.label)}</span>
    </button>`
  ).join("");

  return `
    <section class="pad">
      <div class="card">
        <div class="kicker">OPERATOR VISUAL INTEL</div>
        <h2 class="day-title mt-4">TACTICAL DECK</h2>
        <div class="dim small mt-5">Analyze your weekly volume distribution and nutritional consistency.</div>
      </div>

      <div class="card">
        <div class="kicker mb-4">MUSCLE GROUP VOLUME RADAR (WEEK)</div>
        ${radarBars}
        <div class="mono small color-muted mt-8" style="font-size: 9px;">OPTIMAL RANGE: 10-20 HARD SETS PER MUSCLE GROUP</div>
      </div>

      <div class="card">
        <div class="kicker mb-4">VOLUME vs PROTEIN EQUILIBRIUM</div>
        <div class="flex-row between" style="margin-bottom: 8px;">
          <span class="mono small color-cyan">BAR = VOLUME (KG)</span>
          <span class="mono small color-green">DOT = PROTEIN HIT</span>
        </div>
        <div class="equilibrium-grid" style="height: 80px; align-items: flex-end;">
          ${eqCols}
        </div>
      </div>

      <div class="kicker mt-16 mb-4">BLUEPRINT ARCHIVE</div>
      <div class="bp-grid">${cards}</div>
    </section>
  `;
}

export function viewSystem(db) {
  let bytes = 0;
  try { bytes = new Blob([JSON.stringify(db)]).size; } catch (e) { bytes = JSON.stringify(db).length; }
  const kb = (bytes / 1024).toFixed(1);

  const mealCount = Object.keys(db.logs).reduce((a, k) => {
    const l = db.logs[k];
    return a + (l && Array.isArray(l.meals) ? l.meals.length : 0);
  }, 0);
  const sessionCount = Object.keys(db.workouts).length;
  const photoCount = Object.keys(db.photos).reduce((a, k) => a + POSES.filter((p) => (db.photos[k] || {})[p]).length, 0);
  const bestCount = Object.keys(db.history).length;
  const swState = ("serviceWorker" in navigator && navigator.serviceWorker.controller) ? "ACTIVE" : (("serviceWorker" in navigator) ? "REGISTERED" : "UNSUPPORTED");

  const lastBackup = db.settings.lastBackup || 0;
  let showBackupWarning = false;
  let backupMessage = "";

  if (lastBackup === 0) {
    showBackupWarning = true;
    backupMessage = "You have never exported a backup. Export now to prevent data loss.";
  } else {
    const daysSinceBackup = Math.floor((Date.now() - lastBackup) / (1000 * 60 * 60 * 24));
    if (daysSinceBackup > 7) {
      showBackupWarning = true;
      backupMessage = `It has been ${daysSinceBackup} days since your last JSON export. Export now to prevent data loss.`;
    }
  }

  let maxVolume = 0;
  const volumeData = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dk = ymd(d);
    let dayVol = 0;
    Object.keys(db.workouts).forEach(k => {
      if (k.includes(dk)) {
        const session = db.workouts[k];
        if (session.ex) {
          Object.keys(session.ex).forEach(exId => {
            const s = session.ex[exId];
            if (s.sets) {
              s.sets.forEach((done, idx) => {
                if (done) dayVol += (num(s.weight, 0) * num(s.reps[idx], 0));
              });
            }
          });
        }
      }
    });
    volumeData.push({ label: dayLetter(dk), val: dayVol });
    if (dayVol > maxVolume) maxVolume = dayVol;
  }

  const volumeBars = volumeData.map(v => {
    const heightPct = maxVolume > 0 ? (v.val / maxVolume) * 100 : 0;
    return `
      <div class="volume-bar-wrapper">
        <div class="volume-val">${v.val > 0 ? Math.round(v.val) : ''}</div>
        <div class="volume-bar" style="height: ${heightPct}%;"></div>
        <div class="volume-label">${v.label}</div>
      </div>
    `;
  }).join("");

  return `
    <section class="pad">
      ${showBackupWarning ? `
        <div class="card" style="border: 1px solid var(--red); background: rgba(255, 75, 75, 0.1); animation: pulse-border-red 2s infinite;">
          <div class="kicker color-red mb-4">⚠️ BACKUP OVERDUE</div>
          <div style="font-size: 13px; color: #fff;">${backupMessage}</div>
        </div>
      ` : ''}

      <div class="card">
        <div class="kicker">SYSTEM STATUS</div>
        <h2 class="day-title mt-4">DIAGNOSTICS</h2>
        <div class="sys-row"><span class="dim">DB VERSION</span><span class="v">v${db.version}</span></div>
        <div class="sys-row"><span class="dim">PAYLOAD SIZE</span><span class="v">${kb} KB</span></div>
        <div class="sys-row"><span class="dim">MEALS LOGGED</span><span class="v">${mealCount}</span></div>
        <div class="sys-row"><span class="dim">SESSIONS STORED</span><span class="v">${sessionCount}</span></div>
        <div class="sys-row"><span class="dim">PERSONAL BESTS</span><span class="v">${bestCount}</span></div>
        <div class="sys-row"><span class="dim">VAULT PHOTOS</span><span class="v">${photoCount}</span></div>
        <div class="sys-row"><span class="dim">SERVICE WORKER</span><span class="v">${swState}</span></div>
        <button class="act-btn danger mt-10" data-act="prune-db" style="border-color: var(--orange); color: var(--orange);">🧹 PRUNE STALE DATA (SAVES SPACE)</button>
      </div>

      <div class="card">
        <div class="kicker mb-4">7-DAY VOLUME TONNAGE (KG)</div>
        <div class="volume-chart">
          ${volumeBars}
        </div>
      </div>

      <div class="card">
        <div class="kicker mb-6">WEEKLY TACTICAL SYNTHESIS</div>
        <div class="dim small mb-10">Synthesize your 7-day training and nutrition into a tactical report.</div>
        <button class="act-btn primary" data-act="run-synthesis" id="synthesisBtn" style="border-color: var(--cyan); color: var(--cyan);">🧠 RUN AI DEBRIEF</button>
        <div id="synthesisResult" style="display:none; margin-top:12px; padding:12px; background:rgba(0,0,0,0.3); border-radius:8px;"></div>
      </div>

      <div class="card">
        <div class="kicker mb-6">PROTEIN TARGET</div>
        <div class="row between">
          <input id="targetInput" class="load-in mono" type="number" min="20" max="400" value="${num(db.settings.proteinTarget, 105)}" style="width:90px;text-align:center" />
          <button class="act-btn m-0" data-act="save-target" style="width:auto; padding:9px 16px">SAVE</button>
        </div>
      </div>

      <div class="card">
        <div class="kicker mb-4">BACKUP &amp; RESTORE</div>
        <button class="act-btn primary" data-act="export">⭳ EXPORT JSON BACKUP</button>
        <button class="act-btn" data-act="export-csv" style="border-color: var(--orange); color: var(--orange);">📊 EXPORT WORKOUT LOGS (CSV)</button>
        <button class="act-btn" data-act="import">⭱ IMPORT JSON BACKUP</button>
        <div class="dim small mt-10">Import runs a full multi-key migration — legacy v1/v2 backups are automatically upgraded.</div>
      </div>

      <div class="card">
        <div class="kicker mb-6">CLOUD SYNC</div>
        <div class="dim small mb-10">Enter a secret Sync Code (e.g. your name). Use the same code on other devices to sync your data.</div>
        <div class="manual" style="grid-template-columns: 1fr auto;">
          <input id="syncIdInput" type="text" placeholder="Sync Code" value="${db.settings.syncId || ''}" />
          <button data-act="save-sync" style="padding:0 15px;">SAVE</button>
        </div>
        <div class="flex-row mt-10">
          <button class="act-btn color-cyan m-0" data-act="sync-push" style="flex:1; border-color:var(--cyan);">⭱ PUSH TO CLOUD</button>
          <button class="act-btn color-green m-0" data-act="sync-pull" style="flex:1; border-color:var(--green);">⭳ PULL & MERGE</button>
        </div>
        <div id="syncStatus" class="mono small mt-8 text-center">STATUS: ${db.settings.syncId ? 'READY' : 'NOT CONFIGURED'}</div>
      </div>

      <div class="card">
        <div class="kicker mb-6">NOTIFICATIONS</div>
        <div class="dim small mb-10">Get an alert at 8:30 PM if you need to prep food for the next day.</div>
        <button class="act-btn primary" data-act="request-notifications">🔔 ENABLE PUSH REMINDERS</button>
      </div>

      <div class="card">
        <div class="kicker mb-6">BACKUP SETTINGS</div>
        <div class="dim small mb-10">Include heavy progress photos in your JSON exports and Cloud Sync.</div>
        <button class="act-btn ${db.settings.includePhotos ? 'primary' : ''}" data-act="toggle-photo-sync">
          ${db.settings.includePhotos ? '✓ PHOTOS INCLUDED IN SYNC' : '✕ EXCLUDE PHOTOS (FAST SYNC)'}
        </button>
      </div>

      <div class="card">
        <div class="kicker mb-6">LEGAL & PRIVACY</div>
        <div class="dim small mb-10">Read the operator agreement, health disclaimers, and data privacy policies.</div>
        <button class="act-btn" data-act="open-legal" data-type="privacy">⭳ PRIVACY POLICY</button>
        <button class="act-btn" data-act="open-legal" data-type="terms">⭳ TERMS & HEALTH DISCLAIMER</button>
      </div>

      <div class="card">
        <div class="kicker mb-4">DANGER ZONE</div>
        <button class="act-btn danger" data-act="reset">⌫ PURGE ALL LOCAL DATA</button>
      </div>
    </section>
  `;
}

/* Helpers */
export function getSession(db, dayKey, dateKey, createIfMissing = false) {
  const k = dayKey + "::" + dateKey;
  if (createIfMissing) {
    if (!db.workouts[k]) db.workouts[k] = { ex: {} };
  }
  if (!db.workouts[k]) return { ex: {} };
  if (!db.workouts[k].ex) db.workouts[k].ex = {};
  return db.workouts[k];
}

export function getExState(session, ex, db) {
  let s = session.ex[ex.id];
  if (!s || typeof s !== "object") {
    let defaultWeight = ex.weight;
    if (db && db.history && db.history[ex.id] && db.history[ex.id].weight > ex.weight) {
      defaultWeight = db.history[ex.id].weight;
    }
    s = { sets: [], reps: [], rir: 2, weight: defaultWeight };
    session.ex[ex.id] = s;
  }
  if (!Array.isArray(s.sets)) s.sets = [];
  if (!Array.isArray(s.reps)) s.reps = [];
  while (s.sets.length < ex.sets) { s.sets.push(false); s.reps.push(ex.max); }
  while (s.reps.length < ex.sets) s.reps.push(ex.max);
  if (s.rir === undefined || s.rir === null) s.rir = 2;
  if (s.weight === undefined || s.weight === null) s.weight = ex.weight;
  return s;
}

export function platesFor(total) {
  const t = num(total, 0);
  if (t <= BAR_WEIGHT) return { list: [], note: "EMPTY BAR · 0KG" };
  let perSide = (t - BAR_WEIGHT) / 2;
  const list = [];
  for (let i = 0; i < PLATES.length; i++) {
    const p = PLATES[i];
    while (perSide >= p - 0.001) { list.push(p); perSide -= p; }
  }
  return { list: list, note: perSide > 0.02 ? "CLOSEST LOADABLE" : "" };
}

export function plateHTML(res) {
  if (!res.list.length) return '<span class="mono" style="font-size:9px;color:var(--dim)">' + esc(res.note) + "</span>";
  const perSide = res.list.reduce((a, b) => a + b, 0);
  return res.list.map((p) => `<span class="plate" data-w="${p}">${p}</span>`).join("") +
    `<span class="mono plate-total">${perSide}kg / SIDE</span>`;
}

export function dayProtein(db, key) {
  const l = db.logs[key];
  if (!l || !Array.isArray(l.meals)) return 0;
  return l.meals.reduce((a, m) => a + num(m.p, 0), 0);
}

export function dayCal(db, key) {
  const l = db.logs[key];
  if (!l || !Array.isArray(l.meals)) return 0;
  return l.meals.reduce((a, m) => a + num(m.cal, 0), 0);
}