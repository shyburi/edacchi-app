// pages/api/proxyModel.js
export default async function handler(req, res) {
    const { modelUrl } = req.query;

    if (!modelUrl) {
        return res.status(400).json({ error: "modelUrl is required" });
    }

    try {
        const response = await fetch(modelUrl);
        if (!response.ok) throw new Error('Failed to fetch model.');

        res.setHeader('Content-Type', 'model/gltf-binary');
        const arrayBuffer = await response.arrayBuffer();
        res.send(Buffer.from(arrayBuffer));
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}