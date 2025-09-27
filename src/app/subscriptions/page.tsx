

'use client';

import { useMemo, useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Home, BadgePercent, ShoppingCart, Ticket, Wallet as WalletIcon, ArrowLeft, XCircle, Globe, Palette, Package, CalendarDays, Server, Star, Hourglass, ShoppingBag, Trash2 } from 'lucide-react';
import { useUser, useFirestore, useDoc, useMemoFirebase, useCollection } from '@/firebase';
import { doc, DocumentData, collection, query, where } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { format, isValid } from 'date-fns';
import { useCart } from '@/hooks/use-cart';

// Consistent Subscription Types from admin page
type SubscriptionCategory = 'domain' | 'design' | 'sales_system' | 'order';

interface BaseSubscription {
  id: string;
  category: SubscriptionCategory;
  status: 'active' | 'cancelled' | 'expired' | 'reviewing';
  createdAt: any;
}

interface DomainSubscription extends BaseSubscription {
  category: 'domain';
  domainName: string;
  provider: string;
  planType: string;
  startDate: any;
  endDate: any;
}

interface DesignSubscription extends BaseSubscription {
  category: 'design';
  projectName: string;
  planType: string;
  endDate: any;
}

interface SalesSystemSubscription extends BaseSubscription {
  category: 'sales_system';
  systemName: string;
  planType: string;
  endDate: any;
}

interface OrderSubscription extends BaseSubscription {
    category: 'order';
    orderName: string;
    orderId: string;
    totalAmount: number;
    itemCount: number;
}


type Subscription = DomainSubscription | DesignSubscription | SalesSystemSubscription | OrderSubscription;


interface UserProfile extends DocumentData {
    id: string;
    displayName?: string;
    subscriptions?: Subscription[];
}

interface Offer extends DocumentData {
  id: string;
  targetType: 'all' | 'specific_user';
  targetUserId?: string;
};

// Helper to safely convert Firestore Timestamps or other date formats to a Date object.
const safeToDate = (date: any): Date | undefined => {
    if (!date) return undefined;
    if (typeof date.toDate === 'function') { // Firestore Timestamp
        return date.toDate();
    }
    if (date instanceof Date) { // Already a Date object
        return date;
    }
    try { // String or number
        const d = new Date(date);
        return isValid(d) ? d : undefined;
    } catch {
        return undefined;
    }
};

const SubscriptionDetail = ({ label, value, icon }: { label: string, value: string | number | undefined, icon: React.ReactNode }) => {
    if (!value) return null;
    return (
        <div className="flex items-center gap-3 text-sm">
            <div className="text-muted-foreground">{icon}</div>
            <div className="text-muted-foreground">{label}:</div>
            <div className="font-medium text-foreground">{value}</div>
        </div>
    )
}

