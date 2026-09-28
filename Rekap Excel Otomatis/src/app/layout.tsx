import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Rekap Excel Otomatis - Multi-Tenant Enterprise Solution',
  description: 'Aplikasi rekap dan agregasi file Excel otomatis dengan isolasi data antar tenant (Row-Level Security) dan sanitasi formula aman.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id" className="h-full">
      <body className="h-full font-sans">{children}</body>
    </html>
  );
}
