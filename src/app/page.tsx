"use client";

import dynamic from "next/dynamic";

const PixelFontRenderer = dynamic(
  () => import("@/components/PixelFontRenderer"),
  { ssr: false }
);

export default function Home() {
  return <PixelFontRenderer />;
}
