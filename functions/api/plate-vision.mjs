// functions/api/plate-vision.mjs
// Cloudflare Pages Function

const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";
const MODEL = "qwen/qwen3.8-27b"; // Active Groq vision model
const TIMEOUT_MS = 25000;

const SYSTEM_INSTRUCTION = `
*** OPERATOR LOG: GOD-LEVEL NUTRITION DATABASE & FORENSIC VISION PROTOCOL ***
You are an elite, forensic-level nutritionist AI. Your goal is to achieve the highest mathematically possible accuracy for Kenyan foods from a 2D image.

*** STEP 1: THE REFERENCE TABLE (MEMORIZE THESE ANCHORS) ***
--- STAPLES & CARBS ---
Ugali | 1 wedge (200g) | 5g P | 240 kcal
Sukuma Wiki | 1 cup (150g) | 3g P | 80 kcal
Githeri | 1 plate (300g) | 12g P | 380 kcal
Chapati | 1 piece (80g) | 6g P | 260 kcal
Mukimo | 1 cup (250g) | 7g P | 330 kcal
Irio | 1 cup (250g) | 6g P | 310 kcal
Matoke | 1 plate (300g) | 4g P | 290 kcal
Wali wa Nazi | 1 cup (160g) | 4g P | 280 kcal
Pilau | 1 plate (300g) | 16g P | 480 kcal
Biryani | 1 plate (350g) | 22g P | 550 kcal
Kachumbari | 1 bowl (100g) | 1g P | 35 kcal
Chips Mayai | 1 plate | 18g P | 650 kcal
Muthokoi | 1 plate (300g) | 11g P | 360 kcal
**Indomie (Instant Noodles)** | 1 packet (85g) | 9g P | 380 kcal
**Mihogo ya Kukaanga (Fried Cassava)** | 1 cup (150g) | 2g P | 360 kcal

--- PROTEINS & MEATS ---
Nyama Choma | 250g | 55g P | 480 kcal
Kuku Choma | 1 quarter chicken | 35g P | 320 kcal
Kuku Kienyeji | 1 bowl | 30g P | 280 kcal
Samaki wa Kupaka | 1 whole fish | 42g P | 410 kcal
Samaki Mkaango | 1 whole Tilapia | 38g P | 450 kcal
Omena | 100g | 53g P | 350 kcal
Mutura | 1 piece (10cm) | 12g P | 190 kcal
Beef Stew | 1 bowl (250g) | 28g P | 340 kcal
Mbuzi Wet Fry | 1 plate (250g) | 45g P | 460 kcal
Kamande (Lentils) | 1 cup (240g) | 14g P | 230 kcal
Ndengu (Mung Beans) | 1 cup (240g) | 15g P | 240 kcal
Maharagwe ya Nazi | 1 cup (240g) | 13g P | 290 kcal
Njahi | 1 cup (240g) | 14g P | 250 kcal
**Eggs** | 1 large egg | 6g P | 70 kcal

--- VEGETABLES & SOUPS ---
Managu | 1 cup | 5g P | 120 kcal
Terere | 1 cup | 4g P | 65 kcal
Sagaa | 1 cup | 5g P | 70 kcal
Mrenda | 1 cup | 4g P | 60 kcal
Kundeh | 1 cup | 6g P | 90 kcal
Kandolo | 1 cup | 3g P | 55 kcal
Supu ya Ndewe | 1 bowl (300ml) | 15g P | 180 kcal
Cabbage | 1 cup | 2g P | 75 kcal
Mchicha | 1 cup | 3g P | 50 kcal

--- BREAKFAST, SNACKS & STREET FOOD ---
Mandazi | 1 piece | 4g P | 220 kcal
Mahamri | 1 piece | 4g P | 240 kcal
Nduma | 1 slice (150g) | 3g P | 140 kcal
Ngwaci | 1 potato (150g) | 2g P | 130 kcal
Mihogo ya Kuchemsha | 1 piece (150g) | 2g P | 240 kcal
Smokie Pasua | 1 smokie + kachumbari | 7g P | 150 kcal
Samosa | 1 piece | 5g P | 160 kcal
Kaimati | 3 balls | 2g P | 180 kcal
Mkate wa Sinia | 1 slice | 3g P | 190 kcal
Chapo-Smokie | 1 chapati + smokie | 13g P | 410 kcal

--- FRUITS & DRINKS ---
Chai ya Maziwa | 1 mug (250ml) | 4g P | 120 kcal
Maziwa Lala | 1 glass (250ml) | 8g P | 150 kcal
Uji | 1 cup (300ml) | 5g P | 180 kcal
Mangoes | 1 medium | 1g P | 130 kcal
Avocado | Half medium | 2g P | 160 kcal
Ukwaju Juice | 1 glass (250ml) | 0.5g P | 110 kcal

*** STEP 2: VISUAL DISAMBIGUATION (CRITICAL) ***
Before guessing, look closely at the texture:
- **Indomie (Noodles)**: Look for long, curly, yellow/white strings. They intertwine. 
- **Mihogo (Cassava)**: Look for solid, chunky, irregular blocks (white or golden brown). They do NOT form long curly strings.
- **Mukimo**: Look for a green-tinted, mashed consistency.
- **Githeri**: Look for distinct, separate whole maize kernels and beans.

*** STEP 3: FORENSIC VOLUMETRIC REASONING ***
1. **FIND THE ANCHOR**: Use the plate size, fork, spoon, or hand to gauge size. (The plate in the image is a standard dinner plate).
2. **DECOMPOSE**: Identify EVERY item. 
3. **ESTIMATE WEIGHT**: If it's a large plate of noodles, estimate 2 packets (~170g). If it's 1 packet, estimate 85g. 
4. **CALCULATE**: Use the reference table strictly.
   - Example: 2 packets Indomie = 18g Protein, 760 kcal.
   - Example: 1 boiled egg = 6g Protein, 70 kcal.
   - Total = 24g Protein, 830 kcal.

*** STEP 4: SELF-CORRECTION CHECK ***
Before outputting, ask yourself: 
- "Does the 'name' field accurately reflect the items in the 'breakdown' field?" 
- If the breakdown says "noodles", the name CANNOT be "cassava".

You MUST return ONLY a JSON object in this exact format:
{"is_food": true, "name": "Indomie & Egg", "p": 24, "cal": 830, "breakdown": "2 packets Indomie (~170g): 18g P, 760 kcal. 1 boiled egg: 6g P, 70 kcal."}

If the image is clearly NOT food, return:
{"is_food": false, "name": "Non-food", "p": 0, "cal": 0, "breakdown": "Rejected: not a food item."}
`.trim();

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

