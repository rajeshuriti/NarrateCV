/**
 * Converts raw resume text → structured JSON scenes.
 *
 * Provider priority:
 *   1. OpenRouter    — free/open-source models
 *   2. Gemini        — generous free tier
 *   3. Hugging Face  — open-source chat models
 *   4. Groq          — fast fallback
 *   5. Anthropic     — paid fallback
 *   6. OpenAI        — paid fallback
 */

import type { Scene } from '@/remotion/types';
import { getEnv, hasEnv } from './env';

export interface Script {
  scenes: Scene[];
}

// Free models tried in order when the previous one returns 429 or 404.
// Override the first choice with OPENROUTER_MODEL env var.
const OPENROUTER_MODELS = [
  getEnv('OPENROUTER_MODEL') ?? 'meta-llama/llama-3.3-70b-instruct:free',
  'google/gemma-3-27b-it:free',
  'deepseek/deepseek-chat-v3-0324:free',
  'qwen/qwen2.5-72b-instruct:free',
  'google/gemma-3-12b-it:free',
];

const GEMINI_MODELS = [
  getEnv('GEMINI_MODEL') ?? 'gemini-2.0-flash',
  'gemini-1.5-flash',
];

const HUGGINGFACE_CHAT_MODELS = [
  getEnv('HUGGINGFACE_MODEL') ?? 'Qwen/Qwen2.5-72B-Instruct',
  'meta-llama/Llama-3.1-8B-Instruct',
  'mistralai/Mistral-7B-Instruct-v0.3',
];

function buildSystemPrompt(hasPhoto: boolean): string {
  const photoInstruction = hasPhoto
    ? `\n- The user has uploaded a profile photo. Set "usePhoto": true on the "intro" and "closing" scenes ONLY.`
    : `\n- No profile photo was uploaded. Set "usePhoto": false on all scenes.`;

  return `You are an expert resume storyteller. Convert the resume text into a compelling
narrated video script. Output ONLY valid JSON — no markdown, no explanation.

Rules:
- Short, punchy sentences optimised for voice-over (max 25 words per scene)
- No filler phrases ("I am passionate about…", "leveraging synergies…")
- Focus on concrete impact and numbers where present
- Each scene must have a clear single focus${photoInstruction}

Required JSON shape:
{
  "scenes": [
    { "type": "intro",      "text": "<name + 1-line title>",         "duration": 4, "usePhoto": ${hasPhoto} },
    { "type": "skills",     "text": "<comma-separated key skills>",  "duration": 5, "usePhoto": false },
    { "type": "experience", "text": "<2-3 most impressive roles>",   "duration": 6, "usePhoto": false },
    { "type": "project",    "text": "<1-2 standout projects>",       "duration": 6, "usePhoto": false },
    { "type": "impact",     "text": "<3 quantified achievements>",   "duration": 5, "usePhoto": false },
    { "type": "closing",    "text": "<1 memorable closing line>",    "duration": 4, "usePhoto": ${hasPhoto} }
  ]
}`;
}

const USER_PROMPT = (resumeText: string) =>
  `Convert this resume into the JSON video script:\n\n${resumeText}`;

/**
 * Extracts a JSON object from a model response that may be wrapped in
 * markdown code fences (\`\`\`json … \`\`\`) or contain leading/trailing prose.
 */
function extractJson(text: string, model: string): Script {
  // Strip markdown fences if present
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  const candidate = fenced ? fenced[1] : text;

  // Find the outermost { … } block
  const start = candidate.indexOf('{');
  const end = candidate.lastIndexOf('}');
  if (start === -1 || end === -1) {
    console.error(`[script] ${model} returned non-JSON:\n`, text.slice(0, 300));
    throw new Error(`Model (${model}) did not return JSON. Response: "${text.slice(0, 120)}…"`);
  }

  try {
    return JSON.parse(candidate.slice(start, end + 1)) as Script;
  } catch {
    console.error(`[script] ${model} returned malformed JSON:\n`, candidate.slice(start, end + 1).slice(0, 300));
    throw new Error(`Model (${model}) returned malformed JSON.`);
  }
}

