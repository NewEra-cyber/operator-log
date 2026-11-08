// functions/api/plate-vision.mjs
const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";
const MODEL = "llama-3.2-11b-vision-preview"; // Valid Groq vision model
const TIMEOUT_MS = 25000;

const SYSTEM_INSTRUCTION = `
*** CRITICAL KENYAN FOOD DICTIONARY & VISUAL RULES ***
You MUST prioritize Kenyan names and macros over international equivalents. Here is how to visually identify them:
- **Ugali**: Thick white block of maize meal. (High carb).
- **Omena**: Small silver dried fish. (Very high protein).
- **Matumbo**: Chopped cow intestines/tripe. Looks like thick, brownish, chewy meat chunks stewed with tomatoes and onions. (Moderate protein, high fat).
- **Githeri**: Mixture of maize and beans. (Moderate carbs & protein).
- **Ndengu**: Green grams / mung beans stew. (High plant protein).
- **Sukuma Wiki**: Sautéed collard greens (chopped, dark green).
- **Managu / Terere**: Traditional dark leafy greens (nightshade/amaranth), often mixed with milk or cream.
- **Nyama Choma**: Roasted/grilled meat (usually goat or beef), usually served with kachumbari.
- **Mutura**: African sausage (dark, thick cylindrical meat).
- **Chapati**: Layered flatbread (round, brown, flaky).
- **Mandazi**: Fried dough balls (puffy, golden brown).
- **Pilau**: Spiced rice with meat chunks (brownish rice).
- **Kachumbari**: Fresh tomato and onion salad.
- **Tilapia**: Whole fried fish.
- **Smokie**: Thin, reddish-brown sausage.
- **Indomie**: Yellow, curly instant noodles. Often cooked with a fried egg, tomatoes, and onions. If in the packet, it is a blue/red Indomie wrapper.

Do NOT use terms like Fufu, Polenta, Anchovies, or Collard Greens. Use the exact Kenyan names above.
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

// Only use this for ACTUAL non-food items
function reject(breakdown = "Rejected: not a food item.") {
  return { is_food: false, name: "Non-food", p: 0, cal: 0, breakdown };
}

// Use this for system errors so the UI shows an error, not a rejection
function systemError(message) {
  return { error: "system_error", is_food: true, name: "Error", p: 0, cal: 0, breakdown: message };
}

function sanitise(obj) {
  if (!obj || typeof obj !== "object") return systemError("Rejected: unreadable image.");
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
    return json(systemError("POST required."), 405);
  }

  let image = "";
  try {
    const body = await req.json();
    image = typeof body?.image === "string" ? body.image : "";
  } catch {
    return json(systemError("Invalid request body."), 400);
  }

  image = image.replace(/^data:image\/[a-zA-Z0-9.+-]+;base64,/, "").trim();

  if (!image || image.length < 128) {
    return json(systemError("No usable image supplied."), 400);
  }

  if (!apiKey) {
    return json(systemError("Vision service is not configured (missing GROQ_API_KEY)."), 500);
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
          { type: "text", text: "Analyse this image. Return the strict JSON object only." },
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
      
      return json(systemError(`Vision service error (${res.status}). Please try again.`), 500);
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
      return json(systemError("Vision model returned no usable data."), 500);
    }

    return json(sanitise(parsed), 200);
  } catch (err) {
    const aborted = err && err.name === "AbortError";
    return json(systemError(aborted ? "Vision request timed out." : "Vision service unavailable."), 500);
  }
}