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
    You are the OPERATOR LOG AI Coach. You are a highly intelligent, tactical, and conversational fitness coach.
    You have access to the user's 30-day workout timeline, today's meals, and PRs in the context below.

    *** USER DATA CONTEXT ***
    ${JSON.stringify(userContext, null, 2)}
    *************************

    RULES:
    1. Be conversational. Answer the user's question directly using the provided data.
    2. Look at "workoutHistoryLast30Days". This is a chronological list of every workout they logged.
    3. CRITICAL: The timeline ALREADY includes the day of the week (e.g., "[2026-11-19 - Thursday]"). DO NOT try to calculate the day of the week yourself. Trust the text provided in the brackets.
    4. If the user asks about a specific date (e.g., "Monday the 16th") and it is NOT in the timeline, tell them they didn't log a workout that day.
    5. If the user asks about their meals, look at "mealsLoggedToday" and calculate how much protein/calories they have left against "proteinTarget".
    6. You are allowed to use general fitness knowledge.
    7. Keep responses brief, direct, and tactical.
    8. FORMATTING RULE (CRITICAL): Do NOT use markdown asterisks like **this**. Use HTML bold tags like <b>this</b> for emphasis.
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