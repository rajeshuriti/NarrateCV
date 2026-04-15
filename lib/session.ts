/**
 * Session helpers — each pipeline run gets a UUID that namespaces its
 * files under /public/sessions/{id}/.
 */
import path from 'path';
import fs from 'fs';

export const SESSIONS_DIR = path.join(process.cwd(), 'public', 'sessions');

export function sessionDir(sessionId: string): string {
  return path.join(SESSIONS_DIR, sessionId);
}

export function ensureSessionDir(sessionId: string): string {
  const dir = sessionDir(sessionId);
  fs.mkdirSync(dir, { recursive: true });
  return dir;
}

/** Public URL path for a session file (served by Next.js static file serving) */
export function sessionPublicUrl(sessionId: string, filename: string, baseUrl: string): string {
  return `${baseUrl}/sessions/${sessionId}/${filename}`;
}
