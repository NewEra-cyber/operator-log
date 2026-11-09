import { TRAINING, STAPLES, MEAL_PLAN, MILESTONES, POSES, BLUEPRINTS, PLATES, BAR_WEIGHT, formatPose } from './data.js';
import { esc, fmtDate, dayLetter, num, fmtRest, addDays, ymd, pad2 } from './utils.js';
export function viewMission(db, state) {
  const dateKey = state.missionDate || ymd();
  const day = TRAINING.filter((d) => d.key === state.dayKey)[0] || TRAINING[0];
  const session = getSession(db, day.key, dateKey);

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

  return `
    <section class="pad">
      <div class="day-strip">${pills}</div>
      <div class="card">
        <div class="row between">
          <div>
            <div class="kicker flex-between">
              ${day.tag} · ${dateKey}
              <button class="mono btn-date" data-act="open-calendar" data-target="mission" data-date="${dateKey}">${dateKey} 📅</button>
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
    </section>
  `;
}

function exCardHTML(db, session, ex) {
  const s = getExState(session, ex, db);
  const best = db.history[ex.id];
  const allDone = s.sets.every(Boolean) && s.sets.length > 0;
  const overload = allDone && s.reps.every((r) => num(r, 0) >= ex.max);
  const target = num(s.weight, 0) + ex.inc;

  const bestHTML = best
    ? `<div class="best-badge">◈ PREVIOUS BEST <b>${best.weight}KG</b>${best.reps != null ? " × " + best.reps : ""}${best.date ? " · " + esc(best.date) : ""}</div>`
    : "";

  const setsHTML = s.sets.map((on, i) =>
    `<div class="set-item ${on ? "done" : ""}">
      <button class="set-btn" data-act="toggle-set" data-ex="${ex.id}" data-i="${i}">${on ? "✓" : (i + 1)}</button>
      <input class="reps-in mono" type="number" inputmode="numeric" min="0" max="99" value="${s.reps[i]}" data-act="ex-reps" data-ex="${ex.id}" data-i="${i}" />
    </div>`
  ).join("");

  const rirHTML = [2, 1, 0].map((v) =>
    `<button class="${num(s.rir) === v ? "on" : ""}" data-act="set-rir" data-ex="${ex.id}" data-v="${v}">${v}</button>`
  ).join("");

  return `
    <article class="ex-card" id="card-${ex.id}">
      <div class="ex-top">
        <div class="ex-id">
          <h3 class="ex-name" data-act="open-history" data-ex="${ex.id}">${esc(ex.name)}</h3>
          <div class="ex-meta">${ex.sets} × ${ex.min}–${ex.max}${ex.recovery ? " REPS/MIN" : " REPS"} · REST ${fmtRest(ex.rest)}</div>
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
            <span class="lbl">PLATE CALC · 20KG BAR</span>
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
  if (state.refuelView === 'plan') return viewMealPlan(state);

  const key = state.nutDate;
  const log = db.logs[key] || { meals: [] };
  const meals = Array.isArray(log.meals) ? log.meals : [];
  const target = num(db.settings.proteinTarget, 105) || 105;
  const p = meals.reduce((a, m) => a + num(m.p, 0), 0);
  const cal = meals.reduce((a, m) => a + num(m.cal, 0), 0);
  const pct = Math.max(0, Math.min(1, p / target));

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
      <div class="flex-row mb-4">
        <button class="act-btn ${state.refuelView === 'log' ? 'primary' : ''} btn-tab" data-act="refuel-toggle" data-view="log">DAILY LOG</button>
        <button class="act-btn ${state.refuelView === 'plan' ? 'primary' : ''} btn-tab" data-act="refuel-toggle" data-view="plan">MEAL PROTOCOL</button>
      </div>

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

      <button class="mono btn-calendar mb-4" data-act="open-calendar" data-target="nut" data-date="${key}">${fmtDate(key)} 📅</button>

      <div class="card">
        <div class="kicker mb-9">WATER INTAKE</div>
        <div class="water-row">
          ${Array.from({ length: 5 }).map((_, i) => {
    const active = (log.water || 0) > i;
    return `<button data-act="add-water" data-i="${i + 1}" class="water-btn ${active ? '' : 'inactive'}">💧</button>`;
  }).join('')}
        </div>
      </div>

      <div class="card">
        <div class="kicker mb-8">7-DAY PERFORMANCE MATRIX</div>
        <div class="matrix">${matrix}</div>
        <div class="mono stat-label mt-8">GREEN = 105G PROTEIN TARGET ACHIEVED</div>
      </div>

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
      <div class="day-strip mb-12">${dayPills}</div>
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

      <!-- NEW SHOPPING LIST CARD -->
      <div class="kicker mt-16 mb-4">WEEKLY EXTRAS TO BUY</div>
      <div class="card" style="border-left: 3px solid var(--primary);">
        <ul style="list-style: none; padding: 0; margin: 0; font-size: 13px; color: var(--muted); line-height: 1.8;">
          <li>🛒 <b>Eggs:</b> 4 (about KES 60)</li>
          <li>🛒 <b>Bread:</b> 2 loaves (about KES 140)</li>
          <li>🛒 <b>Peanut butter:</b> 1 jar (about KES 250)</li>
          <li>🛒 <b>Margarine:</b> small tub every 2 weeks (about KES 100)</li>
          <li>🛒 <b>Groundnuts:</b> ½ kg (about KES 150)</li>
          <li>🛒 <b>Milk and mala:</b> about 3 litres (about KES 300)</li>
          <li>🛒 <b>Omena:</b> ¼ kg (about KES 100-150)</li>
          <li>🛒 <b>Bananas and oranges:</b> about KES 200</li>
          <li>🛒 <b>Sweet potatoes:</b> 3 large (about KES 100)</li>
        </ul>
        <div class="mono mt-10 color-orange" style="font-size: 12px; border-top: 1px dashed var(--border); padding-top: 10px;">
          ESTIMATED TOTAL: KES 1,400 - 1,500<br>
          <span class="color-muted" style="font-size: 11px;">(Beans, ndengu & githeri from family pot)</span>
        </div>
      </div>
    </div>
  `;
}

