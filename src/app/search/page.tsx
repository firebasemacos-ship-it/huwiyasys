
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Home, Ticket, BadgePercent, ShoppingCart, Wallet, LoaderCircle, Gift, Copy, CheckCircle2 } from 'lucide-react';
import { useFirestore, useCollection, useMemoFirebase, useUser } from '@/firebase';
import { collection, query, where, DocumentData, doc, updateDoc, arrayUnion, runTransaction, serverTimestamp, increment } from 'firebase/firestore';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';


interface Offer extends DocumentData {
  id: string;
  title: string;
  type: 'cash_gift' | 'discount_coupon';
  status: 'active' | 'inactive';
  // cash_gift specific
  amount?: number;
  redeemedBy?: string[];
  // discount_coupon specific
  productName?: string;
  discountPercentage?: number;
  couponCode?: string;
}

export default function OffersPage() {
    const firestore = useFirestore();
    const { user } = useUser();
    const { toast } = useToast();

    const [redeemingStates, setRedeemingStates] = useState<Record<string, boolean>>({});

    const offersQuery = useMemoFirebase(() => {
        if (!firestore) return null;
        return query(collection(firestore, 'offers'), where('status', '==', 'active'));
    }, [firestore]);

    const { data: offers, isLoading } = useCollection<Offer>(offersQuery);

    const handleRedeemGift = async (offer: Offer) => {
        if (!user || !firestore || offer.type !== 'cash_gift') return;

        setRedeemingStates(prev => ({ ...prev, [offer.id]: true }));

        try {
            await runTransaction(firestore, async (transaction) => {
                const offerRef = doc(firestore, 'offers', offer.id);
                const userRef = doc(firestore, 'users', user.uid);

                const offerDoc = await transaction.get(offerRef);
                if (!offerDoc.exists()) throw new Error("لم يعد العرض متاحاً.");
                
                const offerData = offerDoc.data() as Offer;
                if (offerData.redeemedBy?.includes(user.uid)) {
                    throw new Error("لقد قمت باسترداد هذه الهدية من قبل.");
                }

                transaction.update(userRef, { "wallet.balance": increment(offerData.amount!) });
                transaction.update(offerRef, { redeemedBy: arrayUnion(user.uid) });
                
                const userTransactionRef = doc(collection(userRef, 'transactions'));
                transaction.set(userTransactionRef, {
                    type: 'هدية',
                    amount: offerData.amount,
                    date: serverTimestamp(),
                    description: `هدية: ${offerData.title}`
                });
            });

            toast({
                title: "تم استرداد الهدية!",
                description: `تمت إضافة ${offer.amount} د.ل إلى رصيدك.`,
                className: 'bg-green-500 text-white'
            });

        } catch (error: any) {
             toast({ variant: 'destructive', title: "فشل استرداد الهدية", description: error.message });
        } finally {
            setRedeemingStates(prev => ({ ...prev, [offer.id]: false }));
        }
    };

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        toast({ title: 'تم نسخ الكوبون!', description: 'يمكنك الآن استخدامه في صفحة الدفع.' });
    };

    const isRedeemed = (offer: Offer) => {
        if (!user || offer.type !== 'cash_gift') return false;
        return offer.redeemedBy?.includes(user.uid) || false;
    }

  return (
    <div className="dark bg-background text-foreground" dir="rtl">
      <div className="flex min-h-screen flex-col">
        <header className="sticky top-0 z-40 flex w-full items-center justify-between border-b bg-background/30 p-4 backdrop-blur-lg">
           <h1 className="text-xl font-bold">العروض</h1>
        </header>

        <main className="flex-1 overflow-y-auto p-4 pb-24">
            {isLoading ? (
                <div className="space-y-4">
                    <Skeleton className="h-32 w-full rounded-xl" />
                    <Skeleton className="h-32 w-full rounded-xl" />
                    <Skeleton className="h-32 w-full rounded-xl" />
                </div>
            ) : offers && offers.length > 0 ? (
                <div className="space-y-4">
                    {offers.map(offer => (
                        <Card key={offer.id} className="bg-card/50 border-primary/20">
                            <CardHeader className="flex-row items-start justify-between gap-4">
                                <div>
                                    <CardTitle>{offer.title}</CardTitle>
                                    {offer.type === 'discount_coupon' && (
                                        <CardDescription>خصم {offer.discountPercentage}% على {offer.productName}</CardDescription>
                                    )}
                                </div>
                                <div className="p-3 rounded-full bg-primary/10 text-primary">
                                    {offer.type === 'cash_gift' ? <Gift className="h-6 w-6"/> : <Ticket className="h-6 w-6"/>}
                                </div>
                            </CardHeader>
                            <CardContent>
                                {offer.type === 'cash_gift' && (
                                    <div className="flex items-center justify-between">
                                        <p className="text-2xl font-bold text-primary">{offer.amount} د.ل</p>
                                        {isRedeemed(offer) ? (
                                            <Button variant="secondary" disabled>
                                                <CheckCircle2 className="ml-2 h-4 w-4"/>
                                                تم الاسترداد
                                            </Button>
                                        ) : (
                                            <Button onClick={() => handleRedeemGift(offer)} disabled={redeemingStates[offer.id]}>
                                                {redeemingStates[offer.id] ? <LoaderCircle className="ml-2 h-4 w-4 animate-spin"/> : 'استرداد الهدية'}
                                            </Button>
                                        )}
                                    </div>
                                )}
                                {offer.type === 'discount_coupon' && (
                                    <div className="flex items-center justify-between gap-2 rounded-lg bg-muted p-3">
                                        <p className="font-mono text-lg font-bold text-primary">{offer.couponCode}</p>
                                        <Button size="sm" onClick={() => copyToClipboard(offer.couponCode!)}>
                                            <Copy className="ml-2 h-4 w-4"/>
                                            نسخ الكوبون
                                        </Button>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    ))}
                </div>
            ) : (
              <div className="text-center flex flex-col items-center justify-center h-full">
                <BadgePercent className="mb-4 h-20 w-20 text-muted-foreground" />
                <h2 className="text-lg font-semibold">لا توجد عروض متاحة حالياً</h2>
                <p className="text-muted-foreground">تحقق مرة أخرى قريباً!</p>
              </div>
            )}
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

    