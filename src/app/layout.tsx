import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Pixel Font Renderer",
  description: "TTF → pixel grid · 18 built-in blackletter & gothic fonts · add any Google Font",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body style={{ margin: 0 }}>{children}</body>
    </html>
  );
}
