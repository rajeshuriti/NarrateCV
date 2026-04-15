/**
 * POST /api/generate-audio
 * Body: { sessionId: string, scenes: Scene[] }
 * Generates one MP3 per scene, saves to /public/sessions/{sessionId}/,
 * returns { audioUrls: string[], warning?: string }
 */

import { NextRequest, NextResponse } from 'next/server';
import { generateAudioFiles } from '@/lib/voice-generator';
import type { Scene } from '@/remotion/types';

export const runtime = 'nodejs';
// Audio generation can take a while for multiple scenes
export const maxDuration = 120;

function getBaseUrl(req: NextRequest): string {
  const proto = req.headers.get('x-forwarded-proto') ?? 'http';
  const host = req.headers.get('host') ?? 'localhost:3000';
  return `${proto}://${host}`;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { sessionId, scenes } = body as { sessionId: string; scenes: Scene[] };

    if (!sessionId || !Array.isArray(scenes) || scenes.length === 0) {
      return NextResponse.json(
        { error: 'sessionId and scenes are required' },
        { status: 400 },
      );
    }

    const baseUrl = getBaseUrl(req);
    const { audioUrls, warnings } = await generateAudioFiles(scenes, sessionId, baseUrl);

    return NextResponse.json({
      audioUrls,
      warning: warnings.length > 0
        ? `Voice-over could not be generated for ${warnings.length} scene(s). A silent video will be created instead.`
        : undefined,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('[generate-audio]', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