export default function SubscriptionsPage() {
    const { user, isUserLoading } = useUser();
    const firestore = useFirestore();
    const { items: cartItems } = useCart();


    const userDocRef = useMemoFirebase(() => {
        if (!firestore || !user) return null;
        return doc(firestore, 'users', user.uid);
    }, [firestore, user]);

    const { data: userData, isLoading, error } = useDoc<UserProfile>(userDocRef);

      // New state for offer badge
    const [newOfferCount, setNewOfferCount] = useState(0);
    const offersQuery = useMemoFirebase(() => {
        if (!firestore || !user) return null;
        return query(collection(firestore, 'offers'), where('status', '==', 'active'));
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
    
    // Sort subscriptions by creation date, descending.
    const subscriptions = useMemo(() => {
        if (!userData?.subscriptions) return [];
        return [...userData.subscriptions].sort((a, b) => {
            const dateA = safeToDate(a.createdAt) || new Date(0);
            const dateB = safeToDate(b.createdAt) || new Date(0);
            return dateB.getTime() - dateA.getTime();
        });
    }, [userData?.subscriptions]);

    const totalCartItems = useMemo(() => cartItems.reduce((acc, item) => acc + item.quantity, 0), [cartItems]);


    const handleCancelRequest = (subscriptionId: string) => {
        // TODO: Implement the logic to update the subscription status to 'cancelled' in Firestore.
        // This will likely involve updating the user's document.
        console.log("Cancelling request for subscription ID:", subscriptionId);
    };

    const getStatusVariant = (status: Subscription['status']) => {
        switch (status) {
            case 'active': return 'default';
            case 'reviewing': return 'secondary';
            case 'expired': return 'secondary';
            case 'cancelled': return 'destructive';
            default: return 'outline';
        }
    }
    const getStatusText = (status: Subscription['status']) => {
        switch (status) {
            case 'active': return 'نشط';
            case 'reviewing': return 'قيد المراجعة';
            case 'expired': return 'منتهي';
            case 'cancelled': return 'ملغي';
            default: return status;
        }
    }

    const getCategoryDetails = (sub: Subscription) => {
        const endDate = safeToDate((sub as any).endDate);
        const formattedEndDate = endDate ? format(endDate, 'PPP') : undefined;

        switch(sub.category) {
            case 'order':
                 return {
                    title: sub.orderName,
                    icon: <ShoppingBag className="h-6 w-6 text-green-400" />,
                    cardClassName: "bg-green-500/10 border-green-500/30",
                    details: (
                        <>
                            <SubscriptionDetail label="عدد المنتجات" value={sub.itemCount} icon={<Package className="w-4 h-4"/>} />
                            <SubscriptionDetail label="المبلغ الإجمالي" value={`${sub.totalAmount.toFixed(2)} د.ل`} icon={<WalletIcon className="w-4 h-4"/>} />
                        </>
                    )
                }
            case 'domain':
                const startDate = safeToDate(sub.startDate);
                return {
                    title: sub.domainName,
                    icon: <Globe className="h-6 w-6 text-primary" />,
                    cardClassName: "border-primary/20",
                    details: (
                        <>
                            <SubscriptionDetail label="الشركة" value={sub.provider} icon={<Server className="w-4 h-4"/>} />
                            <SubscriptionDetail label="الباقة" value={sub.planType} icon={<Star className="w-4 h-4"/>} />
                            <SubscriptionDetail label="تاريخ البدء" value={startDate ? format(startDate, 'PPP') : undefined} icon={<CalendarDays className="w-4 h-4"/>} />
                            <SubscriptionDetail label="تاريخ الانتهاء" value={formattedEndDate} icon={<CalendarDays className="w-4 h-4"/>} />
                        </>
                    )
                }
            case 'design':
                return {
                    title: sub.projectName,
                    icon: <Palette className="h-6 w-6 text-primary" />,
                     cardClassName: "border-primary/20",
                    details: (
                        <>
                            <SubscriptionDetail label="الباقة" value={sub.planType} icon={<Star className="w-4 h-4"/>} />
                             <SubscriptionDetail label="تاريخ الانتهاء" value={formattedEndDate} icon={<CalendarDays className="w-4 h-4"/>} />
                        </>
                    )
                }
            case 'sales_system':
                return {
                    title: sub.systemName,
                    icon: <Package className="h-6 w-6 text-primary" />,
                     cardClassName: "border-primary/20",
                    details: (
                         <>
                            <SubscriptionDetail label="الباقة" value={sub.planType} icon={<Star className="w-4 h-4"/>} />
                            <SubscriptionDetail label="تاريخ الانتهاء" value={formattedEndDate} icon={<CalendarDays className="w-4 h-4"/>} />
                        </>
                    )
                }
            default:
                const unhandledSub = sub as any;
                return {
                    title: unhandledSub.planName || 'اشتراك غير معروف',
                    icon: <Ticket className="h-6 w-6 text-primary" />,
                     cardClassName: "border-primary/20",
                    details: <SubscriptionDetail label="تاريخ الانتهاء" value={formattedEndDate} icon={<CalendarDays className="w-4 h-4"/>} />
                }
        }
    }


  return (
    <div className="dark bg-background text-foreground" dir="rtl">
      <div className="flex min-h-screen flex-col">
        <header className="sticky top-0 z-40 flex w-full items-center justify-between border-b bg-background/30 p-4 backdrop-blur-lg">
          <h1 className="text-xl font-bold">اشتراكاتي وطلباتي</h1>
          <Button variant="ghost" size="icon" onClick={() => window.history.back()}>
            <ArrowLeft className="h-6 w-6" />
          </Button>
        </header>

        <main className="flex-1 overflow-y-auto p-4 pb-24">
            {isUserLoading || isLoading ? (
                <div className="space-y-4">
                    {Array.from({ length: 3 }).map((_, i) => (
                        <Card key={i} className="overflow-hidden rounded-xl">
                            <CardHeader><Skeleton className="h-6 w-1/2" /></CardHeader>
                            <CardContent className="p-4 space-y-3">
                                <Skeleton className="h-4 w-3/4" />
                                <Skeleton className="h-4 w-1/2" />
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
                    {subscriptions.map(sub => {
                       const { title, icon, details, cardClassName } = getCategoryDetails(sub);
                       return (
                        <Card key={sub.id} className={`overflow-hidden rounded-xl bg-gradient-to-br from-card/80 to-card/60 transition-all hover:shadow-primary/10 hover:shadow-lg ${cardClassName}`}>
                            <CardHeader>
                                <div className="flex justify-between items-start">
                                    <div className="flex items-center gap-3">
                                        {icon}
                                        <CardTitle className="text-lg font-bold">{title}</CardTitle>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        {sub.status === 'active' && (
                                            <span className="relative flex h-3 w-3">
                                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                                                <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
                                            </span>
                                        )}
                                        {sub.status === 'reviewing' && (
                                            <Hourglass className="h-4 w-4 animate-spin text-yellow-400" />
                                        )}
                                        <Badge variant={getStatusVariant(sub.status)} className="text-sm shrink-0">
                                            {getStatusText(sub.status)}
                                        </Badge>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-3 pt-2">
                               {details}
                               {sub.status === 'reviewing' && (
                                   <div className="flex justify-end pt-2">
                                       <Button variant="destructive" size="sm" onClick={() => handleCancelRequest(sub.id)}>
                                            <Trash2 className="ml-2 h-4 w-4" />
                                            إلغاء الطلب
                                       </Button>
                                   </div>
                               )}
                            </CardContent>
                        </Card>
                       )
                    })}
                </div>
            ) : (
                <div className="flex flex-col items-center justify-center gap-4 py-12 text-center h-full">
                    <Ticket className="h-20 w-20 text-muted-foreground" />
                    <h2 className="text-xl font-semibold">لا توجد لديك اشتراكات أو طلبات</h2>
                    <p className="text-muted-foreground">اكتشف العروض والخدمات للاشتراك بها أو قم بطلب جديد.</p>
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
              className="flex flex-col items-center text-xs text-muted-foreground relative"
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
              <WalletIcon className="mb-1 h-6 w-6" />
              محفظتي
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

    
