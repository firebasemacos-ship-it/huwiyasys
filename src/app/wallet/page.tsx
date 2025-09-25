'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Home, MoreHorizontal, Search, ShoppingCart, Wallet as WalletIcon, ArrowLeft, CreditCard, Gift, PlusCircle, LoaderCircle, CheckCircle2, Wifi, ArrowUpCircle, ArrowDownCircle, BadgeHelp } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { Logo } from '@/components/icons';
import { useUser, useFirestore, useDoc, useMemoFirebase, useCollection } from '@/firebase';
import { doc, updateDoc, arrayUnion, collection, addDoc, serverTimestamp, query, orderBy, getDocs, where } from 'firebase/firestore';
import { Skeleton } from '@/components/ui/skeleton';
import { CardLinkRequestHandler } from '@/components/CardLinkRequestHandler';
import { useDebounce } from 'use-debounce';

type Wallet = {
    balance: number;
    cardNumber: string;
    cvv: string;
    expiryDate: string;
    ownerName?: string;
}

type UserProfile = {
    displayName: string;
    wallet: Wallet;
    linkedWallets?: Wallet[];
}

type Transaction = {
    id: string;
    type: string;
    amount: number;
    date: any; // Firestore timestamp
    description?: string;
}

function AddCardDialog({ onClose }: { onClose: () => void }) {
    const firestore = useFirestore();
    const { user: currentUser, isUserLoading } = useUser();
    const { toast } = useToast();

    const [cardNumber, setCardNumber] = useState('');
    const [debouncedCardNumber] = useDebounce(cardNumber, 500);

    const [foundUser, setFoundUser] = useState<{ id: string, data: UserProfile } | null>(null);
    const [isSearching, setIsSearching] = useState(false);
    const [requestStatus, setRequestStatus] = useState<'idle' | 'sending' | 'sent'>('idle');

    useEffect(() => {
        const findUser = async () => {
            if (!debouncedCardNumber || debouncedCardNumber.length < 16 || !firestore) {
                setFoundUser(null);
                return;
            }
            setIsSearching(true);
            try {
                const usersRef = collection(firestore, 'users');
                const q = query(usersRef, where("wallet.cardNumber", "==", debouncedCardNumber));
                const querySnapshot = await getDocs(q);

                if (!querySnapshot.empty) {
                    const userDoc = querySnapshot.docs[0];
                    if (userDoc.id === currentUser?.uid) {
                         toast({ title: "لا يمكن إضافة بطاقتك الخاصة", variant: 'destructive' });
                         setFoundUser(null);
                    } else {
                        setFoundUser({ id: userDoc.id, data: userDoc.data() as UserProfile });
                    }
                } else {
                    setFoundUser(null);
                }
            } catch (error) {
                console.error("Error searching for user:", error);
            } finally {
                setIsSearching(false);
            }
        };

        findUser();
    }, [debouncedCardNumber, firestore, currentUser?.uid, toast]);

    const handleSendRequest = async () => {
        if (!foundUser || !currentUser || !firestore) return;
        
        setRequestStatus('sending');
        try {
            const requestsRef = collection(firestore, 'cardLinkRequests');
            await addDoc(requestsRef, {
                requesterId: currentUser.uid,
                requesterName: currentUser.displayName,
                ownerId: foundUser.id,
                ownerName: foundUser.data.displayName,
                cardNumber: foundUser.data.wallet.cardNumber,
                status: 'pending',
                createdAt: serverTimestamp()
            });
            setRequestStatus('sent');
        } catch (error) {
             console.error("Error sending link request:", error);
             toast({ variant: 'destructive', title: 'فشل إرسال الطلب', description: 'حدث خطأ غير متوقع.' });
             setRequestStatus('idle');
        }
    };

    if (requestStatus === 'sent') {
        return (
            <DialogContent dir="rtl">
                <div className="flex flex-col items-center justify-center gap-4 py-12 text-center">
                    <CheckCircle2 className="h-16 w-16 text-green-500" />
                    <DialogTitle className="text-2xl">تم إرسال الطلب بنجاح</DialogTitle>
                    <DialogDescription>تم إرسال طلب إلى {foundUser?.data.displayName}. سيتم إشعارك عند موافقته.</DialogDescription>
                    <Button className="mt-4" onClick={onClose}>إغلاق</Button>
                </div>
            </DialogContent>
        )
    }

    return (
        <DialogContent dir="rtl">
            <DialogHeader>
                <DialogTitle>إضافة بطاقة جديدة</DialogTitle>
                <DialogDescription>أدخل رقم بطاقة مستخدم آخر لطلب ربطها بحسابك.</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
                <div className="space-y-2">
                    <Label htmlFor="new-card-number">رقم البطاقة</Label>
                    <Input id="new-card-number" placeholder="XXXX XXXX XXXX XXXX" value={cardNumber} onChange={e => setCardNumber(e.target.value)} />
                </div>
                
                {isSearching && <div className="flex items-center gap-2 text-sm text-muted-foreground"><LoaderCircle className="h-4 w-4 animate-spin" /><span>جاري البحث...</span></div>}

                {foundUser && !isSearching && (
                    <Card className="bg-muted/50">
                        <CardContent className="p-4">
                             <p className="text-sm font-semibold">صاحب البطاقة</p>
                             <p>{foundUser.data.displayName}</p>
                        </CardContent>
                    </Card>
                )}
                {!foundUser && !isSearching && cardNumber.length >= 16 && (
                    <p className="text-sm text-destructive">لم يتم العثور على مستخدم بهذه البطاقة.</p>
                )}
            </div>
            <DialogFooter>
                <Button onClick={handleSendRequest} disabled={!foundUser || isUserLoading || requestStatus === 'sending'} className="w-full">
                    {requestStatus === 'sending' ? <LoaderCircle className="ml-2 h-4 w-4 animate-spin" /> : <PlusCircle className="ml-2 h-4 w-4" />}
                    {requestStatus === 'sending' ? 'جاري الإرسال...' : 'إرسال طلب ربط'}
                </Button>
            </DialogFooter>
        </DialogContent>
    );
}

