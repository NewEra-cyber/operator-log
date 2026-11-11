export async function onRequest(context) {
    const req = context.request;
    const apiKey = context.env?.GROQ_API_KEY;

    if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: { "Access-Control-Allow-Origin": "*" } });
    if (!apiKey) return new Response(JSON.stringify({ error: "Missing GROQ_API_KEY" }), { status: 200 });

    try {
        const { weekData } = await req.json();
        
        const payload = {
            model: "qwen/qwen3.8-27b",
            temperature: 0.3,
            messages: [
                {
                    role: "system", 
                    content: `You are an elite tactical strength coach. Analyze this 7-day summary of the user's training and nutrition.
Provide EXACTLY 3 bullet points using this format:
- **Volume & Progression:** [1 sentence on tonnage and strength progression]
- **Refuel Discipline:** [1 sentence on protein hits/misses and water]
- **Directive for Next Week:** [1 tactical command on what to focus on]

Keep it aggressive, brief, and highly analytical. Do NOT use markdown headers, just the 3 bullet points.
CRITICAL: Tonnage is in KILOGRAMS (kg). You MUST use kg for any weight references. NEVER use pounds (lbs).`
                },
                { role: "user", content: JSON.stringify(weekData) }
            ]
        };

        const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
            method: "POST",
            headers: { "Authorization": `Bearer ${apiKey}`, "Content-Type": "application/json" },
            body: JSON.stringify(payload)
        });

        const data = await res.json();
        const advice = data.choices[0].message.content;

        return new Response(JSON.stringify({ advice }), { status: 200, headers: { "Content-Type": "application/json" } });
    } catch (err) {
        return new Response(JSON.stringify({ error: "Failed to synthesize data." }), { status: 200 });
    }
}