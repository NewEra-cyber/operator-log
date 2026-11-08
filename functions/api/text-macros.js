export async function onRequest(context) {
    const req = context.request;
    const apiKey = context.env.GROQ_API_KEY;

    if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: { "Access-Control-Allow-Origin": "*" } });

    try {
        const { text } = await req.json();
        if (!text) throw new Error("No text provided");

        const payload = {
            model: "llama-3.1-8b-instant",
            response_format: { type: "json_object" },
            messages: [
                {
                    role: "system", content: `You are a nutrition bot specializing in Kenyan food. Extract macros from the user's text.
Return ONLY JSON: {"name": "Short Name", "p": number, "cal": number, "breakdown": "Short description"}. 
Recognize local foods like Ugali, Omena, Ndengu, Githeri, Sukuma Wiki, Chapati, Matumbo, Nyama Choma, Managu, and Mutura. 
If no food is mentioned, return {"name": "Non-food", "p": 0, "cal": 0, "breakdown": "Rejected"}.` },
                { role: "user", content: text }
            ]
        };

        const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
            method: "POST",
            headers: { "Authorization": `Bearer ${apiKey}`, "Content-Type": "application/json" },
            body: JSON.stringify(payload)
        });

        const data = await res.json();

        // Robust JSON extraction (strips markdown fences if the AI adds them)
        let rawContent = data.choices[0].message.content;
        rawContent = rawContent.replace(/^```(?:json)?/i, "").replace(/```$/, "").trim();

        const parsed = JSON.parse(rawContent);
        return new Response(JSON.stringify(parsed), { status: 200, headers: { "Content-Type": "application/json" } });
    } catch (err) {
        console.error("Text Macros Error:", err);
        return new Response(JSON.stringify({ is_food: false, name: "Error", p: 0, cal: 0, breakdown: "AI offline" }), { status: 200 });
    }
}