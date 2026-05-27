import type { Metadata, Viewport } from 'next';
import { Inter, Rajdhani } from 'next/font/google';
import Script from 'next/script';
import './globals.css';

const inter = Inter({ subsets: ['latin'], display: 'swap' });
const rajdhani = Rajdhani({ subsets: ['latin'], weight: ['400', '500', '600', '700'], display: 'swap', variable: '--cs2-font' });

export const metadata: Metadata = {
  title: 'Personal Hub',
  description: 'Meu assistente pessoal com IA',
  manifest: '/manifest.webmanifest',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Hub'
  },
  icons: {
    icon: [{ url: '/icon.svg', type: 'image/svg+xml' }],
    apple: [{ url: '/icon.svg' }]
  }
};

export const viewport: Viewport = {
  themeColor: '#0c0f14',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover'
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className={`dark ${rajdhani.variable}`}>
      <body className={`${inter.className} h-full`}>
        {children}
        <Script id="sw-register" strategy="afterInteractive">
          {`
            if ('serviceWorker' in navigator) {
              window.addEventListener('load', () => {
                navigator.serviceWorker.register('/sw.js').catch(() => {});
              });
            }
          `}
        </Script>
      </body>
    </html>
  );
}
