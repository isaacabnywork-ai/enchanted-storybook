import type { Metadata, Viewport } from "next";
import { Cormorant_Garamond, Lora, Dancing_Script } from "next/font/google";
import "./globals.css";

const cormorant = Cormorant_Garamond({
  variable: "--font-heading",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

const lora = Lora({
  variable: "--font-body",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  display: "swap",
});

const dancingScript = Dancing_Script({
  variable: "--font-handwriting",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Our Enchanted Tale — Interactive Storybook",
  description:
    "A magical interactive storybook with beautiful watercolor illustrations, 3D page-flip animations, and enchanting storytelling. Swipe through an enchanted fairy tale experience.",
  keywords: [
    "storybook",
    "fairy tale",
    "interactive",
    "love story",
    "animated book",
  ],
  openGraph: {
    title: "Our Enchanted Tale",
    description:
      "A magical interactive storybook with beautiful watercolor illustrations and 3D page-flip animations.",
    type: "website",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#f8e8e0",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${cormorant.variable} ${lora.variable} ${dancingScript.variable} h-full`}
    >
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}
