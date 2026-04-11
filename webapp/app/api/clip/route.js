export async function POST(req) {
  const { image_base64, task } = await req.json();
  const HF_TOKEN = process.env.HUGGINGFACE_API_KEY;

  console.log('HF_TOKEN:', HF_TOKEN ? 'set' : 'missing');
  console.log('Task:', task);
  console.log('Image size:', image_base64?.length);

  if (!HF_TOKEN) {
    return Response.json({ error: "Missing HUGGINGFACE_API_KEY" }, { status: 400 });
  }

  if (!image_base64 || !task) {
    return Response.json({ error: "Missing image_base64 or task" }, { status: 400 });
  }

  try {
    const prompt = task === 'caption' 
      ? 'Generate a short caption for this image.' 
      : 'Summarize what you see in this image.';

    console.log('Prompt:', prompt);
    console.log('Calling HuggingFace API...');

    const response = await fetch(
      "https://router.huggingface.co/models/Qwen/Qwen2.5-VL-7B-Instruct",
      {
        headers: { Authorization: `Bearer ${HF_TOKEN}` },
        method: "POST",
        body: JSON.stringify({
          inputs: prompt,
          image: image_base64,
        }),
      }
    );

    console.log('HF Response status:', response.status);

    if (!response.ok) {
      const errorData = await response.text();
      console.error('HF Error:', errorData);
      return Response.json({ error: `HuggingFace API error: ${errorData}` }, { status: response.status });
    }

    const result = await response.json();
    console.log('HF Result:', result);

    return Response.json(result);
  } catch (error) {
    console.error('Server error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}
