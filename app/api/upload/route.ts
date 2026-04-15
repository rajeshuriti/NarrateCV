/**
 * POST /api/upload
 * Accepts a multipart PDF upload, extracts text, returns raw resume text.
 * The frontend stores the text in state and passes it to the next step.
 */

import { NextRequest, NextResponse } from 'next/server';
import { extractTextFromPdf } from '@/lib/pdf-parser';

export const runtime = 'nodejs'; // pdf-parse requires Node.js runtime

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file');

    if (!file || typeof file === 'string') {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    if (!file.name.toLowerCase().endsWith('.pdf')) {
      return NextResponse.json({ error: 'Only PDF files are supported' }, { status: 400 });
    }

    // 5 MB limit
    const MAX_BYTES = 5 * 1024 * 1024;
    const arrayBuffer = await file.arrayBuffer();
    if (arrayBuffer.byteLength > MAX_BYTES) {
      return NextResponse.json({ error: 'File exceeds 5 MB limit' }, { status: 413 });
    }

    const buffer = Buffer.from(arrayBuffer);
    const text = await extractTextFromPdf(buffer);

    if (!text || text.length < 50) {
      return NextResponse.json(
        { error: 'Could not extract meaningful text from this PDF' },
        { status: 422 },
      );
    }

    return NextResponse.json({ text, charCount: text.length });
  } catch (err) {
    console.error('[upload]', err);
    return NextResponse.json({ error: 'Failed to parse PDF' }, { status: 500 });
  }
}