function shouldTryNextModel(error: unknown): boolean {
  const { status } = error as { status?: number };
  return status === 429 || status === 404 || status === 400 || status === 401 || status === 402 || status === 403;
}

async function generateWithOpenRouter(resumeText: string, hasPhoto: boolean): Promise<Script> {
  const OpenAI = (await import('openai')).default;
  const client = new OpenAI({
    apiKey: getEnv('OPENROUTER_API_KEY'),
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
        messages: [
          { role: 'user', content: `${buildSystemPrompt(hasPhoto)}\n\n${USER_PROMPT(resumeText)}` },
        ],
      });
      const raw = response.choices[0]?.message?.content ?? '{}';
      return extractJson(raw, model);
    } catch (err: unknown) {
      if (shouldTryNextModel(err)) {
        const { status } = err as { status?: number };
        console.warn(`[script] ${model} returned ${status}, trying next model…`);
        lastError = err instanceof Error ? err : new Error(String(err));
        continue;
      }
      throw err;
    }
  }

  throw new Error(`All OpenRouter free models are rate-limited. ${lastError.message}`);
}

async function generateWithGemini(resumeText: string, hasPhoto: boolean): Promise<Script> {
  const apiKey = getEnv('GEMINI_API_KEY');
  let lastError: Error = new Error('No models available');

  for (const model of GEMINI_MODELS) {
    try {
      console.log(`[script] trying Gemini model: ${model}`);
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [
              {
                role: 'user',
                parts: [{ text: `${buildSystemPrompt(hasPhoto)}\n\n${USER_PROMPT(resumeText)}` }],
              },
            ],
            generationConfig: {
              temperature: 0.2,
              maxOutputTokens: 1024,
              responseMimeType: 'application/json',
            },
          }),
        },
      );

      if (!response.ok) {
        const message = await response.text();
        const error = new Error(`Gemini ${response.status}: ${message.slice(0, 200)}`);
        (error as Error & { status?: number }).status = response.status;
        throw error;
      }

      const data = await response.json() as {
        candidates?: Array<{
          content?: { parts?: Array<{ text?: string }> };
        }>;
      };

      const raw = data.candidates?.[0]?.content?.parts?.map((part) => part.text ?? '').join('') ?? '';
      return extractJson(raw, model);
    } catch (err: unknown) {
      if (shouldTryNextModel(err)) {
        const { status } = err as { status?: number };
        console.warn(`[script] ${model} returned ${status}, trying next Gemini model…`);
        lastError = err instanceof Error ? err : new Error(String(err));
        continue;
      }
      throw err;
    }
  }

  throw new Error(`All Gemini models failed. ${lastError.message}`);
}

async function generateWithHuggingFace(resumeText: string, hasPhoto: boolean): Promise<Script> {
  const { HfInference } = await import('@huggingface/inference');
  const hf = new HfInference(getEnv('HUGGINGFACE_API_KEY'));
  let lastError: Error = new Error('No models available');

  for (const model of HUGGINGFACE_CHAT_MODELS) {
    try {
      console.log(`[script] trying Hugging Face model: ${model}`);
      const response = await hf.chatCompletion({
        model,
        messages: [
          { role: 'system', content: buildSystemPrompt(hasPhoto) },
          { role: 'user', content: USER_PROMPT(resumeText) },
        ],
        max_tokens: 1024,
        temperature: 0.2,
      });

      const raw = response.choices?.[0]?.message?.content as unknown;
      const text =
        typeof raw === 'string'
          ? raw
          : Array.isArray(raw)
            ? raw.map((item) => JSON.stringify(item)).join('\n')
            : '';
      return extractJson(text, model);
    } catch (err: unknown) {
      if (shouldTryNextModel(err)) {
        const { status } = err as { status?: number };
        console.warn(`[script] ${model} returned ${status}, trying next Hugging Face model…`);
        lastError = err instanceof Error ? err : new Error(String(err));
        continue;
      }
      throw err;
    }
  }

  throw new Error(`All Hugging Face models failed. ${lastError.message}`);
}

