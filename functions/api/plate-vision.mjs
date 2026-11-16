// functions/api/plate-vision.mjs
// Cloudflare Pages Function
//
// DESIGN: the vision model only IDENTIFIES foods (with preparation) and ESTIMATES grams.
// All protein / calorie maths happens here from MACRO_DB. Every item is returned with its
// own per-100g values, so the client can recalculate after the user edits a weight
// without keeping a second macro table (app.js no longer has one).

const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";
const MODEL = "qwen/qwen3.8-27b";
const TIMEOUT_MS = 25000;

const SYSTEM_INSTRUCTION = `
*** FORENSIC VISION PROTOCOL ***
You are an elite nutritionist AI. Your job is to identify foods, state HOW they are prepared, and estimate their weight in grams AS SERVED ON THE PLATE.

*** PREPARATION RULES (CRITICAL) ***
Always put the preparation in the item name, using ONLY these forms where they apply:
- "Omena stew": omena cooked with tomato/onion/sauce (glossy, saucy, brown/red). THIS IS THE COMMON CASE.
- "Omena (dry)": dry-fried / crispy omena with NO sauce, or raw dried omena.
- "Spaghetti (boiled)": plain pasta, no visible oil or vegetables.
- "Spaghetti (fried)": pasta stir-fried/sautéed, glossy, mixed with tomato/onion/greens.
- "Pilau", "White rice", "Ugali", etc. for the other foods below.
Never describe a stewed dish as dry. Weights are COOKED weights as served, never dry/uncooked weights.

*** VISUAL DISAMBIGUATION RULES ***
- **Ugali**: A SOLID, CUT BLOCK of white maize meal.
- **White Rice**: A LOOSE PILE of separate, short oval grains.
- **Pasta/Spaghetti**: Long (or broken) thin cylindrical yellow/tan strands, often mixed with vegetables. If you see strands, it is pasta. DO NOT CALL THIS WHITE RICE.
- **Pilau**: Brown/spiced separate rice grains.
- **Scrambled Eggs**: Yellow, fluffy, curdled texture mixed with tomatoes/onions.
- **Maharagwe (Beans)**: LARGER, kidney-shaped beans.
- **Ndengu (Green Grams)**: SMALL, round, yellowish-green seeds.
- **Omena**: Small silver dried fish (whole, with heads and eyes).
- **Sukuma Wiki**: Finely chopped, dark green leafy vegetables.

*** WEIGHT ESTIMATION (cooked, as served) ***
- A standard dinner plate is ~10 inches.
- Ugali: 1 block is ~200g-250g.
- Pasta/Rice pile: a large serving is ~200g-250g.
- Omena stew: a fish-heavy portion on a plate is ~100g-130g.
- Biscuit packets: 1 small packet = 30g.

*** OUTPUT FORMAT ***
Return ONLY a JSON object. Do NOT calculate protein or calories.
{
  "is_food": true,
  "items": [
    {"name": "Spaghetti (fried)", "weight_g": 250},
    {"name": "Omena stew", "weight_g": 110}
  ]
}

If the image is clearly NOT food, return:
{"is_food": false, "name": "Non-food", "items": []}
`.trim();

