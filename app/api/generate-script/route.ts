/**
 * POST /api/generate-script
 * Body: { resumeText: string }
 * Returns: { scenes: Scene[] }
 */

import { NextRequest, NextResponse } from 'next/server';
import { generateScript } from '@/lib/script-generator';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const resumeText: string = body?.resumeText;

    if (!resumeText || resumeText.trim().length < 50) {
      return NextResponse.json({ error: 'resumeText is required' }, { status: 400 });
    }

    // Truncate to ~4000 chars — enough for Claude / GPT-4o-mini context
    const trimmed = resumeText.slice(0, 4000);
    const script = await generateScript(trimmed);

    // Sanity-check the returned JSON has the right shape
    if (!Array.isArray(script?.scenes) || script.scenes.length === 0) {
      return NextResponse.json({ error: 'AI returned invalid script format' }, { status: 500 });
    }

    return NextResponse.json({ scenes: script.scenes });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('[generate-script]', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
