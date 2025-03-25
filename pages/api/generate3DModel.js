// pages/api/generate3DModel.js

export default async function handler(req, res) {
    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Method not allowed' });
    }
  
    const { prompt } = req.body;
  
    if (!prompt) {
      return res.status(400).json({ error: 'Promptが指定されていません' });
    }
  
    const requestBody = {
      mode: 'preview',
      prompt,
      negative_prompt: 'low quality, low resolution, low poly, ugly',
      art_style: 'realistic',
      should_remesh: true
    };
  
    try {
      const response = await fetch('https://api.meshy.ai/v2/text-to-3d', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.MESHY_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });
  
      const data = await response.json();
  
      if (!response.ok) {
        throw new Error(data.message || 'Meshy APIでエラーが発生しました');
      }
  
      res.status(200).json(data);
  
    } catch (error) {
      console.error('Meshy APIエラー:', error.message);
      res.status(500).json({ error: error.message });
    }
  }
  