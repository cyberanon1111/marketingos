import type { Metadata } from 'next';
import Providers from '@/components/layout/Providers';
import './globals.css';

export const metadata: Metadata = {
  title: 'MarketingOS',
  description: 'The operating system for the marketing department.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="font-sans">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
