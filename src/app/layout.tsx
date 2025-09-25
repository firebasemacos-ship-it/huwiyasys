import type { Metadata } from "next";
import { Toaster } from "@/components/ui/toaster";
import { FirebaseClientProvider } from "@/firebase";
import "./globals.css";
import { Zain } from "next/font/google";

const zain = Zain({
  subsets: ["arabic"],
  weight: ["400", "700"],
});


export const metadata: Metadata = {
  title: "Mobile Mate",
  description: "Your personal assistant for managing and discovering mobile apps.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ar" dir="rtl" suppressHydrationWarning>
      <body className={`${zain.className} font-body antialiased`}>
        <FirebaseClientProvider>
            {children}
        </FirebaseClientProvider>
        <Toaster />
      </body>
    </html>
  );
}
