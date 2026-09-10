import { ImageResponse } from "next/og";
export const alt =
  "Project Scope Cutter — Your idea is big. Your first build shouldn’t be.";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export default function Image() {
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        padding: "65px 75px",
        background: "#111310",
        color: "#eeefe7",
      }}
    >
      <div style={{ display: "flex", fontSize: 26, color: "#d4f77c" }}>
        ✂ PROJECT SCOPE CUTTER
      </div>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          fontSize: 78,
          letterSpacing: -3,
          fontWeight: 600,
          lineHeight: 1.08,
        }}
      >
        <span>Your idea is big.</span>
        <span>Your first build</span>
        <span style={{ color: "#d4f77c" }}>shouldn’t be.</span>
      </div>
      <div style={{ display: "flex", fontSize: 23, color: "#a8ada0" }}>
        30 or 60 minutes. One focused MVP. Just ship.
      </div>
    </div>,
    size,
  );
}
