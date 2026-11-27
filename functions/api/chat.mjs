const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";
// Use the currently supported Qwen multimodal model
const MODEL = "qwen/qwen3.8-27b";

export async function onRequest(context) {
    const req = context.request;
    const apiKey = context.env.GROQ_API_KEY;

    if (req.method === "OPTIONS") {
        return new Response(null, { status: 204, headers: { "Access-Control-Allow-Origin": "*" } });
    }

    let question = "";
    let userContext = {};
    let chatHistory = [];
    let images = [];

    try {
        const body = await req.json();
        question = body.question || "";
        userContext = body.context || {};
        chatHistory = body.history || [];
        images = body.images || [];
    } catch {
        return new Response(JSON.stringify({ error: "Invalid body" }), { status: 400 });
    }

    if (!question) return new Response(JSON.stringify({ error: "No question" }), { status: 400 });

    const systemPrompt = `
    You are the OPERATOR LOG AI Coach. You are highly intelligent, tactical, and conversational.
    You have access to the user's fitness data below.
    
    *** USER DATA CONTEXT ***
    ${JSON.stringify(userContext, null, 2)}
    *************************

    RULES:
    1. If the user asks about their physique/progress, and images are provided, analyze the visual differences carefully (muscle definition, posture, leanness).
    2. If no images are provided, you MUST tell the user: "I cannot see your photos. Please attach a baseline and current photo to the chat so I can compare them."
    3. Be conversational and tactical.
    4. FORMATTING RULE: Do NOT use markdown asterisks like **this**. Use HTML bold tags like <b>this</b> for emphasis.
  `;

    const messages = [
        { role: "system", content: systemPrompt },
        ...chatHistory,
    ];

    // Construct the user message. If there are images, we attach them.
    if (images.length > 0) {
        const userContent = [{ type: "text", text: question }];
        images.forEach(img => {
            // img is a base64 string (e.g., "/9j/4AAQSk...")
            userContent.push({ type: "image_url", image_url: { url: `data:image/jpeg;base64,${img}` } });
        });
        messages.push({ role: "user", content: userContent });
    } else {
        messages.push({ role: "user", content: question });
    }

    const payload = {
        model: MODEL,
        temperature: 0.3,
        max_tokens: 2000,
        messages: messages
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
            const errText = await res.text();
            console.error("[CHAT API ERROR]", errText);
            throw new Error(`Groq API Error: ${res.status}`);
        }

        const data = await res.json();
        const reply = data.choices[0].message.content;

        return new Response(JSON.stringify({ reply }), {
            headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
        });

    } catch (err) {
        console.error("[CHAT CATCH ERROR]", err);
        return new Response(JSON.stringify({ error: err.message }), { status: 500 });
    }
}