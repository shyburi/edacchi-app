// pages/api/analyzeTranscript.js
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { transcript, growthPrompt } = req.body;

  if (!transcript || !growthPrompt) {
    return res.status(400).json({ error: 'Missing transcript or growthPrompt' });
  }

  const systemPrompt = `
You are an expert prompt engineer for image generation.

Based on the user's voice input and the current character growth stage, generate a high-quality prompt for a Pixar-style image generation AI.

The character is a tree branch that grows emotionally based on the user's voice.

Use the following format:
"Voice: {user input} → Final Prompt: {image generation prompt}"

Keep it in English. Use the provided growth description and keep the character cute and non-threatening.

Make sure the character is a *tree branch itself*, not something living on a tree.
`;

  try {
    const messages = [
      { role: "system", content: systemPrompt },
      {
        role: "user",
        content: `Voice: "${transcript}"\nGrowth Prompt: "${growthPrompt}"\nNow combine them into a single detailed prompt.`,
      },
    ];

    const completion = await openai.chat.completions.create({
      model: "gpt-4", // or 'gpt-3.5-turbo' if you're on the free plan
      messages,
      temperature: 0.9,
    });

    const gptPrompt = completion.choices[0].message.content;
    const finalPrompt = gptPrompt.split("→ Final Prompt:")[1]?.trim() || gptPrompt;

    res.status(200).json({ analysis: finalPrompt });
  } catch (error) {
    console.error("GPT分析エラー:", error);
    res.status(500).json({ error: "Failed to generate prompt" });
  }
}
