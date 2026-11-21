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
    You have full access to the user's fitness profile, weekly program, and recent logs, provided below.

    *** USER DATA CONTEXT ***
    ${JSON.stringify(userContext, null, 2)}
    *************************

    RULES:
    1. Be conversational. Answer the user's question directly, using the provided data to personalize your answer.
    2. If they ask about their weekly plan, look at the "fullWeeklyProgram" data.
    3. If they ask about their meals, look at "mealsToday" and calculate how much protein/calories they have left.
    4. If they ask about their lifts, look at "currentSession", "recentWorkouts", and "recentPRs".
    5. You are allowed to use general fitness knowledge (e.g., if they ask "what is a good alternative for bench press?", you can answer even if it's not in the data).
    6. Keep responses brief, direct, and tactical. Do not sound like a robot reading a database. Sound like a coach.
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