// functions/api/plate-vision.mjs
// Cloudflare Pages Function

const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";
const MODEL = "qwen/qwen3.8-27b"; 
const TIMEOUT_MS = 25000;

const SYSTEM_INSTRUCTION = `
*** FORENSIC VISION PROTOCOL ***
You are an elite nutritionist AI. Your ONLY job is to identify the Kenyan foods on the plate and estimate their weight in grams. 

*** VISUAL DISAMBIGUATION RULES (CRITICAL) ***
- **Ugali**: Look for a SOLID, CUT BLOCK or DOME of white maize meal. It holds its shape rigidly.
- **White Rice**: Look for a LOOSE PILE of individual, fluffy grains. It flows and shifts.
- **Ndengu (Green Grams)**: Look for SMALL, round, yellowish-green seeds.
- **Maharagwe (Beans)**: Look for LARGER, kidney-shaped, reddish-brown beans.
- **Njahi**: Look for distinctly BLACK beans.
- **Githeri**: Look for whole maize kernels mixed with beans.
- **Wali wa Nazi**: Only call it this if you clearly see a thick, yellow/brown coconut sauce.
- **Indomie**: Yellow, long, curly instant noodles.
- **Omena**: Small silver dried fish.

*** WEIGHT ESTIMATION & DENSITY ANCHORS (CRITICAL) ***
Do NOT guess weight based on how full the bowl is. Dense foods weigh more than they look, and fluffy foods weigh less.
- **A standard dinner plate** is ~10 inches.
- **Ugali**: 1 standard block/serving is ~200g. Do not exceed 250g unless the block is visibly massive.
- **Rice**: 1 cup (a large scoop) is ~150g-200g.
- **Stews (Omena/Beans/Ndengu)**: A standard bowl of stew is ~250g total. 
- **CRITICAL OMENA RULE**: Dried Omena is extremely dense. A massive-looking bowl of Omena stew usually only contains **50g to 75g of DRY Omena**. If the bowl is full to the brim, cap the Omena estimate at **80g max**. Do NOT guess 150g+ for a single bowl.
- **Gravy/Sauce**: If the food is swimming in a milky/tomato sauce, estimate the sauce separately as "Stew Gravy" at ~100g per bowl.

*** OUTPUT FORMAT ***
Return ONLY a JSON object. Do NOT calculate protein or calories. Just list the items and their estimated weights in grams.
Format:
{
  "is_food": true,
  "items": [
    {"name": "Omena", "weight_g": 60},
    {"name": "Stew Gravy", "weight_g": 100}
  ]
}

If the image is clearly NOT food, return:
{"is_food": false, "name": "Non-food", "items": []}
`.trim();

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
  "spaghetti": { p: 5.0, cal: 150 },
  "chips": { p: 3.0, cal: 300 },

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
  "green grams": { p: 6.3, cal: 100 },
  "maharagwe ya nazi": { p: 5.4, cal: 121 },
  "maharagwe": { p: 5.5, cal: 120 },
  "beans": { p: 5.5, cal: 120 },
  "njahi": { p: 5.8, cal: 104 },
  "egg": { p: 12.0, cal: 140 },
  "eggs": { p: 12.0, cal: 140 },

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
  "stew gravy": { p: 2.0, cal: 150 }, // Added gravy fallback

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
  "biscuits": { p: 5.0, cal: 450 },
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
    const res = await fetch(GROQ_URL, {
      method: "POST",
      headers: {
        "Authorization": "Bearer " + apiKey,
        "Content-Type": "application/json",
        "Accept": "application/json",
      },
      body: JSON.stringify(payload),
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

    // JAVASCRIPT DOES THE MATH
    let totalP = 0;
    let totalCal = 0;
    let breakdownParts = [];
    let itemNames = [];

    parsed.items.forEach(item => {
      const nameLower = item.name.toLowerCase();
      let matchedKey = Object.keys(MACRO_DB).find(k => nameLower.includes(k));
      
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