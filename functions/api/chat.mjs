const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";
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

    try {
        const body = await req.json();
        question = body.question || "";
        userContext = body.context || {};
        chatHistory = body.history || [];
    } catch {
        return new Response(JSON.stringify({ error: "Invalid body" }), { status: 400 });
    }

    if (!question) return new Response(JSON.stringify({ error: "No question" }), { status: 400 });

    const systemPrompt = `
    You are the OPERATOR LOG AI Coach. You are tactical, direct, and highly personalized.
    You have full access to the user's current fitness and nutrition data, provided below.
    
    *** USER DATA CONTEXT ***
    ${JSON.stringify(userContext, null, 2)}
    *************************

    RULES:
    1. Answer the user's question accurately using ONLY the data provided above.
    2. Do NOT make up numbers. If they ask how many calories they ate, count the "meals" array for today.
    3. If they ask what to lift, look at their "currentSession" and "history".
    4. Keep responses under 3 sentences unless they ask for a detailed explanation.
    5. Use a gritty, tactical tone (e.g., "Operator, you are 20g short on protein. Eat some omena.")
  `;

    // Construct the message array: System Prompt + Past Chat + New Question
    const messages = [
        { role: "system", content: systemPrompt },
        ...chatHistory,
        { role: "user", content: question }
    ];

    const payload = {
        model: MODEL,
        temperature: 0.3,
        max_tokens: 400,
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

        const data = await res.json();
        const reply = data.choices[0].message.content;

        return new Response(JSON.stringify({ reply }), {
            headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
        });

    } catch (err) {
        return new Response(JSON.stringify({ error: "Failed to reach AI" }), { status: 500 });
    }
}