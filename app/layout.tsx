import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Plasive Technologies — Privacy-First Data & Cloud Engineering',
  description: 'Plasive builds resilient, privacy-first data products. Data analytics, cloud architecture, enterprise security, and high-performance systems for data-heavy regulated environments.',
  metadataBase: new URL('https://plasive.vercel.app'),
  alternates: { canonical: '/' },
  robots: { index: true, follow: true },
  openGraph: {
    type: 'website',
    url: 'https://plasive.vercel.app/',
    title: 'Plasive Technologies — Privacy-First Data & Cloud Engineering',
    description: 'Plasive builds resilient, privacy-first data products. Data analytics, cloud architecture, enterprise security, and high-performance systems.',
    images: [{ url: '/og-image.svg' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Plasive Technologies — Privacy-First Data & Cloud Engineering',
    description: 'Plasive builds resilient, privacy-first data products.',
    images: ['/og-image.svg'],
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
        <meta name="theme-color" content="#08080c" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@200;300;400;500&display=swap" rel="stylesheet" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'Organization',
              name: 'Plasive Technologies S.r.l.',
              url: 'https://plasive.vercel.app',
              logo: 'https://plasive.vercel.app/favicon.svg',
              email: 'info@plasive.tech',
              address: {
                '@type': 'PostalAddress',
                streetAddress: 'Via Cesare Battisti 26',
                addressLocality: 'Bologna',
                postalCode: '40123',
                addressCountry: 'IT',
              },
              sameAs: ['https://www.linkedin.com/company/plasivetech'],
            }),
          }}
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
