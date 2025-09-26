'use client';

import { useState, useEffect, useMemo } from 'react';
import AdminSubPageLayout from '../layout';
import { Button } from '@/components/ui/button';
import { MoreHorizontal, PlusCircle, LoaderCircle, Trash2, Edit, CalendarIcon } from 'lucide-react';
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
import { collection, doc, updateDoc, DocumentData, query, orderBy, getDoc } from 'firebase/firestore';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { v4 as uuidv4 } from 'uuid';


interface Subscription {
  id: string; // Using UUID for local identification in array
  planName: string;
  status: 'active' | 'cancelled' | 'expired';
  endDate: any; // Can be a Date object or Firestore Timestamp
  createdAt: any;
}

interface UserData extends DocumentData {
    id: string; // Firestore document ID
    displayName?: string;
    subscriptions?: Subscription[];
}


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

    const [planName, setPlanName] = useState(subscription?.planName || '');
    const [status, setStatus] = useState<'active' | 'cancelled' | 'expired'>(subscription?.status || 'active');
    
    // Safely convert Firestore Timestamp to Date for the Calendar component
    const initialDate = useMemo(() => {
        if (!subscription?.endDate) return undefined;
        // Firestore timestamps have a toDate() method
        if (typeof subscription.endDate.toDate === 'function') {
            return subscription.endDate.toDate();
        }
        // If it's already a Date object
        if (subscription.endDate instanceof Date) {
            return subscription.endDate;
        }
        // Fallback for string or number representations if necessary
        const d = new Date(subscription.endDate);
        return isNaN(d.getTime()) ? undefined : d;
    }, [subscription?.endDate]);

    const [endDate, setEndDate] = useState<Date | undefined>(initialDate);
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async () => {
        if (!planName || !endDate || !firestore) {
            toast({ variant: 'destructive', title: "بيانات ناقصة", description: "الرجاء ملء جميع الحقول." });
            return;
        }
        setIsLoading(true);

        const userDocRef = doc(firestore, 'users', user.id);

        try {
            // We get the latest user data to avoid race conditions
            const userDoc = await getDoc(userDocRef);
            const currentData = userDoc.data() as UserData;
            const currentSubscriptions = currentData.subscriptions || [];
            let updatedSubscriptions: any[];

            if (subscription) { // Editing existing subscription
                updatedSubscriptions = currentSubscriptions.map(sub => 
                    sub.id === subscription.id 
                    ? { ...sub, planName, status, endDate } 
                    : sub
                );
            } else { // Adding new subscription
                const newSubscription = {
                    id: uuidv4(),
                    planName,
                    status,
                    endDate,
                    createdAt: new Date(),
                };
                updatedSubscriptions = [...currentSubscriptions, newSubscription];
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
    
    return (
         <DialogContent dir="rtl" className="sm:max-w-[425px]">
            <DialogHeader>
                <DialogTitle>{subscription ? `تعديل اشتراك لـ ${user.displayName}` : `إضافة اشتراك لـ ${user.displayName}`}</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
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
            manualRefresh(); // Manually trigger a re-fetch of the collection
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

    const getSafeDate = (endDate: any) => {
        if (!endDate) return null;
        if (typeof endDate.toDate === 'function') {
          return endDate.toDate();
        }
        const d = new Date(endDate);
        return isNaN(d.getTime()) ? null : d;
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
                                                    const formattedDate = getSafeDate(sub.endDate);
                                                    return (
                                                        <div key={sub.id} className="flex items-center justify-between gap-4 p-2 rounded-md bg-muted/50">
                                                            <div>
                                                                <p className="font-semibold">{sub.planName}</p>
                                                                <p className="text-xs text-muted-foreground">
                                                                    ينتهي في: {formattedDate ? format(formattedDate, 'PPP') : 'تاريخ غير صالح'}
                                                                </p>
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
                             <span className="font-bold"> {itemToDelete.subscription.planName} </span> 
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
