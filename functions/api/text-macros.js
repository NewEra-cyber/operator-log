const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";
// Replace this line:
// const MODEL = "llama3-8b-8192";

// With this:
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
        return new Response(JSON.stringify({ error: "Invalid body" }), { status: 400 });
    }

    if (!text) return new Response(JSON.stringify({ error: "No text" }), { status: 400 });

    const payload = {
        model: MODEL,
        temperature: 0.1,
        messages: [
            {
                role: "system",
                content: "You are a nutritionist. Extract macros from the user's text. Return ONLY a JSON object with keys: 'name' (string), 'p' (number, protein grams), 'cal' (number, calories), 'breakdown' (string, brief description)."
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

        if (!res.ok) throw new Error("Groq API error");

        const data = await res.json();
        const content = data.choices[0].message.content;

        // Extract JSON from the response (in case the AI adds markdown)
        const start = content.indexOf("{");
        const end = content.lastIndexOf("}");
        const jsonStr = content.slice(start, end + 1);
        const parsed = JSON.parse(jsonStr);

        return new Response(JSON.stringify(parsed), {
            headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
        });

    } catch (err) {
        return new Response(JSON.stringify({ error: "Failed to analyze text", p: 0, cal: 0 }), { status: 500 });
    }
}