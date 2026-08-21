import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "CounselFlow API",
  description: "Deterministic preference-strategy backend for the CounselFlow MVP"
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
