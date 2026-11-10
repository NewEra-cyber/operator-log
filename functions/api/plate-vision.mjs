// functions/api/plate-vision.mjs
// Cloudflare Pages Function

const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";
const MODEL = "qwen/qwen3.8-27b"; // Active Groq vision model
const TIMEOUT_MS = 25000;

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

// EXHAUSTIVE KENYAN MACRO DATABASE (per 100g)
// Calculated from your 60-item list
const MACRO_DB = {
  // STAPLES & CARBS
  "ugali": { p: 2.5, cal: 120 },
  "sukuma wiki": { p: 2.0, cal: 53 },
  "githeri": { p: 4.0, cal: 127 },
  "chapati": { p: 7.5, cal: 325 },
  "mukimo": { p: 2.8, cal: 132 },
  "irio": { p: 2.4, cal: 124 },
  "matoke": { p: 1.3, cal: 97 },
  "wali wa nazi": { p: 2.5, cal: 175 },
  "white rice": { p: 2.5, cal: 130 },
  "pilau": { p: 5.3, cal: 160 },
  "biryani": { p: 6.3, cal: 157 },
  "kachumbari": { p: 1.0, cal: 35 },
  "viazi karai": { p: 2.0, cal: 193 },
  "chips mayai": { p: 5.1, cal: 186 },
  "kimanga": { p: 3.0, cal: 140 },
  "muthokoi": { p: 3.7, cal: 120 },

  // PROTEINS & MEATS
  "nyama choma": { p: 22.0, cal: 192 },
  "kuku choma": { p: 14.0, cal: 128 },
  "kuku kienyeji": { p: 10.0, cal: 93 },
  "samaki wa kupaka": { p: 10.5, cal: 102 },
  "samaki mkaango": { p: 12.7, cal: 150 },
  "omena": { p: 53.0, cal: 350 },
  "mutura": { p: 12.0, cal: 190 },
  "beef stew": { p: 11.2, cal: 136 },
  "mbuzi wet fry": { p: 18.0, cal: 184 },
  "kamande": { p: 5.8, cal: 96 },
  "ndengu": { p: 6.3, cal: 100 },
  "maharagwe ya nazi": { p: 5.4, cal: 121 },
  "maharagwe": { p: 5.5, cal: 120 },
  "beans": { p: 5.5, cal: 120 },
  "njahi": { p: 5.8, cal: 104 },
  "mayai boiro": { p: 12.0, cal: 170 },
  "egg": { p: 12.0, cal: 140 },
  "eggs": { p: 12.0, cal: 140 },

  // VEGETABLES & SOUPS
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

  // BREAKFAST, SNACKS & STREET FOOD
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
  "maandazi ya pasua": { p: 7.3, cal: 246 },
  "chapo-smokie": { p: 6.5, cal: 205 },
  "boflo": { p: 8.3, cal: 350 },
  "bread": { p: 8.3, cal: 266 },
  "biscuits": { p: 5.0, cal: 450 },
  "indomie": { p: 10.5, cal: 450 },
  "spaghetti": { p: 5.0, cal: 150 },
  "chips": { p: 3.0, cal: 300 },

  // FRUITS & DRINKS
  "chai ya maziwa": { p: 1.6, cal: 48 },
  "maziwa lala": { p: 3.2, cal: 60 },
  "uji": { p: 1.7, cal: 60 },
  "mangoes": { p: 0.7, cal: 87 },
  "avocado": { p: 2.0, cal: 160 },
  "passion fruit": { p: 2.0, cal: 70 },
  "ukwaju juice": { p: 0.2, cal: 44 },
  "milk": { p: 3.2, cal: 60 },
  "groundnuts": { p: 26.0, cal: 567 },
  "banana": { p: 1.0, cal: 90 },
  "greens": { p: 2.0, cal: 50 } // Generic fallback
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

    // === JAVASCRIPT DOES THE MATH ===
    let totalP = 0;
    let totalCal = 0;
    let breakdownParts = [];
    let itemNames = [];

    parsed.items.forEach(item => {
      // Find the best match in the database
      const nameLower = item.name.toLowerCase();
      let matchedKey = Object.keys(MACRO_DB).find(k => nameLower.includes(k));
      
      // Default to a generic profile if completely unknown
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