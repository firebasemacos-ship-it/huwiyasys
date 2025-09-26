
import type { Metadata } from "next";
import { Toaster } from "@/components/ui/toaster";
import { FirebaseClientProvider } from "@/firebase";
import "./globals.css";
import { Cairo } from "next/font/google";
import { CartProvider } from "@/hooks/use-cart";
import { ThemeProvider } from "@/components/theme-provider";
import { PaymentRequestHandler } from "@/components/PaymentRequestHandler";
import { CardLinkRequestHandler } from "@/components/CardLinkRequestHandler";
import { AcceptedRequestProcessor } from "@/components/AcceptedRequestProcessor";


const cairo = Cairo({
  subsets: ["arabic"],
  weight: ["400", "700"],
  variable: '--font-cairo',
});


export const metadata: Metadata = {
  title: "Mobile Mate",
  description: "Your personal assistant for managing and discovering mobile apps.",
};

function GlobalRequestHandlers() {
  return (
    <>
      <PaymentRequestHandler />
      <CardLinkRequestHandler />
      <AcceptedRequestProcessor />
    </>
  );
}


export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ar" dir="rtl" suppressHydrationWarning>
      <body className={`${cairo.variable} font-body antialiased`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
        >
          <FirebaseClientProvider>
            <CartProvider>
              {children}
              <GlobalRequestHandlers />
            </CartProvider>
          </FirebaseClientProvider>
        </ThemeProvider>
        <Toaster />
      </body>
    </html>
  );
}
