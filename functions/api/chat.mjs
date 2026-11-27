const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";
// Use the Qwen model for both text routing and vision analysis
const MODEL = "qwen/qwen3.8-27b";

export async function onRequest(context) {
    const req = context.request;
    const apiKey = context.env.GROQ_API_KEY;

    // Handle CORS preflight
    if (req.method === "OPTIONS") {
        return new Response(null, { status: 204, headers: { "Access-Control-Allow-Origin": "*" } });
    }

    let question = "", userContext = {}, chatHistory = [], images = [];

    try {
        const body = await req.json();
        question = body.question || "";
        userContext = body.context || {};
        chatHistory = body.history || [];
        images = body.images || [];
    } catch {
        return new Response(JSON.stringify({ error: "Invalid JSON body" }), { status: 400 });
    }

    if (!question) {
        return new Response(JSON.stringify({ error: "No question provided" }), { status: 400 });
    }

    const systemPrompt = `
    You are the OPERATOR LOG AI Coach.
    You have access to the user's fitness data and a photoInventory showing what photos they have in their Vault.
    
    *** USER DATA CONTEXT ***
    ${JSON.stringify(userContext, null, 2)}
    *************************

    RULES:
    1. If the user asks to compare photos (e.g. "Compare Week 0 and Week 4 Front Relaxed"), check the "photoInventory".
    2. If the photos exist, you MUST use the "get_photo" tool to fetch them.
    3. If the photos don't exist, tell the user.
    4. Be tactical and brief.
    5. FORMATTING: Use HTML <b>bold</b>, not markdown.
  `;

    // Define the tool for fetching photos
    const tools = [{
        type: "function",
        function: {
            name: "get_photo",
            description: "Fetch a specific physique photo from the database.",
            parameters: {
                type: "object",
                properties: {
                    weekA: { type: "string", description: "The first week key (e.g. w0, w4)" },
                    weekB: { type: "string", description: "The second week key for comparison (optional)" },
                    pose: { type: "string", description: "The pose key (e.g. front_relaxed)" }
                },
                required: ["weekA", "pose"]
            }
        }
    }];

    const messages = [
        { role: "system", content: systemPrompt },
        ...chatHistory,
    ];

    // 1. If images are provided, use the Vision Model
    if (images.length > 0) {
        const userContent = [{ type: "text", text: question }];
        images.forEach(img => {
            userContent.push({ type: "image_url", image_url: { url: `data:image/jpeg;base64,${img}` } });
        });
        messages.push({ role: "user", content: userContent });

        const payload = {
            model: MODEL, // Qwen handles both text and vision
            temperature: 0.3,
            max_tokens: 2000,
            messages: messages
        };

        try {
            const res = await fetch(GROQ_URL, {
                method: "POST",
                headers: { "Authorization": `Bearer ${apiKey}`, "Content-Type": "application/json" },
                body: JSON.stringify(payload)
            });

            if (!res.ok) {
                const errText = await res.text();
                throw new Error(`Groq Vision API Error: ${errText}`);
            }

            const data = await res.json();
            return new Response(JSON.stringify({ reply: data.choices[0].message.content }), {
                headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
            });
        } catch (err) {
            return new Response(JSON.stringify({ error: err.message }), {
                status: 500,
                headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
            });
        }
    }

    // 2. Otherwise, use the Text Model with Tools
    messages.push({ role: "user", content: question });

    const payload = {
        model: MODEL, // Qwen handles text routing too
        temperature: 0.1,
        messages: messages,
        tools: tools,
        tool_choice: "auto"
    };

    try {
        const res = await fetch(GROQ_URL, {
            method: "POST",
            headers: { "Authorization": `Bearer ${apiKey}`, "Content-Type": "application/json" },
            body: JSON.stringify(payload)
        });

        if (!res.ok) {
            const errText = await res.text();
            throw new Error(`Groq Text API Error: ${errText}`);
        }

        const data = await res.json();
        const choice = data.choices[0].message;

        // If the AI wants to use the tool, return the tool call
        if (choice.tool_calls && choice.tool_calls.length > 0) {
            const toolCall = choice.tool_calls[0];
            return new Response(JSON.stringify({
                tool_call: toolCall.function.name,
                args: JSON.parse(toolCall.function.arguments)
            }), {
                headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
            });
        }

        // Otherwise, return the text reply
        return new Response(JSON.stringify({ reply: choice.content }), {
            headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
        });
    } catch (err) {
        return new Response(JSON.stringify({ error: err.message }), {
            status: 500,
            headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
        });
    }
}