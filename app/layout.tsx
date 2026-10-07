import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = { title: "Synapse // Knowledge Arcade", description: "A context-first chat arcade for your ideas and documents." };

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
