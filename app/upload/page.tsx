'use client';

/**
 * Upload page — drives the full pipeline:
 *   PDF drop → extract text → generate script → generate audio → go to preview
 */

import React, { useCallback, useState } from 'react';
import { useRouter } from 'next/navigation';
import { v4 as uuidv4 } from 'uuid';
import type { Scene } from '@/remotion/types';

type PipelineStep = 'idle' | 'uploading' | 'scripting' | 'voicing' | 'done' | 'error';

interface StepConfig {
  key: PipelineStep;
  label: string;
}

const STEPS: StepConfig[] = [
  { key: 'uploading', label: 'Extracting resume text…' },
  { key: 'scripting', label: 'Generating AI script…' },
  { key: 'voicing', label: 'Creating voice-over…' },
  { key: 'done', label: 'Done!' },
];

function stepIndex(step: PipelineStep): number {
  return STEPS.findIndex((s) => s.key === step);
}

export default function UploadPage() {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [step, setStep] = useState<PipelineStep>('idle');
  const [error, setError] = useState<string | null>(null);
  const [scenes, setScenes] = useState<Scene[]>([]);

  // ── Drop zone handlers ────────────────────────────────────────────────────
  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const dropped = e.dataTransfer.files[0];
    if (dropped?.name.toLowerCase().endsWith('.pdf')) setFile(dropped);
    else setError('Please upload a PDF file.');
  }, []);

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const picked = e.target.files?.[0];
    if (picked) {
      setFile(picked);
      setError(null);
    }
  };

  // ── Pipeline runner ───────────────────────────────────────────────────────
  const runPipeline = async () => {
    if (!file) return;
    const sessionId = uuidv4();
    setError(null);

    try {
      // ── Step 1: Upload + parse PDF ─────────────────────────────────────
      setStep('uploading');
      const formData = new FormData();
      formData.append('file', file);
      const uploadRes = await fetch('/api/upload', { method: 'POST', body: formData });
      if (!uploadRes.ok) throw new Error((await uploadRes.json()).error);
      const { text } = await uploadRes.json();

      // ── Step 2: Generate AI script ────────────────────────────────────
      setStep('scripting');
      const scriptRes = await fetch('/api/generate-script', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resumeText: text }),
      });
      if (!scriptRes.ok) throw new Error((await scriptRes.json()).error);
      const { scenes: rawScenes } = await scriptRes.json();
      setScenes(rawScenes);

      // ── Step 3: Generate audio per scene ──────────────────────────────
      setStep('voicing');
      const audioRes = await fetch('/api/generate-audio', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId, scenes: rawScenes }),
      });
      if (!audioRes.ok) throw new Error((await audioRes.json()).error);
      const { audioUrls } = await audioRes.json();

      // Merge audio URLs into scenes
      const finalScenes: Scene[] = rawScenes.map((s: Scene, i: number) => ({
        ...s,
        audioUrl: audioUrls[i] ?? '',
      }));

      setStep('done');

      // Pass data to preview page via sessionStorage (avoids huge query params)
      sessionStorage.setItem(
        `ncv_${sessionId}`,
        JSON.stringify({ sessionId, scenes: finalScenes }),
      );

      router.push(`/preview?session=${sessionId}`);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Something went wrong';
      setError(message);
      setStep('error');
    }
  };

  const currentStepIdx = stepIndex(step);
  const isRunning = step !== 'idle' && step !== 'done' && step !== 'error';

  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-6">
      <div className="w-full max-w-xl">
        {/* Header */}
        <div className="mb-8 text-center">
          <a href="/" className="inline-flex items-center gap-2 text-accent-light text-sm font-semibold mb-6 hover:text-accent transition-colors">
            ← NarrateCV
          </a>
          <h1 className="text-3xl font-bold text-white">Upload Your Resume</h1>
          <p className="text-slate-500 mt-2">PDF only · Max 5 MB</p>
        </div>

        {/* Drop zone */}
        <div
          onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          className={`
            relative border-2 border-dashed rounded-2xl p-12 text-center transition-all duration-200 cursor-pointer
            ${isDragging ? 'border-accent bg-accent/10' : 'border-border hover:border-accent/50 hover:bg-accent/5'}
            ${file ? 'bg-accent/5 border-accent/50' : ''}
          `}
          onClick={() => document.getElementById('file-input')?.click()}
        >
          <input
            id="file-input"
            type="file"
            accept=".pdf"
            className="hidden"
            onChange={handleFileInput}
          />

          {file ? (
            <div className="flex flex-col items-center gap-3">
              <div className="w-14 h-14 bg-accent/15 rounded-xl flex items-center justify-center">
                <span className="text-2xl">📄</span>
              </div>
              <div>
                <p className="text-white font-semibold">{file.name}</p>
                <p className="text-slate-500 text-sm mt-1">
                  {(file.size / 1024).toFixed(0)} KB · Click to change
                </p>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-3 text-slate-500">
              <div className="w-14 h-14 bg-surface rounded-xl flex items-center justify-center">
                <span className="text-3xl">⬆</span>
              </div>
              <div>
                <p className="text-slate-300 font-medium">Drop your PDF here</p>
                <p className="text-sm mt-1">or click to browse</p>
              </div>
            </div>
          )}
        </div>

        {/* Error */}
        {error && (
          <div className="mt-4 p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm">
            {error}
          </div>
        )}

        {/* Pipeline progress */}
        {isRunning && (
          <div className="mt-6 space-y-3">
            {STEPS.map((s, i) => {
              const done = i < currentStepIdx;
              const active = i === currentStepIdx;
              return (
                <div key={s.key} className="flex items-center gap-3">
                  <div
                    className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 transition-all
                      ${done ? 'bg-accent text-white' : active ? 'bg-accent/30 text-accent-light border border-accent progress-pulse' : 'bg-surface text-slate-600 border border-border'}`}
                  >
                    {done ? '✓' : i + 1}
                  </div>
                  <span
                    className={`text-sm transition-colors ${done ? 'text-slate-400 line-through' : active ? 'text-white font-medium' : 'text-slate-600'}`}
                  >
                    {s.label}
                  </span>
                </div>
              );
            })}
          </div>
        )}

        {/* Script preview (while loading audio) */}
        {scenes.length > 0 && step === 'voicing' && (
          <div className="mt-6 p-4 bg-surface rounded-xl border border-border space-y-2">
            <p className="text-xs text-slate-500 font-semibold uppercase tracking-widest mb-3">
              Generated Script
            </p>
            {scenes.map((scene, i) => (
              <div key={i} className="flex items-start gap-3">
                <span className="text-accent text-xs font-mono mt-0.5 w-20 flex-shrink-0 uppercase">
                  {scene.type}
                </span>
                <p className="text-slate-300 text-sm leading-relaxed">{scene.text}</p>
              </div>
            ))}
          </div>
        )}

        {/* CTA button */}
        <button
          onClick={runPipeline}
          disabled={!file || isRunning}
          className={`
            mt-6 w-full py-4 rounded-xl font-semibold text-lg transition-all duration-200
            ${!file || isRunning
              ? 'bg-surface text-slate-600 cursor-not-allowed border border-border'
              : 'bg-accent hover:bg-accent/90 text-white shadow-lg shadow-accent/25 hover:shadow-accent/40 hover:scale-[1.01]'
            }
          `}
        >
          {isRunning ? 'Processing…' : 'Generate My Video →'}
        </button>
      </div>
    </main>
  );
}
