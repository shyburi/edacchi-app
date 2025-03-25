export default async function handler(req, res) {
    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Method not allowed' });
    }
  
    const { predictionId } = req.body;
  
    try {
      const response = await fetch(`https://api.replicate.com/v1/predictions/${predictionId}`, {
        headers: {
          'Authorization': `Token ${process.env.REPLICATE_API_TOKEN}`
        }
      });
  
      const data = await response.json();
  
      if (!response.ok) {
        throw new Error(data.detail || "生成状況取得に失敗しました");
      }
  
      res.status(200).json(data);
  
    } catch (error) {
      console.error("Replicateエラー:", error.message);
      res.status(500).json({ error: error.message });
    }
  }
  