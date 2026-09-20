import type { Metadata, Viewport } from "next";
import { Fraunces, Inter } from "next/font/google";
import "./globals.css";
import ThemeToggle from "@/components/ui/ThemeToggle";

const fraunces = Fraunces({ subsets: ["latin"], variable: "--font-display", weight: ["500", "600"] });
const inter = Inter({ subsets: ["latin"], weight: ["400", "500", "600", "700"] });

export const metadata: Metadata = {
  title: "Trim — find a barber near you",
  description: "Discover verified barbers and barbershops near you."
};

// Without this, some mobile browsers render the page at a fake desktop
// width and then shrink the whole thing to fit the screen — everything
// looks tiny and squeezed into the middle instead of actually being
// responsive.
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={fraunces.variable}>
      <body className={`${inter.className} min-h-screen bg-bg text-textPrimary antialiased`}>
        <ThemeToggle />
        {children}
      </body>
    </html>
  );
}
