'use client';

/**
 * Enhanced Preview page — loads session data, show-cases cinematic scene breakdown,
 * and allows for 120s video preview and MP4 download.
 */

import React, { useEffect, useRef, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import type { VideoProps, Scene } from '@/remotion/types';
import dynamic from 'next/dynamic';

// Remotion Player must be client-only
const PlayerWrapper = dynamic(() => import('@/components/PlayerWrapper'), { ssr: false });

type RenderState = 'idle' | 'rendering' | 'done' | 'error';

function PreviewInner() {
  const router = useRouter();
  const params = useSearchParams();
  const sessionId = params.get('session') ?? '';

  const [sessionData, setSessionData] = useState<VideoProps | null>(null);
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
    
    try {
      const data = JSON.parse(raw);
      setSessionData(data);
    } catch {
      setNotFound(true);
    }
  }, [sessionId]);

  // ── Trigger server render automatically once scenes are loaded ────────────
  useEffect(() => {
    if (!sessionData || renderCalledRef.current) return;
    renderCalledRef.current = true;
    startRender();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionData]);

  async function startRender() {
    if (!sessionData) return;
    setRenderState('rendering');
    setRenderError(null);
    try {
      const res = await fetch('/api/render', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          sessionId, 
          scenes: sessionData.scenes, 
          photoUrl: sessionData.photoUrl,
          candidate: sessionData.candidate 
        }),
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

  // Calculate total duration
  const totalDuration = sessionData?.scenes.reduce((acc, s) => acc + s.duration, 0) || 0;
  const totalFrames = Math.round(totalDuration * 30);

  if (notFound) {
    return (
      <main className="min-h-screen flex items-center justify-center px-6 text-center">
        <div>
          <p className="text-4xl mb-4">🔍</p>
          <h2 className="text-2xl font-bold text-white mb-2">Session not found</h2>
          <a href="/upload" className="text-accent hover:text-accent-light underline">Start a new video →</a>
        </div>
      </main>
    );
  }

  if (!sessionData) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
      </main>
    );
  }

  return (
    <main className="min-h-screen flex flex-col items-center px-6 py-12">
      <div className="w-full max-w-5xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <a href="/upload" className="text-accent-light text-sm hover:text-accent transition-colors">← Upload another</a>
            <h1 className="text-3xl font-bold text-white mt-1">Your Cinematic Resume</h1>
            <p className="text-slate-400 mt-1">{sessionData.candidate.name} — {sessionData.candidate.headline}</p>
          </div>
          <div className="text-right">
            <span className="block text-2xl font-bold text-accent">{totalDuration}s</span>
            <span className="text-slate-500 text-sm">Target Duration</span>
          </div>
        </div>

        {/* Remotion Player */}
        <div className="rounded-3xl overflow-hidden border border-border bg-surface shadow-2xl shadow-black/80 aspect-video">
          <PlayerWrapper 
            scenes={sessionData.scenes} 
            durationInFrames={totalFrames} 
            photoUrl={sessionData.photoUrl} 
            candidate={sessionData.candidate}
          />
        </div>

        {/* Actions Bar */}
        <div className="mt-8 flex gap-4">
          <button 
            onClick={() => router.push('/upload')}
            className="flex-1 bg-surface border border-border hover:border-accent/40 text-white font-semibold py-4 rounded-2xl transition-all"
          >
            Regenerate Script
          </button>
          {renderState === 'done' && videoUrl ? (
            <a
              href={videoUrl}
              download={`${sessionData.candidate.name.replace(/\s+/g, '_')}_Video.mp4`}
              className="flex-[2] bg-accent hover:bg-accent/90 text-white font-bold py-4 rounded-2xl text-center shadow-lg shadow-accent/25 transition-transform hover:scale-[1.01]"
            >
              Download Final MP4
            </a>
          ) : (
            <div className="flex-[2] bg-surface border border-border text-slate-500 font-semibold py-4 rounded-2xl text-center flex items-center justify-center gap-3">
              {renderState === 'rendering' ? (
                <>
                  <div className="w-4 h-4 border-2 border-accent border-t-transparent rounded-full animate-spin" />
                  Rendering MP4...
                </>
              ) : (
                'Waiting for Render'
              )}
            </div>
          )}
        </div>

        {/* Scene Breakdown */}
        <div className="mt-12 space-y-6">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            Timeline Breakdown
            <span className="text-sm font-normal text-slate-500">({sessionData.scenes.length} Scenes)</span>
          </h2>
          <div className="grid gap-4">
            {sessionData.scenes.map((scene, i) => (
              <div 
                key={i}
                className="group flex items-start gap-6 p-6 bg-surface/50 rounded-2xl border border-border hover:border-accent/30 transition-colors"
                id={`scene-${i}`}
              >
                <div className="mt-1 w-12 h-12 rounded-xl bg-accent/10 border border-accent/20 flex items-center justify-center text-accent font-bold">
                  {i + 1}
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-bold text-white uppercase text-xs tracking-widest">{scene.type.replace('-', ' ')}</h3>
                    <span className="text-xs text-slate-500 font-mono">{scene.duration}.0s</span>
                  </div>
                  {scene.title && <p className="text-accent-light font-semibold text-lg mb-1">{scene.title}</p>}
                  <p className="text-slate-400 text-sm leading-relaxed">{scene.text}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Progress Warning */}
        {renderState === 'rendering' && (
          <div className="mt-8 p-6 bg-blue-500/5 border border-blue-500/20 rounded-2xl text-blue-300 text-sm flex gap-4 items-center">
            <span className="text-2xl">⏳</span>
            <p>
              Cinematic videos take longer to render (approx. 2-4 minutes). 
              The preview above uses your browser's RAM for instant playback while the server processes your download.
            </p>
          </div>
        )}
      </div>
    </main>
  );
}

export default function PreviewPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" /></div>}>
      <PreviewInner />
    </Suspense>
  );
}
