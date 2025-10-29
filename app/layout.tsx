import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "CD Home Improvements - Rockford's Premier Home Renovation Contractor",
  description: "Professional kitchen, bathroom, deck, and window installation services in Rockford, IL. Quality craftsmanship and exceptional service.",
  keywords: ["home improvement", "kitchen remodeling", "bathroom renovation", "deck installation", "windows", "Rockford IL"],
  openGraph: {
    title: "CD Home Improvements - Rockford's Premier Home Renovation Contractor",
    description: "Professional kitchen, bathroom, deck, and window installation services in Rockford, IL.",
    url: "https://cdhomeimprovementsrockford.com",
    siteName: "CD Home Improvements",
    locale: "en_US",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>{children}</body>
    </html>
  );
}
