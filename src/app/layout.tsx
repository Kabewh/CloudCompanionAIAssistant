import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";
import { ConvexClientProvider } from "./ConvexClientProvider";
import Script from "next/script";
const geist = Geist({
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Cloud Companion",
  description: "Your intelligent cloud assistant",
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
    ],
    apple: '/cloud-icon.png',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
        <link rel="apple-touch-icon" href="/cloud-icon.png" />
        <Script id="favicon-refresh">
          {`
            // Force favicon refresh for browsers
            const faviconVersion = new Date().getTime();
            const links = document.querySelectorAll('link[rel="icon"], link[rel="shortcut icon"]');
            links.forEach(link => {
              if (link.href.includes('?')) {
                link.href = link.href.split('?')[0] + '?v=' + faviconVersion;
              } else {
                link.href = link.href + '?v=' + faviconVersion;
              }
            });
          `}
        </Script>
      </head>
      <body className={`${geist.className} antialiased`} suppressHydrationWarning>
        <ConvexClientProvider>
          {children}
        </ConvexClientProvider>
      </body>
    </html>
  );
}
