import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'BranchPulse OS',
  description: 'Franchise & Multi-Branch Operations Platform',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="light">
      <body className="bg-background text-on-background antialiased selection:bg-primary/20">
        {children}
      </body>
    </html>
  );
}
