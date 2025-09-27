

'use client';

import { useState, useMemo, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription as CardDescriptionUI } from '@/components/ui/card';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { Home, Ticket, BadgePercent, ShoppingCart, Wallet, Plus, Minus, Trash2, ArrowLeft, LoaderCircle, CheckCircle2, XCircle, Clock, Download, Printer } from 'lucide-react';
import Image from 'next/image';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger } from '@/components/ui/dialog';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { useUser, useFirestore, useDoc, useMemoFirebase, useCollection } from '@/firebase';
import { doc, DocumentData, runTransaction, collection, query, where, getDocs, serverTimestamp, increment, addDoc, getDoc, updateDoc, onSnapshot, arrayUnion, DocumentReference } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { useCart } from '@/hooks/use-cart';
import { v4 as uuidv4 } from 'uuid';
import QRCode from "react-qr-code";
import { Logo } from '@/components/icons';
import { Badge } from '@/components/ui/badge';


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
    contractNumber: string;
    wallet: WalletInfo;
    linkedWallets?: WalletInfo[];
};

type Offer = DocumentData & {
  id: string;
  type: 'discount_coupon';
  productId?: string;
  discountPercentage?: number;
  couponCode?: string;
  isUsed?: boolean;
  targetType: 'all' | 'specific_user';
  targetUserId?: string;
};


type InvoiceData = {
    orderId: string;
    userName: string;
    contractNumber: string;
    paymentCard: string;
}