// Per 100 g AS SERVED (cooked). Values for stew / fried dishes are estimates, tune to taste.
const MACRO_DB = {
  // STAPLES & CARBS
  "ugali": { p: 2.5, cal: 120 },
  "white rice": { p: 2.5, cal: 130 },
  "wali wa nazi": { p: 2.5, cal: 175 },
  "chapati": { p: 7.5, cal: 325 },
  "mukimo": { p: 2.8, cal: 132 },
  "irio": { p: 2.4, cal: 124 },
  "matoke": { p: 1.3, cal: 97 },
  "pilau": { p: 5.3, cal: 160 },
  "biryani": { p: 6.3, cal: 157 },
  "kachumbari": { p: 1.0, cal: 35 },
  "viazi karai": { p: 2.0, cal: 193 },
  "chips mayai": { p: 5.1, cal: 186 },
  "kimanga": { p: 3.0, cal: 140 },
  "muthokoi": { p: 3.7, cal: 120 },
  "indomie": { p: 10.5, cal: 450 },
  "spaghetti boiled": { p: 5.0, cal: 150 },
  "spaghetti fried": { p: 6.0, cal: 190 },
  "chips": { p: 3.0, cal: 300 },

  // PROTEINS & MEATS
  "nyama choma": { p: 22.0, cal: 192 },
  "kuku choma": { p: 14.0, cal: 128 },
  "kuku kienyeji": { p: 10.0, cal: 93 },
  "samaki wa kupaka": { p: 10.5, cal: 102 },
  "samaki mkaango": { p: 12.7, cal: 150 },
  "omena dry": { p: 53.0, cal: 350 },   // dry-fried / dried only
  "omena stew": { p: 22.0, cal: 210 },  // cooked with tomato/onion/oil
  "mutura": { p: 12.0, cal: 190 },
  "beef stew": { p: 11.2, cal: 136 },
  "mbuzi wet fry": { p: 18.0, cal: 184 },
  "kamande": { p: 5.8, cal: 96 },
  "ndengu": { p: 6.3, cal: 100 },
  "green grams": { p: 6.3, cal: 100 },
  "maharagwe ya nazi": { p: 5.4, cal: 121 },
  "maharagwe": { p: 5.5, cal: 120 },
  "beans": { p: 5.5, cal: 120 },
  "njahi": { p: 5.8, cal: 104 },
  "egg": { p: 12.0, cal: 140 },
  "eggs": { p: 12.0, cal: 140 },
  "scrambled eggs": { p: 12.0, cal: 140 },

  // VEGETABLES & SOUPS
  "sukuma wiki": { p: 2.0, cal: 53 },
  "managu": { p: 3.3, cal: 80 },
  "terere": { p: 2.7, cal: 43 },
  "sagaa": { p: 3.3, cal: 47 },
  "mrenda": { p: 2.7, cal: 40 },
  "kundeh": { p: 4.0, cal: 60 },
  "kandolo": { p: 2.0, cal: 37 },
  "mshirikale": { p: 2.7, cal: 47 },
  "supu ya ndewe": { p: 5.0, cal: 60 },
  "cabbage": { p: 1.3, cal: 50 },
  "mchicha": { p: 2.0, cal: 33 },
  "githeri": { p: 4.0, cal: 127 },
  "greens": { p: 2.0, cal: 53 },

  // BREAKFAST & SNACKS
  "mandazi": { p: 8.0, cal: 440 },
  "mahamri": { p: 8.0, cal: 480 },
  "nduma": { p: 2.0, cal: 93 },
  "ngwaci": { p: 1.3, cal: 87 },
  "mihogo ya kuchemsha": { p: 1.3, cal: 160 },
  "mihogo ya kukaanga": { p: 1.3, cal: 240 },
  "smokie pasua": { p: 7.0, cal: 150 },
  "samosa": { p: 10.0, cal: 320 },
  "kaimati": { p: 4.0, cal: 360 },
  "mkate wa sinia": { p: 3.0, cal: 190 },
  "chapo-smokie": { p: 6.5, cal: 205 },
  "bread": { p: 8.3, cal: 266 },
  "biscuits": { p: 6.6, cal: 500 },
  "lemon cream biscuits": { p: 6.6, cal: 500 },
  "groundnuts": { p: 26.0, cal: 567 },

  // DRINKS & FRUITS
  "chai ya maziwa": { p: 1.6, cal: 48 },
  "maziwa lala": { p: 3.2, cal: 60 },
  "uji": { p: 1.7, cal: 60 },
  "mangoes": { p: 0.7, cal: 87 },
  "avocado": { p: 2.0, cal: 160 },
  "passion fruit": { p: 2.0, cal: 70 },
  "milk": { p: 3.2, cal: 60 },
  "banana": { p: 1.0, cal: 90 }
};

// Preparation-aware routing. Checked BEFORE the generic longest-substring match, so the
// model's wording ("Omena", "Fried Spaghetti", "dry omena") always lands on the right row.
const norm = (s) => String(s || "").toLowerCase().replace(/[^a-z0-9 ]+/g, " ").replace(/\s+/g, " ").trim();
const DRY_RE = /\b(dry|dried|raw|uncooked|crispy|crunchy)\b/;
const FRIED_RE = /\b(fried|stir|stirfried|saute|sauteed|sautéed|vegetables|veg|mixed)\b/;

function resolveMacros(name) {
  const n = norm(name);

  if (/\b(omena|dagaa|silver fish|silverfish)\b/.test(n)) {
    const key = DRY_RE.test(n) && !/\b(stew|sauce|tomato|wet)\b/.test(n) ? "omena dry" : "omena stew";
    return { key, ...MACRO_DB[key] };
  }
  if (/\b(spaghetti|pasta|noodles|macaroni)\b/.test(n) && !/\bindomie\b/.test(n)) {
    const key = FRIED_RE.test(n) ? "spaghetti fried" : "spaghetti boiled";
    return { key, ...MACRO_DB[key] };
  }

  const key = Object.keys(MACRO_DB)
    .sort((a, b) => b.length - a.length)
    .find((k) => n.includes(norm(k)));
  if (key) return { key, ...MACRO_DB[key] };
  return { key: null, p: 5.0, cal: 150 }; // generic fallback, flagged to the client
}

