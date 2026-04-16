/**
 * POST /api/upload-photo
 * Body: multipart { sessionId: string, photo: File }
 *
 * Used by the "Paste Text" flow where no PDF is uploaded but the user
 * has added a profile photo. Creates the session directory and saves the photo.
 * Returns: { photoUrl: string }
 */

import { NextRequest, NextResponse } from 'next/server';
import { ensureSessionDir } from '@/lib/session';
import path from 'path';
import fs from 'fs';

export const runtime = 'nodejs';

const ALLOWED_PHOTO_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_PHOTO_BYTES = 5 * 1024 * 1024;

function getBaseUrl(req: NextRequest): string {
  const proto = req.headers.get('x-forwarded-proto') ?? 'http';
  const host = req.headers.get('host') ?? 'localhost:3000';
  return `${proto}://${host}`;
}

function photoExtension(mime: string): string {
  switch (mime) {
    case 'image/jpeg': return 'jpg';
    case 'image/png': return 'png';
    case 'image/webp': return 'webp';
    default: return 'jpg';
  }
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const sessionId = formData.get('sessionId');
    const photo = formData.get('photo');

    if (!sessionId || typeof sessionId !== 'string') {
      return NextResponse.json({ error: 'sessionId is required' }, { status: 400 });
    }

    if (!photo || typeof photo === 'string' || photo.size === 0) {
      return NextResponse.json({ error: 'No photo provided' }, { status: 400 });
    }

    if (!ALLOWED_PHOTO_TYPES.includes(photo.type)) {
      return NextResponse.json({ error: 'Photo must be JPG, PNG, or WEBP' }, { status: 400 });
    }

    if (photo.size > MAX_PHOTO_BYTES) {
      return NextResponse.json({ error: 'Photo exceeds 5 MB limit' }, { status: 413 });
    }

    const dir = ensureSessionDir(sessionId);
    const ext = photoExtension(photo.type);
    const filename = `photo.${ext}`;
    const photoBuffer = Buffer.from(await photo.arrayBuffer());
    fs.writeFileSync(path.join(dir, filename), photoBuffer);

    const baseUrl = getBaseUrl(req);
    const photoUrl = `${baseUrl}/sessions/${sessionId}/${filename}`;

    return NextResponse.json({ photoUrl });
  } catch (err) {
    console.error('[upload-photo]', err);
    return NextResponse.json({ error: 'Failed to save photo' }, { status: 500 });
  }
}
