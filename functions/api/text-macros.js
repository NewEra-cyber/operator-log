const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";
// Use a current, supported text model
const MODEL = "llama-3.1-8b-instant"; 

export async function onRequest(context) {
  const req = context.request;
  const apiKey = context.env.GROQ_API_KEY;

  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: { "Access-Control-Allow-Origin": "*" } });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "POST required" }), { status: 405 });
  }

  let text = "";
  try {
    const body = await req.json();
    text = body.text || "";
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON body" }), { status: 400 });
  }

  if (!text) return new Response(JSON.stringify({ error: "No text provided" }), { status: 400 });

  const payload = {
    model: MODEL,
    temperature: 0.1,
    response_format: { type: "json_object" }, // Force JSON output
    messages: [
      { 
        role: "system", 
        content: "You are a nutritionist. Extract macros from the user's text. Return ONLY a JSON object with keys: 'name' (string), 'p' (number, protein grams), 'cal' (number, calories), 'breakdown' (string). Example: {\"name\":\"2 Eggs\",\"p\":12,\"cal\":140,\"breakdown\":\"2 large eggs\"}" 
      },
      { role: "user", content: text }
    ]
  };

  try {
    const res = await fetch(GROQ_URL, {
      method: "POST",
      headers: {
        "Authorization": "Bearer " + apiKey,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    });

    if (!res.ok) {
      const errorText = await res.text();
      throw new Error(`Groq API error: ${res.status} ${errorText}`);
    }

    const data = await res.json();
    const content = data.choices[0].message.content;
    
    // Parse the JSON response
    const parsed = JSON.parse(content);

    return new Response(JSON.stringify(parsed), {
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
    });

  } catch (err) {
    console.error("Backend Error:", err);
    return new Response(JSON.stringify({ error: err.message, p: 0, cal: 0 }), { 
      status: 500,
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
    });
  }
}