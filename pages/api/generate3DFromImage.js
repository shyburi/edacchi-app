// pages/api/generate3DFromImage.js
export default async function handler(req, res) {
    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Method not allowed' });
    }
  
    const { imageUrl } = req.body;
  
    if (!imageUrl) {
      return res.status(400).json({ error: 'Image URL is required' });
    }
  
    try {
      const response = await fetch('https://api.meshy.ai/v1/image-to-3d', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${process.env.MESHY_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          image_url: imageUrl,
          mode: 'preview', // または 'standard'
        }),
      });
  
      const data = await response.json();
  
      if (!response.ok) {
        throw new Error(data.message || 'Meshy API error');
      }
  
      res.status(200).json(data);
    } catch (error) {
      console.error('Meshy image-to-3d error:', error);
      res.status(500).json({ error: error.message });
    }
  }
  