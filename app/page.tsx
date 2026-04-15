import Link from 'next/link';

// Landing page — kept intentionally minimal, focused on the value prop
export default function LandingPage() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-6 text-center relative overflow-hidden">
      {/* Subtle grid background */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage:
            'linear-gradient(rgba(99,102,241,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(99,102,241,0.05) 1px, transparent 1px)',
          backgroundSize: '60px 60px',
        }}
      />

      {/* Glow orbs */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] rounded-full bg-accent/10 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] rounded-full bg-purple-600/8 blur-[100px] pointer-events-none" />

      <div className="relative z-10 max-w-3xl mx-auto">
        {/* Badge */}
        <div className="inline-flex items-center gap-2 bg-accent/10 border border-accent/30 text-accent-light text-sm font-semibold px-4 py-1.5 rounded-full mb-8 tracking-wide">
          <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
          AI-Powered Resume Videos
        </div>

        {/* Headline */}
        <h1 className="text-6xl md:text-7xl font-extrabold tracking-tight leading-tight mb-6">
          Your Resume,{' '}
          <span className="bg-gradient-to-r from-accent to-accent-light bg-clip-text text-transparent">
            Narrated
          </span>
        </h1>

        <p className="text-slate-400 text-xl leading-relaxed mb-12 max-w-xl mx-auto">
          Upload your PDF resume. AI crafts a storytelling script. We generate voice-over and
          render a polished video — in under two minutes.
        </p>

        {/* Pipeline steps */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-12 text-sm text-slate-500">
          {['Upload PDF', 'AI Script', 'Voice Over', 'Remotion Video'].map((step, i) => (
            <div key={step} className="flex items-center gap-3">
              <span className="text-slate-300 font-medium">{step}</span>
              {i < 3 && <span className="hidden sm:block text-accent/50">→</span>}
            </div>
          ))}
        </div>

        {/* CTA */}
        <Link
          href="/upload"
          className="inline-flex items-center gap-3 bg-accent hover:bg-accent/90 text-white font-semibold px-8 py-4 rounded-xl text-lg transition-all duration-200 shadow-lg shadow-accent/25 hover:shadow-accent/40 hover:scale-[1.02]"
        >
          Get Started — It's Free
          <span className="text-xl">→</span>
        </Link>

        <p className="mt-4 text-slate-600 text-sm">No account required · PDF up to 5 MB</p>
      </div>
    </main>
  );
}
