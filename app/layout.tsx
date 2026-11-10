import './globals.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
});

export const metadata: Metadata = {
  title: 'Ride Together - Carpooling & Bus Travel Across India',
  description: 'Carpool with Ride Together. Save money on fuel and tolls, travel sustainably, and meet verified community members.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="min-h-screen bg-[#f4f7f8] text-[#054752] font-sans antialiased">
        {children}
      </body>
    </html>
  );
}
