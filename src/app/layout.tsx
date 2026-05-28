import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "NASDAQ Trader Simulator",
  description:
    "Practice investing with $100,000 of virtual money against real NASDAQ tech market data.",
  applicationName: "NASDAQ Trader Simulator",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-bg text-text font-sans antialiased">
        {children}
      </body>
    </html>
  );
}
