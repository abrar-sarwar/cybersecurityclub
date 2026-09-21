import type { Metadata, Viewport } from "next";
import { Inter, Manrope } from "next/font/google";
import "./globals.css";
import "./observatory.css";
import "./signal.css";
import { branding } from "@config/branding";
import { siteUrl } from "@/lib/site";
import { resolveSingle } from "@/server/services/media";
import { safeDb } from "@/server/safe-db";

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

export async function generateMetadata(): Promise<Metadata> {
  // Metadata must never be the thing that fails a build or a request.
  const [favicon, social] = await Promise.all([
    safeDb(() => resolveSingle(branding.favicon.slot), null, "favicon slot"),
    safeDb(() => resolveSingle(branding.socialPreview.slot), null, "social slot"),
  ]);
  const socialImage = social ? [{ url: social.src, width: social.width, height: social.height, alt: social.alt }] : undefined;
  return {
    metadataBase: new URL(siteUrl()),
    title: {
      default: branding.displayName,
      template: `%s · ${branding.shortName}`,
    },
    description: branding.description,
    applicationName: branding.displayName,
    ...(favicon ? { icons: { icon: [{ url: favicon.src }], apple: [{ url: favicon.src }] } } : {}),
    openGraph: {
      type: "website",
      siteName: branding.displayName,
      title: branding.displayName,
      description: branding.description,
      ...(socialImage ? { images: socialImage } : {}),
    },
    twitter: {
      card: "summary_large_image",
      title: branding.displayName,
      description: branding.description,
      ...(socialImage ? { images: socialImage.map((i) => i.url) } : {}),
    },
    robots: { index: true, follow: true },
  };
}

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
