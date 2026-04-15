/**
 * Generates MP3 audio files for each scene.
 * Writes to /public/sessions/{sessionId}/audio-{index}.mp3
 * Returns the list of public URL paths.
 *
 * Provider priority (first available key wins):
 *   1. Hugging Face Inference API — free tier, no credit card needed
 *   2. ElevenLabs                 — paid, high quality
 *   3. OpenAI TTS                 — paid, good quality
 */

import fs from 'fs';
import path from 'path';
import { ensureSessionDir } from './session';
import { getEnv, hasEnv } from './env';
import type { Scene } from '@/remotion/types';

const HF_TTS_MODELS = [
  getEnv('HF_TTS_MODEL') ?? 'espnet/kan-bayashi_ljspeech_vits',
  'facebook/mms-tts-eng',
];

async function ttsHuggingFace(text: string, outputPath: string): Promise<void> {
  const { HfInference } = await import('@huggingface/inference');
  const hf = new HfInference(getEnv('HUGGINGFACE_API_KEY'));
  const failures: string[] = [];

  for (const model of HF_TTS_MODELS) {
    try {
      const audioBlob = await hf.textToSpeech({
        provider: 'hf-inference',
        model,
        inputs: text,
      });

      const buffer = Buffer.from(await audioBlob.arrayBuffer());
      fs.writeFileSync(outputPath, buffer);
      return;
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      failures.push(`${model}: ${message}`);
      console.warn(`[tts] Hugging Face model ${model} failed: ${message}`);
    }
  }

  throw new Error(`All Hugging Face TTS models failed. ${failures.join(' | ')}`);
}

async function ttsElevenLabs(text: string, outputPath: string): Promise<void> {
  const voiceId = process.env.ELEVENLABS_VOICE_ID ?? 'EXAVITQu4vr4xnSDxMaL'; // Rachel
  const apiKey = getEnv('ELEVENLABS_API_KEY');
  const response = await fetch(
    `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,
    {
      method: 'POST',
      headers: {
        Accept: 'audio/mpeg',
        'Content-Type': 'application/json',
        'xi-api-key': apiKey!,
      },
      body: JSON.stringify({
        text,
        model_id: 'eleven_monolingual_v1',
        voice_settings: { stability: 0.5, similarity_boost: 0.75 },
      }),
    },
  );

  if (!response.ok) throw new Error(`ElevenLabs error: ${response.statusText}`);
  const buffer = Buffer.from(await response.arrayBuffer());
  fs.writeFileSync(outputPath, buffer);
}

async function ttsOpenAI(text: string, outputPath: string): Promise<void> {
  const OpenAI = (await import('openai')).default;
  const client = new OpenAI({ apiKey: getEnv('OPENAI_API_KEY') });

  const response = await client.audio.speech.create({
    model: 'tts-1',
    voice: 'nova',
    input: text,
    speed: 0.95,
  });

  const buffer = Buffer.from(await response.arrayBuffer());
  fs.writeFileSync(outputPath, buffer);
}

export async function generateAudioFiles(
  scenes: Scene[],
  sessionId: string,
  baseUrl: string,
): Promise<{ audioUrls: string[]; warnings: string[] }> {
  const dir = ensureSessionDir(sessionId);
  const urls: string[] = [];
  const warnings: string[] = [];

  for (let i = 0; i < scenes.length; i++) {
    const scene = scenes[i];
    const filename = `audio-${i}.mp3`;
    const outputPath = path.join(dir, filename);

    const errors: string[] = [];

    if (hasEnv('HUGGINGFACE_API_KEY')) {
      try {
        await ttsHuggingFace(scene.text, outputPath);
        urls.push(`${baseUrl}/sessions/${sessionId}/${filename}`);
        continue;
      } catch (error: unknown) {
        errors.push(`Hugging Face: ${error instanceof Error ? error.message : String(error)}`);
      }
    }

    if (hasEnv('ELEVENLABS_API_KEY')) {
      try {
        await ttsElevenLabs(scene.text, outputPath);
        urls.push(`${baseUrl}/sessions/${sessionId}/${filename}`);
        continue;
      } catch (error: unknown) {
        errors.push(`ElevenLabs: ${error instanceof Error ? error.message : String(error)}`);
      }
    }

    if (hasEnv('OPENAI_API_KEY')) {
      try {
        await ttsOpenAI(scene.text, outputPath);
        urls.push(`${baseUrl}/sessions/${sessionId}/${filename}`);
        continue;
      } catch (error: unknown) {
        errors.push(`OpenAI: ${error instanceof Error ? error.message : String(error)}`);
      }
    }

    if (errors.length === 0) {
      throw new Error(
        'No valid TTS key configured. Set HUGGINGFACE_API_KEY (free at huggingface.co), ' +
        'ELEVENLABS_API_KEY, or OPENAI_API_KEY in .env.local, and remove any example placeholder values.',
      );
    }

    warnings.push(`Scene ${i + 1} (${scene.type}) has no narration. ${errors.join(' | ')}`);
    urls.push('');
  }

  return { audioUrls: urls, warnings };
}
