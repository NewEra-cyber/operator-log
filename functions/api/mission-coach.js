export async function onRequest(context) {
    const req = context.request;
    const apiKey = context.env?.GROQ_API_KEY;

    if (req.method === "OPTIONS") {
        return new Response(null, { status: 204, headers: { "Access-Control-Allow-Origin": "*" } });
    }

    if (!apiKey) {
        return new Response(JSON.stringify({ advice: "ERROR: GROQ_API_KEY is missing from Cloudflare environment variables." }), {
            status: 200, headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
        });
    }

    try {
        const { workoutData } = await req.json();
        if (!workoutData) throw new Error("No workout data provided");

        const payload = {
            model: "llama-3.3-70b-versatile",
            temperature: 0.3,
            messages: [
                {
                    role: "system",
                    content: `You are an elite, tactical strength and conditioning coach. 
                    The user is a beginner/intermediate lifter following a 4-day Upper/Lower split.
                    They will send you their workout log for today (including exercises, weights, sets, reps, and RIR (Reps in Reserve)).
                    
                    Your job is to analyze the data and provide:
                    1. A brief tactical assessment of today's performance (e.g., noting fatigue if RIR drops or reps fall off).
                    2. Strict progressive overload advice for next week (when to add weight, when to hold steady, when to deload).
                    3. One specific form or mindset cue for their weakest exercise today.

                    Keep it concise, motivating, and formatted cleanly in 3 short paragraphs. Use bullet points if necessary.`
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
            const errorText = await res.text();
            console.error("Groq API Error:", errorText);
            return new Response(JSON.stringify({ advice: `Groq API Error (${res.status}): ${errorText.substring(0, 100)}` }), {
                status: 200, headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
            });
        }

        const data = await res.json();
        const advice = data.choices[0].message.content;

        return new Response(JSON.stringify({ advice }), {
            status: 200, headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
        });

    } catch (err) {
        console.error("Mission Coach Error:", err);
        return new Response(JSON.stringify({ advice: `System Error: ${err.message}` }), {
            status: 200, headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
        });
    }
}