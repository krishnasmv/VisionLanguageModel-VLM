export async function POST(req) {
  try {
    const { image_base64, task } = await req.json();
    const REPLICATE_TOKEN = process.env.REPLICATE_API_KEY;

    console.log('REPLICATE_TOKEN exists:', !!REPLICATE_TOKEN);
    console.log('Task:', task);
    console.log('Image size:', image_base64?.length);

    if (!REPLICATE_TOKEN) {
      console.log('ERROR: Missing REPLICATE_API_KEY');
      return Response.json({ error: "Missing REPLICATE_API_KEY" }, { status: 400 });
    }

    if (!image_base64) {
      console.log('ERROR: Missing image_base64');
      return Response.json({ error: "Missing image_base64" }, { status: 400 });
    }

    console.log('Creating Replicate prediction with BLIP...');

    

    const createResponse = await fetch("https://api.replicate.com/v1/predictions", {
      method: "POST",
      headers: {
        "Authorization": `Token ${REPLICATE_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        version: "2e1dddc8621f72155f24cf2e0adbde548458d3cab9f00c0139eea840d0ac4746",
        input: {
          image: `data:image/jpeg;base64,${image_base64}`,
          caption: true,
        },
      }),
    });

    console.log('Replicate response status:', createResponse.status);
    const prediction = await createResponse.json();
    console.log('Prediction response:', JSON.stringify(prediction));

    if (!prediction.id) {
      console.log('ERROR: No prediction ID returned');
      return Response.json({ error: `Failed to create prediction: ${prediction.detail || JSON.stringify(prediction)}` }, { status: 500 });
    }

    const predictionId = prediction.id;
    console.log('Prediction ID:', predictionId);
    
    let result = prediction;
    let attempts = 0;

    while (result.status === "processing" && attempts < 120) {
      console.log(`Polling attempt ${attempts + 1}... Status: ${result.status}`);
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const statusResponse = await fetch(`https://api.replicate.com/v1/predictions/${predictionId}`, {
        headers: { "Authorization": `Token ${REPLICATE_TOKEN}` },
      });
      
      result = await statusResponse.json();
      console.log(`Poll ${attempts + 1} status:`, result.status);
      attempts++;
    }

    console.log('Final result status:', result.status);
    console.log('Final result:', JSON.stringify(result));

    if (result.status === "succeeded") {
      console.log('Success! Output:', result.output);
      return Response.json({ output: result.output });
    } else if (result.status === "failed") {
      console.log('Prediction failed:', result.error);
      return Response.json({ error: `Prediction failed: ${result.error}` }, { status: 500 });
    } else {
      console.log('Prediction timeout or error:', result.status);
      return Response.json({ error: `Prediction status: ${result.status}` }, { status: 500 });
    }
  } catch (error) {
    console.error('Server error:', error.message);
    console.error('Stack:', error.stack);
    return Response.json({ error: error.message }, { status: 500 });
  }
}
