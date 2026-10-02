import type { Metadata, Viewport } from "next";
import { Inter, Manrope } from "next/font/google";
import "./globals.css";
import "./observatory.css";
import "./signal.css";
import "./flare.css";
import { branding } from "@config/branding";
import { siteUrl } from "@/lib/site";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin"],
  display: "swap",
  weight: ["500", "600", "700", "800"],
});

// Icons and the social preview come from the files beside this one
// (icon.png, apple-icon.png, favicon.ico, opengraph-image.tsx).
export const metadata: Metadata = {
  metadataBase: new URL(siteUrl()),
  title: {
    default: branding.displayName,
    template: `%s · ${branding.shortName}`,
  },
  description: branding.description,
  applicationName: branding.displayName,
  openGraph: {
    type: "website",
    siteName: branding.displayName,
    title: branding.displayName,
    description: branding.description,
  },
  twitter: {
    card: "summary_large_image",
    title: branding.displayName,
    description: branding.description,
  },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  themeColor: branding.colors.background,
  width: "device-width",
  initialScale: 1,
  colorScheme: "dark",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${inter.variable} ${manrope.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col">
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-lg focus:bg-brand-600 focus:px-4 focus:py-2 focus:text-white"
        >
          Skip to main content
        </a>
        {children}
      </body>
    </html>
  );
}
