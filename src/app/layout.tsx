import type { Metadata } from "next";
import "./styles.css";

export const metadata: Metadata = {
  title: "Document Metadata Mutation Checker",
  description: "PDF metadata analysis and risk reporting"
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
