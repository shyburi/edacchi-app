// pages/api/checkPredictionStatus.js
export default async function handler(req, res) {
    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Method not allowed' });
    }
  
    const { predictionId } = req.body;
  
    if (!predictionId) {
      return res.status(400).json({ error: 'predictionIdが指定されていません' });
    }
  
    try {
      const response = await fetch(`https://api.replicate.com/v1/predictions/${predictionId}`, {
        headers: {
          'Authorization': `Token ${process.env.REPLICATE_API_TOKEN}`,
          'Content-Type': 'application/json'
        }
      });
  
      const data = await response.json();
  
      if (!response.ok) {
        throw new Error(data.detail || "ステータス取得に失敗しました");
      }
  
      res.status(200).json(data);
  
    } catch (error) {
      console.error("Replicateステータス確認エラー:", error.message);
      res.status(500).json({ error: error.message });
    }
  }
  