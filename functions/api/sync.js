export async function onRequestGet(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const syncId = url.searchParams.get("id");

  if (!syncId) return new Response("Missing Sync ID", { status: 400 });

  try {
    const data = await env.OPERATOR_SYNC.get(syncId);
    return new Response(data || "{}", {
      status: 200,
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
    });
  } catch (err) {
    return new Response("Error", { status: 500 });
  }
}

export async function onRequestPost(context) {
  const { request, env } = context;
  try {
    const body = await request.json();
    const { id, data } = body;

    if (!id || !data) return new Response("Missing data", { status: 400 });

    // Save the JSON string to Cloudflare KV
    await env.OPERATOR_SYNC.put(id, JSON.stringify(data));

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
    });
  } catch (err) {
    return new Response("Error", { status: 500 });
  }
}