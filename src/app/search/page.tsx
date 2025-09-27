
'use client';

import { Input } from '@/components/ui/input';
import { Search as SearchIcon, Home, ShoppingCart, Wallet, Ticket } from 'lucide-react';

export default function SearchPage() {
  return (
    <div className="dark bg-background text-foreground" dir="rtl">
      <div className="flex min-h-screen flex-col">
        <header className="sticky top-0 z-40 w-full border-b bg-background/30 p-4 backdrop-blur-lg">
          <div className="relative">
            <Input
              type="search"
              placeholder="ابحث عن منتجات"
              className="w-full rounded-full bg-muted pr-10"
            />
            <SearchIcon className="absolute right-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 pb-24">
          <div className="text-center">
            <h2 className="text-lg font-semibold">ابحث عن منتجاتك المفضلة</h2>
            <p className="text-muted-foreground">ابدأ بكتابة اسم المنتج الذي تبحث عنه.</p>
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
              <SearchIcon className="mb-1 h-6 w-6" />
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

