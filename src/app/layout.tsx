import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "react-hot-toast";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Forever Young",
  description: "Men's Clothing and Accessories",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
        {/* Toast notifications */}
        <Toaster
          position="top-center"
          reverseOrder={false}
          toastOptions={{
            style: {
              background: '#fff',
              color: '#18181b',
              fontWeight: 500,
              fontSize: '1rem',
              borderRadius: '12px',
              boxShadow: '0 6px 32px rgba(0,0,0,0.12)',
              padding: '18px 28px',
              border: '1px solid #e5e7eb',
              fontFamily: 'inherit',
            },
            duration: 3500,
            success: {
              icon: '✅',
              style: {
                background: '#f0fdf4',
                color: '#15803d',
                border: '1px solid #bbf7d0',
              },
            },
            error: {
              icon: '⛔',
              style: {
                background: '#fef2f2',
                color: '#b91c1c',
                border: '1px solid #fecaca',
              },
            },
          }}
        />
      </body>
    </html>
  );
}
