/**
 * Converts raw resume text → structured JSON scenes.
 *
 * Provider priority (first available key wins):
 *   1. OpenRouter   — free tier models (Llama, Gemma, Mistral, …) — recommended
 *   2. Groq         — free tier, Llama 3.3 70B
 *   3. Anthropic    — Claude Sonnet (paid)
 *   4. OpenAI       — GPT-4o-mini (paid)
 */

import type { Scene } from '@/remotion/types';

export interface Script {
  scenes: Scene[];
}

// Free models tried in order when the previous one returns 429.
// Override the first choice with OPENROUTER_MODEL env var.
const OPENROUTER_MODELS = [
  process.env.OPENROUTER_MODEL ?? 'meta-llama/llama-3.3-70b-instruct:free',
  'google/gemma-3-27b-it:free',
  'mistralai/mistral-7b-instruct:free',
  'qwen/qwen2.5-72b-instruct:free',
];

const SYSTEM_PROMPT = `You are an expert resume storyteller. Convert the resume text into a compelling
narrated video script. Output ONLY valid JSON — no markdown, no explanation.

Rules:
- Short, punchy sentences optimised for voice-over (max 25 words per scene)
- No filler phrases ("I am passionate about…", "leveraging synergies…")
- Focus on concrete impact and numbers where present
- Each scene must have a clear single focus

Required JSON shape:
{
  "scenes": [
    { "type": "intro",      "text": "<name + 1-line title>",         "duration": 4 },
    { "type": "skills",     "text": "<comma-separated key skills>",  "duration": 5 },
    { "type": "experience", "text": "<2-3 most impressive roles>",   "duration": 6 },
    { "type": "impact",     "text": "<3 quantified achievements>",   "duration": 5 },
    { "type": "closing",    "text": "<1 memorable closing line>",    "duration": 4 }
  ]
}`;

const USER_PROMPT = (resumeText: string) =>
  `Convert this resume into the JSON video script:\n\n${resumeText}`;

async function generateWithOpenRouter(resumeText: string): Promise<Script> {
  const OpenAI = (await import('openai')).default;
  const client = new OpenAI({
    apiKey: process.env.OPENROUTER_API_KEY,
    baseURL: 'https://openrouter.ai/api/v1',
    defaultHeaders: {
      'HTTP-Referer': 'http://localhost:3000',
      'X-Title': 'NarrateCV',
    },
  });

  let lastError: Error = new Error('No models available');

  for (const model of OPENROUTER_MODELS) {
    try {
      console.log(`[script] trying OpenRouter model: ${model}`);
      const response = await client.chat.completions.create({
        model,
        response_format: { type: 'json_object' },
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: USER_PROMPT(resumeText) },
        ],
      });
      const raw = response.choices[0]?.message?.content ?? '{}';
      return JSON.parse(raw) as Script;
    } catch (err: unknown) {
      const { status } = err as { status?: number };
      // 429 = rate limited / provider overloaded — try next model
      if (status === 429) {
        console.warn(`[script] ${model} returned 429, trying next model…`);
        lastError = err instanceof Error ? err : new Error(String(err));
        continue;
      }
      throw err; // non-429 errors are real failures
    }
  }

  throw new Error(`All OpenRouter free models are rate-limited. ${lastError.message}`);
}

async function generateWithGroq(resumeText: string): Promise<Script> {
  const Groq = (await import('groq-sdk')).default;
  const client = new Groq({ apiKey: process.env.GROQ_API_KEY });

  const response = await client.chat.completions.create({
    model: 'llama-3.3-70b-versatile',
    response_format: { type: 'json_object' },
    messages: [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: USER_PROMPT(resumeText) },
    ],
  });

  const raw = response.choices[0]?.message?.content ?? '{}';
  return JSON.parse(raw) as Script;
}

async function generateWithClaude(resumeText: string): Promise<Script> {
  const Anthropic = (await import('@anthropic-ai/sdk')).default;
  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  const message = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 1024,
    messages: [{ role: 'user', content: USER_PROMPT(resumeText) }],
    system: SYSTEM_PROMPT,
  });

  const raw = message.content[0].type === 'text' ? message.content[0].text : '';
  return JSON.parse(raw) as Script;
}

async function generateWithOpenAI(resumeText: string): Promise<Script> {
  const OpenAI = (await import('openai')).default;
  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

  const response = await client.chat.completions.create({
    model: 'gpt-4o-mini',
    response_format: { type: 'json_object' },
    messages: [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: USER_PROMPT(resumeText) },
    ],
  });

  const raw = response.choices[0]?.message?.content ?? '{}';
  return JSON.parse(raw) as Script;
}

export async function generateScript(resumeText: string): Promise<Script> {
  if (process.env.OPENROUTER_API_KEY) return generateWithOpenRouter(resumeText);
  if (process.env.GROQ_API_KEY) return generateWithGroq(resumeText);
  if (process.env.ANTHROPIC_API_KEY) return generateWithClaude(resumeText);
  if (process.env.OPENAI_API_KEY) return generateWithOpenAI(resumeText);
  throw new Error(
    'No AI key configured. Set OPENROUTER_API_KEY (free at openrouter.ai), ' +
    'GROQ_API_KEY, ANTHROPIC_API_KEY, or OPENAI_API_KEY in .env.local',
  );
}
