import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import { Suspense } from "react";
import Header from "../components/Header";
import "./globals.css";
import { ThemeProvider } from "../contexts/ThemeContext";
import { BookmarkProvider } from "../contexts/BookmarkContext";
import { AuthProvider } from "../contexts/AuthContext";
import { ErrorBoundary } from "../components/ErrorBoundary";
import ServiceWorkerRegister from "../components/ServiceWorkerRegister";

export const metadata: Metadata = {
  title: "Smart News | Global Newsroom",
  description: "Next-generation AI-powered journalism for the modern world.",
  manifest: "/manifest.json",
  openGraph: {
    title: "Smart News | Global Newsroom",
    description: "Next-generation AI-powered journalism for the modern world.",
    url: "https://smartnews.example.com/",
    siteName: "Smart News",
    images: [
      {
        url: "https://smartnews.example.com/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "Smart News - Global Newsroom",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    site: "@smartnews",
    title: "Smart News | Global Newsroom",
    description: "Next-generation AI-powered journalism for the modern world.",
    images: ["https://smartnews.example.com/og-image.jpg"],
  },
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider>
      <html lang="en" suppressHydrationWarning>
        <body className="font-sans">
          <ServiceWorkerRegister />
          <AuthProvider>
          <ThemeProvider>
            <BookmarkProvider>
              <ErrorBoundary>
                <Suspense
                  fallback={
                    <div className="h-24 bg-muted animate-pulse border-b-2 border-black" />
                  }
                >
                  <Header />
                </Suspense>
                <main role="main">{children}</main>
              </ErrorBoundary>
            </BookmarkProvider>
          </ThemeProvider>
          </AuthProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