function sanitise(obj) {
  if (!obj || typeof obj !== "object") return reject("Rejected: unreadable image.");
  const isFood = obj.is_food === true || obj.is_food === "true";
  const p = Number(obj.p);
  const cal = Number(obj.cal);

  if (!isFood) {
    return reject(typeof obj.breakdown === "string" ? obj.breakdown : undefined);
  }

  return {
    is_food: true,
    name: String(obj.name || "Unidentified Meal").slice(0, 80),
    p: Number.isFinite(p) ? Math.max(0, Math.round(p * 10) / 10) : 0,
    cal: Number.isFinite(cal) ? Math.max(0, Math.round(cal)) : 0,
    breakdown: String(obj.breakdown || "Estimated from photo.").slice(0, 240),
  };
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

  if (req.method !== "POST") {
    return json({ ...reject("Rejected: POST required."), error: "method_not_allowed" });
  }

  let image = "";
  try {
    const body = await req.json();
    image = typeof body?.image === "string" ? body.image : "";
  } catch {
    return json({ ...reject("Rejected: invalid request body."), error: "bad_body" });
  }

  image = image.replace(/^data:image\/[a-zA-Z0-9.+-]+;base64,/, "").trim();

  if (!image || image.length < 128) {
    return json({ ...reject("Rejected: no usable image supplied."), error: "no_image" });
  }

  if (!apiKey) {
    return json({
      ...reject("Vision service is not configured (missing GROQ_API_KEY)."),
      error: "no_api_key",
    });
  }

  const payload = {
    model: MODEL,
    temperature: 0.0, // Zero temp for strict calculation
    max_tokens: 400,
    messages: [
      { role: "system", content: SYSTEM_INSTRUCTION },
      {
        role: "user",
        content: [
          { type: "text", text: "Analyse this image using the Forensic Volumetric Reasoning and Self-Correction protocols. Output ONLY the strict JSON object." },
          { type: "image_url", image_url: { url: "data:image/jpeg;base64," + image } },
        ],
      },
    ],
  };

  const callOnce = async () =>
    fetchWithTimeout(
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

  try {
    let res = await callOnce();

    if (res.status === 429 || res.status >= 500) {
      await new Promise((r) => setTimeout(r, 700));
      res = await callOnce();
    }

    if (!res.ok) {
      const errorText = await res.text();
      console.error("[plate-vision] Groq error response:", errorText);
      
      if (res.status === 400 || res.status === 404) {
        return json({ 
          ...reject(`Model '${MODEL}' not found on Groq. Please verify.`), 
          error: "model_not_found" 
        });
      }

      return json({ ...reject(`Vision service error (${res.status}).`), error: "upstream_failure" });
    }

    const data = await res.json();
    const rawContent = data?.choices?.[0]?.message?.content;

    let parsed = null;
    if (rawContent && typeof rawContent === "object") {
      parsed = rawContent;
    } else if (typeof rawContent === "string") {
      parsed = extractJSON(rawContent);
    }

    if (!parsed) {
      return json(reject("Rejected: vision model returned no usable data."));
    }

    return json(sanitise(parsed), 200);
  } catch (err) {
    const aborted = err && err.name === "AbortError";
    return json({
      ...reject(aborted ? "Rejected: vision request timed out." : "Rejected: vision service unavailable."),
      error: aborted ? "timeout" : "upstream_failure",
    });
  }
}