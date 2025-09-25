
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
import { doc, DocumentData, getDocs, collection, query, where, updateDoc, addDoc, serverTimestamp } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';

const initialCartItems = [
  { id: 1, name: 'لبن جهينة كامل الدسم', price: 25.50, quantity: 1, image: 'category-dairy' },
  { id: 2, name: 'بيض أبيض (10 قطع)', price: 45.00, quantity: 2, image: 'category-eggs' },
  { id: 3, name: 'خبز بلدي (5 أرغفة)', price: 5.00, quantity: 1, image: 'category-bakery' },
];

const getImage = (id: string) => {
    const image = PlaceHolderImages.find((img) => img.id === id);
    return image ? image.imageUrl : 'https://picsum.photos/seed/placeholder/200/200';
};

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


function CheckoutDialog({ onPaymentSuccess, cartItems }: { onPaymentSuccess: () => void, cartItems: typeof initialCartItems }) {
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

    const subtotal = useMemo(() => cartItems.reduce((acc, item) => acc + item.price * item.quantity, 0), [cartItems]);
    const deliveryFee = 10;
    const totalAmount = subtotal + deliveryFee;

    const handlePayment = async () => {
        if (!firestore || !user || !userData) return;
        setPaymentStatus('processing');

        let paymentCardOwnerId: string | null = null;
        let paymentCardOwnerData: UserProfile | null = null;
        let cardVerified = false;

        try {
            if (selectedPayment === 'primary') {
                if (userData.wallet && userData.wallet.balance >= totalAmount) {
                    paymentCardOwnerId = user.uid;
                    paymentCardOwnerData = userData;
                    cardVerified = true;
                } else {
                     toast({ variant: 'destructive', title: 'خطأ في الدفع', description: 'الرصيد في بطاقتك الأساسية غير كافٍ.' });
                     setPaymentStatus('idle');
                     return;
                }
            } else {
                let cardToVerify: { cardNumber: string; expiryDate?: string; cvv?: string; };

                if (selectedPayment === 'new') {
                    if (!newCardNumber || !newCardExpiry || !newCardCvv) {
                        toast({ variant: 'destructive', title: 'بيانات ناقصة', description: 'الرجاء إدخال جميع بيانات البطاقة الجديدة.' });
                        setPaymentStatus('idle');
                        return;
                    }
                    cardToVerify = { cardNumber: newCardNumber, expiryDate: newCardExpiry, cvv: newCardCvv };
                } else {
                    const linkedWallet = userData.linkedWallets?.find(w => w.cardNumber === selectedPayment);
                    if (!linkedWallet) {
                        toast({ variant: 'destructive', title: 'خطأ', description: 'لم يتم العثور على البطاقة المرتبطة.' });
                        setPaymentStatus('idle');
                        return;
                    }
                    cardToVerify = linkedWallet;
                }

                const usersRef = collection(firestore, 'users');
                const q = query(usersRef, where("wallet.cardNumber", "==", cardToVerify.cardNumber));
                const querySnapshot = await getDocs(q);

                if (!querySnapshot.empty) {
                    let cardFound = false;
                    for (const docSnap of querySnapshot.docs) {
                        const foundUser = docSnap.data() as UserProfile;
                        const isMatch = (cardToVerify.expiryDate && cardToVerify.cvv)
                            ? foundUser.wallet.expiryDate === cardToVerify.expiryDate && foundUser.wallet.cvv === cardToVerify.cvv
                            : true; // For already linked cards, we trust them

                        if (isMatch) {
                            cardFound = true;
                            if (foundUser.wallet.balance >= totalAmount) {
                                paymentCardOwnerId = docSnap.id;
                                paymentCardOwnerData = foundUser;
                                cardVerified = true;
                            } else {
                                toast({ variant: 'destructive', title: 'خطأ في الدفع', description: 'رصيد البطاقة المحددة غير كافٍ.' });
                                setPaymentStatus('idle');
                                return;
                            }
                            break; 
                        }
                    }
                    if(!cardFound) {
                        toast({ variant: 'destructive', title: 'خطأ في الدفع', description: 'بيانات البطاقة غير صحيحة.' });
                        setPaymentStatus('idle');
                        return;
                    }
                } else {
                    toast({ variant: 'destructive', title: 'خطأ في الدفع', description: 'لم يتم العثور على البطاقة المحددة.' });
                    setPaymentStatus('idle');
                    return;
                }
            }

            if (!cardVerified || !paymentCardOwnerId || !paymentCardOwnerData) {
                toast({ variant: 'destructive', title: 'خطأ في الدفع', description: 'البطاقة غير صالحة أو الرصيد غير كافٍ.' });
                setPaymentStatus('idle');
                return;
            }

            // --- Process Payment ---
            const newBalance = paymentCardOwnerData.wallet.balance - totalAmount;
            const ownerDocRef = doc(firestore, 'users', paymentCardOwnerId);

            // 1. Update balance
            await updateDoc(ownerDocRef, { 'wallet.balance': newBalance });

            // 2. Create transaction for card owner
            const ownerTransactionsColRef = collection(firestore, 'users', paymentCardOwnerId, 'transactions');
            await addDoc(ownerTransactionsColRef, {
                type: 'شراء',
                amount: -totalAmount,
                date: serverTimestamp(),
                description: `شراء من قبل ${userData.displayName}`
            });
            
            // 3. Create transaction for the buyer (if different from owner)
            if (paymentCardOwnerId !== user.uid) {
                 const buyerTransactionsColRef = collection(firestore, 'users', user.uid, 'transactions');
                 await addDoc(buyerTransactionsColRef, {
                    type: 'شراء',
                    amount: -totalAmount,
                    date: serverTimestamp(),
                    description: `تم الدفع باستخدام بطاقة ${paymentCardOwnerData.displayName}`
                });
            }

            setPaymentStatus('success');

        } catch (error) {
            console.error("Payment error:", error);
            toast({ variant: 'destructive', title: 'خطأ', description: 'حدث خطأ أثناء معالجة الدفع.' });
            setPaymentStatus('idle');
        }
    };

    if (paymentStatus === 'success') {
        return (
             <DialogContent dir="rtl">
                <div className="flex flex-col items-center justify-center gap-4 py-12 text-center">
                    <CheckCircle2 className="h-16 w-16 text-green-500" />
                    <DialogTitle className="text-2xl">تم الدفع بنجاح</DialogTitle>
                    <DialogDescription>شكراً لك! تم استلام طلبك بنجاح.</DialogDescription>
                    <Button className="mt-4" onClick={onPaymentSuccess}>إغلاق</Button>
                </div>
            </DialogContent>
        )
    }

     if (paymentStatus === 'processing') {
        return (
             <DialogContent dir="rtl">
                <div className="flex flex-col items-center justify-center gap-4 py-12 text-center">
                    <LoaderCircle className="h-16 w-16 animate-spin text-primary" />
                    <DialogTitle className="text-2xl">جاري معالجة الدفع</DialogTitle>
                    <DialogDescription>الرجاء الانتظار...</DialogDescription>
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
                <RadioGroup value={selectedPayment} onValueChange={setSelectedPayment} defaultValue="primary">
                    <div className="space-y-4">
                        {isUserDataLoading ? (
                             <div className="space-y-2">
                                <Skeleton className="h-16 w-full rounded-md" />
                             </div>
                        ) : userData?.wallet ? (
                            <Label htmlFor="primary" className="flex items-center gap-4 rounded-md border p-4 hover:bg-accent has-[[data-state=checked]]:border-primary">
                                <RadioGroupItem value="primary" id="primary" />
                                <div className="flex flex-col">
                                    <span>البطاقة الأساسية (الافتراضية)</span>
                                    <span className="text-sm text-muted-foreground font-mono">**** **** **** {userData.wallet.cardNumber.slice(-4)}</span>
                                </div>
                            </Label>
                        ) : <p className="text-sm text-destructive p-4 border border-dashed rounded-md">لم يتم العثور على بطاقة أساسية. الرجاء إضافة بطاقة جديدة.</p>
                        }

                        <Separator/>
                        
                        <p className="text-sm text-muted-foreground">استخدام بطاقات أخرى</p>

                        {userData?.linkedWallets?.map(wallet => (
                             <Label key={wallet.cardNumber} htmlFor={wallet.cardNumber} className="flex items-center gap-4 rounded-md border p-4 hover:bg-accent has-[[data-state=checked]]:border-primary">
                                <RadioGroupItem value={wallet.cardNumber} id={wallet.cardNumber} />
                                <div className="flex flex-col">
                                    <span>بطاقة مرتبطة</span>
                                    <span className="text-sm text-muted-foreground font-mono">**** **** **** {wallet.cardNumber.slice(-4)}</span>
                                </div>
                            </Label>
                        ))}
                        
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
                <Button onClick={handlePayment} disabled={paymentStatus === 'processing' || isUserDataLoading} size="lg" className="w-full">
                    ادفع الآن
                </Button>
            </DialogFooter>
        </DialogContent>
    );
}

export default function CartPage() {
  const { user, isUserLoading } = useUser();
  const [isCheckoutOpen, setCheckoutOpen] = useState(false);
  const [cartItems, setCartItems] = useState(initialCartItems);

  const subtotal = useMemo(() => cartItems.reduce((acc, item) => acc + item.price * item.quantity, 0), [cartItems]);
  const deliveryFee = 10;
  const total = subtotal + deliveryFee;

  const handlePaymentSuccess = () => {
    setCheckoutOpen(false);
    setCartItems([]); // Clear the cart
  };


  return (
    <div className="bg-background text-foreground" dir="rtl">
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
              <h2 className="text-xl font-semibold">تم إرسال طلبك بنجاح!</h2>
              <p className="text-muted-foreground">شكراً لتسوقك معنا.</p>
              <Button onClick={() => window.location.href='/shop'} className="mt-6">متابعة التسوق</Button>
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
                    {isCheckoutOpen && <CheckoutDialog cartItems={cartItems} onPaymentSuccess={handlePaymentSuccess} />}
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
