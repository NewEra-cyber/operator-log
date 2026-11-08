// functions/api/plate-vision.mjs
const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";
const MODEL = "llama-3.2-11b-vision-preview"; // The official Groq vision model
const TIMEOUT_MS = 25000;

const SYSTEM_INSTRUCTION = `
*** CRITICAL KENYAN FOOD DICTIONARY & VISUAL RULES ***
You MUST prioritize Kenyan names and macros over international equivalents. Here is how to visually identify them:
- **Ugali**: Thick white block of maize meal.
- **Omena**: Small silver dried fish.
- **Matumbo**: Chopped cow intestines/tripe.
- **Githeri**: Mixture of maize and beans.
- **Ndengu**: Green grams / mung beans stew.
- **Sukuma Wiki**: Sautéed collard greens.
- **Managu / Terere**: Traditional dark leafy greens.
- **Nyama Choma**: Roasted/grilled meat.
- **Mutura**: African sausage.
- **Chapati**: Layered flatbread.
- **Mandazi**: Fried dough balls.
- **Pilau**: Spiced rice with meat chunks.
- **Kachumbari**: Fresh tomato and onion salad.
- **Tilapia**: Whole fried fish.
- **Smokie**: Thin, reddish-brown sausage.
- **Indomie**: Yellow, curly instant noodles.
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

function systemError(message) {
  return { error: "system_error", is_food: true, name: "Error", p: 0, cal: 0, breakdown: message };
}

function sanitise(obj) {
  if (!obj || typeof obj !== "object") return systemError("Rejected: unreadable image.");
  const isFood = obj.is_food === true || obj.is_food === "true";

  if (!isFood) {
    return reject(typeof obj.breakdown === "string" ? obj.breakdown : undefined);
  }

  return {
    is_food: true,
    name: String(obj.name || "Unidentified Meal").slice(0, 80),
    p: Number.isFinite(Number(obj.p)) ? Math.max(0, Math.round(Number(obj.p) * 10) / 10) : 0,
    cal: Number.isFinite(Number(obj.cal)) ? Math.max(0, Math.round(Number(obj.cal))) : 0,
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

export async function onRequest(context) {
  const req = context.request;
  const apiKey = context.env?.GROQ_API_KEY; // Safe access

  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: { "Access-Control-Allow-Origin": "*" } });
  }

  if (req.method !== "POST") return json(systemError("POST required."), 405);

  let image = "";
  try {
    const body = await req.json();
    image = typeof body?.image === "string" ? body.image : "";
  } catch {
    return json(systemError("Invalid request body."), 400);
  }

  image = image.replace(/^data:image\/[a-zA-Z0-9.+-]+;base64,/, "").trim();

  if (!image || image.length < 128) return json(systemError("No usable image supplied."), 400);
  if (!apiKey) return json(systemError("Missing GROQ_API_KEY in Cloudflare environment variables."), 200);

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
      // Return 200 so the frontend can display the exact error to the user
      return json(systemError(`Groq API Error (${res.status}): ${errorText.substring(0, 100)}`), 200);
    }

    const data = await res.json();
    const rawContent = data?.choices?.[0]?.message?.content;
    const parsed = typeof rawContent === "string" ? extractJSON(rawContent) : rawContent;

    if (!parsed) return json(systemError("Vision model returned no usable data."), 200);

    return json(sanitise(parsed), 200);
  } catch (err) {
    return json(systemError(`Network Error: ${err.message}`), 200);
  }
}