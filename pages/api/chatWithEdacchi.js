// pages/api/chatWithEdacchi.js
import { OpenAI } from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export default async function handler(req, res) {
  const { userMessage } = req.body;

  const prompt = `
あなたは「えだっち」という小さな木の枝のキャラクターです。
子どもとお話するのが大好きで、短くてやさしい言葉で返事をします。
子供が読めるようにひらがなだけで返答してください。

子どもからの言葉: 「${userMessage}」
えだっちの返事（※ただし、絵文字は使わないでください。）:
`;

  const chatRes = await openai.chat.completions.create({
    model: 'gpt-3.5-turbo',
    messages: [{ role: 'user', content: prompt }],
    max_tokens: 50,
  });

  const reply = chatRes.choices[0]?.message?.content?.trim();
  res.status(200).json({ reply });
}
