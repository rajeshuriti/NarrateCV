/**
 * Converts raw resume text → structured cinematic JSON scenes.
 *
 * Provider priority:
 *   1. OpenRouter    — free/open-source models
 *   2. Gemini        — generous free tier
 *   3. Hugging Face  — open-source chat models
 *   4. Groq          — fast fallback
 *   5. Anthropic     — paid fallback
 *   6. OpenAI        — paid fallback
 */

import type { VideoProps, Scene } from '@/remotion/types';
import { getEnv, hasEnv } from './env';

export interface Script extends Omit<VideoProps, 'photoUrl'> {}

// Free models tried in order. meta-llama/llama-3-8b is the most reliable free model on OR.
const OPENROUTER_MODELS = [
  getEnv('OPENROUTER_MODEL') ?? 'meta-llama/llama-3-8b-instruct:free',
  'meta-llama/llama-3.3-70b-instruct:free',
  'google/gemma-3-27b-it:free',
  'deepseek/deepseek-chat:free',
  'microsoft/phi-3-medium-128k-instruct:free',
  'qwen/qwen2.5-72b-instruct:free',
];

const GEMINI_MODELS = [
  getEnv('GEMINI_MODEL') ?? 'gemini-2.0-flash',
  'gemini-1.5-flash',
];

const HUGGINGFACE_CHAT_MODELS = [
  getEnv('HUGGINGFACE_MODEL') ?? 'Qwen/Qwen2.5-72B-Instruct',
  'meta-llama/Llama-3.1-8B-Instruct',
];

function buildSystemPrompt(hasPhoto: boolean): string {
  const photoInstruction = hasPhoto
    ? `\n- The user has uploaded a profile photo. Set "usePhoto": true on the "intro-hero", "experience-timeline", and "closing" scenes ONLY.`
    : `\n- No profile photo was uploaded. Set "usePhoto": false on all scenes.`;

  return `You are a world-class career storyteller and executive producer. Your task is to transform raw resume text into a CINEMATIC, 90-120 SECOND professional biography script. 

Output ONLY valid JSON — no markdown, no explanation.

SCENE ARCHITECTURE (Target 10-14 scenes):
1. intro-hero (8s): Full name, punchy headline, high impact.
2. summary (10s): High-level career narrative, value proposition.
3. skills-grid (10s): Overview of core competencies.
4. skill-category (8-10s): Deep dive into a specific tech stack (e.g., Frontend/Backend/Cloud).
5. experience-timeline (12s): Deep dive into Job #1 (Strongest role).
6. experience-timeline (12s): Deep dive into Job #2.
7. project-showcase (12s): Detailed breakdown of Project #1.
8. project-showcase (10s): Detailed breakdown of Project #2.
9. metrics (10s): Quantified achievements and dramatic data points.
10. strengths (8s): Soft skills and working style.
11. career-goal (8s): Vision for the next role.
12. closing (8s): Compelling call to action and memorable final line.

RULES:
- DURATION: Total duration must be between 100-125 seconds. Each scene must be 8-12 seconds.
- LANGUAGE: Premium, confident, recruiter-friendly storytelling. Use natural spoken rhythm.
- NO CLICHÉS: Avoid "passionate about", "synergy", "proven track record".
- ELABORATION: Do not just list bullet points. Explain the "Why" and "How" behind achievements.
- SKILLS: Group skills logically into categories.
- TONE: Professional but engaging, like a high-end product advertisement.${photoInstruction}

JSON RESPONSE SHAPE:
{
  "candidate": {
    "name": "Full Name",
    "headline": "Senior Software Engineer",
    "yearsExperience": "10+"
  },
  "videoMeta": {
    "targetDurationSeconds": 115
  },
  "scenes": [
    {
      "type": "intro-hero",
      "title": "Introducing [Name]",
      "subtitle": "[Headline]",
      "text": "[8s of clear narration]",
      "duration": 8,
      "usePhoto": true,
      "visual": "hero"
    },
    ...
  ]
}`;
}

const USER_PROMPT = (resumeText: string) =>
  `Convert this resume into the cinematic JSON video script:\n\n${resumeText}`;

