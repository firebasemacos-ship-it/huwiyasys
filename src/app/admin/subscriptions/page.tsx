'use client';

import { useState, useEffect, useMemo } from 'react';
import AdminSubPageLayout from '../layout';
import { Button } from '@/components/ui/button';
import { MoreHorizontal, PlusCircle, LoaderCircle, Trash2, Edit, CalendarIcon } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { useToast } from '@/hooks/use-toast';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, doc, updateDoc, DocumentData, query, orderBy, getDoc } from 'firebase/firestore';
import { cn } from '@/lib/utils';
import { format, isValid } from 'date-fns';
import { v4 as uuidv4 } from 'uuid';


type SubscriptionCategory = 'domain' | 'design' | 'sales_system';

interface BaseSubscription {
  id: string;
  category: SubscriptionCategory;
  status: 'active' | 'cancelled' | 'expired';
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

type Subscription = DomainSubscription | DesignSubscription | SalesSystemSubscription;


interface UserData extends DocumentData {
    id: string; // Firestore document ID
    displayName?: string;
    subscriptions?: Subscription[];
}

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

function SubscriptionDialog({ 
    user, 
    subscription, 
    onSave, 
    onClose 
}: { 
    user: UserData, 
    subscription?: Subscription | null, 
    onSave: () => void, 
    onClose: () => void 
}) {
    const firestore = useFirestore();
    const { toast } = useToast();

    const [category, setCategory] = useState<SubscriptionCategory | ''>(subscription?.category || '');

    // Common fields
    const [status, setStatus] = useState<'active' | 'cancelled' | 'expired'>(subscription?.status || 'active');
    
    // Domain fields
    const [domainName, setDomainName] = useState(subscription?.category === 'domain' ? subscription.domainName : '');
    const [provider, setProvider] = useState(subscription?.category === 'domain' ? subscription.provider : '');
    const [domainPlan, setDomainPlan] = useState(subscription?.category === 'domain' ? subscription.planType : '');
    const [startDate, setStartDate] = useState<Date | undefined>(subscription?.category === 'domain' ? safeToDate(subscription.startDate) : undefined);
    
    // Design fields
    const [projectName, setProjectName] = useState(subscription?.category === 'design' ? subscription.projectName : '');
    const [designPlan, setDesignPlan] = useState(subscription?.category === 'design' ? subscription.planType : '');
    
    // Sales System fields
    const [systemName, setSystemName] = useState(subscription?.category === 'sales_system' ? subscription.systemName : '');
    const [salesPlan, setSalesPlan] = useState(subscription?.category === 'sales_system' ? subscription.planType : '');

    // Common endDate for all types (except maybe domain which has start/end)
    const [endDate, setEndDate] = useState<Date | undefined>(safeToDate(subscription?.endDate));

    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async () => {
        if (!category || !firestore) {
            toast({ variant: 'destructive', title: "بيانات ناقصة", description: "الرجاء اختيار فئة الاشتراك." });
            return;
        }
        setIsLoading(true);

        const userDocRef = doc(firestore, 'users', user.id);
        
        let newSubscriptionData: Omit<Subscription, 'id' | 'createdAt'> | null = null;
        
        if (category === 'domain') {
            if (!domainName || !provider || !domainPlan || !startDate || !endDate) {
                 toast({ variant: 'destructive', title: "بيانات ناقصة", description: "الرجاء ملء جميع حقول الدومين." });
                 setIsLoading(false);
                 return;
            }
            newSubscriptionData = { category, status, domainName, provider, planType: domainPlan, startDate, endDate };
        } else if (category === 'design') {
            if (!projectName || !designPlan || !endDate) {
                toast({ variant: 'destructive', title: "بيانات ناقصة", description: "الرجاء ملء جميع حقول التصميم." });
                setIsLoading(false);
                return;
            }
            newSubscriptionData = { category, status, projectName, planType: designPlan, endDate };
        } else if (category === 'sales_system') {
            if (!systemName || !salesPlan || !endDate) {
                toast({ variant: 'destructive', title: "بيانات ناقصة", description: "الرجاء ملء جميع حقول نظام المبيعات." });
                setIsLoading(false);
                return;
            }
            newSubscriptionData = { category, status, systemName, planType: salesPlan, endDate };
        }

        try {
            const userDoc = await getDoc(userDocRef);
            const currentData = userDoc.data() as UserData;
            const currentSubscriptions = currentData.subscriptions || [];
            let updatedSubscriptions: Subscription[];

            if (subscription && newSubscriptionData) { // Editing
                updatedSubscriptions = currentSubscriptions.map(sub => 
                    sub.id === subscription.id 
                    ? { ...sub, ...newSubscriptionData } 
                    : sub
                );
            } else if (newSubscriptionData) { // Adding
                const finalNewSub = {
                    ...newSubscriptionData,
                    id: uuidv4(),
                    createdAt: new Date(),
                } as Subscription;
                updatedSubscriptions = [...currentSubscriptions, finalNewSub];
            } else {
                throw new Error("بيانات الاشتراك غير صالحة.");
            }
            
            await updateDoc(userDocRef, { subscriptions: updatedSubscriptions });
            
            toast({ title: subscription ? "تم تحديث الاشتراك بنجاح" : "تمت إضافة الاشتراك بنجاح" });
            onSave();
            onClose();

        } catch (error: any) {
            console.error("Error saving subscription: ", error);
            toast({ variant: 'destructive', title: "خطأ", description: error.message });
        } finally {
            setIsLoading(false);
        }
    };

    const renderCategoryFields = () => {
        switch (category) {
            case 'domain':
                return (
                    <>
                        <div className="space-y-2">
                            <Label htmlFor="domain-name">اسم الدومين</Label>
                            <Input id="domain-name" value={domainName} onChange={(e) => setDomainName(e.target.value)} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="provider">الشركة المقدمة للخدمة</Label>
                            <Input id="provider" value={provider} onChange={(e) => setProvider(e.target.value)} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="domain-plan">نوع الباقة</Label>
                            <Input id="domain-plan" value={domainPlan} onChange={(e) => setDomainPlan(e.target.value)} />
                        </div>
                         <div className="space-y-2">
                            <Label>تاريخ الاشتراك</Label>
                            <Popover>
                                <PopoverTrigger asChild>
                                <Button variant={"outline"} className={cn("w-full justify-start text-left font-normal", !startDate && "text-muted-foreground")}>
                                    <CalendarIcon className="ml-2 h-4 w-4" />
                                    {startDate ? format(startDate, "PPP") : <span>اختر تاريخًا</span>}
                                </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0"><Calendar mode="single" selected={startDate} onSelect={setStartDate} initialFocus/></PopoverContent>
                            </Popover>
                        </div>
                    </>
                );
            case 'design':
                return (
                    <>
                        <div className="space-y-2">
                            <Label htmlFor="project-name">اسم المشروع</Label>
                            <Input id="project-name" value={projectName} onChange={(e) => setProjectName(e.target.value)} />
                        </div>
                         <div className="space-y-2">
                            <Label htmlFor="design-plan">نوع الباقة</Label>
                            <Input id="design-plan" value={designPlan} onChange={(e) => setDesignPlan(e.target.value)} />
                        </div>
                    </>
                );
            case 'sales_system':
                 return (
                    <>
                        <div className="space-y-2">
                            <Label htmlFor="system-name">اسم النظام</Label>
                            <Input id="system-name" value={systemName} onChange={(e) => setSystemName(e.target.value)} />
                        </div>
                         <div className="space-y-2">
                            <Label htmlFor="sales-plan">نوع الباقة</Label>
                            <Input id="sales-plan" value={salesPlan} onChange={(e) => setSalesPlan(e.target.value)} />
                        </div>
                    </>
                );
            default:
                return null;
        }
    }
    
    return (
         <DialogContent dir="rtl" className="sm:max-w-md">
            <DialogHeader>
                <DialogTitle>{subscription ? `تعديل اشتراك لـ ${user.displayName}` : `إضافة اشتراك لـ ${user.displayName}`}</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
                 <div className="space-y-2">
                    <Label htmlFor="category">فئة الاشتراك</Label>
                    <Select value={category} onValueChange={(val) => setCategory(val as SubscriptionCategory)} disabled={!!subscription}>
                        <SelectTrigger id="category">
                            <SelectValue placeholder="اختر فئة" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="domain">دومين</SelectItem>
                            <SelectItem value="design">تصميم</SelectItem>
                            <SelectItem value="sales_system">نظام مبيعات</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                {category && (
                    <>
                        {renderCategoryFields()}

                        <div className="space-y-2">
                            <Label>تاريخ الانتهاء</Label>
                            <Popover>
                                <PopoverTrigger asChild>
                                <Button variant={"outline"} className={cn("w-full justify-start text-left font-normal", !endDate && "text-muted-foreground")}>
                                    <CalendarIcon className="ml-2 h-4 w-4" />
                                    {endDate ? format(endDate, "PPP") : <span>اختر تاريخًا</span>}
                                </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0"><Calendar mode="single" selected={endDate} onSelect={setEndDate} initialFocus/></PopoverContent>
                            </Popover>
                        </div>
                        
                        <div className="space-y-2">
                            <Label htmlFor="status">الحالة</Label>
                            <Select value={status} onValueChange={(val) => setStatus(val as 'active' | 'cancelled' | 'expired')}>
                                <SelectTrigger id="status">
                                    <SelectValue placeholder="اختر الحالة" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="active">نشط</SelectItem>
                                    <SelectItem value="cancelled">ملغي</SelectItem>
                                    <SelectItem value="expired">منتهي</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </>
                )}
            </div>
            <DialogFooter>
                <Button onClick={onClose} variant="outline">إلغاء</Button>
                <Button onClick={handleSubmit} disabled={isLoading || !category}>
                    {isLoading ? <LoaderCircle className="ml-2 h-4 w-4 animate-spin" /> : (subscription ? 'حفظ التغييرات' : 'إضافة اشتراك')}
                </Button>
            </DialogFooter>
        </DialogContent>
    );
}

export default function SubscriptionsPage() {
    const firestore = useFirestore();
    const { toast } = useToast();

    const [isSubDialogOpen, setSubDialogOpen] = useState(false);
    const [isDeleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [selectedUser, setSelectedUser] = useState<UserData | null>(null);
    const [selectedSubscription, setSelectedSubscription] = useState<Subscription | null>(null);
    const [itemToDelete, setItemToDelete] = useState<{ user: UserData, subscription: Subscription } | null>(null);

    const usersQuery = useMemoFirebase(() => firestore ? query(collection(firestore, 'users'), orderBy('displayName')) : null, [firestore]);
    const { data: users, isLoading, error, manualRefresh } = useCollection<UserData>(usersQuery);

    useEffect(() => {
        if (error) {
            toast({ variant: 'destructive', title: 'فشل تحميل المستخدمين', description: error.message });
        }
    }, [error, toast]);

    const handleAddSubscription = (user: UserData) => {
        setSelectedUser(user);
        setSelectedSubscription(null);
        setSubDialogOpen(true);
    };

    const handleEditSubscription = (user: UserData, subscription: Subscription) => {
        setSelectedUser(user);
        setSelectedSubscription(subscription);
        setSubDialogOpen(true);
    };

    const confirmDelete = (user: UserData, subscription: Subscription) => {
        setItemToDelete({ user, subscription });
        setDeleteDialogOpen(true);
    };

    const handleDelete = async () => {
        if (!itemToDelete || !firestore) return;
        
        const { user, subscription } = itemToDelete;
        const userDocRef = doc(firestore, 'users', user.id);

        try {
            const updatedSubscriptions = user.subscriptions?.filter(sub => sub.id !== subscription.id) || [];
            await updateDoc(userDocRef, { subscriptions: updatedSubscriptions });

            toast({ title: `تم حذف الاشتراك بنجاح` });
            setDeleteDialogOpen(false);
            setItemToDelete(null);
            manualRefresh();
        } catch (error: any) {
            toast({ variant: 'destructive', title: "فشل الحذف", description: error.message });
        }
    };
    
    const getStatusVariant = (status: Subscription['status']) => {
        switch (status) {
            case 'active': return 'default';
            case 'expired': return 'secondary';
            case 'cancelled': return 'destructive';
            default: return 'outline';
        }
    };
    const getStatusText = (status: Subscription['status']) => {
        switch (status) {
            case 'active': return 'نشط';
            case 'expired': return 'منتهي';
            case 'cancelled': return 'ملغي';
            default: return status;
        }
    };

    const getSubscriptionTitle = (sub: Subscription) => {
        switch(sub.category) {
            case 'domain': return sub.domainName;
            case 'design': return sub.projectName;
            case 'sales_system': return sub.systemName;
            default: return 'اشتراك غير معروف';
        }
    }
    
    const getCategoryText = (category: SubscriptionCategory) => {
        switch(category) {
            case 'domain': return 'دومين';
            case 'design': return 'تصميم';
            case 'sales_system': return 'نظام مبيعات';
            default: return 'غير معروف';
        }
    }

  return (
    <AdminSubPageLayout title="إدارة الاشتراكات">
        <Card>
            <CardHeader>
                <CardTitle>قائمة اشتراكات المستخدمين</CardTitle>
                <CardDescription>عرض وإدارة اشتراكات المستخدمين.</CardDescription>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>المشترك</TableHead>
                            <TableHead>الاشتراكات</TableHead>
                            <TableHead><span className="sr-only">الإجراءات</span></TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            <TableRow><TableCell colSpan={3} className="h-24 text-center">جاري تحميل المستخدمين...</TableCell></TableRow>
                        ) : users?.length ? (
                            users.map((user) => (
                                <TableRow key={user.id}>
                                    <TableCell className="font-medium align-top py-4">{user.displayName}</TableCell>
                                    <TableCell className="align-top py-4">
                                        {user.subscriptions && user.subscriptions.length > 0 ? (
                                            <div className="flex flex-col gap-2">
                                                {user.subscriptions.map(sub => {
                                                    const formattedDate = safeToDate(sub.endDate);
                                                    return (
                                                        <div key={sub.id} className="flex items-center justify-between gap-4 p-2 rounded-md bg-muted/50">
                                                            <div>
                                                                <p className="font-semibold">{getSubscriptionTitle(sub)}</p>
                                                                <div className="text-xs text-muted-foreground flex items-center gap-2">
                                                                   <Badge variant="outline" className="text-xs">{getCategoryText(sub.category)}</Badge>
                                                                   <span>
                                                                     ينتهي في: {formattedDate ? format(formattedDate, 'PPP') : 'تاريخ غير صالح'}
                                                                   </span>
                                                                </div>
                                                            </div>
                                                            <div className="flex items-center gap-2">
                                                                <Badge variant={getStatusVariant(sub.status)}>
                                                                    {getStatusText(sub.status)}
                                                                </Badge>
                                                                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleEditSubscription(user, sub)}>
                                                                    <Edit className="h-4 w-4" />
                                                                </Button>
                                                                 <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => confirmDelete(user, sub)}>
                                                                    <Trash2 className="h-4 w-4" />
                                                                </Button>
                                                            </div>
                                                        </div>
                                                    )
                                                })}
                                            </div>
                                        ) : (
                                            <p className="text-muted-foreground py-2">لا توجد اشتراكات.</p>
                                        )}
                                    </TableCell>
                                     <TableCell className="align-top py-4">
                                        <Button size="sm" onClick={() => handleAddSubscription(user)}>
                                            <PlusCircle className="h-4 w-4 ml-2" />
                                            إضافة
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))
                        ) : (
                            <TableRow><TableCell colSpan={3} className="h-24 text-center">لا يوجد مستخدمون لعرضهم.</TableCell></TableRow>
                        )}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>

        {isSubDialogOpen && selectedUser && (
            <Dialog open={isSubDialogOpen} onOpenChange={setSubDialogOpen}>
                <SubscriptionDialog 
                    user={selectedUser} 
                    subscription={selectedSubscription} 
                    onSave={manualRefresh} 
                    onClose={() => setSubDialogOpen(false)} 
                />
            </Dialog>
        )}

        {itemToDelete && (
            <AlertDialog open={isDeleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <AlertDialogContent dir="rtl">
                    <AlertDialogHeader>
                        <AlertDialogTitle>هل أنت متأكد؟</AlertDialogTitle>
                        <AlertDialogDescription>
                            هذا الإجراء لا يمكن التراجع عنه. سيؤدي هذا إلى حذف اشتراك
                             <span className="font-bold"> {getSubscriptionTitle(itemToDelete.subscription)} </span> 
                             الخاص بالمستخدم
                             <span className="font-bold"> {itemToDelete.user.displayName} </span>
                             نهائيًا.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel onClick={() => setItemToDelete(null)}>إلغاء</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90">
                            نعم، قم بالحذف
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        )}
    </AdminSubPageLayout>
  );
}
