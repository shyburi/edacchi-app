// pages/api/saveTranscript.js
import fs from 'fs';
import path from 'path';

export default function handler(req, res) {
  if (req.method === 'POST') {
    const { transcript } = req.body;
    const filePath = path.join(process.cwd(), 'transcripts.txt');

    fs.appendFile(filePath, transcript + '\n', (err) => {
      if (err) {
        console.error(err);
        res.status(500).json({ message: '保存エラー', error: err.message });
      } else {
        res.status(200).json({ message: '保存成功', filePath });
      }
    });
  } else {
    res.status(405).json({ message: 'Method not allowed' });
  }
}
