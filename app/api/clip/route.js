export async function POST(req) {
  const { image_url, text } = await req.json();
  const HF_TOKEN = process.env.HUGGINGFACE_API_KEY;

  if (!HF_TOKEN) {
    return Response.json({ error: "Missing HUGGINGFACE_API_KEY" }, { status: 400 });
  }

  try {
    const response = await fetch(
      "https://api-inference.huggingface.co/models/openai/clip-vit-base-patch32",
      {
        headers: { Authorization: `Bearer ${HF_TOKEN}` },
        method: "POST",
        body: JSON.stringify({
          inputs: {
            image: image_url,
            candidate_labels: text.split(",").map((t) => t.trim()),
          },
        }),
      }
    );

    const result = await response.json();
    return Response.json(result);
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