async function generateWithGroq(resumeText: string, hasPhoto: boolean): Promise<Script> {
  const Groq = (await import('groq-sdk')).default;
  const client = new Groq({ apiKey: getEnv('GROQ_API_KEY') });

  const response = await client.chat.completions.create({
    model: 'llama-3.3-70b-versatile',
    response_format: { type: 'json_object' },
    messages: [
      { role: 'system', content: buildSystemPrompt(hasPhoto) },
      { role: 'user', content: USER_PROMPT(resumeText) },
    ],
  });

  const raw = response.choices[0]?.message?.content ?? '{}';
  return JSON.parse(raw) as Script;
}

async function generateWithClaude(resumeText: string, hasPhoto: boolean): Promise<Script> {
  const Anthropic = (await import('@anthropic-ai/sdk')).default;
  const client = new Anthropic({ apiKey: getEnv('ANTHROPIC_API_KEY') });

  const message = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 1024,
    messages: [{ role: 'user', content: USER_PROMPT(resumeText) }],
    system: buildSystemPrompt(hasPhoto),
  });

  const raw = message.content[0].type === 'text' ? message.content[0].text : '';
  return JSON.parse(raw) as Script;
}

async function generateWithOpenAI(resumeText: string, hasPhoto: boolean): Promise<Script> {
  const OpenAI = (await import('openai')).default;
  const client = new OpenAI({ apiKey: getEnv('OPENAI_API_KEY') });

  const response = await client.chat.completions.create({
    model: 'gpt-4o-mini',
    response_format: { type: 'json_object' },
    messages: [
      { role: 'system', content: buildSystemPrompt(hasPhoto) },
      { role: 'user', content: USER_PROMPT(resumeText) },
    ],
  });

  const raw = response.choices[0]?.message?.content ?? '{}';
  return JSON.parse(raw) as Script;
}

type ScriptProvider = {
  name: string;
  enabled: boolean;
  generate: (resumeText: string, hasPhoto: boolean) => Promise<Script>;
};

export async function generateScript(resumeText: string, hasPhoto: boolean = false): Promise<Script> {
  const providers: ScriptProvider[] = [
    { name: 'OpenRouter', enabled: hasEnv('OPENROUTER_API_KEY'), generate: generateWithOpenRouter },
    { name: 'Gemini', enabled: hasEnv('GEMINI_API_KEY'), generate: generateWithGemini },
    { name: 'Hugging Face', enabled: hasEnv('HUGGINGFACE_API_KEY'), generate: generateWithHuggingFace },
    { name: 'Groq', enabled: hasEnv('GROQ_API_KEY'), generate: generateWithGroq },
    { name: 'Anthropic', enabled: hasEnv('ANTHROPIC_API_KEY'), generate: generateWithClaude },
    { name: 'OpenAI', enabled: hasEnv('OPENAI_API_KEY'), generate: generateWithOpenAI },
  ];

  const availableProviders = providers.filter((provider) => provider.enabled);
  if (availableProviders.length === 0) {
    throw new Error(
      'No valid AI key configured. Set OPENROUTER_API_KEY, GEMINI_API_KEY or GOOGLE_API_KEY, ' +
      'HUGGINGFACE_API_KEY, GROQ_API_KEY, ANTHROPIC_API_KEY, or OPENAI_API_KEY in .env.local, ' +
      'and remove any example placeholder values.',
    );
  }

  const failures: string[] = [];

  for (const provider of availableProviders) {
    try {
      return await provider.generate(resumeText, hasPhoto);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      console.warn(`[script] ${provider.name} failed: ${message}`);
      failures.push(`${provider.name}: ${message}`);
    }
  }

  throw new Error(
    `All configured AI providers failed. ${failures.join(' | ')}`,
  );
}
