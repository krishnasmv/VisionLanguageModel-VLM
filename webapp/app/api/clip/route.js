export async function POST(req) {
  try {
    const { image_base64, task } = await req.json();
    const REPLICATE_TOKEN = process.env.REPLICATE_API_KEY;

    console.log('REPLICATE_TOKEN exists:', !!REPLICATE_TOKEN);
    console.log('Task:', task);

    if (!REPLICATE_TOKEN) {
      console.log('ERROR: Missing REPLICATE_API_KEY');
      return Response.json({ error: "Missing REPLICATE_API_KEY" }, { status: 400 });
    }

    if (!image_base64 || !task) {
      console.log('ERROR: Missing image_base64 or task');
      return Response.json({ error: "Missing image_base64 or task" }, { status: 400 });
    }

    const prompt = task === 'caption' 
      ? 'Generate a short caption for this image.' 
      : 'Summarize what you see in this image.';

    console.log('Creating Replicate prediction...');

    const createResponse = await fetch("https://api.replicate.com/v1/predictions", {
      method: "POST",
      headers: {
        "Authorization": `Token ${REPLICATE_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        version: "e5cd7715b9c708d8b32043b91729f439867d428c45ab13adc2b71204b11b19fb",
        input: {
          image: `data:image/jpeg;base64,${image_base64}`,
          prompt: prompt,
        },
      }),
    });

    console.log('Replicate response status:', createResponse.status);
    const prediction = await createResponse.json();
    console.log('Prediction:', prediction);

    if (!prediction.id) {
      console.log('ERROR: No prediction ID returned');
      return Response.json({ error: `Failed to create prediction: ${JSON.stringify(prediction)}` }, { status: 500 });
    }

    const predictionId = prediction.id;
    let result = prediction;
    let attempts = 0;

    while (result.status === "processing" && attempts < 60) {
      console.log(`Polling attempt ${attempts + 1}...`);
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const statusResponse = await fetch(`https://api.replicate.com/v1/predictions/${predictionId}`, {
        headers: { "Authorization": `Token ${REPLICATE_TOKEN}` },
      });
      
      result = await statusResponse.json();
      console.log('Poll result:', result.status);
      attempts++;
    }

    console.log('Final result:', result);

    if (result.status === "succeeded") {
      return Response.json({ output: result.output });
    } else {
      return Response.json({ error: `Prediction failed: ${result.status}` }, { status: 500 });
    }
  } catch (error) {
    console.error('Server error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}
