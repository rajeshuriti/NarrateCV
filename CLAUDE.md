# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm install          # install all dependencies
npm run dev          # Next.js dev server on http://localhost:3000
npm run build        # production build
npm run remotion:studio  # open Remotion Studio for live composition preview
```

Copy `.env.example` → `.env.local` and fill in at least one AI key before running.

## Architecture

NarrateCV is a single Next.js 14 (App Router) application with an integrated Remotion render pipeline.

### Pipeline flow

```
PDF upload → /api/upload       → pdf-parse → raw text
raw text   → /api/generate-script → Claude/OpenAI → scenes JSON
scenes     → /api/generate-audio  → OpenAI TTS / ElevenLabs → MP3 per scene
scenes     → /api/render          → @remotion/bundler + @remotion/renderer → MP4
```

### Key directories

- `remotion/` — Remotion compositions. `index.ts` calls `registerRoot(Root)`. `Root.tsx` defines the `NarrateCV` composition with `calculateMetadata` for dynamic duration. `NarrateVideo.tsx` maps scenes → `<Sequence>` + `<Audio>` blocks. `scenes/` contains one animated React component per scene type.
- `lib/` — Pure server-side helpers: `pdf-parser.ts`, `script-generator.ts` (Claude-first, OpenAI fallback), `voice-generator.ts` (OpenAI TTS-first, ElevenLabs fallback), `session.ts` (UUID-based file namespacing under `public/sessions/`).
- `app/api/` — Four API routes, all `runtime = 'nodejs'`. Upload and render can be slow; `maxDuration` is set accordingly.
- `components/PlayerWrapper.tsx` — `dynamic(() => ..., { ssr: false })` wrapper around `@remotion/player`'s `<Player>` so it never runs in Node.

### State between pages

Session data (scenes + audio URLs) is written to `sessionStorage` by the upload page and read by the preview page using the key `ncv_{sessionId}`. Audio/video files are served from `public/sessions/{sessionId}/` by Next.js static file serving.

### Remotion rendering

The `/api/render` route calls `bundle()` (webpack bundles `remotion/index.ts`) then `renderMedia()` which spins up a headless Chrome instance. First render per server restart is slow (~60–90 s for a 30 s video) because of bundling. For production, move to async job + polling, or use Remotion Lambda.

### AI keys

- `ANTHROPIC_API_KEY` → Claude (script generation)
- `OPENAI_API_KEY` → GPT-4o-mini (script fallback) + OpenAI TTS (voice)
- `ELEVENLABS_API_KEY` → ElevenLabs TTS (voice, takes priority over OpenAI TTS when set)
