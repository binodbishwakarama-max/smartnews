import type { Metadata } from "next";
import { Playfair_Display, Inter } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "../contexts/ThemeContext";
import { BookmarkProvider } from "../contexts/BookmarkContext";

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: '--font-playfair'
});

const inter = Inter({
  subsets: ["latin"],
  variable: '--font-inter'
});

export const metadata: Metadata = {
  title: "Smart News | Global Newsroom",
  description: "Next-generation AI-powered journalism for the modern world.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${playfair.variable} ${inter.variable} font-sans`}>
        <ThemeProvider>
          <BookmarkProvider>
            {children}
          </BookmarkProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
