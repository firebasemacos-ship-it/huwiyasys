'use client';

import { useState, useEffect } from 'react';
import AdminSubPageLayout from '../layout';
import { Button } from '@/components/ui/button';
import { MoreHorizontal, CheckCircle, XCircle, PlusCircle, LoaderCircle, Trash2, Edit, CalendarIcon } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuItem,
} from '@/components/ui/dropdown-menu';
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
import { collection, doc, updateDoc, deleteDoc, addDoc, serverTimestamp, DocumentData, query, orderBy } from 'firebase/firestore';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

interface Subscription extends DocumentData {
  id: string;
  userId: string;
  userName: string;
  planName: string;
  status: 'active' | 'cancelled' | 'expired';
  endDate: any;
  createdAt: any;
}

interface UserData {
    id: string;
    displayName?: string;
}

function SubscriptionDialog({ subscription, users, onSave, onClose }: { subscription?: Subscription | null, users: UserData[], onSave: () => void, onClose: () => void }) {
    const firestore = useFirestore();
    const { toast } = useToast();

    const [userId, setUserId] = useState(subscription?.userId || '');
    const [planName, setPlanName] = useState(subscription?.planName || '');
    const [status, setStatus] = useState<'active' | 'cancelled' | 'expired'>(subscription?.status || 'active');
    const [endDate, setEndDate] = useState<Date | undefined>(subscription?.endDate?.toDate());
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async () => {
        const selectedUser = users.find(u => u.id === userId);
        if (!userId || !planName || !endDate || !firestore || !selectedUser) {
            toast({ variant: 'destructive', title: "بيانات ناقصة", description: "الرجاء ملء جميع الحقول." });
            return;
        }
        setIsLoading(true);

        const subscriptionData = {
            userId,
            userName: selectedUser.displayName,
            planName,
            status,
            endDate,
            updatedAt: serverTimestamp(),
        };

        try {
            if (subscription) {
                await updateDoc(doc(firestore, 'subscriptions', subscription.id), subscriptionData);
                toast({ title: "تم تحديث الاشتراك بنجاح" });
            } else {
                await addDoc(collection(firestore, 'subscriptions'), { 
                    ...subscriptionData, 
                    createdAt: serverTimestamp() 
                });
                toast({ title: "تمت إضافة الاشتراك بنجاح" });
            }
            onSave();
            onClose();
        } catch (error: any) {
            console.error("Error saving subscription: ", error);
            toast({ variant: 'destructive', title: "خطأ", description: error.message });
        } finally {
            setIsLoading(false);
        }
    };
    
    return (
         <DialogContent dir="rtl" className="sm:max-w-[425px]">
            <DialogHeader>
                <DialogTitle>{subscription ? 'تعديل الاشتراك' : 'إضافة اشتراك جديد'}</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
                <div className="space-y-2">
                    <Label htmlFor="user">المستخدم</Label>
                    <Select value={userId} onValueChange={setUserId} disabled={!!subscription}>
                        <SelectTrigger id="user">
                            <SelectValue placeholder="اختر مستخدم" />
                        </SelectTrigger>
                        <SelectContent>
                            {users.map(user => (
                                <SelectItem key={user.id} value={user.id}>{user.displayName}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
                 <div className="space-y-2">
                    <Label htmlFor="plan-name">اسم الخطة</Label>
                    <Input id="plan-name" value={planName} onChange={(e) => setPlanName(e.target.value)} />
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
                <div className="space-y-2">
                    <Label htmlFor="end-date">تاريخ الانتهاء</Label>
                    <Popover>
                        <PopoverTrigger asChild>
                        <Button
                            variant={"outline"}
                            className={cn(
                                "w-full justify-start text-left font-normal",
                                !endDate && "text-muted-foreground"
                            )}
                        >
                            <CalendarIcon className="ml-2 h-4 w-4" />
                            {endDate ? format(endDate, "PPP", ) : <span>اختر تاريخًا</span>}
                        </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                            <Calendar
                                mode="single"
                                selected={endDate}
                                onSelect={setEndDate}
                                initialFocus
                            />
                        </PopoverContent>
                    </Popover>
                </div>
            </div>
            <DialogFooter>
                <Button onClick={onClose} variant="outline">إلغاء</Button>
                <Button onClick={handleSubmit} disabled={isLoading}>
                    {isLoading ? <LoaderCircle className="ml-2 h-4 w-4 animate-spin" /> : (subscription ? 'حفظ التغييرات' : 'إضافة اشتراك')}
                </Button>
            </DialogFooter>
        </DialogContent>
    );
}

export default function SubscriptionsPage() {
    const firestore = useFirestore();
    const { toast } = useToast();

    // Dialog states
    const [isSubDialogOpen, setSubDialogOpen] = useState(false);
    const [isDeleteDialogOpen, setDeleteDialogOpen] = useState(false);

    // Data states
    const [selectedSubscription, setSelectedSubscription] = useState<Subscription | null>(null);
    const [subscriptionToDelete, setSubscriptionToDelete] = useState<Subscription | null>(null);

    // Firestore data hooks
    const subscriptionsQuery = useMemoFirebase(() => firestore ? query(collection(firestore, 'subscriptions'), orderBy('createdAt', 'desc')) : null, [firestore]);
    const { data: subscriptions, isLoading, error } = useCollection<Subscription>(subscriptionsQuery);

    const usersQuery = useMemoFirebase(() => firestore ? query(collection(firestore, 'users'), orderBy('displayName')) : null, [firestore]);
    const { data: users, isLoading: isLoadingUsers } = useCollection<UserData>(usersQuery);

    useEffect(() => {
        if (error) {
            toast({ variant: 'destructive', title: 'فشل تحميل الاشتراكات', description: 'يرجى مراجعة قواعد الأمان في Firestore.' });
        }
    }, [error, toast]);

    const updateSubscriptionStatus = async (subscriptionId: string, status: Subscription['status']) => {
        if (!firestore) return;
        const subscriptionRef = doc(firestore, 'subscriptions', subscriptionId);
        try {
            await updateDoc(subscriptionRef, { status });
            toast({ title: 'تم تحديث حالة الاشتراك بنجاح' });
        } catch (err) {
            console.error("Error updating subscription status:", err);
            toast({ variant: 'destructive', title: 'فشل تحديث الحالة', description: (err as Error).message });
        }
    };
    
    // Handlers
    const handleAddSubscription = () => {
        setSelectedSubscription(null);
        setSubDialogOpen(true);
    };
    const handleEditSubscription = (subscription: Subscription) => {
        setSelectedSubscription(subscription);
        setSubDialogOpen(true);
    };
    const confirmDelete = (subscription: Subscription) => {
        setSubscriptionToDelete(subscription);
        setDeleteDialogOpen(true);
    };
     const handleDelete = async () => {
        if (!subscriptionToDelete || !firestore) return;
        
        try {
            await deleteDoc(doc(firestore, 'subscriptions', subscriptionToDelete.id));
            toast({ title: `تم حذف الاشتراك بنجاح` });
            setDeleteDialogOpen(false);
            setSubscriptionToDelete(null);
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
    <AdminSubPageLayout title="إدارة الاشتراكات">
        <Card>
            <CardHeader className="flex-row items-center justify-between">
                 <div>
                    <CardTitle>قائمة الاشتراكات</CardTitle>
                    <CardDescription>عرض وإدارة اشتراكات المستخدمين.</CardDescription>
                </div>
                <Button size="sm" className="h-8 gap-1" onClick={handleAddSubscription} disabled={isLoadingUsers}>
                    <PlusCircle className="h-3.5 w-3.5" />
                    <span>إضافة اشتراك</span>
                </Button>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>المشترك</TableHead>
                            <TableHead>الخطة</TableHead>
                            <TableHead>الحالة</TableHead>
                            <TableHead>تاريخ الانتهاء</TableHead>
                            <TableHead><span className="sr-only">الإجراءات</span></TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            <TableRow><TableCell colSpan={5} className="h-24 text-center">جاري تحميل الاشتراكات...</TableCell></TableRow>
                        ) : subscriptions?.length ? (
                            subscriptions.map((sub) => (
                                <TableRow key={sub.id}>
                                    <TableCell className="font-medium">{sub.userName}</TableCell>
                                    <TableCell>{sub.planName}</TableCell>
                                    <TableCell>
                                        <Badge variant={getStatusVariant(sub.status)}>
                                            {getStatusText(sub.status)}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>{sub.endDate?.toDate().toLocaleDateString('ar-LY')}</TableCell>
                                    <TableCell className="text-left">
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button aria-haspopup="true" size="icon" variant="ghost">
                                                    <MoreHorizontal className="h-4 w-4" />
                                                    <span className="sr-only">Toggle menu</span>
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end" dir="rtl">
                                                <DropdownMenuLabel>الإجراءات</DropdownMenuLabel>
                                                <DropdownMenuItem onSelect={() => handleEditSubscription(sub)} disabled={isLoadingUsers}>تعديل</DropdownMenuItem>
                                                <DropdownMenuItem onSelect={() => confirmDelete(sub)} className="text-destructive">حذف</DropdownMenuItem>
                                                <DropdownMenuLabel>تغيير الحالة السريع</DropdownMenuLabel>
                                                <DropdownMenuItem onSelect={() => updateSubscriptionStatus(sub.id, 'active')}>
                                                    <CheckCircle className="ml-2 h-4 w-4" />
                                                    <span>تنشيط</span>
                                                </DropdownMenuItem>
                                                <DropdownMenuItem onSelect={() => updateSubscriptionStatus(sub.id, 'cancelled')} className="text-destructive">
                                                    <XCircle className="ml-2 h-4 w-4" />
                                                    <span>إلغاء</span>
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </TableCell>
                                </TableRow>
                            ))
                        ) : (
                            <TableRow><TableCell colSpan={5} className="h-24 text-center">لا توجد اشتراكات لعرضها.</TableCell></TableRow>
                        )}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>

        <Dialog open={isSubDialogOpen} onOpenChange={setSubDialogOpen}>
           {isSubDialogOpen && <SubscriptionDialog subscription={selectedSubscription} users={users || []} onSave={() => {}} onClose={() => setSubDialogOpen(false)} />}
        </Dialog>

        <AlertDialog open={isDeleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
            <AlertDialogContent dir="rtl">
                <AlertDialogHeader>
                    <AlertDialogTitle>هل أنت متأكد؟</AlertDialogTitle>
                    <AlertDialogDescription>
                        هذا الإجراء لا يمكن التراجع عنه. سيؤدي هذا إلى حذف الاشتراك نهائيًا.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel onClick={() => setSubscriptionToDelete(null)}>إلغاء</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90">
                        نعم، قم بالحذف
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>

    </AdminSubPageLayout>
  );
}
