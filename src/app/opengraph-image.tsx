import { ImageResponse } from "next/og";
import { branding } from "@config/branding";

export const alt = branding.displayName;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/** Generated fallback social preview. Replaced by the "site.socialPreview" slot when an officer uploads one. */
export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: 72,
          background: branding.colors.background,
          color: branding.colors.navy,
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div style={{ fontSize: 34, fontWeight: 700 }}>{branding.wordmark.primary}</div>
            <div style={{ fontSize: 22, color: branding.colors.muted }}>{branding.wordmark.secondary}</div>
          </div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          <div style={{ fontSize: 80, fontWeight: 600, lineHeight: 1.05, letterSpacing: -2 }}>Your people. A bigger world.</div>
          <div style={{ fontSize: 26, color: branding.colors.muted }}>Cybersecurity. Community. A place to start.</div>
        </div>
      </div>
    ),
    { ...size },
  );
}
