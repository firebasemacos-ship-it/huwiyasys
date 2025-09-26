
'use client';

import { Button } from '@/components/ui/button';
import { Home, Search, ShoppingCart, Ticket, Wallet as WalletIcon, ArrowLeft, XCircle } from 'lucide-react';
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy, DocumentData } from 'firebase/firestore';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';

interface Subscription extends DocumentData {
  id: string;
  planName: string;
  status: 'active' | 'cancelled' | 'expired';
  endDate: any;
  createdAt: any;
}


export default function SubscriptionsPage() {
    const { user, isUserLoading } = useUser();
    const firestore = useFirestore();

    const subscriptionsQuery = useMemoFirebase(() => {
        if (!firestore || !user) return null;
        // Correctly query the subcollection for the current user
        return query(
            collection(firestore, 'users', user.uid, 'userSubscriptions'), 
            orderBy('createdAt', 'desc')
        );
    }, [firestore, user]);

    const { data: subscriptions, isLoading, error } = useCollection<Subscription>(subscriptionsQuery);
    
    const getStatusVariant = (status: Subscription['status']) => {
        switch (status) {
            case 'active': return 'default';
            case 'expired': return 'secondary';
            case 'cancelled': return 'destructive';
            default: return 'outline';
        }
    }
    const getStatusText = (status: Subscription['status']) => {
        switch (status) {
            case 'active': return 'نشط';
            case 'expired': return 'منتهي';
            case 'cancelled': return 'ملغي';
            default: return status;
        }
    }

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
            {isUserLoading || isLoading ? (
                <div className="space-y-4">
                    {Array.from({ length: 3 }).map((_, i) => (
                        <Card key={i} className="overflow-hidden rounded-xl">
                            <CardContent className="p-4 space-y-3">
                                <div className="flex justify-between items-center">
                                    <Skeleton className="h-6 w-1/2" />
                                    <Skeleton className="h-6 w-1/4" />
                                </div>
                                <Skeleton className="h-4 w-1/3" />
                            </CardContent>
                        </Card>
                    ))}
                </div>
            ) : error ? (
                 <div className="flex flex-col items-center justify-center gap-4 py-12 text-center h-full">
                    <XCircle className="h-20 w-20 text-destructive" />
                    <h2 className="text-xl font-semibold">حدث خطأ في الصلاحيات</h2>
                    <p className="text-muted-foreground max-w-sm">لا يمكنك الوصول إلى هذه البيانات. الرجاء مراجعة قواعد الأمان في Firestore.</p>
                </div>
            ) : subscriptions && subscriptions.length > 0 ? (
                 <div className="space-y-4">
                    {subscriptions.map(sub => (
                        <Card key={sub.id} className="overflow-hidden rounded-xl bg-card/80">
                            <CardContent className="p-4">
                                <div className="flex justify-between items-start">
                                    <div className="space-y-1">
                                        <h3 className="font-bold text-lg">{sub.planName}</h3>
                                        <p className="text-sm text-muted-foreground">
                                            ينتهي في: {sub.endDate?.toDate().toLocaleDateString('ar-LY') || 'غير محدد'}
                                        </p>
                                    </div>
                                    <Badge variant={getStatusVariant(sub.status)} className="text-sm">
                                        {getStatusText(sub.status)}
                                    </Badge>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            ) : (
                <div className="flex flex-col items-center justify-center gap-4 py-12 text-center h-full">
                    <Ticket className="h-20 w-20 text-muted-foreground" />
                    <h2 className="text-xl font-semibold">لا توجد لديك اشتراكات</h2>
                    <p className="text-muted-foreground">اكتشف العروض والخدمات للاشتراك بها.</p>
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
