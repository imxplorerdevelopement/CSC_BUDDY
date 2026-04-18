import type { Metadata } from "next";
import {
  Cormorant_Garamond,
  League_Spartan,
  Manrope,
} from "next/font/google";
import Footer from "@/components/Footer";
import LenisProvider from "@/components/LenisProvider";
import Nav from "@/components/Nav";
import Preloader from "@/components/Preloader";
import WhatsAppButton from "@/components/WhatsAppButton";
import "./globals.css";

const cormorant = Cormorant_Garamond({
  variable: "--font-cormorant",
  subsets: ["latin"],
  style: ["normal", "italic"],
  weight: ["300", "400", "500", "600", "700"],
});

const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin"],
  weight: ["200", "400", "600", "700", "800"],
});

const spartan = League_Spartan({
  variable: "--font-spartan",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: "IMxplorer",
  description: "Luxury travel experiences by IMxplorer.",
  icons: {
    icon: "/favicon.ico",
    shortcut: "/favicon.ico",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${cormorant.variable} ${manrope.variable} ${spartan.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-imxDark text-imxLight">
        <LenisProvider />
        <Preloader />
        <Nav />
        <main className="flex-1">{children}</main>
        <Footer />
        <WhatsAppButton />
      </body>
    </html>
  );
}
