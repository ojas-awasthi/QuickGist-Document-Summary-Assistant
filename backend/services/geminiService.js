
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';
dotenv.config();

const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
  console.warn('GEMINI_API_KEY is not set. Set it in your .env file to enable summaries.');
}

const ai = new GoogleGenAI({ apiKey });

const LENGTH_MAP = {
  short: 'Please keep it short (approx 3-5 bullet points and a 50-100 word paragraph).',
  medium: 'Please provide 5-8 bullet points and a 150-250 word paragraph.',
  long: 'Please provide detailed summary: 8-12 bullet points and a 350-600 word paragraph.'
};


export async function generateSummary(text, length = 'medium') {
  if (!apiKey) throw new Error('GEMINI_API_KEY not configured on the server.');

  const model = process.env.GEMINI_MODEL || 'gemini-2.0-flash-001';

  const instruction = `
You are a helpful assistant. Summarize the following document. ${LENGTH_MAP[length] || LENGTH_MAP.medium}
Deliver:
1) A short paragraph "Concise summary:" with the core idea.
2) A "Key points:" list (bullet points).
3) "Action items / dates / numbers" if any found.

Document:
${text}
`;

  try {
    const response = await ai.models.generateContent({
      model,
      contents: instruction
    });

    if (response && typeof response.text === 'string') return response.text;
    // fallback: return the raw object
    return JSON.stringify(response, null, 2);
  } catch (err) {
    console.error('Gemini error:', err);
    throw err;
  }
}