export default function WalletPage() {
  const { toast } = useToast();
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();

  const userDocRef = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return doc(firestore, 'users', user.uid);
  }, [firestore, user]);

  const transactionsQuery = useMemoFirebase(() => {
      if (!firestore || !user) return null;
      return query(collection(firestore, 'users', user.uid, 'transactions'), orderBy('date', 'desc'));
  }, [firestore, user]);

  const { data: userData, isLoading: isUserDataLoading } = useDoc<UserProfile>(userDocRef);
  const { data: transactions, isLoading: areTransactionsLoading } = useCollection<Transaction>(transactionsQuery);


  const [isRechargeDialogOpen, setRechargeDialogOpen] = useState(false);
  const [isAddCardDialogOpen, setAddCardDialogOpen] = useState(false);

  const [rechargeCode, setRechargeCode] = useState('');
  const [rechargeStatus, setRechargeStatus] = useState('idle'); // idle, verifying, charging, success

  const [displayBalance, setDisplayBalance] = useState(0);
  const [isCardFlipped, setIsCardFlipped] = useState(false);

  const currentBalance = userData?.wallet?.balance ?? 0;
  const animationFrameId = useRef<number | null>(null);

  useEffect(() => {
    const startBalance = displayBalance;
    const endBalance = currentBalance;
    
    // No need to animate if the balance is the same
    if (Math.abs(endBalance - startBalance) < 0.01) {
        if(displayBalance !== endBalance) setDisplayBalance(endBalance);
        return;
    }

    const duration = 1000; // 1 second animation
    let startTime: number | null = null;

    const animate = (timestamp: number) => {
        if (!startTime) startTime = timestamp;
        const progress = timestamp - startTime;
        const percentage = Math.min(progress / duration, 1);
        
        const newDisplayBalance = startBalance + (endBalance - startBalance) * percentage;
        setDisplayBalance(newDisplayBalance);

        if (progress < duration) {
            animationFrameId.current = requestAnimationFrame(animate);
        }
    };

    animationFrameId.current = requestAnimationFrame(animate);

    return () => {
        if (animationFrameId.current) {
            cancelAnimationFrame(animationFrameId.current);
        }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentBalance]); 


  const handleRecharge = async () => {
    if (!rechargeCode.trim()) {
        toast({ variant: "destructive", title: "خطأ", description: "الرجاء إدخال رمز كرت التعبئة." });
        return;
    }
    if (!userDocRef || !userData || !firestore || !user) return;
    
    setRechargeStatus('verifying');

    // Simulate network delay and verification
    await new Promise(resolve => setTimeout(resolve, 1500));
    setRechargeStatus('charging');
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    const rechargeAmount = 100.00; // Assume code is for 100 LYD for now
    const newBalance = (userData.wallet?.balance ?? 0) + rechargeAmount;

    try {
        // Update balance
        await updateDoc(userDocRef, { 'wallet.balance': newBalance });
        
        // Create transaction record
        const transactionsColRef = collection(firestore, 'users', user.uid, 'transactions');
        await addDoc(transactionsColRef, {
            type: 'شحن رصيد',
            amount: rechargeAmount,
            date: serverTimestamp(),
            description: `شحن باستخدام كرت ${rechargeCode.slice(0,4)}...`
        });

        setRechargeStatus('success');
        await new Promise(resolve => setTimeout(resolve, 1500));

        setRechargeDialogOpen(false);
        toast({
            title: "تم الشحن بنجاح",
            description: `تمت إضافة ${rechargeAmount.toFixed(2)} دينار ليبي إلى محفظتك.`,
        });
        
        setTimeout(() => {
            setRechargeStatus('idle');
            setRechargeCode('');
        }, 500);

    } catch (error) {
        console.error("Failed to update balance or create transaction:", error);
        toast({ variant: "destructive", title: "فشل الشحن", description: "حدث خطأ أثناء تحديث الرصيد." });
        setRechargeStatus('idle');
    }
  }

  const { Icon, message } = useMemo(() => {
      switch (rechargeStatus) {
          case 'verifying':
              return { Icon: () => <LoaderCircle className="h-16 w-16 animate-spin text-primary" />, message: 'جاري التحقق من كرت التعبئة...' };
          case 'charging':
              return { Icon: () => <LoaderCircle className="h-16 w-16 animate-spin text-primary" />, message: 'جاري شحن المحفظة...' };
          case 'success':
              return { Icon: () => <CheckCircle2 className="h-16 w-16 text-green-500" />, message: 'تمت إضافة الرصيد بنجاح!' };
          default:
              return { Icon: () => <Gift className="h-16 w-16 text-muted-foreground" />, message: 'أدخل رمز كرت التعبئة لشحن محفظتك.' };
      }
  }, [rechargeStatus]);
  
  const formatCardNumber = (num: string | undefined) => {
    if (!num) return '5432 1098 7654 3456';
    return num.replace(/(.{4})/g, '$1 ').trim();
  }
  
  const formatDate = (timestamp: any) => {
    if (!timestamp) return '';
    // Firestore Timestamps can be converted to JS Date objects
    const date = timestamp.toDate();
    return date.toLocaleDateString('ar-LY', { year: 'numeric', month: 'long', day: 'numeric' });
  }

  const getTransactionIcon = (type: string) => {
      if (type.includes('شراء')) {
        return <ShoppingCart className="h-6 w-6 text-primary" />;
      }
      if (type.includes('شحن')) {
        return <ArrowUpCircle className="h-6 w-6 text-green-500" />;
      }
      if (type.includes('إيداع')) {
        return <ArrowUpCircle className="h-6 w-6 text-green-500" />;
      }
       if (type.includes('سحب')) {
        return <ArrowDownCircle className="h-6 w-6 text-red-500" />;
      }
      return <BadgeHelp className="h-6 w-6 text-muted-foreground" />;
  }


  return (
    <div className="bg-background text-foreground" dir="rtl">
      <CardLinkRequestHandler />
      <div className="flex min-h-screen flex-col">
        <header className="sticky top-0 z-40 flex w-full items-center justify-between border-b bg-background/95 p-4 backdrop-blur">
          <h1 className="text-xl font-bold">المحفظة</h1>
          <Button variant="ghost" size="icon" onClick={() => window.history.back()}>
            <ArrowLeft className="h-6 w-6" />
          </Button>
        </header>

        <main className="flex-1 overflow-y-auto bg-muted/20 p-4 pb-24">
            {isUserLoading || isUserDataLoading ? (
                 <div className="mx-auto max-w-sm">
                    <Skeleton className="w-full aspect-[1.586] rounded-xl" />
                 </div>
            ) : (
                <div className="mb-6 mx-auto max-w-sm" style={{ perspective: '1000px' }}>
                    <div 
                        className={cn("relative w-full aspect-[1.586] transition-transform duration-700")}
                        style={{ transformStyle: 'preserve-3d', transform: isCardFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)' }}
                        onClick={() => setIsCardFlipped(!isCardFlipped)}
                    >
                        {/* Card Front */}
                        <div className="absolute w-full h-full" style={{ backfaceVisibility: 'hidden' }}>
                            <Card className="relative h-full w-full overflow-hidden rounded-xl bg-primary text-primary-foreground shadow-lg">
                                <CardContent className="flex h-full flex-col justify-between p-6">
                                    <div className="flex items-start justify-between">
                                        <div className="flex items-center gap-2 pointer-events-none">
                                            <Logo className="h-8 w-8 text-primary-foreground" />
                                            <span className="text-lg font-bold">{userData?.displayName || 'المستخدم'}</span>
                                        </div>
                                        <Wifi className="h-6 w-6 -rotate-90 opacity-70" />
                                    </div>
                                    <div className="text-left">
                                        <p className="font-mono text-xl tracking-widest">
                                            {formatCardNumber(userData?.wallet?.cardNumber)}
                                        </p>
                                    </div>
                                    <div className="flex items-end justify-between">
                                        <div>
                                            <p className="text-sm opacity-80">الرصيد الحالي</p>
                                            <p className="text-3xl font-bold leading-tight">{displayBalance.toFixed(2)}</p>
                                            <p className="text-sm font-medium opacity-90">دينار ليبي</p>
                                        </div>
                                        <p className="text-sm font-semibold">{userData?.wallet?.expiryDate || '08/30'}</p>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Card Back */}
                        <div className="absolute w-full h-full" style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}>
                            <Card className="relative h-full w-full overflow-hidden rounded-xl bg-primary text-primary-foreground shadow-lg">
                                <div className="h-full flex flex-col justify-between p-4">
                                    <div className="h-12 bg-black mt-4"></div>
                                    <div className="flex justify-end items-center gap-4 px-4 py-2 bg-slate-200 rounded-md">
                                        <p className="font-mono text-lg text-black italic">{userData?.wallet?.cvv || '123'}</p>
                                        <p className="text-sm text-slate-600 flex-1 text-right">CVV</p>
                                    </div>
                                    <div className="text-xs opacity-70 text-left p-2">
                                        <p>انقر للعودة</p>
                                    </div>
                                </div>
                            </Card>
                        </div>
                    </div>
                </div>
            )}
          
          <Dialog open={isRechargeDialogOpen} onOpenChange={(isOpen) => {
              if (!isOpen) {
                setTimeout(() => {
                    setRechargeStatus('idle');
                    setRechargeCode('');
                }, 500);
              }
              setRechargeDialogOpen(isOpen);
          }}>
            <DialogTrigger asChild>
                <Button size="lg" className="w-full" disabled={isUserLoading || isUserDataLoading}>
                    <PlusCircle className="ml-2 h-5 w-5" />
                    شحن الرصيد
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md" dir="rtl">
                <DialogHeader className="text-center">
                    <DialogTitle className="text-2xl">شحن الرصيد</DialogTitle>
                </DialogHeader>
                <div className="flex flex-col items-center justify-center gap-4 py-6 text-center">
                    <div className="flex h-32 w-32 items-center justify-center">
                       <Icon />
                    </div>
                    <p className="min-h-[40px] text-muted-foreground">{message}</p>
                </div>

                <div className={cn("grid gap-4", rechargeStatus !== 'idle' && 'opacity-0 h-0 invisible')}>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="recharge-code" className="text-right">
                            رمز الكرت
                        </Label>
                        <Input
                            id="recharge-code"
                            placeholder="XXXX-XXXX-XXXX-XXXX"
                            className="col-span-3"
                            value={rechargeCode}
                            onChange={(e) => setRechargeCode(e.target.value)}
                            disabled={rechargeStatus !== 'idle'}
                        />
                    </div>
                </div>
                <DialogFooter>
                    <Button type="submit" className="w-full" onClick={handleRecharge} disabled={rechargeStatus !== 'idle'}>
                       {rechargeStatus === 'idle' ? <PlusCircle className="ml-2 h-4 w-4" /> : <LoaderCircle className="ml-2 h-4 w-4 animate-spin" />}
                       {rechargeStatus === 'idle' ? 'شحن' : 'جاري الشحن...'}
                    </Button>
                </DialogFooter>
            </DialogContent>
          </Dialog>

          <div className="my-6 grid grid-cols-2 gap-4">
            <Dialog open={isAddCardDialogOpen} onOpenChange={setAddCardDialogOpen}>
                <DialogTrigger asChild>
                    <Card className="overflow-hidden rounded-xl cursor-pointer hover:bg-muted/50 transition-colors">
                        <CardContent className="flex flex-col items-center justify-center p-4 text-center">
                            <CreditCard className="mb-2 h-8 w-8 text-primary" />
                            <p className="text-sm font-semibold">طرق الدفع</p>
                        </CardContent>
                    </Card>
                </DialogTrigger>
                {isAddCardDialogOpen && <AddCardDialog onClose={() => setAddCardDialogOpen(false)} />}
            </Dialog>

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
                {areTransactionsLoading ? (
                     <div className="space-y-2 p-6">
                        {Array.from({ length: 3 }).map((_, i) => (
                           <div key={i} className="flex items-center gap-4 py-3">
                                <Skeleton className="h-10 w-10 rounded-full" />
                                <div className='space-y-2 flex-1'>
                                    <Skeleton className="h-5 w-24" />
                                    <Skeleton className="h-4 w-32" />
                                </div>
                                <Skeleton className="h-6 w-28" />
                            </div>
                        ))}
                    </div>
                ) : transactions && transactions.length > 0 ? (
                    <div className="space-y-0">
                        {transactions.map((transaction, index) => (
                        <div key={transaction.id}>
                            <div className="flex items-center gap-4 px-6 py-4">
                                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
                                    {getTransactionIcon(transaction.type)}
                                </div>
                                <div className="flex-1">
                                    <p className="font-semibold">{transaction.description || transaction.type}</p>
                                    <p className="text-sm text-muted-foreground">{formatDate(transaction.date)}</p>
                                </div>
                                <p className={cn(
                                    "font-bold text-lg",
                                    transaction.amount >= 0 ? 'text-green-500' : 'text-destructive'
                                )}>
                                    {transaction.amount >= 0 ? '+' : ''}{transaction.amount.toFixed(2)}
                                    <span className="text-sm font-normal"> د.ل</span>
                                </p>
                            </div>
                            {index < transactions.length - 1 && <Separator />}
                        </div>
                        ))}
                    </div>
                ) : (
                    <div className="p-6 text-center text-muted-foreground">
                        لا توجد معاملات لعرضها.
                    </div>
                )}
            </CardContent>
          </Card>
        </main>

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
              className="flex flex-col items-center text-xs text-muted-foreground"
            >
              <ShoppingCart className="mb-1 h-6 w-6" />
              السلة
            </a>
            <a
              href="/wallet"
              className="flex flex-col items-center text-xs font-medium text-primary"
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
