/**
 * POST /api/upload
 * Accepts a multipart form: required `file` (PDF) + optional `photo` (JPG/PNG/WEBP).
 * Creates a session directory, saves the photo (if any), extracts resume text.
 * Returns: { text, charCount, sessionId, photoUrl? }
 */

import { NextRequest, NextResponse } from 'next/server';
import { extractTextFromPdf } from '@/lib/pdf-parser';
import { ensureSessionDir } from '@/lib/session';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import fs from 'fs';

export const runtime = 'nodejs'; // pdf-parse requires Node.js runtime

const ALLOWED_PHOTO_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_PHOTO_BYTES = 5 * 1024 * 1024; // 5 MB
const MAX_PDF_BYTES = 5 * 1024 * 1024;

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
    const file = formData.get('file');
    const photo = formData.get('photo');

    if (!file || typeof file === 'string') {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    if (!file.name.toLowerCase().endsWith('.pdf')) {
      return NextResponse.json({ error: 'Only PDF files are supported' }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    if (arrayBuffer.byteLength > MAX_PDF_BYTES) {
      return NextResponse.json({ error: 'PDF exceeds 5 MB limit' }, { status: 413 });
    }

    // Create session eagerly so we can save the photo
    const sessionId = uuidv4();
    const dir = ensureSessionDir(sessionId);
    const baseUrl = getBaseUrl(req);

    // ── Handle optional photo ────────────────────────────────────────────────
    let photoUrl: string | undefined;

    if (photo && typeof photo !== 'string' && photo.size > 0) {
      if (!ALLOWED_PHOTO_TYPES.includes(photo.type)) {
        return NextResponse.json(
          { error: 'Photo must be JPG, PNG, or WEBP' },
          { status: 400 },
        );
      }
      if (photo.size > MAX_PHOTO_BYTES) {
        return NextResponse.json(
          { error: 'Photo exceeds 5 MB limit' },
          { status: 413 },
        );
      }

      const ext = photoExtension(photo.type);
      const filename = `photo.${ext}`;
      const photoBuffer = Buffer.from(await photo.arrayBuffer());
      fs.writeFileSync(path.join(dir, filename), photoBuffer);
      photoUrl = `${baseUrl}/sessions/${sessionId}/${filename}`;
    }

    // ── Extract resume text ──────────────────────────────────────────────────
    const buffer = Buffer.from(arrayBuffer);
    const text = await extractTextFromPdf(buffer);

    if (!text || text.length < 50) {
      return NextResponse.json(
        { error: 'Could not extract meaningful text from this PDF' },
        { status: 422 },
      );
    }

    return NextResponse.json({ text, charCount: text.length, sessionId, photoUrl });
  } catch (err) {
    console.error('[upload]', err);
    return NextResponse.json({ error: 'Failed to parse PDF' }, { status: 500 });
  }
}
