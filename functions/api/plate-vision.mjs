// functions/api/plate-vision.mjs
// Cloudflare Pages Function

const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";
const MODEL = "qwen/qwen3.8-27b"; // Active Groq vision model
const TIMEOUT_MS = 25000;

const SYSTEM_INSTRUCTION = `
*** CRITICAL KENYAN FOOD DICTIONARY & VISUAL RULES ***
You MUST prioritize Kenyan names and macros over international equivalents:
- **Ugali**: Thick white block of maize meal. (High carb). 1 fist = ~200g (approx 4g protein, 300 kcal).
- **Omena**: Small silver dried fish. (Very high protein). 100g = 45g protein, 290 kcal.
- **Matumbo**: Chopped cow intestines/tripe. 150g = 20g protein, 250 kcal.
- **Githeri**: Mixture of maize and beans. 1 cup = 200g (approx 15g protein, 250 kcal).
- **Ndengu**: Green grams / mung beans stew. 1 cup = 200g (approx 14g protein, 210 kcal).
- **Sukuma Wiki**: Sautéed collard greens. (Low calorie).
- **Nyama Choma**: Roasted/grilled meat. 150g = 35g protein, 350 kcal.
- **Mutura**: African sausage. 100g = 15g protein, 250 kcal.
- **Chapati**: Layered flatbread. 1 piece = 60g (approx 4g protein, 200 kcal).
- **Mandazi**: Fried dough balls. 1 piece = 50g (approx 3g protein, 200 kcal).
- **Pilau**: Spiced rice with meat chunks. 1 cup = 200g (approx 10g protein, 300 kcal).
- **Tilapia**: Whole fried fish. 300g = 60g protein, 400 kcal.
- **Smokie**: Thin, reddish-brown sausage. 1 piece = 30g (approx 5g protein, 80 kcal).
- **Indomie**: Yellow, curly instant noodles. 1 packet = 85g (approx 9g protein, 380 kcal).
- **Eggs**: 1 large egg = 50g (approx 6g protein, 70 kcal).
- **Rice**: 1 cup cooked = 150g (approx 4g protein, 200 kcal).

*** SCALE AWARENESS & PORTION ESTIMATION (CRITICAL) ***
You MUST look for scale reference objects in the image (hands, spoons, cans, plates, phones, bags). 
1. **Standard Plates**: If the food is on a standard plate or bowl, estimate the portion on that plate.
2. **Bulk Piles / Markets**: If the image shows a massive pile of food (like a market stall or bulk storage), DO NOT default to a standard 100g serving. Use the reference objects (like the cans in the image) to estimate the total weight of the *entire visible pile*. (e.g., If a standard can is 400g, and the pile is 50 times the size of the can, the pile is 20,000g).
3. **Calculate Macros for the VISIBLE portion**: If it's a massive pile, your macro estimate MUST reflect that massive pile (e.g., thousands of grams), not a single serving. 

*** CALCULATION RULES ***
1. Visually estimate the weight in grams of the portion shown.
2. Calculate the protein and calories based on the weight anchors above.
3. Do NOT underestimate.

You MUST return ONLY a JSON object in this exact format:
{"is_food": true, "name": "Omena", "p": 450, "cal": 2900, "breakdown": "Estimated 1kg visible pile based on can size"}.

If the image is clearly NOT food (e.g., a person, a car, a blank wall), return:
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
    temperature: 0.1,
    max_tokens: 400,
    messages: [
      { role: "system", content: SYSTEM_INSTRUCTION },
      {
        role: "user",
        content: [
          { type: "text", text: "Analyse this image carefully. Estimate the scale and portion size using visual anchors, calculate the macros for the visible portion, and return the strict JSON object." },
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