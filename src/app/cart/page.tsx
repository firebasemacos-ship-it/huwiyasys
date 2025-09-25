
'use client';

import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { Home, MoreHorizontal, Search, ShoppingCart, Wallet, Plus, Minus, Trash2, ArrowLeft, LoaderCircle, CheckCircle2 } from 'lucide-react';
import Image from 'next/image';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger } from '@/components/ui/dialog';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { useUser, useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { doc, DocumentData } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';

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

type WalletInfo = {
    balance: number;
    cardNumber: string;
    cvv: string;
    expiryDate: string;
    status: 'active' | 'suspended';
};

type UserProfile = {
    displayName: string;
    wallet: WalletInfo;
    linkedWallets?: WalletInfo[];
};


function CheckoutDialog({ totalAmount }: { totalAmount: number }) {
    const { toast } = useToast();
    const { user } = useUser();
    const firestore = useFirestore();

    const userDocRef = useMemoFirebase(() => {
        if (!firestore || !user) return null;
        return doc(firestore, 'users', user.uid);
    }, [firestore, user]);

    const { data: userData, isLoading: isUserDataLoading } = useDoc<UserProfile>(userDocRef);

    const [selectedPayment, setSelectedPayment] = useState<string>('primary');
    const [paymentStatus, setPaymentStatus] = useState<'idle' | 'processing' | 'success'>('idle');

    const [newCardNumber, setNewCardNumber] = useState('');
    const [newCardExpiry, setNewCardExpiry] = useState('');
    const [newCardCvv, setNewCardCvv] = useState('');


    const handlePayment = async () => {
        setPaymentStatus('processing');
        // Simulate payment processing
        await new Promise(resolve => setTimeout(resolve, 2000));

        let cardUsed: WalletInfo | undefined;
        if (selectedPayment === 'primary') {
            cardUsed = userData?.wallet;
        } else if (selectedPayment === 'new') {
            // Basic validation for new card
            if (!newCardNumber || !newCardExpiry || !newCardCvv) {
                toast({ variant: 'destructive', title: 'بيانات ناقصة', description: 'الرجاء إدخال جميع بيانات البطاقة الجديدة.' });
                setPaymentStatus('idle');
                return;
            }
            cardUsed = { cardNumber: newCardNumber, expiryDate: newCardExpiry, cvv: newCardCvv, balance: Infinity, status: 'active' };
        } else {
            cardUsed = userData?.linkedWallets?.find(w => w.cardNumber === selectedPayment);
        }

        if (!cardUsed) {
            toast({ variant: 'destructive', title: 'خطأ في الدفع', description: 'لم يتم العثور على طريقة الدفع المختارة.' });
            setPaymentStatus('idle');
            return;
        }
        
        // In a real app, you would connect to a payment gateway here.
        // For this demo, we'll just show a success message.
        setPaymentStatus('success');
        
        // You might want to clear the cart and navigate to an order confirmation page here.
    };

    if (paymentStatus === 'processing' || paymentStatus === 'success') {
        return (
             <DialogContent dir="rtl">
                <div className="flex flex-col items-center justify-center gap-4 py-12 text-center">
                    {paymentStatus === 'processing' ? (
                       <>
                        <LoaderCircle className="h-16 w-16 animate-spin text-primary" />
                        <DialogTitle className="text-2xl">جاري معالجة الدفع</DialogTitle>
                        <DialogDescription>الرجاء الانتظار...</DialogDescription>
                       </>
                    ) : (
                        <>
                        <CheckCircle2 className="h-16 w-16 text-green-500" />
                        <DialogTitle className="text-2xl">تم الدفع بنجاح</DialogTitle>
                        <DialogDescription>شكراً لك! تم استلام طلبك بنجاح.</DialogDescription>
                        <Button className="mt-4" onClick={() => window.location.reload()}>إغلاق</Button>
                       </>
                    )}
                </div>
            </DialogContent>
        )
    }

    return (
        <DialogContent dir="rtl">
            <DialogHeader>
                <DialogTitle>إتمام الطلب</DialogTitle>
                <DialogDescription>اختر طريقة الدفع لإتمام عملية الشراء.</DialogDescription>
            </DialogHeader>
            
            <div className="py-4">
                <RadioGroup value={selectedPayment} onValueChange={setSelectedPayment}>
                    <div className="space-y-4">
                        {isUserDataLoading ? (
                             <div className="space-y-2">
                                <Skeleton className="h-6 w-full rounded-md" />
                                <Skeleton className="h-6 w-full rounded-md" />
                             </div>
                        ) : (
                            <>
                                {userData?.wallet && (
                                    <Label htmlFor="primary" className="flex items-center gap-4 rounded-md border p-4 hover:bg-accent has-[[data-state=checked]]:border-primary">
                                        <RadioGroupItem value="primary" id="primary" />
                                        <div className="flex flex-col">
                                            <span>البطاقة الأساسية</span>
                                            <span className="text-sm text-muted-foreground font-mono">**** **** **** {userData.wallet.cardNumber.slice(-4)}</span>
                                        </div>
                                    </Label>
                                )}
                                {userData?.linkedWallets?.map(wallet => (
                                     <Label key={wallet.cardNumber} htmlFor={wallet.cardNumber} className="flex items-center gap-4 rounded-md border p-4 hover:bg-accent has-[[data-state=checked]]:border-primary">
                                        <RadioGroupItem value={wallet.cardNumber} id={wallet.cardNumber} />
                                        <div className="flex flex-col">
                                            <span>بطاقة مرتبطة</span>
                                            <span className="text-sm text-muted-foreground font-mono">**** **** **** {wallet.cardNumber.slice(-4)}</span>
                                        </div>
                                    </Label>
                                ))}
                            </>
                        )}

                        <Label htmlFor="new" className="flex items-center gap-4 rounded-md border p-4 hover:bg-accent has-[[data-state=checked]]:border-primary">
                            <RadioGroupItem value="new" id="new" />
                            <span>استخدام بطاقة جديدة</span>
                        </Label>

                        {selectedPayment === 'new' && (
                            <div className="grid gap-4 pl-10 pt-4">
                                <div className="space-y-2">
                                    <Label htmlFor="new-card-number">رقم البطاقة</Label>
                                    <Input id="new-card-number" placeholder="XXXX XXXX XXXX XXXX" value={newCardNumber} onChange={e => setNewCardNumber(e.target.value)} />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="new-card-expiry">تاريخ الانتهاء</Label>
                                        <Input id="new-card-expiry" placeholder="MM/YY" value={newCardExpiry} onChange={e => setNewCardExpiry(e.target.value)} />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="new-card-cvv">CVV</Label>
                                        <Input id="new-card-cvv" placeholder="XXX" value={newCardCvv} onChange={e => setNewCardCvv(e.target.value)} />
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </RadioGroup>
                
                <Separator className="my-6" />

                <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                        <span className="text-muted-foreground">المجموع الكلي</span>
                        <span className="font-semibold">{totalAmount.toFixed(2)} دينار ليبي</span>
                    </div>
                </div>
            </div>

            <DialogFooter>
                <Button onClick={handlePayment} disabled={paymentStatus === 'processing'} size="lg" className="w-full">
                    {paymentStatus === 'processing' ? <LoaderCircle className="ml-2 h-4 w-4 animate-spin" /> : null}
                    ادفع الآن
                </Button>
            </DialogFooter>
        </DialogContent>
    );
}

export default function CartPage() {
  const { user, isUserLoading } = useUser();
  const [isCheckoutOpen, setCheckoutOpen] = useState(false);

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
        
        {cartItems.length > 0 && (
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
                <Dialog open={isCheckoutOpen} onOpenChange={setCheckoutOpen}>
                    <DialogTrigger asChild>
                        <Button size="lg" className="mt-4 w-full text-lg" disabled={isUserLoading}>
                            إتمام الطلب
                        </Button>
                    </DialogTrigger>
                    {isCheckoutOpen && <CheckoutDialog totalAmount={total} />}
                </Dialog>
            </div>
        )}

        <footer className="fixed bottom-0 z-40 w-full border-t bg-background">
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


    