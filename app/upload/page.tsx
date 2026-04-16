'use client';

/**
 * Upload page — two input modes:
 *   1. PDF upload  → /api/upload (parse + optional photo) → /api/generate-script → /api/generate-audio
 *   2. Paste text  → skip parsing, go straight to /api/generate-script
 *
 * Profile photo upload is optional and applies to both modes.
 */

import React, { useCallback, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { v4 as uuidv4 } from 'uuid';
import type { Scene } from '@/remotion/types';

/** Safely extracts an error message from any fetch Response. */
async function readError(res: Response): Promise<string> {
  const ct = res.headers.get('content-type') ?? '';
  if (ct.includes('application/json')) {
    try {
      const body = await res.json();
      return body.error ?? `Server error ${res.status}`;
    } catch {
      return `Server error ${res.status}`;
    }
  }
  return `Server error ${res.status}: ${res.statusText}`;
}

type Tab = 'pdf' | 'text';
type PipelineStep = 'idle' | 'uploading' | 'scripting' | 'voicing' | 'done' | 'error';

const PDF_STEPS = [
  { key: 'uploading' as PipelineStep, label: 'Extracting resume text…' },
  { key: 'scripting' as PipelineStep, label: 'Generating AI script…' },
  { key: 'voicing'   as PipelineStep, label: 'Creating voice-over…' },
  { key: 'done'      as PipelineStep, label: 'Done!' },
];

const TEXT_STEPS = [
  { key: 'scripting' as PipelineStep, label: 'Generating AI script…' },
  { key: 'voicing'   as PipelineStep, label: 'Creating voice-over…' },
  { key: 'done'      as PipelineStep, label: 'Done!' },
];

const ACCEPTED_PHOTO_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_PHOTO_MB = 5;

export default function UploadPage() {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>('pdf');

  // PDF mode state
  const [file, setFile] = useState<File | null>(null);
  const [isDraggingPdf, setIsDraggingPdf] = useState(false);

  // Photo state
  const [photo, setPhoto] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [isDraggingPhoto, setIsDraggingPhoto] = useState(false);
  const photoInputRef = useRef<HTMLInputElement>(null);

  // Text mode state
  const [resumeText, setResumeText] = useState('');

  // Shared pipeline state
  const [step, setStep] = useState<PipelineStep>('idle');
  const [error, setError] = useState<string | null>(null);
  const [warning, setWarning] = useState<string | null>(null);
  const [scenes, setScenes] = useState<Scene[]>([]);

  // ── Photo handlers ─────────────────────────────────────────────────────────
  function applyPhoto(picked: File) {
    if (!ACCEPTED_PHOTO_TYPES.includes(picked.type)) {
      setError('Photo must be JPG, PNG, or WEBP.');
      return;
    }
    if (picked.size > MAX_PHOTO_MB * 1024 * 1024) {
      setError(`Photo exceeds ${MAX_PHOTO_MB} MB limit.`);
      return;
    }
    setPhoto(picked);
    setError(null);
    const url = URL.createObjectURL(picked);
    setPhotoPreview(url);
  }

  const handlePhotoDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingPhoto(false);
    const dropped = e.dataTransfer.files[0];
    if (dropped) applyPhoto(dropped);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handlePhotoInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const picked = e.target.files?.[0];
    if (picked) applyPhoto(picked);
  };

  function removePhoto() {
    setPhoto(null);
    if (photoPreview) URL.revokeObjectURL(photoPreview);
    setPhotoPreview(null);
    if (photoInputRef.current) photoInputRef.current.value = '';
  }

  // ── PDF drop zone ──────────────────────────────────────────────────────────
  const handlePdfDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingPdf(false);
    const dropped = e.dataTransfer.files[0];
    if (dropped?.name.toLowerCase().endsWith('.pdf')) setFile(dropped);
    else setError('Please upload a PDF file.');
  }, []);

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const picked = e.target.files?.[0];
    if (picked) { setFile(picked); setError(null); }
  };

  // ── Shared pipeline steps (script → audio → preview) ─────────────────────
  async function runScriptAndAudio(text: string, sessionId: string, photoUrl?: string) {
    setWarning(null);

    setStep('scripting');
    const scriptRes = await fetch('/api/generate-script', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ resumeText: text, hasPhoto: !!photo }),
    });
    if (!scriptRes.ok) throw new Error(await readError(scriptRes));
    const scriptText = await scriptRes.text();
    let scriptBody: { scenes?: Scene[] };
    try { scriptBody = JSON.parse(scriptText); }
    catch { throw new Error(`Script API returned non-JSON: ${scriptText.slice(0, 120)}`); }
    const rawScenes = scriptBody.scenes ?? [];
    setScenes(rawScenes);

    setStep('voicing');
    const audioRes = await fetch('/api/generate-audio', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId, scenes: rawScenes }),
    });
    if (!audioRes.ok) throw new Error(await readError(audioRes));
    const audioText = await audioRes.text();
    let audioBody: { audioUrls?: string[]; warning?: string };
    try { audioBody = JSON.parse(audioText); }
    catch { throw new Error(`Audio API returned non-JSON: ${audioText.slice(0, 120)}`); }
    const { audioUrls = [], warning: audioWarning } = audioBody;
    if (audioWarning) setWarning(audioWarning);

    const finalScenes: Scene[] = rawScenes.map((s: Scene, i: number) => ({
      ...s,
      audioUrl: audioUrls[i] ?? '',
    }));

    setStep('done');
    sessionStorage.setItem(
      `ncv_${sessionId}`,
      JSON.stringify({ sessionId, scenes: finalScenes, warning: audioWarning ?? null, photoUrl }),
    );
    router.push(`/preview?session=${sessionId}`);
  }

  // ── PDF pipeline ──────────────────────────────────────────────────────────
  const runPdfPipeline = async () => {
    if (!file) return;
    setError(null);
    setWarning(null);
    try {
      setStep('uploading');
      const formData = new FormData();
      formData.append('file', file);
      if (photo) formData.append('photo', photo);

      const uploadRes = await fetch('/api/upload', { method: 'POST', body: formData });
      if (!uploadRes.ok) throw new Error(await readError(uploadRes));
      const { text, sessionId, photoUrl } = await uploadRes.json();
      await runScriptAndAudio(text, sessionId, photoUrl);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
      setStep('error');
    }
  };

  // ── Text pipeline ─────────────────────────────────────────────────────────
  const runTextPipeline = async () => {
    if (resumeText.trim().length < 50) return;
    setError(null);
    setWarning(null);
    try {
      // For text mode, we still need to handle photo upload separately
      // Create a form to upload just the photo (if any) and get a session ID
      let sessionId: string;
      let photoUrl: string | undefined;

      if (photo) {
        // Upload photo via a minimal form (no PDF needed for session/photo creation)
        // We create a session on the client and then upload photo via a dedicated mini endpoint
        // Since the upload endpoint requires a PDF, for text mode we generate the session client-side
        // and upload the photo manually
        sessionId = uuidv4();
        const formData = new FormData();
        // Send a trivial PDF-bypass: the upload route requires PDF. 
        // For text mode we skip the upload API entirely and use a text-only flow.
        // Instead, upload just the photo to a dedicated route.
        const photoFormData = new FormData();
        photoFormData.append('sessionId', sessionId);
        photoFormData.append('photo', photo);
        const photoRes = await fetch('/api/upload-photo', {
          method: 'POST',
          body: photoFormData,
        });
        if (photoRes.ok) {
          const { photoUrl: url } = await photoRes.json();
          photoUrl = url;
        }
        void formData; // suppress unused warning
      } else {
        sessionId = uuidv4();
      }

      await runScriptAndAudio(resumeText.trim(), sessionId, photoUrl);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
      setStep('error');
    }
  };

  const isRunning = step !== 'idle' && step !== 'done' && step !== 'error';
  const steps = tab === 'pdf' ? PDF_STEPS : TEXT_STEPS;
  const currentStepIdx = steps.findIndex((s) => s.key === step);
  const canSubmit = tab === 'pdf' ? !!file : resumeText.trim().length >= 50;

  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-6 py-16">
      <div className="w-full max-w-xl space-y-6">

        {/* Header */}
        <div className="text-center">
          <a href="/" className="inline-flex items-center gap-2 text-accent-light text-sm font-semibold mb-6 hover:text-accent transition-colors">
            ← NarrateCV
          </a>
          <h1 className="text-3xl font-bold text-white">Upload Your Resume</h1>
          <p className="text-slate-400 text-sm mt-2">
            Upload your resume and optionally add a profile photo to personalize your video.
          </p>
        </div>

        {/* ── Profile Photo Upload (optional) ───────────────────────────────── */}
        <div className="bg-surface border border-border rounded-2xl p-5">
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-white text-sm font-semibold">Profile Photo</p>
              <p className="text-slate-500 text-xs mt-0.5">Optional · JPG, PNG or WEBP · Max 5 MB</p>
            </div>
            {photo && (
              <button
                onClick={removePhoto}
                className="text-xs text-slate-500 hover:text-red-400 transition-colors"
              >
                Remove
              </button>
            )}
          </div>

          {photo && photoPreview ? (
            /* Photo preview */
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-accent/40 flex-shrink-0">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={photoPreview} alt="Profile preview" className="w-full h-full object-cover" />
              </div>
              <div>
                <p className="text-white text-sm font-medium">{photo.name}</p>
                <p className="text-slate-500 text-xs mt-0.5">{(photo.size / 1024).toFixed(0)} KB · Click below to change</p>
              </div>
              <button
                onClick={() => photoInputRef.current?.click()}
                className="ml-auto text-xs text-accent hover:text-accent-light underline transition-colors"
              >
                Change
              </button>
            </div>
          ) : (
            /* Drop zone */
            <div
              onDragOver={(e) => { e.preventDefault(); setIsDraggingPhoto(true); }}
              onDragLeave={() => setIsDraggingPhoto(false)}
              onDrop={handlePhotoDrop}
              onClick={() => photoInputRef.current?.click()}
              className={`
                border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all duration-200
                ${isDraggingPhoto
                  ? 'border-accent bg-accent/10'
                  : 'border-border hover:border-accent/40 hover:bg-accent/5'
                }
              `}
            >
              <div className="flex flex-col items-center gap-2 text-slate-500">
                <span className="text-2xl">🖼️</span>
                <p className="text-slate-400 text-sm font-medium">Drop photo or click to browse</p>
              </div>
            </div>
          )}

          <input
            ref={photoInputRef}
            id="photo-input"
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            onChange={handlePhotoInput}
          />
        </div>

        {/* Tab switcher */}
        <div className="flex rounded-xl overflow-hidden border border-border">
          {(['pdf', 'text'] as Tab[]).map((t) => (
            <button
              key={t}
              onClick={() => { setTab(t); setError(null); setStep('idle'); }}
              disabled={isRunning}
              className={`flex-1 py-3 text-sm font-semibold transition-colors
                ${tab === t
                  ? 'bg-accent text-white'
                  : 'bg-surface text-slate-400 hover:text-slate-200'
                }`}
            >
              {t === 'pdf' ? '📄 Upload PDF' : '✏️ Paste Text'}
            </button>
          ))}
        </div>

        {/* ── PDF tab ── */}
        {tab === 'pdf' && (
          <div
            onDragOver={(e) => { e.preventDefault(); setIsDraggingPdf(true); }}
            onDragLeave={() => setIsDraggingPdf(false)}
            onDrop={handlePdfDrop}
            onClick={() => document.getElementById('file-input')?.click()}
            className={`
              relative border-2 border-dashed rounded-2xl p-12 text-center transition-all duration-200 cursor-pointer
              ${isDraggingPdf ? 'border-accent bg-accent/10' : 'border-border hover:border-accent/50 hover:bg-accent/5'}
              ${file ? 'bg-accent/5 border-accent/50' : ''}
            `}
          >
            <input id="file-input" type="file" accept=".pdf" className="hidden" onChange={handleFileInput} />
            {file ? (
              <div className="flex flex-col items-center gap-3">
                <div className="w-14 h-14 bg-accent/15 rounded-xl flex items-center justify-center">
                  <span className="text-2xl">📄</span>
                </div>
                <div>
                  <p className="text-white font-semibold">{file.name}</p>
                  <p className="text-slate-500 text-sm mt-1">{(file.size / 1024).toFixed(0)} KB · Click to change</p>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-3 text-slate-500">
                <div className="w-14 h-14 bg-surface rounded-xl flex items-center justify-center">
                  <span className="text-3xl">⬆</span>
                </div>
                <div>
                  <p className="text-slate-300 font-medium">Drop your PDF here</p>
                  <p className="text-sm mt-1">or click to browse · Max 5 MB</p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── Text tab ── */}
        {tab === 'text' && (
          <div className="relative">
            <textarea
              value={resumeText}
              onChange={(e) => { setResumeText(e.target.value); setError(null); }}
              disabled={isRunning}
              placeholder={`Paste your resume here…\n\nExample:\nJane Doe — Senior Software Engineer\n\nSkills: React, TypeScript, Node.js, AWS\n\nExperience:\n• Acme Corp (2021–present) — Led platform team, reduced deploy time 60%\n• Startup Inc (2018–2021) — Built real-time data pipeline serving 1M users\n\nImpact: Shipped $2M in features, maintained 99.9% uptime`}
              className="w-full h-64 bg-surface border border-border rounded-2xl p-4 text-slate-300 text-sm leading-relaxed resize-none focus:outline-none focus:border-accent/60 placeholder:text-slate-600 transition-colors"
            />
            <span className={`absolute bottom-3 right-4 text-xs ${resumeText.length < 50 ? 'text-slate-600' : 'text-slate-500'}`}>
              {resumeText.length} chars {resumeText.length < 50 ? `(need ${50 - resumeText.length} more)` : ''}
            </span>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm">
            {error}
          </div>
        )}

        {warning && (
          <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-xl text-amber-300 text-sm">
            {warning}
          </div>
        )}

        {/* Pipeline progress */}
        {isRunning && (
          <div className="space-y-3">
            {steps.map((s, i) => {
              const done = i < currentStepIdx;
              const active = i === currentStepIdx;
              return (
                <div key={s.key} className="flex items-center gap-3">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 transition-all
                    ${done ? 'bg-accent text-white' : active ? 'bg-accent/30 text-accent-light border border-accent progress-pulse' : 'bg-surface text-slate-600 border border-border'}`}>
                    {done ? '✓' : i + 1}
                  </div>
                  <span className={`text-sm transition-colors ${done ? 'text-slate-400 line-through' : active ? 'text-white font-medium' : 'text-slate-600'}`}>
                    {s.label}
                  </span>
                </div>
              );
            })}
          </div>
        )}

        {/* Script preview while generating audio */}
        {scenes.length > 0 && step === 'voicing' && (
          <div className="p-4 bg-surface rounded-xl border border-border space-y-2">
            <p className="text-xs text-slate-500 font-semibold uppercase tracking-widest mb-3">Generated Script</p>
            {scenes.map((scene, i) => (
              <div key={i} className="flex items-start gap-3">
                <span className="text-accent text-xs font-mono mt-0.5 w-20 flex-shrink-0 uppercase">{scene.type}</span>
                <p className="text-slate-300 text-sm leading-relaxed">{scene.text}</p>
              </div>
            ))}
          </div>
        )}

        {/* CTA */}
        <button
          onClick={tab === 'pdf' ? runPdfPipeline : runTextPipeline}
          disabled={!canSubmit || isRunning}
          id="generate-video-btn"
          className={`
            w-full py-4 rounded-xl font-semibold text-lg transition-all duration-200
            ${!canSubmit || isRunning
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
