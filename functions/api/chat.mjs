const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";
// Qwen is the supported multimodal model that handles both text, tools, and vision
const MODEL = "qwen/qwen3.8-27b";

export async function onRequest(context) {
    const req = context.request;
    const apiKey = context.env.GROQ_API_KEY;

    if (req.method === "OPTIONS") {
        return new Response(null, { status: 204, headers: { "Access-Control-Allow-Origin": "*" } });
    }

    let question = "", userContext = {}, chatHistory = [], toolResponse = null, requestedImages = [];

    try {
        const body = await req.json();
        question = body.question || "";
        userContext = body.context || {};
        chatHistory = body.history || [];
        toolResponse = body.toolResponse || null;
        requestedImages = body.requestedImages || [];
    } catch {
        return new Response(JSON.stringify({ error: "Invalid body" }), { status: 400 });
    }

    // --- STEP 2: The client fetched the images and sent them back for Vision Analysis ---
    if (toolResponse && requestedImages.length > 0) {
        const systemPrompt = `
      You are the OPERATOR LOG AI Coach. 
      You requested photos and the client has provided them. Analyze the visual differences carefully (muscle definition, posture, leanness) and compare them against the user's training data provided in the context.
      Context: ${JSON.stringify(userContext)}
    `;

        const messages = [
            { role: "system", content: systemPrompt },
            ...chatHistory,
            { role: "assistant", content: null, tool_calls: [toolResponse] },
            {
                role: "tool",
                tool_call_id: toolResponse.id,
                content: "Images fetched successfully. The image data is attached in the next message."
            },
            {
                role: "user",
                content: [
                    { type: "text", text: "Here are the requested images. Compare them." },
                    ...requestedImages.map(img => ({ type: "image_url", image_url: { url: `data:image/jpeg;base64,${img}` } }))
                ]
            }
        ];

        const payload = { model: MODEL, temperature: 0.2, messages: messages };

        try {
            const res = await fetch(GROQ_URL, {
                method: "POST",
                headers: { "Authorization": "Bearer " + apiKey, "Content-Type": "application/json" },
                body: JSON.stringify(payload)
            });
            const data = await res.json();
            const reply = data.choices[0].message.content;
            return new Response(JSON.stringify({ reply }), { headers: { "Content-Type": "application/json" } });
        } catch (err) {
            return new Response(JSON.stringify({ error: "Vision analysis failed: " + err.message }), { status: 500 });
        }
    }

    // --- STEP 1: The user asked a question. Qwen decides if it needs tools. ---
    const systemPrompt = `
    You are the OPERATOR LOG AI Coach. You have full access to the user's fitness data and photo vault.
    *** USER DATA CONTEXT ***
    ${JSON.stringify(userContext, null, 2)}
    *************************

    RULES:
    1. If the user asks to compare photos (e.g. "Compare Week 0 and Week 4 Front Relaxed"), you MUST use the "get_photos_for_comparison" tool. 
    2. Look at "photoInventory" in the context to see what weeks they actually have. If they don't have them, tell them.
    3. Be tactical and brief.
    4. FORMATTING: Use HTML <b>bold</b>, not markdown.
  `;

    const tools = [{
        type: "function",
        function: {
            name: "get_photos_for_comparison",
            description: "Fetch two physique photos from the database to compare.",
            parameters: {
                type: "object",
                properties: {
                    weekA: { type: "string", description: "First week (e.g. w0)" },
                    weekB: { type: "string", description: "Second week (e.g. w4)" },
                    pose: { type: "string", description: "The pose (e.g. front_relaxed)" }
                },
                required: ["weekA", "weekB", "pose"]
            }
        }
    }];

    const messages = [
        { role: "system", content: systemPrompt },
        ...chatHistory,
        { role: "user", content: question }
    ];

    const payload = {
        model: MODEL,
        temperature: 0.1,
        messages: messages,
        tools: tools,
        tool_choice: "auto"
    };

    try {
        const res = await fetch(GROQ_URL, {
            method: "POST",
            headers: { "Authorization": "Bearer " + apiKey, "Content-Type": "application/json" },
            body: JSON.stringify(payload)
        });
        const data = await res.json();
        const choice = data.choices[0].message;

        if (choice.tool_calls && choice.tool_calls.length > 0) {
            // The AI wants to use a tool. Send it back to the client.
            return new Response(JSON.stringify({
                tool_call: choice.tool_calls[0],
                type: "tool_call"
            }), { headers: { "Content-Type": "application/json" } });
        }

        // No tools needed, just a normal text reply
        return new Response(JSON.stringify({ reply: choice.content }), { headers: { "Content-Type": "application/json" } });

    } catch (err) {
        return new Response(JSON.stringify({ error: err.message }), { status: 500 });
    }
}