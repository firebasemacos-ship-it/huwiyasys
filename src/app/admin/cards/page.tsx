
'use client';

import { useState, useEffect, useMemo } from 'react';
import AdminSubPageLayout from '../layout';
import { Button } from '@/components/ui/button';
import { MoreHorizontal, LoaderCircle, Search, ListFilter, Trash2 } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
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
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuItem,
  DropdownMenuCheckboxItem,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useFirestore, useUser } from '@/firebase';
import { collection, getDocs, doc, updateDoc, deleteDoc, DocumentData, addDoc, serverTimestamp } from 'firebase/firestore';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';


type Wallet = {
    balance: number;
    cardNumber: string;
    cvv: string;
    expiryDate: string;
    status: 'active' | 'suspended';
}

type UserData = {
    id: string;
    displayName?: string;
    contractNumber?: string;
    tempPassword?: string;
    wallet?: Wallet;
};

function CardManagementDialog({ user, onUserUpdate, onClose }: { user: UserData; onUserUpdate: (updatedUser: UserData) => void, onClose: () => void }) {
    const { toast } = useToast();
    const firestore = useFirestore();
    const [amount, setAmount] = useState(0);
    const [isLoading, setIsLoading] = useState(false);
    const { user: adminUser } = useUser();

    if (!user.wallet || !firestore) return null;

    const createTransaction = async (type: string, transactionAmount: number, description: string) => {
        if (!firestore || !user) return;
        const transactionsColRef = collection(firestore, 'users', user.id, 'transactions');
        await addDoc(transactionsColRef, {
            type: type,
            amount: transactionAmount,
            date: serverTimestamp(),
            description: description,
        });
    };

    const handleUpdate = async (updateData: Partial<UserData['wallet']>, transactionDetails?: { type: string, amount: number, description: string }) => {
        if (isLoading) return;
        setIsLoading(true);
        try {
            const userDocRef = doc(firestore, 'users', user.id);
            const newWalletState = { ...user.wallet, ...updateData };
            await updateDoc(userDocRef, { wallet: newWalletState });
            
            if (transactionDetails) {
                await createTransaction(transactionDetails.type, transactionDetails.amount, transactionDetails.description);
            }

            const updatedUser = { ...user, wallet: newWalletState };
            onUserUpdate(updatedUser);

            toast({ title: 'نجاح', description: 'تم تحديث بيانات البطاقة.' });
             if (updateData.balance !== undefined) {
               setAmount(0); // Reset amount after transaction
            }
        } catch (error: any) {
            toast({ variant: 'destructive', title: 'خطأ', description: error.message });
        } finally {
            setIsLoading(false);
        }
    };
    
    const handleDeposit = () => {
      if(amount > 0) {
        handleUpdate(
            { balance: user.wallet!.balance + Number(amount) },
            { type: 'إيداع إداري', amount: Number(amount), description: `إيداع من قبل المدير ${adminUser?.email}` }
        );
      }
    }

    const handleWithdraw = () => {
      if(amount > 0 && user.wallet!.balance >= amount) {
        handleUpdate(
            { balance: user.wallet!.balance - Number(amount) },
            { type: 'سحب إداري', amount: -Number(amount), description: `سحب من قبل المدير ${adminUser?.email}` }
        );
      } else {
        toast({ variant: 'destructive', title: 'خطأ', description: 'المبلغ المطلوب للسحب أكبر من الرصيد المتاح.' });
      }
    }
    const handleToggleStatus = () => {
        const newStatus = user.wallet!.status === 'active' ? 'suspended' : 'active';
        const description = `تم ${newStatus === 'active' ? 'تفعيل' : 'تعليق'} البطاقة من قبل المدير`;
        handleUpdate(
            { status: newStatus },
            { type: 'تغيير حالة البطاقة', amount: 0, description: description }
        );
    }

    return (
        <DialogContent dir="rtl" onInteractOutside={(e) => e.preventDefault()}>
            <DialogHeader>
                <DialogTitle>إدارة بطاقة: {user.displayName}</DialogTitle>
                <DialogDescription>
                    رقم البطاقة: <span className="font-mono">{user.wallet.cardNumber}</span>
                    <br />
                    الرصيد الحالي: <span className="font-bold">{user.wallet.balance.toFixed(2)} د.ل</span>
                     <Badge variant={user.wallet.status === 'active' ? 'default' : 'destructive'} className="mr-2">
                        {user.wallet.status === 'active' ? 'نشطة' : 'معلقة'}
                    </Badge>
                </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                    <Label className="text-right">المبلغ</Label>
                    <Input value={amount} onChange={(e) => setAmount(Number(e.target.value))} type="number" className="col-span-3" />
                </div>
                <div className="flex gap-2">
                    <Button onClick={handleDeposit} disabled={isLoading} className="flex-1">
                        {isLoading ? <LoaderCircle className="animate-spin" /> : 'إيداع'}
                    </Button>
                    <Button onClick={handleWithdraw} disabled={isLoading} variant="secondary" className="flex-1">
                        {isLoading ? <LoaderCircle className="animate-spin" /> : 'سحب'}
                    </Button>
                </div>
            </div>
            <DialogFooter className="sm:justify-between gap-2">
                 <Button onClick={handleToggleStatus} disabled={isLoading} variant={user.wallet.status === 'active' ? 'destructive' : 'secondary'}>
                    {isLoading && <LoaderCircle className="ml-2 h-4 w-4 animate-spin" />}
                    {user.wallet.status === 'active' ? 'تعليق البطاقة' : 'تفعيل البطاقة'}
                </Button>
                <Button onClick={onClose} variant="outline">إغلاق</Button>
            </DialogFooter>
        </DialogContent>
    );
}


