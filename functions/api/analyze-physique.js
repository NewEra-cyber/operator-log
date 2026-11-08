export async function onRequest(context) {
  const req = context.request;
  const apiKey = context.env.GROQ_API_KEY;

  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: { "Access-Control-Allow-Origin": "*" } });

  try {
    const { image1, image2, pose } = await req.json();
    if (!image1 || !image2) throw new Error("Missing images");

    const payload = {
      model: "meta-llama/llama-3.2-11b-vision-preview", 
      temperature: 0.2,
      max_tokens: 500,
      messages: [
        { 
          role: "system", 
          content: `You are an expert bodybuilding coach. Compare Image 1 (Before) and Image 2 (After) focusing on the ${pose} pose. 
          
          Analyze these muscle groups:
          - Back (Lats, Traps, Rear Delts)
          - Legs (Quads, Hamstrings)
          - Calves
          - Abs/Core
          - Arms (Biceps, Triceps)
          - Chest/Shoulders

          Return ONLY JSON: 
          {"overall": "1 sentence summary of progress", "muscles": [{"group": "Name", "status": "Improved/No Change/Needs Work", "notes": "brief observation"}]}` 
        },
        {
          role: "user",
          content: [
            { type: "text", text: "Here is Image 1 (Before):" },
            { type: "image_url", image_url: { url: "data:image/jpeg;base64," + image1 } },
            { type: "text", text: "Here is Image 2 (After):" },
            { type: "image_url", image_url: { url: "data:image/jpeg;base64," + image2 } }
          ]
        }
      ]
    };

    const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: { "Authorization": `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    const data = await res.json();
    let rawContent = data.choices[0].message.content;
    rawContent = rawContent.replace(/^```(?:json)?/i, "").replace(/```$/, "").trim();
    
    const parsed = JSON.parse(rawContent);
    return new Response(JSON.stringify(parsed), { status: 200, headers: { "Content-Type": "application/json" } });
  } catch (err) {
    console.error("Physique AI Error:", err);
    return new Response(JSON.stringify({ error: "Failed to analyze images" }), { status: 200 });
  }
}