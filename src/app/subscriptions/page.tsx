
'use client';

import { Button } from '@/components/ui/button';
import { Home, MoreHorizontal, Search, ShoppingCart, Star, Ticket, Wallet as WalletIcon, ArrowLeft } from 'lucide-react';


export default function SubscriptionsPage() {
  return (
    <div className="dark bg-background text-foreground" dir="rtl">
      <div className="flex min-h-screen flex-col">
        <header className="sticky top-0 z-40 flex w-full items-center justify-between border-b bg-background/30 p-4 backdrop-blur-lg">
          <h1 className="text-xl font-bold">اشتراكاتي</h1>
          <Button variant="ghost" size="icon" onClick={() => window.history.back()}>
            <ArrowLeft className="h-6 w-6" />
          </Button>
        </header>

        <main className="flex-1 overflow-y-auto p-4 pb-24">
            <div className="flex flex-col items-center justify-center gap-4 py-12 text-center h-full">
                 <Ticket className="h-20 w-20 text-muted-foreground" />
                 <h2 className="text-xl font-semibold">لا توجد لديك اشتراكات</h2>
                 <p className="text-muted-foreground">اكتشف العروض والخدمات للاشتراك بها.</p>
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
              className="flex flex-col items-center text-xs text-muted-foreground"
            >
              <Search className="mb-1 h-6 w-6" />
              البحث
            </a>
            <a
              href="/cart"
              className="flex flex-col items-center text-xs text-muted-foreground"
            >
              <ShoppingCart className="mb-1 h-6 w-6" />
              السلة
            </a>
            <a
              href="/wallet"
              className="flex flex-col items-center text-xs text-muted-foreground"
            >
              <WalletIcon className="mb-1 h-6 w-6" />
              باي
            </a>
            <a
              href="/subscriptions"
              className="flex flex-col items-center text-xs font-medium text-primary"
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
