// functions/api/plate-vision.mjs
// Cloudflare Pages Function

const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";
const MODEL = "qwen/qwen3.8-27b"; // Active Groq vision model
const TIMEOUT_MS = 25000;

// The AI will ONLY identify the food and estimate weight. It will NOT do math.
const SYSTEM_INSTRUCTION = `
*** FORENSIC VISION PROTOCOL ***
You are an elite nutritionist AI. Your ONLY job is to identify the Kenyan foods on the plate and estimate their weight in grams. 

*** VISUAL DISAMBIGUATION RULES ***
- **White Rice**: Plain, white, fluffy grains. (Do NOT call it Wali wa Nazi unless you clearly see a thick, yellow/brown coconut sauce).
- **Maharagwe (Beans)**: Brown, red, or pinto beans stewed with tomatoes/onions.
- **Njahi**: Distinctly BLACK beans.
- **Githeri**: Whole maize kernels mixed with beans.
- **Indomie**: Yellow, long, curly instant noodles.
- **Ugali**: Solid white block of maize meal.
- **Omena**: Small silver dried fish.

*** WEIGHT ESTIMATION (CRITICAL) ***
Look at the plate, spoon, or hand in the image to gauge size. 
- A standard dinner plate is ~10 inches.
- A large mound of rice covering 1/4 of the plate is ~200-250g.
- A standard cup of beans is ~200g.
- A piece of meat the size of a fist is ~150g.

*** OUTPUT FORMAT ***
Return ONLY a JSON object. Do NOT calculate protein or calories. Just list the items and their estimated weights in grams.
Format:
{
  "is_food": true,
  "items": [
    {"name": "White Rice", "weight_g": 250},
    {"name": "Maharagwe (Beans)", "weight_g": 150}
  ]
}

If the image is clearly NOT food, return:
{"is_food": false, "name": "Non-food", "items": []}
`.trim();

// Hardcoded Macro Database (per 100g)
// This guarantees 100% math accuracy.
const MACRO_DB = {
  "ugali": { p: 2.5, cal: 120 },
  "white rice": { p: 2.5, cal: 130 },
  "wali wa nazi": { p: 2.5, cal: 175 },
  "maharagwe": { p: 5.5, cal: 120 }, // Beans
  "beans": { p: 5.5, cal: 120 },
  "njahi": { p: 6.0, cal: 105 }, // Black beans
  "ndengu": { p: 6.0, cal: 100 }, // Green grams
  "githeri": { p: 4.0, cal: 125 },
  "omena": { p: 53.0, cal: 350 },
  "egg": { p: 12.0, cal: 140 },
  "eggs": { p: 12.0, cal: 140 },
  "indomie": { p: 10.5, cal: 450 },
  "spaghetti": { p: 5.0, cal: 150 },
  "chapati": { p: 7.5, cal: 325 },
  "sukuma wiki": { p: 2.0, cal: 50 },
  "greens": { p: 2.0, cal: 50 },
  "beef": { p: 25.0, cal: 200 },
  "nyama choma": { p: 25.0, cal: 200 },
  "chicken": { p: 22.0, cal: 150 },
  "kuku": { p: 22.0, cal: 150 },
  "milk": { p: 3.5, cal: 60 },
  "uji": { p: 2.0, cal: 60 },
  "bread": { p: 8.0, cal: 260 },
  "biscuits": { p: 5.0, cal: 450 },
  "avocado": { p: 2.0, cal: 160 },
  "banana": { p: 1.0, cal: 90 },
  "mandazi": { p: 5.0, cal: 350 },
  "chips": { p: 3.0, cal: 300 },
  "cabbage": { p: 1.5, cal: 50 }
};

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

function fetchWithTimeout(url, opts, ms) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), ms);
  return fetch(url, { ...opts, signal: ctrl.signal }).finally(() => clearTimeout(t));
}

export async function onRequest(context) {
  const req = context.request;
  const apiKey = context.env.GROQ_API_KEY;

  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "Content-Type",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
      },
    });
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
    temperature: 0.0, // Zero temperature for strict adherence
    max_tokens: 300,
    messages: [
      { role: "system", content: SYSTEM_INSTRUCTION },
      {
        role: "user",
        content: [
          { type: "text", text: "Identify the foods and estimate their weights in grams. Output ONLY the strict JSON." },
          { type: "image_url", image_url: { url: "data:image/jpeg;base64," + image } },
        ],
      },
    ],
  };

  try {
    const res = await fetchWithTimeout(
      GROQ_URL,
      {
        method: "POST",
        headers: {
          "Authorization": "Bearer " + apiKey,
          "Content-Type": "application/json",
          "Accept": "application/json",
        },
        body: JSON.stringify(payload),
      },
      TIMEOUT_MS
    );

    if (!res.ok) {
      const errorText = await res.text();
      return json(reject(`Vision service error (${res.status}): ${errorText.substring(0, 50)}`), 200);
    }

    const data = await res.json();
    const rawContent = data?.choices?.[0]?.message?.content;
    const parsed = extractJSON(rawContent);

    if (!parsed || !parsed.is_food || !Array.isArray(parsed.items) || parsed.items.length === 0) {
      return json(reject("Rejected: vision model returned no usable data."));
    }

    // === THE JAVASCRIPT DOES THE MATH ===
    let totalP = 0;
    let totalCal = 0;
    let breakdownParts = [];
    let itemNames = [];

    parsed.items.forEach(item => {
      // Find the best match in the database
      const nameLower = item.name.toLowerCase();
      let matchedKey = Object.keys(MACRO_DB).find(k => nameLower.includes(k));
      
      // Default to a generic profile if unknown
      let macros = matchedKey ? MACRO_DB[matchedKey] : { p: 5.0, cal: 150 }; 
      
      const weight = Number(item.weight_g) || 0;
      if (weight > 0) {
        const itemP = (weight / 100) * macros.p;
        const itemCal = (weight / 100) * macros.cal;
        
        totalP += itemP;
        totalCal += itemCal;
        
        itemNames.push(item.name);
        breakdownParts.push(`${weight}g ${item.name}: ${itemP.toFixed(1)}g P, ${Math.round(itemCal)} kcal`);
      }
    });

    // Final Sanity Check
    if (totalCal === 0) {
      return json(reject("Rejected: could not calculate macros."));
    }

    return json({
      is_food: true,
      name: itemNames.join(" & "),
      p: Math.round(totalP * 10) / 10,
      cal: Math.round(totalCal),
      breakdown: breakdownParts.join(" | ")
    }, 200);

  } catch (err) {
    const aborted = err && err.name === "AbortError";
    return json(reject(aborted ? "Rejected: vision request timed out." : "Rejected: vision service unavailable."), 200);
  }
}