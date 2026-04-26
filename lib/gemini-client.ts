/**
 * lib/gemini-client.ts
 *
 * Google Gemini inference client — fallback for Groq in content generation.
 * Model: gemini-1.5-flash — fast, free tier (15 req/min, 1M req/day).
 */

import { GoogleGenerativeAI } from '@google/generative-ai';

let _client: GoogleGenerativeAI | null = null;

export function getGeminiClient(): GoogleGenerativeAI {
  if (!_client) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) throw new Error('GEMINI_API_KEY is not set');
    _client = new GoogleGenerativeAI(apiKey);
  }
  return _client;
}

export function isGeminiConfigured(): boolean {
  return !!process.env.GEMINI_API_KEY;
}

/**
 * Generate structured JSON content via Gemini.
 * Uses gemini-1.5-flash — fast, free, reliable JSON output.
 */
export async function geminiJSON<T = unknown>(prompt: string): Promise<T> {
  const genAI = getGeminiClient();
  const model = genAI.getGenerativeModel({
    model: 'gemini-1.5-flash',
    generationConfig: {
      responseMimeType: 'application/json',
      temperature: 0.4,
      maxOutputTokens: 2048,
    },
    systemInstruction:
      'You are a professional curriculum architect. Always respond with valid JSON only. No markdown, no prose, no code fences.',
  });

  const result = await model.generateContent(prompt);
  const raw = result.response.text();
  return JSON.parse(raw) as T;
}
