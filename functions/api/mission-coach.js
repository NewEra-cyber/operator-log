export async function onRequest(context) {
    const req = context.request;
    const apiKey = context.env?.GROQ_API_KEY;

    if (req.method === "OPTIONS") {
        return new Response(null, { status: 204, headers: { "Access-Control-Allow-Origin": "*" } });
    }

    if (!apiKey) {
        return new Response(JSON.stringify({ advice: "ERROR: GROQ_API_KEY is missing." }), {
            status: 200, headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
        });
    }

    try {
        const { workoutData } = await req.json();
        if (!workoutData) throw new Error("No workout data provided");

        const payload = {
            model: "qwen/qwen3.8-27b",
            temperature: 0.2,
            messages: [
                {
                    role: "system",
                    content: `You are an elite, tactical strength coach. Analyze the user's workout log.
                    
                    RULES:
                    1. Be ruthlessly concise. Maximum 15 words per sentence.
                    2. Use exactly 3 sections: "ASSESSMENT:", "NEXT WEEK:", "FOCUS:".
                    3. Use ALL CAPS for the section titles.
                    4. NO markdown headers (no #). NO asterisks (**). Just plain text with line breaks.
                    5. CRITICAL: The weights logged by the user are ALWAYS in KILOGRAMS (kg). NEVER use pounds (lbs).
                    6. CRITICAL: The user provides "sessionNotes" (a micro-journal). You MUST read these notes carefully. If the user mentions pain, tweaks, fatigue, or form breakdowns, you must prioritize that in your assessment and adjust next week's advice to prevent injury.`
                },
                { role: "user", content: JSON.stringify(workoutData) }
            ]
        };

        const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
            method: "POST",
            headers: { "Authorization": `Bearer ${apiKey}`, "Content-Type": "application/json" },
            body: JSON.stringify(payload)
        });

        if (!res.ok) {
            return new Response(JSON.stringify({ advice: `Groq API Error (${res.status})` }), {
                status: 200, headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
            });
        }

        const data = await res.json();
        const advice = data.choices[0].message.content;

        return new Response(JSON.stringify({ advice }), {
            status: 200, headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
        });

    } catch (err) {
        return new Response(JSON.stringify({ advice: `System Error: ${err.message}` }), {
            status: 200, headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
        });
    }
}