function CheckoutDialog({ onPaymentSuccess, cartItems, totalAmount, discountAmount, appliedCoupon }: { onPaymentSuccess: () => void, cartItems: any[], totalAmount: number, discountAmount: number, appliedCoupon: Offer | null }) {
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

    const [invoiceData, setInvoiceData] = useState<InvoiceData | null>(null);

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
                setInvoiceData({
                    orderId: data.orderData.orderId,
                    userName: data.orderData.userName,
                    contractNumber: data.orderData.contractNumber,
                    paymentCard: data.orderData.paymentMethod
                });
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
        
        const finalAmount = totalAmount - discountAmount;
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

        const orderName = cartItems.map(item => item.name).join(', ');

        // Direct payment for primary card or new card
        if (cardType === 'primary' || cardType === 'new') {
            try {
                const orderRef = await runTransaction(firestore, async (transaction) => {
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
                    if (cardOwnerData.wallet.balance < finalAmount) {
                        throw new Error(`الرصيد في بطاقة ${cardOwnerData.displayName} غير كافٍ.`);
                    }
                    
                    const buyerRef = doc(firestore, 'users', user.uid);

                    transaction.update(cardOwnerRef, { "wallet.balance": increment(-finalAmount) });
                    const ownerTransactionRef = doc(collection(firestore, `users/${cardOwnerId}/transactions`));
                    transaction.set(ownerTransactionRef, {
                        type: 'شراء', amount: -finalAmount, date: serverTimestamp(),
                        description: cardOwnerId === user.uid ? `شراء: ${orderName}` : `شراء ${orderName} من قبل ${userData.displayName}`
                    });
                    if (cardOwnerId !== user.uid) {
                        const buyerTransactionRef = doc(collection(firestore, `users/${user.uid}/transactions`));
                        transaction.set(buyerTransactionRef, {
                            type: 'شراء', amount: 0, date: serverTimestamp(), description: `تم الدفع باستخدام بطاقة ${cardOwnerData.displayName}`
                        });
                    }

                    if (appliedCoupon) {
                        const couponRef = doc(firestore, 'offers', appliedCoupon.id);
                        transaction.update(couponRef, { isUsed: true, usedBy: user.uid });
                    }
                    
                    const newOrderRef = doc(collection(firestore, 'orders'));
                    transaction.set(newOrderRef, {
                        userId: user.uid, userName: userData.displayName, items: cartDataForOrder, totalAmount: finalAmount,
                        status: 'pending', paymentMethod: `**** ${finalPaymentCardNumber.slice(-4)}`, createdAt: serverTimestamp(),
                    });

                    const orderSubscription = {
                        id: uuidv4(),
                        category: 'order',
                        status: 'reviewing',
                        orderName: orderName,
                        orderId: newOrderRef.id,
                        totalAmount: finalAmount,
                        itemCount: cartItems.reduce((acc, item) => acc + item.quantity, 0),
                        createdAt: new Date(),
                    };
                    transaction.update(buyerRef, { subscriptions: arrayUnion(orderSubscription) });
                    return newOrderRef;
                });
                
                setInvoiceData({
                    orderId: orderRef.id,
                    userName: userData.displayName,
                    contractNumber: userData.contractNumber,
                    paymentCard: `**** ${finalPaymentCardNumber.slice(-4)}`
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
                const newOrderId = doc(collection(firestore, 'orders')).id; // Pre-generate order ID
                
                const paymentRequest = {
                    requesterId: user.uid,
                    requesterName: userData.displayName,
                    ownerId: ownerDoc.id,
                    amount: finalAmount,
                    status: 'pending',
                    createdAt: serverTimestamp(),
                    orderData: {
                        orderId: newOrderId,
                        userId: user.uid, 
                        userName: userData.displayName,
                        contractNumber: userData.contractNumber,
                        items: cartDataForOrder, 
                        totalAmount: finalAmount,
                        paymentMethod: `**** ${finalPaymentCardNumber.slice(-4)}`,
                        orderName: orderName,
                        appliedCouponId: appliedCoupon?.id || null,
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
        setInvoiceData(null);
        onPaymentSuccess(); // This closes the dialog and clears the cart
    }
    
    const invoiceRef = useRef<HTMLDivElement>(null);
    
    const handlePrint = () => {
        const printWindow = window.open('', '', 'height=800,width=600');
        if (printWindow && invoiceRef.current) {
            printWindow.document.write('<html><head><title>فاتورة</title>');
            // Include styles
            const styles = Array.from(document.styleSheets)
                .map(styleSheet => {
                    try {
                        return Array.from(styleSheet.cssRules)
                            .map(rule => rule.cssText)
                            .join('');
                    } catch (e) {
                        return '';
                    }
                }).join('');
            printWindow.document.write(`<style>${styles} .dark { background: white; color: black; } .print-only-card-bg { background-color: white !important; } .print-only-text-black { color: black !important; }</style>`);
            printWindow.document.write('</head><body dir="rtl">');
            printWindow.document.write(invoiceRef.current.innerHTML);
            printWindow.document.write('</body></html>');
            printWindow.document.close();
            setTimeout(() => { // Timeout to ensure content is loaded
                 printWindow.print();
                 printWindow.close();
            }, 500);
        }
    };


    if (paymentStatus === 'success' && invoiceData) {
        const formattedInvoiceId = `ZETABAIT-${invoiceData.orderId.substring(0, 8).toUpperCase()}`;
        return (
             <DialogContent dir="rtl" className="max-w-md">
                <div className="flex flex-col items-center justify-center gap-4 py-8 text-center">
                    <CheckCircle2 className="h-16 w-16 text-green-500" />
                    <DialogTitle className="text-2xl">تم الدفع بنجاح</DialogTitle>
                    <DialogDescription>شكراً لك! تم استلام طلبك وهو الآن قيد المراجعة.</DialogDescription>

                     <div ref={invoiceRef} className="w-full mt-4">
                        <Card className="w-full max-w-sm mx-auto text-right dark:bg-slate-800 print-only-card-bg">
                            <CardHeader className="text-center space-y-2 pb-2">
                                <Logo className="h-16 w-16 mx-auto" />
                                <CardTitle className="dark:text-white print-only-text-black">فاتورة إلكترونية</CardTitle>
                                <CardDescriptionUI className="dark:text-slate-300 print-only-text-black">Electronic Invoice</CardDescriptionUI>
                            </CardHeader>
                            <CardContent className="space-y-4 pt-4 dark:text-white print-only-text-black">
                                <div className="flex justify-between items-center">
                                    <div className="text-sm space-y-2">
                                        <p><strong>الاسم:</strong> {invoiceData.userName}</p>
                                        <p><strong>رقم العقد:</strong> {invoiceData.contractNumber}</p>
                                        <p><strong>البطاقة:</strong> {invoiceData.paymentCard}</p>
                                        <p><strong>رقم الهاتف:</strong> {'-'} </p>
                                    </div>
                                    <div className="p-1.5 bg-white rounded-md">
                                        <QRCode value={invoiceData.orderId} size={80} />
                                    </div>
                                </div>
                                <Separator className="my-2 bg-slate-500" />
                                <div className="text-center">
                                    <p className="text-sm">رقم الفاتورة</p>
                                    <p className="font-mono tracking-widest text-lg">{formattedInvoiceId}</p>
                                </div>
                            </CardContent>
                        </Card>
                     </div>

                    <div className="flex gap-2 w-full mt-4">
                        <Button className="flex-1" variant="outline" onClick={handlePrint}>
                            <Printer className="ml-2 h-4 w-4" />
                            طباعة
                        </Button>
                        <Button className="flex-1" onClick={resetAndClose}>إغلاق</Button>
                    </div>
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
                                <div className="mr-auto text-sm text-muted-foreground">الرصيد: {userData.wallet.balance.toFixed(2)} د.ل</div>
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
                        <span className="text-muted-foreground">المجموع الفرعي</span>
                        <span className="font-semibold">{totalAmount.toFixed(2)} دينار ليبي</span>
                    </div>
                     {discountAmount > 0 && (
                        <div className="flex justify-between text-green-500">
                            <span className="text-muted-foreground">الخصم</span>
                            <span className="font-semibold">- {discountAmount.toFixed(2)} دينار ليبي</span>
                        </div>
                    )}
                     <div className="flex justify-between text-base font-bold">
                        <span>المجموع النهائي</span>
                        <span>{(totalAmount - discountAmount).toFixed(2)} دينار ليبي</span>
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
  const firestore = useFirestore();
  const { toast } = useToast();
  const { items: cartItems, updateQuantity, removeItem, clearCart } = useCart();
  
  const [isCheckoutOpen, setCheckoutOpen] = useState(false);
  const [isClient, setIsClient] = useState(false);
  
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<Offer | null>(null);
  const [discountAmount, setDiscountAmount] = useState(0);
  const [isApplyingCoupon, setIsApplyingCoupon] = useState(false);

  // New state for offer badge
  const [newOfferCount, setNewOfferCount] = useState(0);
  const offersQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return query(
        collection(firestore, 'offers'), 
        where('status', '==', 'active')
    );
  }, [firestore, user]);
  const { data: allOffers } = useCollection<Offer>(offersQuery);

  useEffect(() => {
    if (typeof window !== 'undefined' && allOffers && user) {
        const viewedOffers = JSON.parse(localStorage.getItem('viewedOffers') || '{}');
        const userOffers = allOffers.filter(offer => offer.targetType === 'all' || offer.targetUserId === user.uid);
        const unreadCount = userOffers.filter(offer => !viewedOffers[offer.id]).length;
        setNewOfferCount(unreadCount);
    }
  }, [allOffers, user]);


  useEffect(() => {
    setIsClient(true);
  }, []);

  const totalCartItems = useMemo(() => cartItems.reduce((acc, item) => acc + item.quantity, 0), [cartItems]);
  const subtotal = useMemo(() => cartItems.reduce((acc, item) => acc + item.price * item.quantity, 0), [cartItems]);

  useEffect(() => {
    // Recalculate discount if cart changes
    if (appliedCoupon) {
      const itemInCart = cartItems.find(item => item.id === appliedCoupon.productId);
      if (itemInCart && appliedCoupon.discountPercentage) {
        const discount = (itemInCart.price * itemInCart.quantity) * (appliedCoupon.discountPercentage / 100);
        setDiscountAmount(discount);
      } else {
        // Coupon is no longer valid for the items in cart
        setAppliedCoupon(null);
        setDiscountAmount(0);
        setCouponCode('');
        toast({
            variant: "destructive",
            title: "تمت إزالة الكوبون",
            description: "المنتج المرتبط بالكوبون لم يعد في السلة.",
        });
      }
    }
  }, [cartItems, appliedCoupon, toast]);

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) {
        toast({ variant: 'destructive', title: "حقل فارغ", description: "الرجاء إدخال كود الخصم." });
        return;
    }
     if (!firestore) return;
    
    setIsApplyingCoupon(true);
    try {
        const offersRef = collection(firestore, 'offers');
        const q = query(offersRef, where("couponCode", "==", couponCode.trim()), where("type", "==", "discount_coupon"));
        const snapshot = await getDocs(q);

        if (snapshot.empty) {
            throw new Error("كود الخصم غير صالح.");
        }

        const couponDoc = snapshot.docs[0];
        const couponData = { id: couponDoc.id, ...couponDoc.data() } as Offer;

        if (couponData.isUsed) {
            throw new Error("هذا الكوبون تم استخدامه بالفعل.");
        }

        const itemInCart = cartItems.find(item => item.id === couponData.productId);
        if (!itemInCart) {
            throw new Error(`هذا الكوبون صالح فقط لمنتج "${couponData.productName}".`);
        }

        const discount = (itemInCart.price * itemInCart.quantity) * (couponData.discountPercentage! / 100);
        setDiscountAmount(discount);
        setAppliedCoupon(couponData);
        toast({ title: "تم تطبيق الخصم!", className: "bg-green-500 text-white" });

    } catch (error: any) {
        setDiscountAmount(0);
        setAppliedCoupon(null);
        toast({ variant: 'destructive', title: "فشل تطبيق الخصم", description: error.message });
    } finally {
        setIsApplyingCoupon(false);
    }
  }


  const handlePaymentSuccess = () => {
    setCheckoutOpen(false);
    clearCart();
    setAppliedCoupon(null);
    setDiscountAmount(0);
    setCouponCode('');
  };

  const finalTotal = subtotal - discountAmount;


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
                <Card>
                    <CardContent className="p-4">
                         <div className="flex gap-2">
                            <Input 
                                placeholder="أدخل كود الخصم" 
                                value={couponCode}
                                onChange={e => setCouponCode(e.target.value)}
                                disabled={!!appliedCoupon}
                            />
                            <Button onClick={handleApplyCoupon} disabled={isApplyingCoupon || !!appliedCoupon}>
                                {isApplyingCoupon ? <LoaderCircle className="animate-spin h-4 w-4"/> : (appliedCoupon ? <CheckCircle2 className="h-4 w-4"/> : 'تطبيق')}
                            </Button>
                         </div>
                         {appliedCoupon && <p className="text-green-500 text-xs mt-2">تم تطبيق كوبون "{appliedCoupon.couponCode}" بنجاح.</p>}
                    </CardContent>
                </Card>
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
                    {discountAmount > 0 && (
                        <div className="flex justify-between text-green-500">
                             <span>الخصم</span>
                            <span>- {discountAmount.toFixed(2)} دينار ليبي</span>
                        </div>
                    )}
                    <Separator />
                    <div className="flex justify-between text-base font-bold">
                        <span>المجموع النهائي</span>
                        <span>{finalTotal.toFixed(2)} دينار ليبي</span>
                    </div>
                </div>
                <Dialog open={isCheckoutOpen} onOpenChange={setCheckoutOpen}>
                    <DialogTrigger asChild>
                        <Button size="lg" className="mt-4 w-full text-lg" disabled={isUserLoading}>
                            إتمام الطلب
                        </Button>
                    </DialogTrigger>
                    {isCheckoutOpen && <CheckoutDialog cartItems={cartItems} totalAmount={subtotal} discountAmount={discountAmount} appliedCoupon={appliedCoupon} onPaymentSuccess={handlePaymentSuccess} />}
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
              className="flex flex-col items-center text-xs text-muted-foreground relative"
            >
              {newOfferCount > 0 && (
                <Badge variant="destructive" className="absolute -top-1 -right-2 h-4 w-4 justify-center p-0">{newOfferCount}</Badge>
              )}
              <BadgePercent className="mb-1 h-6 w-6" />
              العروض
            </a>
            <a
              href="/cart"
              className="flex flex-col items-center text-xs font-medium text-primary relative"
            >
              {totalCartItems > 0 && (
                <Badge className="absolute -top-1 -right-2 h-4 w-4 justify-center p-0">{totalCartItems}</Badge>
              )}
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

    