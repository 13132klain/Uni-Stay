
import type { Metadata } from 'next';
import { GeistSans } from 'geist/font/sans';
import { GeistMono } from 'geist/font/mono';
import './globals.css';
import { Toaster } from '@/components/ui/toaster'; // Restored Toaster import

const geistSans = GeistSans;
const geistMono = GeistMono;

export const metadata: Metadata = {
  title: 'UniStay - Student Housing',
  description: 'Find and book student rentals near Meru University.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="icon" type="image/png" href="/favicon.png" />
      </head>
      <body className={`${geistSans.variable} ${geistMono.variable} font-sans antialiased`}>
        {children}
        <Toaster /> {/* Restored Toaster component */}
      </body>
    </html>
  );
}
