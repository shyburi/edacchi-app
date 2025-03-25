export default async function handler(req, res) {
    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Method not allowed' });
    }
  
    const { jobId } = req.body;
  
    try {
      const response = await fetch(`https://api.meshy.ai/v2/text-to-3d/${jobId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${process.env.MESHY_API_KEY}`,
          'Content-Type': 'application/json',
        },
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
  