/**
 * Extracts a JSON object from a model response.
 */
function extractJson(text: string, model: string): Script {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  const candidate = fenced ? fenced[1] : text;

  const start = candidate.indexOf('{');
  const end = candidate.lastIndexOf('}');
  if (start === -1 || end === -1) {
    throw new Error(`Model (${model}) did not return JSON. Response snippet: "${text.slice(0, 100)}…"`);
  }

  try {
    return JSON.parse(candidate.slice(start, end + 1)) as Script;
  } catch {
    throw new Error(`Model (${model}) returned malformed JSON.`);
  }
}

function shouldTryNextModel(error: unknown): boolean {
  const { status } = error as { status?: number };
  return status === 429 || status === 404 || status === 400 || status === 401 || status === 403;
}

async function generateWithOpenRouter(resumeText: string, hasPhoto: boolean): Promise<Script> {
  const OpenAI = (await import('openai')).default;
  const client = new OpenAI({
    apiKey: getEnv('OPENROUTER_API_KEY'),
    baseURL: 'https://openrouter.ai/api/v1',
  });

  let lastError: Error = new Error('No models available');
  for (const model of OPENROUTER_MODELS) {
    try {
      console.log(`[script] trying OpenRouter model: ${model}`);
      const response = await client.chat.completions.create({
        model,
        messages: [
          { role: 'system', content: buildSystemPrompt(hasPhoto) },
          { role: 'user', content: USER_PROMPT(resumeText) }
        ],
        temperature: 0.3,
        max_tokens: 2500, // Ensure enough tokens for 12-14 scenes
      });
      const raw = response.choices[0]?.message?.content ?? '{}';
      return extractJson(raw, model);
    } catch (err: unknown) {
      if (shouldTryNextModel(err)) {
        lastError = err instanceof Error ? err : new Error(String(err));
        continue;
      }
      throw err;
    }
  }
  throw lastError;
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
            contents: [{ role: 'user', parts: [{ text: `${buildSystemPrompt(hasPhoto)}\n\n${USER_PROMPT(resumeText)}` }] }],
            generationConfig: { temperature: 0.2, maxOutputTokens: 2048, responseMimeType: 'application/json' },
          }),
        },
      );

      if (!response.ok) {
        const error = new Error(`Gemini ${response.status}`);
        (error as any).status = response.status;
        throw error;
      }

      const data = await response.json();
      const raw = data.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
      return extractJson(raw, model);
    } catch (err: unknown) {
      if (shouldTryNextModel(err)) {
        lastError = err instanceof Error ? err : new Error(String(err));
        continue;
      }
      throw err;
    }
  }
  throw lastError;
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
        max_tokens: 3000,
        temperature: 0.2,
      });

      const raw = response.choices?.[0]?.message?.content;
      return extractJson(typeof raw === 'string' ? raw : JSON.stringify(raw), model);
    } catch (err: unknown) {
      if (shouldTryNextModel(err)) {
        lastError = err instanceof Error ? err : new Error(String(err));
        continue;
      }
      throw err;
    }
  }
  throw lastError;
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
    model: 'claude-3-5-sonnet-20240620',
    max_tokens: 4096,
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
    max_tokens: 4096,
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

  const availableProviders = providers.filter((p) => p.enabled);
  if (availableProviders.length === 0) {
    throw new Error('No valid AI key configured.');
  }

  for (const provider of availableProviders) {
    try {
      console.log(`[script] Calling ${provider.name}...`);
      return await provider.generate(resumeText, hasPhoto);
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : String(error);
      const status = (error as any)?.status;
      
      if (status === 401) {
        console.error(`[script] CRITICAL: ${provider.name} API Key is INVALID (401). Check .env.local.`);
      } else if (status === 429) {
        console.warn(`[script] ${provider.name} Rate Limited (429).`);
      } else {
        console.error(`[script] ${provider.name} error (${status || 'unknown'}):`, msg);
      }
    }
  }

  throw new Error('All configured AI providers failed. Check server logs for 401 or 429 errors.');
}
