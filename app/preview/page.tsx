'use client';

/**
 * Preview page — loads session data from sessionStorage, shows the
 * Remotion Player for instant preview, and triggers server-side render
 * for the final downloadable MP4.
 */

import React, { useEffect, useRef, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import type { Scene } from '@/remotion/types';
import dynamic from 'next/dynamic';

// Remotion Player must be client-only (uses browser APIs)
const PlayerWrapper = dynamic(() => import('@/components/PlayerWrapper'), { ssr: false });

type RenderState = 'idle' | 'rendering' | 'done' | 'error';

// Inner component that reads search params — must be inside <Suspense>
function PreviewInner() {
  const params = useSearchParams();
  const sessionId = params.get('session') ?? '';

  const [scenes, setScenes] = useState<Scene[]>([]);
  const [notFound, setNotFound] = useState(false);
  const [renderState, setRenderState] = useState<RenderState>('idle');
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [renderError, setRenderError] = useState<string | null>(null);
  const renderCalledRef = useRef(false);

  // ── Load session from sessionStorage ─────────────────────────────────────
  useEffect(() => {
    if (!sessionId) { setNotFound(true); return; }
    const raw = sessionStorage.getItem(`ncv_${sessionId}`);
    if (!raw) { setNotFound(true); return; }
    const { scenes: s } = JSON.parse(raw) as { sessionId: string; scenes: Scene[] };
    setScenes(s);
  }, [sessionId]);

  // ── Trigger server render automatically once scenes are loaded ────────────
  useEffect(() => {
    if (scenes.length === 0 || renderCalledRef.current) return;
    renderCalledRef.current = true;
    startRender();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scenes]);

  async function startRender() {
    setRenderState('rendering');
    setRenderError(null);
    try {
      const res = await fetch('/api/render', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId, scenes }),
      });
      if (!res.ok) throw new Error((await res.json()).error);
      const { videoUrl: url } = await res.json();
      setVideoUrl(url);
      setRenderState('done');
    } catch (err: unknown) {
      setRenderError(err instanceof Error ? err.message : 'Render failed');
      setRenderState('error');
    }
  }

  const totalDuration = scenes.reduce((acc, s) => acc + s.duration, 0);
  const totalFrames = Math.round(totalDuration * 30);

  if (notFound) {
    return (
      <main className="min-h-screen flex items-center justify-center px-6 text-center">
        <div>
          <p className="text-4xl mb-4">🔍</p>
          <h2 className="text-2xl font-bold text-white mb-2">Session not found</h2>
          <p className="text-slate-500 mb-6">This link may have expired or been opened in a new tab.</p>
          <a href="/upload" className="text-accent hover:text-accent-light underline">
            Start a new video →
          </a>
        </div>
      </main>
    );
  }

  if (scenes.length === 0) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
      </main>
    );
  }

  return (
    <main className="min-h-screen flex flex-col items-center px-6 py-12">
      <div className="w-full max-w-4xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <a href="/upload" className="text-accent-light text-sm hover:text-accent transition-colors">
              ← Upload another
            </a>
            <h1 className="text-2xl font-bold text-white mt-1">Your NarrateCV Video</h1>
          </div>
          <span className="text-slate-500 text-sm">{totalDuration}s · {scenes.length} scenes</span>
        </div>

        {/* Remotion Player — live preview directly in the browser */}
        <div className="rounded-2xl overflow-hidden border border-border bg-surface shadow-xl shadow-black/50">
          <PlayerWrapper scenes={scenes} durationInFrames={totalFrames} />
        </div>

        {/* Scene list */}
        <div className="mt-8 grid gap-3">
          <p className="text-xs text-slate-500 font-semibold uppercase tracking-widest">Script</p>
          {scenes.map((scene, i) => (
            <div
              key={i}
              className="flex items-start gap-4 p-4 bg-surface rounded-xl border border-border"
            >
              <span className="text-accent text-xs font-mono uppercase tracking-wider mt-0.5 w-24 flex-shrink-0">
                {scene.type}
              </span>
              <p className="text-slate-300 text-sm leading-relaxed flex-1">{scene.text}</p>
              <span className="text-slate-600 text-xs flex-shrink-0">{scene.duration}s</span>
            </div>
          ))}
        </div>

        {/* Render status + download */}
        <div className="mt-8 p-6 bg-surface rounded-2xl border border-border">
          {renderState === 'rendering' && (
            <div className="flex items-center gap-4">
              <div className="w-6 h-6 border-2 border-accent border-t-transparent rounded-full animate-spin flex-shrink-0" />
              <div>
                <p className="text-white font-semibold">Rendering your video…</p>
                <p className="text-slate-500 text-sm mt-0.5">
                  This takes 30–90 seconds. The preview above is playable now.
                </p>
              </div>
            </div>
          )}

          {renderState === 'done' && videoUrl && (
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <div>
                <p className="text-white font-semibold">✓ Video ready</p>
                <p className="text-slate-500 text-sm mt-0.5">Your MP4 has been rendered.</p>
              </div>
              <a
                href={videoUrl}
                download="narratecv.mp4"
                className="inline-flex items-center gap-2 bg-accent hover:bg-accent/90 text-white font-semibold px-6 py-3 rounded-xl transition-all hover:scale-[1.02] shadow-lg shadow-accent/25"
              >
                ⬇ Download MP4
              </a>
            </div>
          )}

          {renderState === 'error' && (
            <div className="space-y-3">
              <p className="text-red-400 font-semibold">Render failed</p>
              <p className="text-slate-500 text-sm">{renderError}</p>
              <button
                onClick={() => { renderCalledRef.current = false; startRender(); }}
                className="text-accent hover:text-accent-light text-sm underline"
              >
                Retry render
              </button>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}

// Exported page wraps PreviewInner in Suspense (required for useSearchParams in Next.js 14)
export default function PreviewPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
        </main>
      }
    >
      <PreviewInner />
    </Suspense>
  );
}
