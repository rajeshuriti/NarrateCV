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
import type { Scene } from '@/remotion/types';

// HF model used for TTS — swap to any model that supports text-to-speech
// Good free options:
//   facebook/mms-tts-eng   — fast, clear English voice
//   espnet/kan-bayashi_ljspeech_vits — natural-sounding, slower
const HF_TTS_MODEL = process.env.HF_TTS_MODEL ?? 'facebook/mms-tts-eng';

async function ttsHuggingFace(text: string, outputPath: string): Promise<void> {
  const { HfInference } = await import('@huggingface/inference');
  const hf = new HfInference(process.env.HUGGINGFACE_API_KEY);

  const audioBlob = await hf.textToSpeech({
    model: HF_TTS_MODEL,
    inputs: text,
  });

  const buffer = Buffer.from(await audioBlob.arrayBuffer());
  fs.writeFileSync(outputPath, buffer);
}

async function ttsElevenLabs(text: string, outputPath: string): Promise<void> {
  const voiceId = process.env.ELEVENLABS_VOICE_ID ?? 'EXAVITQu4vr4xnSDxMaL'; // Rachel
  const response = await fetch(
    `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,
    {
      method: 'POST',
      headers: {
        Accept: 'audio/mpeg',
        'Content-Type': 'application/json',
        'xi-api-key': process.env.ELEVENLABS_API_KEY!,
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
  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

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
): Promise<string[]> {
  const dir = ensureSessionDir(sessionId);
  const urls: string[] = [];

  for (let i = 0; i < scenes.length; i++) {
    const scene = scenes[i];
    const filename = `audio-${i}.mp3`;
    const outputPath = path.join(dir, filename);

    if (process.env.HUGGINGFACE_API_KEY) {
      await ttsHuggingFace(scene.text, outputPath);
    } else if (process.env.ELEVENLABS_API_KEY) {
      await ttsElevenLabs(scene.text, outputPath);
    } else if (process.env.OPENAI_API_KEY) {
      await ttsOpenAI(scene.text, outputPath);
    } else {
      throw new Error(
        'No TTS key configured. Set HUGGINGFACE_API_KEY (free at huggingface.co), ' +
        'ELEVENLABS_API_KEY, or OPENAI_API_KEY in .env.local',
      );
    }

    urls.push(`${baseUrl}/sessions/${sessionId}/${filename}`);
  }

  return urls;
}