function json(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "no-store",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Headers": "Content-Type",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
    },
  });
}

function reject(breakdown = "Rejected: not a food item.") {
  return { is_food: false, name: "Non-food", p: 0, cal: 0, breakdown };
}

function extractJSON(text) {
  if (!text) return null;
  let t = String(text).trim();
  t = t.replace(/^```(?:json)?/i, "").replace(/```$/, "").trim();
  const start = t.indexOf("{");
  const end = t.lastIndexOf("}");
  if (start === -1 || end === -1 || end <= start) return null;
  try { return JSON.parse(t.slice(start, end + 1)); } catch { return null; }
}

export async function onRequest(context) {
  const req = context.request;
  const apiKey = context.env.GROQ_API_KEY;

  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: { "Access-Control-Allow-Origin": "*" } });
  }

  if (req.method !== "POST") return json(reject("Rejected: POST required."), 405);

  let image = "";
  try {
    const body = await req.json();
    image = typeof body?.image === "string" ? body.image : "";
  } catch {
    return json(reject("Rejected: invalid request body."), 400);
  }

  image = image.replace(/^data:image\/[a-zA-Z0-9.+-]+;base64,/, "").trim();

  if (!image || image.length < 128) return json(reject("Rejected: no usable image supplied."), 400);
  if (!apiKey) return json(reject("Vision service is not configured (missing GROQ_API_KEY)."), 500);

  const payload = {
    model: MODEL,
    temperature: 0.0,
    max_tokens: 400,
    messages: [
      { role: "system", content: SYSTEM_INSTRUCTION },
      {
        role: "user",
        content: [
          { type: "text", text: "Identify the foods/drinks, include how each is prepared in the name, and estimate cooked weights in grams. Output ONLY the strict JSON." },
          { type: "image_url", image_url: { url: "data:image/jpeg;base64," + image } },
        ],
      },
    ],
  };

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const res = await fetch(GROQ_URL, {
      method: "POST",
      headers: {
        "Authorization": "Bearer " + apiKey,
        "Content-Type": "application/json",
        "Accept": "application/json",
      },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });

    if (!res.ok) {
      const errorText = await res.text();
      console.error("[plate-vision] Groq error:", errorText);
      return json(reject(`Vision service error (${res.status}): ${errorText.substring(0, 50)}`), 200);
    }

    const data = await res.json();
    const rawContent = data?.choices?.[0]?.message?.content;
    const parsed = extractJSON(rawContent);

    if (!parsed || !parsed.is_food || !Array.isArray(parsed.items) || parsed.items.length === 0) {
      return json(reject("Rejected: vision model returned no usable data."));
    }

    const items = [];
    parsed.items.slice(0, 12).forEach((raw) => {
      const name = String(raw?.name || "").trim().slice(0, 60);
      const weight = Math.min(1500, Math.max(0, Number(raw?.weight_g) || 0));
      if (!name || weight <= 0) return;

      const m = resolveMacros(name);
      items.push({
        name,
        weight_g: Math.round(weight),
        p100: m.p,
        cal100: m.cal,
        p: Math.round((weight / 100) * m.p * 10) / 10,
        cal: Math.round((weight / 100) * m.cal),
        estimated: m.key === null,
      });
    });

    if (items.length === 0) return json(reject("Rejected: could not calculate macros."));

    const totalP = items.reduce((s, i) => s + i.p, 0);
    const totalCal = items.reduce((s, i) => s + i.cal, 0);

    return json({
      is_food: true,
      name: items.map((i) => i.name).join(" & "),
      p: Math.round(totalP * 10) / 10,
      cal: Math.round(totalCal),
      breakdown: items.map((i) => `${i.weight_g}g ${i.name}: ${i.p.toFixed(1)}g P, ${i.cal} kcal`).join(" | "),
      items,
    }, 200);

  } catch (err) {
    const aborted = err && err.name === "AbortError";
    return json(reject(aborted ? "Rejected: vision request timed out." : "Rejected: vision service unavailable."), 200);
  } finally {
    clearTimeout(timer);
  }
}
