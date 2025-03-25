// pages/api/generateCharacterImage.js
export default async function handler(req, res) {
  console.log("Replicate API Token:", process.env.REPLICATE_API_TOKEN);

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { prompt } = req.body;

  if (!prompt) {
    return res.status(400).json({ error: 'Promptが指定されていません' });
  }

  try {
    const response = await fetch('https://api.replicate.com/v1/predictions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Token ${process.env.REPLICATE_API_TOKEN}`
      },
      body: JSON.stringify({
        version: "ac732df83cea7fff18b8472768c88ad041fa750ff7682a21affe81863cbe77e4",
        input: {
          prompt: prompt,
          width: 512,
          height: 512,
          scheduler: "KLMS",
          num_outputs: 1,
          guidance_scale: 7.5,
          prompt_strength: 0.8,
          num_inference_steps: 50
        }
      })
      
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.detail || "画像生成に失敗しました");
    }

    res.status(200).json({ predictionId: data.id });

  } catch (error) {
    console.error("Replicateエラー:", error.message);
    res.status(500).json({ error: error.message });
  }
}
