import type { Metadata, Viewport } from 'next';
import { Inter, JetBrains_Mono } from 'next/font/google';
import './globals.css';
import { Providers } from '@/providers';

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-sans',
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-mono',
});

export const metadata: Metadata = {
  title: {
    default: 'Quizy Arena — Play. Think. Grow.',
    template: '%s | Quizy Arena',
  },
  description:
    'Train your brain with premium cognitive games. Improve memory, logic, focus, and more. Compete with friends and track your growth.',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Quizy Arena',
  },
  openGraph: {
    title: 'Quizy Arena — Play. Think. Grow.',
    description:
      'The world\'s most premium brain gaming platform for students.',
    type: 'website',
    locale: 'en_US',
    siteName: 'Quizy Arena',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Quizy Arena — Play. Think. Grow.',
    description:
      'Train your brain with premium cognitive games.',
  },
  robots: {
    index: true,
    follow: true,
  },
};

export const viewport: Viewport = {
  themeColor: '#F8FAFC',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${jetbrainsMono.variable}`}
    >
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
