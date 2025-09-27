
'use client';

import { Input } from '@/components/ui/input';
import { BadgePercent, Home, ShoppingCart, Wallet, Ticket } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function OffersPage() {
  return (
    <div className="dark bg-background text-foreground" dir="rtl">
      <div className="flex min-h-screen flex-col">
        <header className="sticky top-0 z-40 flex w-full items-center justify-between border-b bg-background/30 p-4 backdrop-blur-lg">
           <h1 className="text-xl font-bold">العروض</h1>
        </header>

        <main className="flex-1 overflow-y-auto p-4 pb-24">
          <div className="text-center flex flex-col items-center justify-center h-full">
            <BadgePercent className="mb-4 h-20 w-20 text-muted-foreground" />
            <h2 className="text-lg font-semibold">لا توجد عروض متاحة حالياً</h2>
            <p className="text-muted-foreground">تحقق مرة أخرى قريباً!</p>
          </div>
        </main>

        <footer className="fixed bottom-0 z-40 w-full border-t border-white/10 bg-background/30 backdrop-blur-lg">
          <nav className="flex items-center justify-around p-2">
            <a
              href="/shop"
              className="flex flex-col items-center text-xs text-muted-foreground"
            >
              <Home className="mb-1 h-6 w-6" />
              الرئيسية
            </a>
            <a
              href="/search"
              className="flex flex-col items-center text-xs font-medium text-primary"
            >
              <BadgePercent className="mb-1 h-6 w-6" />
              العروض
            </a>
            <a
              href="/cart"
              className="flex flex-col items-center text-xs text-muted-foreground"
            >
              <ShoppingCart className="mb-1 h-6 w-6" />
              السلة
            </a>
            <a
              href="/my-wallet"
              className="flex flex-col items-center text-xs text-muted-foreground"
            >
              <Wallet className="mb-1 h-6 w-6" />
              محفظتي
            </a>
            <a
              href="/subscriptions"
              className="flex flex-col items-center text-xs text-muted-foreground"
            >
              <Ticket className="mb-1 h-6 w-6" />
              الاشتراكات
            </a>
          </nav>
        </footer>
      </div>
    </div>
  );
}