export default function CardsPage() {
    const { user: adminUser, isUserLoading: isAdminLoading } = useUser();
    const firestore = useFirestore();
    const { toast } = useToast();

    const [users, setUsers] = useState<UserData[]>([]);
    const [isLoadingUsers, setIsLoadingUsers] = useState(true);
    const [isManageCardDialogOpen, setManageCardDialogOpen] = useState(false);
    const [selectedUser, setSelectedUser] = useState<UserData | null>(null);

    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState<string[]>(['active', 'suspended']);

    const [isDeleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [userToDelete, setUserToDelete] = useState<UserData | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    useEffect(() => {
        const fetchUsers = async () => {
            if (firestore && adminUser && adminUser.email === 'admin@huwiyasys.app') {
                setIsLoadingUsers(true);
                try {
                    const usersCollectionRef = collection(firestore, 'users');
                    const querySnapshot = await getDocs(usersCollectionRef);
                    const usersList = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as UserData));
                    setUsers(usersList.filter(u => u.wallet)); // Only show users with wallets
                } catch (error) {
                    console.error("Error fetching users:", error);
                    toast({ variant: 'destructive', title: 'فشل جلب المستخدمين', description: 'لا تملك الصلاحيات الكافية.' });
                } finally {
                    setIsLoadingUsers(false);
                }
            } else if (!isAdminLoading) {
                setUsers([]);
                setIsLoadingUsers(false);
            }
        };

        fetchUsers();
    }, [firestore, adminUser, isAdminLoading, toast]);

    const handleManageCardClick = (user: UserData) => {
        setSelectedUser(user);
        setManageCardDialogOpen(true);
    }
    
    const handleUserUpdate = (updatedUser: UserData) => {
        setUsers(users.map(u => u.id === updatedUser.id ? updatedUser : u));
        if (selectedUser?.id === updatedUser.id) {
            setSelectedUser(updatedUser);
        }
    }

    const handleFilterChange = (status: string) => {
        setStatusFilter(prev => 
            prev.includes(status) ? prev.filter(s => s !== status) : [...prev, status]
        );
    };

    const confirmDeleteUser = (user: UserData) => {
        setUserToDelete(user);
        setDeleteDialogOpen(true);
    };

    const handleDeleteUser = async () => {
        if (!userToDelete || !firestore) return;
        
        setIsDeleting(true);
        try {
            await deleteDoc(doc(firestore, "users", userToDelete.id));

            setUsers(users.filter(u => u.id !== userToDelete.id));
            toast({ title: "نجاح", description: `تم حذف بيانات المستخدم ${userToDelete.displayName}.` });

        } catch (error: any) {
            console.error("Error deleting user:", error);
            toast({ variant: 'destructive', title: 'فشل حذف المستخدم', description: error.message });
        } finally {
            setIsDeleting(false);
            setDeleteDialogOpen(false);
            setUserToDelete(null);
        }
    };


    const filteredUsers = useMemo(() => {
        return users
            .filter(user => statusFilter.includes(user.wallet?.status ?? ''))
            .filter(user => 
                user.displayName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                user.contractNumber?.includes(searchTerm)
            );
    }, [users, searchTerm, statusFilter]);

    return (
        <AdminSubPageLayout title="إدارة البطاقات">
            <Card>
                <CardHeader>
                    <CardTitle>قائمة بطاقات المستخدمين</CardTitle>
                    <CardDescription>عرض وإدارة بطاقات الدفع للمستخدمين.</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex items-center justify-between gap-4 mb-4">
                        <div className="relative w-full max-w-sm">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input 
                                placeholder="ابحث بالاسم أو رقم العقد..." 
                                className="pl-10" 
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                            />
                        </div>
                         <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                            <Button variant="outline" size="sm" className="h-10 gap-1">
                                <ListFilter className="h-3.5 w-3.5" />
                                <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
                                فلترة
                                </span>
                            </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" dir="rtl">
                                <DropdownMenuLabel>فلترة حسب الحالة</DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                <DropdownMenuCheckboxItem checked={statusFilter.includes('active')} onCheckedChange={() => handleFilterChange('active')}>
                                    نشطة
                                </DropdownMenuCheckboxItem>
                                <DropdownMenuCheckboxItem checked={statusFilter.includes('suspended')} onCheckedChange={() => handleFilterChange('suspended')}>
                                    معلقة
                                </DropdownMenuCheckboxItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>الاسم</TableHead>
                                <TableHead>رقم العقد</TableHead>
                                <TableHead>حالة البطاقة</TableHead>
                                <TableHead className="text-left">الرصيد</TableHead>
                                <TableHead>
                                    <span className="sr-only">الإجراءات</span>
                                </TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isLoadingUsers || isAdminLoading ? (
                                Array.from({ length: 5 }).map((_, i) => (
                                    <TableRow key={i}>
                                        <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                                        <TableCell><Skeleton className="h-5 w-20" /></TableCell>
                                        <TableCell><Skeleton className="h-6 w-16 rounded-full" /></TableCell>
                                        <TableCell><Skeleton className="h-5 w-20" /></TableCell>
                                        <TableCell><Skeleton className="h-8 w-8" /></TableCell>
                                    </TableRow>
                                ))
                            ) : filteredUsers.length > 0 ? (
                                filteredUsers.map((user) => (
                                    <TableRow key={user.id}>
                                        <TableCell className="font-medium">{user.displayName}</TableCell>
                                        <TableCell>{user.contractNumber}</TableCell>
                                        <TableCell>
                                            <Badge variant={user.wallet?.status === 'active' ? 'default' : 'destructive'}>
                                                {user.wallet?.status === 'active' ? 'نشطة' : 'معلقة'}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-left font-mono">{(user.wallet?.balance ?? 0).toFixed(2)} د.ل</TableCell>
                                        <TableCell>
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button aria-haspopup="true" size="icon" variant="ghost">
                                                        <MoreHorizontal className="h-4 w-4" />
                                                        <span className="sr-only">Toggle menu</span>
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end" dir='rtl'>
                                                    <DropdownMenuLabel>الإجراءات</DropdownMenuLabel>
                                                    <DropdownMenuItem onSelect={() => handleManageCardClick(user)}>إدارة البطاقة</DropdownMenuItem>
                                                    <DropdownMenuItem onSelect={() => confirmDeleteUser(user)} className="text-destructive">
                                                        حذف المستخدم
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={5} className="text-center h-24">لا توجد بطاقات مطابقة للبحث.</TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
            <Dialog open={isManageCardDialogOpen} onOpenChange={setManageCardDialogOpen}>
                {selectedUser && <CardManagementDialog user={selectedUser} onUserUpdate={handleUserUpdate} onClose={() => setManageCardDialogOpen(false)} />}
            </Dialog>
            <AlertDialog open={isDeleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <AlertDialogContent dir="rtl">
                    <AlertDialogHeader>
                    <AlertDialogTitle>هل أنت متأكد تماماً؟</AlertDialogTitle>
                    <AlertDialogDescription>
                        هذا الإجراء سيحذف بيانات المستخدم بشكل نهائي ولا يمكن التراجع عنه.
                    </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                    <AlertDialogCancel onClick={() => setUserToDelete(null)} disabled={isDeleting}>إلغاء</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDeleteUser} disabled={isDeleting} className="bg-destructive hover:bg-destructive/90">
                        {isDeleting ? <LoaderCircle className="ml-2 h-4 w-4 animate-spin" /> : <Trash2 className="ml-2 h-4 w-4" />}
                        {isDeleting ? 'جاري الحذف...' : 'نعم، قم بالحذف'}
                    </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </AdminSubPageLayout>
    );
}

    