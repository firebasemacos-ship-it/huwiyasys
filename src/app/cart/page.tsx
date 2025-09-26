
'use client';

import { useState, useMemo, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { Home, Ticket, Search, ShoppingCart, Wallet, Plus, Minus, Trash2, ArrowLeft, LoaderCircle, CheckCircle2, XCircle, Clock } from 'lucide-react';
import Image from 'next/image';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger } from '@/components/ui/dialog';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { useUser, useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { doc, DocumentData, runTransaction, collection, query, where, getDocs, serverTimestamp, increment, addDoc, getDoc, updateDoc, onSnapshot } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { useCart } from '@/hooks/use-cart';

const getImage = (id: string | undefined) => {
    if (!id) return 'https://picsum.photos/seed/placeholder/200/200';
    const image = PlaceHolderImages.find((img) => img.id === id);
    return image ? image.imageUrl : 'https://picsum.photos/seed/placeholder/200/200';
};

type WalletInfo = {
    balance: number;
    cardNumber: string;
    cvv: string;
    expiryDate: string;
    status: 'active' | 'suspended';
    ownerName?: string;
};

type UserProfile = {
    displayName: string;
    wallet: WalletInfo;
    linkedWallets?: WalletInfo[];
};


function CheckoutDialog({ onPaymentSuccess, cartItems, totalAmount }: { onPaymentSuccess: () => void, cartItems: any[], totalAmount: number }) {
    const { toast } = useToast();
    const { user } = useUser();
    const firestore = useFirestore();

    const userDocRef = useMemoFirebase(() => {
        if (!firestore || !user) return null;
        return doc(firestore, 'users', user.uid);
    }, [firestore, user]);

    const { data: userData, isLoading: isUserDataLoading } = useDoc<UserProfile>(userDocRef);

    const [selectedPaymentCardNumber, setSelectedPaymentCardNumber] = useState<string>('primary');
    const [paymentStatus, setPaymentStatus] = useState<'idle' | 'processing' | 'success' | 'awaiting_approval' | 'rejected'>('idle');
    const [paymentRequestId, setPaymentRequestId] = useState<string | null>(null);

    const [newCardNumber, setNewCardNumber] = useState('');
    const [newCardExpiry, setNewCardExpiry] = useState('');
    const [newCardCvv, setNewCardCvv] = useState('');
    
    // This effect listens for changes on the payment request document
    useEffect(() => {
        if (paymentStatus !== 'awaiting_approval' || !paymentRequestId || !firestore) return;

        const requestRef = doc(firestore, 'paymentRequests', paymentRequestId);
        const unsubscribe = onSnapshot(requestRef, (snapshot) => {
            const data = snapshot.data();
            if (data?.status === 'processed') {
                setPaymentStatus('success');
                unsubscribe();
            } else if (data?.status === 'rejected') {
                setPaymentStatus('rejected');
                toast({ variant: 'destructive', title: 'تم رفض الدفع', description: 'رفض صاحب البطاقة عملية الدفع.' });
                unsubscribe();
            }
        });

        return () => unsubscribe();
    }, [paymentStatus, paymentRequestId, firestore, toast]);


    const handlePayment = async () => {
        if (!user || !userData || !firestore) {
            toast({ variant: 'destructive', title: 'خطأ', description: 'يجب تسجيل الدخول لإتمام العملية.' });
            return;
        }
        setPaymentStatus('processing');
        
        const cartDataForOrder = cartItems.map(item => ({ id: item.id, name: item.name, price: item.price, quantity: item.quantity }));
        let finalPaymentCardNumber: string;
        let cardType: 'primary' | 'linked' | 'new';

        if (selectedPaymentCardNumber === 'primary') {
            finalPaymentCardNumber = userData.wallet.cardNumber;
            cardType = 'primary';
        } else if (selectedPaymentCardNumber === 'new') {
            finalPaymentCardNumber = newCardNumber.replace(/\s/g, '');
            cardType = 'new';
        } else {
            finalPaymentCardNumber = selectedPaymentCardNumber;
            cardType = 'linked';
        }

        // Direct payment for primary card or new card
        if (cardType === 'primary' || cardType === 'new') {
            try {
                await runTransaction(firestore, async (transaction) => {
                    const usersRef = collection(firestore, 'users');
                    const cardQuery = query(usersRef, where("wallet.cardNumber", "==", finalPaymentCardNumber));
                    const cardOwnerSnapshot = await getDocs(cardQuery);

                    if (cardOwnerSnapshot.empty) {
                        throw new Error("لم يتم العثور على البطاقة المحددة.");
                    }

                    const cardOwnerDoc = cardOwnerSnapshot.docs[0];
                    const cardOwnerId = cardOwnerDoc.id;
                    const cardOwnerData = cardOwnerDoc.data();
                    const cardOwnerRef = doc(firestore, 'users', cardOwnerId);

                    if (cardType === 'new') {
                        if (cardOwnerData.wallet.cvv !== newCardCvv || cardOwnerData.wallet.expiryDate !== newCardExpiry) {
                            throw new Error("بيانات البطاقة (CVV أو تاريخ الانتهاء) غير صحيحة.");
                        }
                    }
                    
                    if (cardOwnerData.wallet.status !== 'active') {
                        throw new Error(`بطاقة ${cardOwnerData.displayName} معلقة حاليًا.`);
                    }
                    if (cardOwnerData.wallet.balance < totalAmount) {
                        throw new Error(`الرصيد في بطاقة ${cardOwnerData.displayName} غير كافٍ.`);
                    }

                    transaction.update(cardOwnerRef, { "wallet.balance": increment(-totalAmount) });
                    const ownerTransactionRef = doc(collection(firestore, `users/${cardOwnerId}/transactions`));
                    transaction.set(ownerTransactionRef, {
                        type: 'شراء', amount: -totalAmount, date: serverTimestamp(),
                        description: cardOwnerId === user.uid ? `شراء منتجات من التطبيق` : `شراء منتجات من قبل المستخدم ${userData.displayName}`
                    });
                    if (cardOwnerId !== user.uid) {
                        const buyerTransactionRef = doc(collection(firestore, `users/${user.uid}/transactions`));
                        transaction.set(buyerTransactionRef, {
                            type: 'شراء', amount: 0, date: serverTimestamp(), description: `تم الدفع باستخدام بطاقة ${cardOwnerData.displayName}`
                        });
                    }
                    const orderRef = doc(collection(firestore, 'orders'));
                    transaction.set(orderRef, {
                        userId: user.uid, userName: userData.displayName, items: cartDataForOrder, totalAmount: totalAmount,
                        status: 'pending', paymentMethod: `**** ${finalPaymentCardNumber.slice(-4)}`, createdAt: serverTimestamp(),
                    });
                });
                setPaymentStatus('success');
            } catch (error: any) {
                console.error("Payment error:", error);
                toast({ variant: 'destructive', title: 'فشل الدفع', description: error.message || 'حدث خطأ أثناء معالجة الدفع.' });
                setPaymentStatus('idle');
            }
        } else { // Linked card: create a payment request
            try {
                const usersRef = collection(firestore, 'users');
                const q = query(usersRef, where("wallet.cardNumber", "==", finalPaymentCardNumber));
                const ownerSnapshot = await getDocs(q);
                if (ownerSnapshot.empty) {
                    throw new Error("لم يتم العثور على مالك البطاقة المرتبطة.");
                }
                const ownerDoc = ownerSnapshot.docs[0];

                const paymentRequest = {
                    requesterId: user.uid,
                    requesterName: userData.displayName,
                    ownerId: ownerDoc.id,
                    amount: totalAmount,
                    status: 'pending',
                    createdAt: serverTimestamp(),
                    orderData: { // Snapshot of the order
                        userId: user.uid, userName: userData.displayName, items: cartDataForOrder, totalAmount: totalAmount,
                        paymentMethod: `**** ${finalPaymentCardNumber.slice(-4)}`
                    }
                };

                const requestDocRef = await addDoc(collection(firestore, 'paymentRequests'), paymentRequest);
                setPaymentRequestId(requestDocRef.id);
                setPaymentStatus('awaiting_approval');

            } catch (error: any) {
                console.error("Payment request error:", error);
                toast({ variant: 'destructive', title: 'فشل إنشاء طلب الدفع', description: error.message });
                setPaymentStatus('idle');
            }
        }
    };
    
    const resetAndClose = () => {
        setPaymentStatus('idle');
        setPaymentRequestId(null);
        onPaymentSuccess(); // This closes the dialog and clears the cart
    }

    if (paymentStatus === 'success') {
        return (
             <DialogContent dir="rtl">
                <div className="flex flex-col items-center justify-center gap-4 py-12 text-center">
                    <CheckCircle2 className="h-16 w-16 text-green-500" />
                    <DialogTitle className="text-2xl">تم الدفع بنجاح</DialogTitle>
                    <DialogDescription>شكراً لك! تم استلام طلبك بنجاح.</DialogDescription>
                    <Button className="mt-4" onClick={resetAndClose}>إغلاق</Button>
                </div>
            </DialogContent>
        )
    }

     if (paymentStatus === 'awaiting_approval') {
        return (
             <DialogContent dir="rtl">
                <div className="flex flex-col items-center justify-center gap-4 py-12 text-center">
                    <Clock className="h-16 w-16 animate-pulse text-primary" />
                    <DialogTitle className="text-2xl">بانتظار الموافقة</DialogTitle>
                    <DialogDescription>تم إرسال طلب دفع إلى صاحب البطاقة. الرجاء الانتظار...</DialogDescription>
                </div>
            </DialogContent>
        )
    }
    
    if (paymentStatus === 'rejected') {
        return (
             <DialogContent dir="rtl">
                <div className="flex flex-col items-center justify-center gap-4 py-12 text-center">
                    <XCircle className="h-16 w-16 text-destructive" />
                    <DialogTitle className="text-2xl">تم رفض العملية</DialogTitle>
                    <DialogDescription>رفض صاحب البطاقة طلب الدفع. يمكنك تجربة طريقة دفع أخرى.</DialogDescription>
                     <Button className="mt-4" onClick={() => setPaymentStatus('idle')}>العودة</Button>
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
                <RadioGroup value={selectedPaymentCardNumber} onValueChange={setSelectedPaymentCardNumber} defaultValue="primary">
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
                                    <span>بطاقة {wallet.ownerName}</span>
                                    <span className="text-sm text-muted-foreground font-mono">**** **** **** {wallet.cardNumber.slice(-4)}</span>
                                </div>
                            </Label>
                        ))}
                        
                        <Label htmlFor="new" className="flex items-center gap-4 rounded-md border p-4 hover:bg-accent has-[[data-state=checked]]:border-primary">
                            <RadioGroupItem value="new" id="new" />
                            <span>استخدام بطاقة جديدة</span>
                        </Label>

                        {selectedPaymentCardNumber === 'new' && (
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
  const { items: cartItems, updateQuantity, removeItem, clearCart } = useCart();
  const [isCheckoutOpen, setCheckoutOpen] = useState(false);
  
  // Hydration fix:
  const [isClient, setIsClient] = useState(false);
  useEffect(() => {
    setIsClient(true);
  }, []);

  const subtotal = useMemo(() => cartItems.reduce((acc, item) => acc + item.price * item.quantity, 0), [cartItems]);
  const deliveryFee = 10;
  const total = subtotal + deliveryFee;

  const handlePaymentSuccess = () => {
    setCheckoutOpen(false);
    clearCart();
  };


  return (
    <div className="dark">
      <div className="flex min-h-screen flex-col bg-background text-foreground">
        <header className="sticky top-0 z-40 flex w-full items-center justify-between border-b bg-background/30 p-4 backdrop-blur-lg">
          <h1 className="text-xl font-bold">السلة</h1>
          <Button variant="ghost" size="icon" onClick={() => window.history.back()}>
            <ArrowLeft className="h-6 w-6" />
          </Button>
        </header>

        <main className="flex-1 overflow-y-auto bg-muted/20 p-4 pb-40">
          {!isClient ? (
             <div className="space-y-4">
                <Skeleton className="h-28 w-full rounded-xl" />
                <Skeleton className="h-28 w-full rounded-xl" />
            </div>
          ) : cartItems.length > 0 ? (
            <div className="space-y-4">
              {cartItems.map((item) => (
                <Card key={item.id} className="overflow-hidden rounded-xl">
                  <CardContent className="flex items-center gap-4 p-4">
                    <Image
                      src={item.imageUrl || getImage(item.imageHint)}
                      alt={item.name}
                      width={80}
                      height={80}
                      className="rounded-lg object-cover"
                      data-ai-hint={item.imageHint}
                    />
                    <div className="flex-1">
                      <p className="font-semibold">{item.name}</p>
                      <p className="font-bold text-primary">{item.price.toFixed(2)} دينار ليبي</p>
                      <div className="mt-2 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Button variant="outline" size="icon" className="h-8 w-8 rounded-full" onClick={() => updateQuantity(item.id, item.quantity + 1)}>
                            <Plus className="h-4 w-4" />
                          </Button>
                          <span>{item.quantity}</span>
                          <Button variant="outline" size="icon" className="h-8 w-8 rounded-full" onClick={() => updateQuantity(item.id, Math.max(1, item.quantity - 1))}>
                            <Minus className="h-4 w-4" />
                          </Button>
                        </div>
                        <Button variant="ghost" size="icon" className="text-destructive" onClick={() => removeItem(item.id)}>
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
              <p className="text-muted-foreground">أضف بعض المنتجات لتبدأ.</p>
              <Button onClick={() => window.location.href='/shop'} className="mt-6">متابعة التسوق</Button>
            </div>
          )}
        </main>
        
        {isClient && cartItems.length > 0 && (
            <div className="fixed bottom-24 z-30 w-full border-t border-white/10 bg-background/30 p-4 shadow-t-strong backdrop-blur-lg">
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
                    {isCheckoutOpen && <CheckoutDialog cartItems={cartItems} totalAmount={total} onPaymentSuccess={handlePaymentSuccess} />}
                </Dialog>
            </div>
        )}

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