export function viewVault(db, state) {
  const blocks = MILESTONES.map((m) => {
    const p = db.photos[m.k] || {};
    const slots = POSES.map((pose) =>
      `<button class="photo-slot" data-act="photo" data-ms="${m.k}" data-pose="${pose}">
        ${p[pose] ? `<img src="${p[pose]}" alt="${m.label} ${pose}" loading="lazy" />` : `<span class="ph-empty"><span>+</span><em>${formatPose(pose)}</em></span>`}
      </button>`
    ).join("");
    return `<div class="ms-block">
      <div class="ms-head"><h3>${m.label}</h3><span>${m.sub}</span></div>
      <div class="ms-grid">${slots}</div>
    </div>`;
  }).join("");

  const poseOpts = POSES.map((p) =>
    `<option value="${p}"${state.cmpPose === p ? " selected" : ""}>${formatPose(p)}</option>`
  ).join("");
  const imgA = (db.photos[state.cmpA] || {})[state.cmpPose];
  const imgB = (db.photos[state.cmpB] || {})[state.cmpPose];

  return `
    <section class="pad">
      <div class="card">
        <div class="kicker">8-WEEK PHYSIQUE VAULT</div>
        <h2 class="day-title mt-4">BI-WEEKLY MILESTONES</h2>
        <div class="dim small mt-5">Photos are compressed on-device before storage. Tap a slot to capture or upload.</div>
      </div>
      ${blocks}

      <div class="card">
        <div class="kicker mb-9">BODY WEIGHT TRACKER</div>
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
        <div class="kicker mb-9">SIDE-BY-SIDE COMPARISON</div>
        <div class="sel-row">
          <select data-act="cmp-a">${MILESTONES.map((m) => `<option value="${m.k}"${state.cmpA === m.k ? " selected" : ""}>${m.label}</option>`).join("")}</select>
          <select data-act="cmp-pose">${poseOpts}</select>
          <select data-act="cmp-b">${MILESTONES.map((m) => `<option value="${m.k}"${state.cmpB === m.k ? " selected" : ""}>${m.label}</option>`).join("")}</select>
        </div>
        <div class="cmp-grid">
          <div class="cmp-slot">
            ${imgA ? `<img src="${imgA}" alt="A" />` : `<span class="ph-empty"><em>NO IMAGE</em></span>`}
            <div class="tag">${state.cmpA.toUpperCase()} · ${state.cmpPose.toUpperCase()}</div>
          </div>
          <div class="cmp-slot">
            ${imgB ? `<img src="${imgB}" alt="B" />` : `<span class="ph-empty"><em>NO IMAGE</em></span>`}
            <div class="tag">${state.cmpB.toUpperCase()} · ${state.cmpPose.toUpperCase()}</div>
          </div>
        </div>
      </div>
    </section>
  `;
}

export function viewBlueprint() {
  const cards = BLUEPRINTS.map((bp) =>
    `<button class="bp-card ${bp.full ? 'full-width' : ''}" data-act="open-bp" data-key="${bp.key}">
      <img class="bp-img" src="${bp.src}" alt="${esc(bp.label)}" loading="lazy" />
      <span class="bp-label">${esc(bp.label)}</span>
    </button>`
  ).join("");

  return `
    <section class="pad">
      <div class="card">
        <div class="kicker">OPERATOR BLUEPRINT DECK</div>
        <h2 class="day-title mt-4">VISUAL TRAINING CARDS</h2>
        <div class="dim small mt-5">Tap any card to open the zoomable full-screen viewer.</div>
      </div>
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

  return `
    <section class="pad">
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
  if (t <= BAR_WEIGHT) return { list: [], note: "EMPTY BAR · 20KG" };
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