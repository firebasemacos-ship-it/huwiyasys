
'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { Home, MoreHorizontal, Search, ShoppingCart, Wallet, Plus, Minus, Trash2, ArrowLeft } from 'lucide-react';
import Image from 'next/image';

const cartItems = [
  { id: 1, name: 'لبن جهينة كامل الدسم', price: 25.50, quantity: 1, image: 'category-dairy' },
  { id: 2, name: 'بيض أبيض (10 قطع)', price: 45.00, quantity: 2, image: 'category-eggs' },
  { id: 3, name: 'خبز بلدي (5 أرغفة)', price: 5.00, quantity: 1, image: 'category-bakery' },
];

const getImage = (id: string) => {
    const image = PlaceHolderImages.find((img) => img.id === id);
    return image ? image.imageUrl : 'https://picsum.photos/seed/placeholder/200/200';
};

const subtotal = cartItems.reduce((acc, item) => acc + item.price * item.quantity, 0);
const deliveryFee = 10;
const total = subtotal + deliveryFee;

export default function CartPage() {
  return (
    <div className="bg-background text-foreground font-sans" dir="rtl">
      <div className="flex min-h-screen flex-col">
        <header className="sticky top-0 z-40 flex w-full items-center justify-between border-b bg-background/95 p-4 backdrop-blur">
          <h1 className="text-xl font-bold">السلة</h1>
          <Button variant="ghost" size="icon" onClick={() => window.history.back()}>
            <ArrowLeft className="h-6 w-6" />
          </Button>
        </header>

        <main className="flex-1 overflow-y-auto bg-muted/20 p-4 pb-40">
          {cartItems.length > 0 ? (
            <div className="space-y-4">
              {cartItems.map((item) => (
                <Card key={item.id} className="overflow-hidden rounded-xl">
                  <CardContent className="flex items-center gap-4 p-4">
                    <Image
                      src={getImage(item.image)}
                      alt={item.name}
                      width={80}
                      height={80}
                      className="rounded-lg object-cover"
                      data-ai-hint={item.image}
                    />
                    <div className="flex-1">
                      <p className="font-semibold">{item.name}</p>
                      <p className="font-bold text-primary">{item.price.toFixed(2)} دينار ليبي</p>
                      <div className="mt-2 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Button variant="outline" size="icon" className="h-8 w-8 rounded-full">
                            <Plus className="h-4 w-4" />
                          </Button>
                          <span>{item.quantity}</span>
                          <Button variant="outline" size="icon" className="h-8 w-8 rounded-full">
                            <Minus className="h-4 w-4" />
                          </Button>
                        </div>
                        <Button variant="ghost" size="icon" className="text-destructive">
                          <Trash2 className="h-5 w-5" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="flex h-full flex-col items-center justify-center text-center">
              <ShoppingCart className="mb-4 h-20 w-20 text-muted-foreground" />
              <h2 className="text-xl font-semibold">سلّتك فارغة</h2>
              <p className="text-muted-foreground">أضف بعض المنتجات لتبدأ التسوق.</p>
              <Button className="mt-6">اكتشف المنتجات</Button>
            </div>
          )}
        </main>

        <div className="fixed bottom-24 z-30 w-full bg-background p-4 shadow-t-strong">
            <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                    <span>المجموع الفرعي</span>
                    <span>{subtotal.toFixed(2)} دينار ليبي</span>
                </div>
                <div className="flex justify-between">
                    <span>رسوم التوصيل</span>
                    <span>{deliveryFee.toFixed(2)} دينار ليبي</span>
                </div>
                <div className="flex justify-between text-base font-bold">
                    <span>المجموع الكلي</span>
                    <span>{total.toFixed(2)} دينار ليبي</span>
                </div>
            </div>
            <Button size="lg" className="mt-4 w-full text-lg">
              إتمام الطلب
            </Button>
        </div>


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
              className="flex flex-col items-center text-xs font-medium text-primary"
            >
              <ShoppingCart className="mb-1 h-6 w-6" />
              السلة
            </a>
            <a
              href="/wallet"
              className="flex flex-col items-center text-xs text-muted-foreground"
            >
              <Wallet className="mb-1 h-6 w-6" />
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
