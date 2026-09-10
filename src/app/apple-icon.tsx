import { ImageResponse } from "next/og";
export const size = { width: 180, height: 180 };
export const contentType = "image/png";
export default function Icon() {
  return new ImageResponse(
    <div
      style={{
        display: "flex",
        width: "100%",
        height: "100%",
        background: "#d4f77c",
        color: "#18200f",
        alignItems: "center",
        justifyContent: "center",
        fontSize: 105,
      }}
    >
      ✂
    </div>,
    size,
  );
}
