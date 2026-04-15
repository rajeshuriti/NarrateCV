import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'NarrateCV — Your Resume, Narrated',
  description: 'Turn your resume into a professionally narrated video in seconds.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-canvas text-slate-100 antialiased">{children}</body>
    </html>
  );
}
