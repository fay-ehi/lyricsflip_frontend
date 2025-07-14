"use client"
import Navbar, { MobileNav } from '@/components/molecules/navbar';
import { metadata } from "./metadata";
import { ClientProvider } from '@/components/providers/client-provider';
import { Geist, Geist_Mono } from 'next/font/google';
import localFont from 'next/font/local';
import { Toaster } from 'sonner';
import { useEffect, useState } from 'react';
import './globals.css';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});
const interV = localFont({
  src: '../fonts/inter-v.ttf',
  // display: 'swap',
  variable: '--font-interv',
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${interV.variable} antialiased`}
        suppressHydrationWarning
      >
        {isClient && (
          <ClientProvider>
            <Navbar />
            {children}
            <MobileNav />
            <Toaster 
              position="top-center"
              expand={false}
              richColors
              closeButton
            />
          </ClientProvider>
        )}
      </body>
    </html>
  );
}
