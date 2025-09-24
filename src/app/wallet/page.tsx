
'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Home, MoreHorizontal, Search, ShoppingCart, Wallet as WalletIcon, ArrowLeft, CreditCard, Gift, PlusCircle } from 'lucide-react';

const transactions = [
  { id: 1, type: 'شحن رصيد', amount: 200.00, date: '25 يوليو 2024' },
  { id: 2, type: 'طلب رقم #1234', amount: -75.50, date: '24 يوليو 2024' },
  { id: 3, type: 'هدية من صديق', amount: 50.00, date: '22 يوليو 2024' },
  { id: 4, type: 'طلب رقم #1211', amount: -120.00, date: '21 يوليو 2024' },
];

export default function WalletPage() {
  const currentBalance = transactions.reduce((acc, t) => acc + t.amount, 0);

  return (
    <div className="bg-background text-foreground font-sans" dir="rtl">
      <div className="flex min-h-screen flex-col">
        <header className="sticky top-0 z-40 flex w-full items-center justify-between border-b bg-background/95 p-4 backdrop-blur">
          <h1 className="text-xl font-bold">المحفظة</h1>
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-6 w-6" />
          </Button>
        </header>

        <main className="flex-1 overflow-y-auto bg-muted/20 p-4 pb-24">
          <Card className="mb-6 overflow-hidden rounded-xl bg-purple-600 text-primary-foreground shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm opacity-80">الرصيد الحالي</p>
                  <p className="text-3xl font-bold">{currentBalance.toFixed(2)} جنيه</p>
                </div>
                <WalletIcon className="h-12 w-12 opacity-50" />
              </div>
              <Button size="lg" className="mt-4 w-full bg-primary-foreground text-primary hover:bg-primary-foreground/90">
                <PlusCircle className="ml-2 h-5 w-5" />
                شحن الرصيد
              </Button>
            </CardContent>
          </Card>
          
          <div className="mb-6 grid grid-cols-2 gap-4">
             <Card className="overflow-hidden rounded-xl">
                <CardContent className="flex flex-col items-center justify-center p-4 text-center">
                    <CreditCard className="mb-2 h-8 w-8 text-primary" />
                    <p className="text-sm font-semibold">طرق الدفع</p>
                </CardContent>
             </Card>
             <Card className="overflow-hidden rounded-xl">
                <CardContent className="flex flex-col items-center justify-center p-4 text-center">
                    <Gift className="mb-2 h-8 w-8 text-primary" />
                    <p className="text-sm font-semibold">إرسال هدية</p>
                </CardContent>
             </Card>
          </div>

          <Card className="overflow-hidden rounded-xl">
            <CardHeader>
              <CardTitle>سجل المعاملات</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="space-y-4">
                {transactions.map((transaction, index) => (
                  <div key={transaction.id}>
                    <div className="flex items-center justify-between px-6 py-4">
                        <div>
                            <p className="font-semibold">{transaction.type}</p>
                            <p className="text-sm text-muted-foreground">{transaction.date}</p>
                        </div>
                        <p className={`font-bold ${transaction.amount > 0 ? 'text-green-500' : 'text-destructive'}`}>
                            {transaction.amount > 0 ? '+' : ''}{transaction.amount.toFixed(2)} جنيه
                        </p>
                    </div>
                    {index < transactions.length - 1 && <Separator />}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </main>

        <footer className="fixed bottom-0 z-40 w-full border-t bg-background">
          <nav className="flex items-center justify-around p-2">
            <a
              href="/"
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
              className="flex flex-col items-center text-xs font-medium text-purple-600"
            >
              <WalletIcon className="mb-1 h-6 w-6" />
              باي
            </a>
            <a
              href="#"
              className="flex flex-col items-center text-xs text-muted-foreground"
            >
              <MoreHorizontal className="mb-1 h-6 w-6" />
              المزيد
            </a>
          </nav>
        </footer>
      </div>
    </div>
  );
}
