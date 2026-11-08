export async function onRequest(context) {
    const req = context.request;
    const apiKey = context.env?.GROQ_API_KEY;

    if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: { "Access-Control-Allow-Origin": "*" } });

    try {
        const { text } = await req.json();
        if (!text) throw new Error("No text provided");

        const payload = {
            model: "llama-3.3-70b-versatile", // Smartest Groq model for JSON output
            response_format: { type: "json_object" },
            temperature: 0.1,
            messages: [
                {
                    role: "system", 
                    content: `You are an expert Kenyan nutrition bot. Extract macros from the user's text.
Return ONLY a JSON object: {"name": "Short Name", "p": number, "cal": number, "breakdown": "Short description"}. 
Recognize local foods like Ugali, Omena, Ndengu, Githeri, Sukuma Wiki, Chapati, Matumbo, Nyama Choma, Managu, Mutura, and Indomie. 
If the user types something that is clearly not food, return {"name": "Non-food", "p": 0, "cal": 0, "breakdown": "Rejected"}.`
                },
                { role: "user", content: text }
            ]
        };

        const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
            method: "POST",
            headers: { "Authorization": `Bearer ${apiKey}`, "Content-Type": "application/json" },
            body: JSON.stringify(payload)
        });

        const data = await res.json();
        if (data.error) throw new Error(data.error.message);

        let rawContent = data.choices[0].message.content;
        rawContent = rawContent.replace(/^```(?:json)?/i, "").replace(/```$/, "").trim();

        const parsed = JSON.parse(rawContent);
        return new Response(JSON.stringify(parsed), { status: 200, headers: { "Content-Type": "application/json" } });
    } catch (err) {
        console.error("Text Macros Error:", err);
        // Return the actual error so you can see it in the UI!
        return new Response(JSON.stringify({ 
            name: "AI Error", 
            p: 0, 
            cal: 0, 
            breakdown: err.message || "AI service unavailable." 
        }), { status: 200, headers: { "Content-Type": "application/json" } });
    }
}