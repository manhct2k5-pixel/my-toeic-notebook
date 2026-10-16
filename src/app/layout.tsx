import type { Metadata } from 'next';
import './globals.css';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';

export const metadata: Metadata = {
  title: 'My TOEIC Notebook – Sổ học từ vựng, Listening & Reading',
  description: 'Website tự học TOEIC cá nhân: sổ từ vựng điện tử thông minh, luyện Listening & Reading liên kết trực tiếp với sổ ghi chép.',
};

import { AppProviders } from '@/components/providers/AppProviders';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="vi" className="h-full">
      <body className="min-h-full flex flex-col bg-[#fbfbfa] text-slate-800 antialiased selection:bg-blue-100 selection:text-blue-900">
        <AppProviders>
          <Navbar />
          <main className="flex-1 flex flex-col">{children}</main>
          <Footer />
        </AppProviders>
      </body>
    </html>
  );
}
