import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { NavHeader } from "@/components/nav-header";
import "./globals.css";

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "PetSpeak - Give Your Pet a Voice",
  description:
    "AI-powered pet translator. Snap a photo of your pet, hear their voice, and learn how to care for them.",
  openGraph: {
    title: "PetSpeak - Give Your Pet a Voice",
    description:
      "AI-powered pet translator. Snap a photo of your pet, hear their voice, and learn how to care for them.",
    type: "website",
    siteName: "PetSpeak",
  },
  twitter: {
    card: "summary_large_image",
    title: "PetSpeak - Give Your Pet a Voice",
    description:
      "AI-powered pet translator. Snap a photo of your pet, hear their voice, and learn how to care for them.",
  },
  icons: {
    icon: "/icon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-background text-foreground font-sans">
        <NavHeader />
        <main className="flex-1">{children}</main>
      </body>
    </html>
  );
}
