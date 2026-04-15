/**
 * POST /api/render
 * Body: { sessionId: string, scenes: Scene[] }
 *
 * Server-side Remotion render pipeline:
 *   1. bundle() — webpack-bundles the Remotion entry point
 *   2. selectComposition() — resolves the composition + calculateMetadata
 *   3. renderMedia() — Chrome renders every frame → H.264 MP4
 *
 * Returns: { videoUrl: string }
 *
 * NOTE: This can take 30–90 s for a 30 s video.
 * For production, move to a background job queue + polling endpoint.
 */

import { NextRequest, NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs';
import { bundle } from '@remotion/bundler';
import { renderMedia, selectComposition } from '@remotion/renderer';
import { ensureSessionDir } from '@/lib/session';
import type { Scene } from '@/remotion/types';

export const runtime = 'nodejs';
export const maxDuration = 300; // 5-minute timeout

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
      return NextResponse.json({ error: 'sessionId and scenes required' }, { status: 400 });
    }

    const dir = ensureSessionDir(sessionId);
    const outputPath = path.join(dir, 'video.mp4');

    // ── 1. Bundle the Remotion entry point ──────────────────────────────────
    // The bundle is a webpack output that Chrome uses to render each frame.
    const entryPoint = path.join(process.cwd(), 'remotion', 'index.ts');
    const bundleLocation = await bundle({
      entryPoint,
      // Pass-through webpack config (no overrides needed for MVP)
      webpackOverride: (cfg) => cfg,
    });

    // ── 2. Resolve the composition (runs calculateMetadata) ─────────────────
    const inputProps = { scenes };
    const composition = await selectComposition({
      serveUrl: bundleLocation,
      id: 'NarrateCV',
      inputProps,
    });

    // ── 3. Render to MP4 ────────────────────────────────────────────────────
    await renderMedia({
      composition,
      serveUrl: bundleLocation,
      codec: 'h264',
      outputLocation: outputPath,
      inputProps,
      // Log render progress to server console
      onProgress: ({ progress }) => {
        process.stdout.write(`\r[render] ${Math.round(progress * 100)}%`);
      },
    });

    process.stdout.write('\n');

    // Sanity check — make sure a file was actually produced
    if (!fs.existsSync(outputPath)) {
      throw new Error('Render completed but output file not found');
    }

    const baseUrl = getBaseUrl(req);
    const videoUrl = `${baseUrl}/sessions/${sessionId}/video.mp4`;

    return NextResponse.json({ videoUrl });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('[render]', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
