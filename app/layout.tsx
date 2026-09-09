import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Fabrizio Falcon — Interactive Portfolio",
  description: "Explore Fabrizio Falcon’s projects, GitHub, and personal portfolio in an interactive 3D workspace.",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
