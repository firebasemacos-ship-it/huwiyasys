'use client';

import { useState, useEffect } from 'react';
import AdminSubPageLayout from '../layout';
import { Button } from '@/components/ui/button';
import { PlusCircle, Copy, MoreHorizontal, LoaderCircle, Trash2 } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
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
} from "@/components/ui/alert-dialog"
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuLabel, DropdownMenuItem } from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useFirestore, useAuth, useUser } from '@/firebase';
import { collection, setDoc, doc, getDocs, DocumentData, deleteDoc, serverTimestamp } from 'firebase/firestore';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { Badge } from '@/components/ui/badge';
import { useRouter } from 'next/navigation';

type Wallet = {
    balance: number;
    cardNumber: string;
    cvv: string;
    expiryDate: string;
    status: 'active' | 'suspended';
}

type UserData = {
    id: string;
    uid: string;
    displayName?: string;
    email?: string;
    contractNumber?: string;
    tempPassword?: string;
    wallet?: Wallet;
    createdAt?: any;
    isAdmin?: boolean;
};

export default function UsersPage() {
    const { toast } = useToast();
    const router = useRouter();
    const { user: adminUser, isUserLoading: isAdminLoading } = useUser();
    const [isAddUserDialogOpen, setAddUserDialogOpen] = useState(false);
    
    const [newUserName, setNewUserName] = useState('');
    const [newContractNumber, setNewContractNumber] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    
    const [users, setUsers] = useState<UserData[]>([]);
    const [isLoadingUsers, setIsLoadingUsers] = useState(true);
    
    const [isDeleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [userToDelete, setUserToDelete] = useState<UserData | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);


    const firestore = useFirestore();
    const auth = useAuth();

    useEffect(() => {
        const fetchUsers = async () => {
            if (firestore && adminUser && adminUser.email === 'zaki@zetabait.app') {
                setIsLoadingUsers(true);
                try {
                    const usersCollectionRef = collection(firestore, 'users');
                    const querySnapshot = await getDocs(usersCollectionRef);
                    const usersList = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as UserData));
                    setUsers(usersList);
                } catch (error) {
                    console.error("Error fetching users:", error);
                    toast({ variant: 'destructive', title: 'فشل جلب المستخدمين', description: (error as Error).message });
                } finally {
                    setIsLoadingUsers(false);
                }
            } else if (!isAdminLoading) {
                if(firestore && adminUser) {
                   toast({ variant: 'destructive', title: 'فشل جلب المستخدمين', description: 'لا تملك الصلاحيات الكافية.' });
                }
                setUsers([]);
                setIsLoadingUsers(false);
            }
        };

        fetchUsers();
    }, [firestore, adminUser, isAdminLoading, toast]);


    const generatePassword = () => Math.random().toString(36).slice(-8);
    const generateCardNumber = () => `5432${Array.from({ length: 12 }, () => Math.floor(Math.random() * 10)).join('')}`;
    const generateCvv = () => Math.floor(100 + Math.random() * 900).toString();
    const generateExpiryDate = () => {
        const date = new Date();
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const year = (date.getFullYear() + 5).toString().slice(-2);
        return `${month}/${year}`;
    };


    const handleAddUser = async () => {
        if (!newUserName || !newContractNumber) {
            toast({ variant: 'destructive', title: 'خطأ', description: 'الرجاء إدخال الاسم ورقم العقد.' });
            return;
        }
        if (!firestore || !auth) {
            toast({ variant: 'destructive', title: 'خطأ', description: 'خدمات Firebase غير متاحة.' });
            return;
        }

        setIsLoading(true);
        const password = generatePassword();
        const email = `${newContractNumber}@huwiyasys.app`;

        try {
            // This is a simplified approach for demonstration. 
            // In a real-world scenario, you should use a backend function (e.g., Firebase Cloud Function)
            // to create users to avoid auth state conflicts on the admin client.
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;

            const newUserDoc: UserData = {
                id: user.uid,
                uid: user.uid,
                displayName: newUserName,
                contractNumber: newContractNumber,
                email: email,
                tempPassword: password,
                createdAt: serverTimestamp(),
                isAdmin: false,
                wallet: {
                    balance: 0,
                    cardNumber: generateCardNumber(),
                    cvv: generateCvv(),
                    expiryDate: generateExpiryDate(),
                    status: 'active',
                }
            };
            
            await setDoc(doc(firestore, 'users', user.uid), newUserDoc);
            
            setUsers(prevUsers => [newUserDoc, ...prevUsers]);

            toast({ title: 'تمت إضافة المستخدم بنجاح', description: `تم إنشاء حساب ومستند لـ ${newUserName}.` });
            setAddUserDialogOpen(false);
            setNewUserName('');
            setNewContractNumber('');

        } catch (error: any) {
            console.error("Error adding user:", error);
            if (error.code === 'auth/email-already-in-use') {
                toast({ variant: 'destructive', title: 'فشل إضافة المستخدم', description: 'رقم العقد هذا مستخدم بالفعل.' });
            } else {
                toast({ variant: 'destructive', title: 'فشل إضافة المستخدم', description: error.message || 'حدث خطأ غير متوقع.' });
            }
        } finally {
             setIsLoading(false);
        }
    };
    
    const confirmDeleteUser = (user: UserData) => {
        setUserToDelete(user);
        setDeleteDialogOpen(true);
    };

    const handleDeleteUser = async () => {
        if (!userToDelete || !firestore) return;
        
        setIsDeleting(true);
        try {
            // Note: This only deletes the Firestore document.
            // Deleting the Firebase Auth user requires admin privileges, typically via a Cloud Function.
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


    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        toast({ title: 'تم النسخ!', description: 'تم نسخ كلمة المرور إلى الحافظة.' });
    };
    
  return (
    <AdminSubPageLayout title="المستخدمون">
        <div className="flex items-center justify-end gap-4">
            <Dialog open={isAddUserDialogOpen} onOpenChange={setAddUserDialogOpen}>
            <DialogTrigger asChild>
                <Button size="sm" className="h-8 gap-1">
                    <PlusCircle className="h-3.5 w-3.5" />
                    <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
                        إضافة مستخدم
                    </span>
                </Button>
            </DialogTrigger>
            <DialogContent dir="rtl">
                <DialogHeader>
                    <DialogTitle>إضافة مستخدم جديد</DialogTitle>
                    <DialogDescription>
                        أدخل بيانات المستخدم الجديد. سيتم إنشاء كلمة مرور مؤقتة وبطاقة دفع تلقائيًا.
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="name" className="text-right">
                            الاسم
                        </Label>
                        <Input id="name" value={newUserName} onChange={(e) => setNewUserName(e.target.value)} className="col-span-3" />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="contract-number" className="text-right">
                            رقم العقد
                        </Label>
                        <Input id="contract-number" value={newContractNumber} onChange={(e) => setNewContractNumber(e.target.value)} className="col-span-3" />
                    </div>
                </div>
                <DialogFooter>
                    <Button onClick={handleAddUser} disabled={isLoading}>
                        {isLoading && <LoaderCircle className="ml-2 h-4 w-4 animate-spin" />}
                        {isLoading ? 'جاري الإضافة...' : 'إضافة مستخدم'}
                    </Button>
                </DialogFooter>
            </DialogContent>
            </Dialog>
        </div>

        <Card className="mt-4">
            <CardHeader>
                <CardTitle>قائمة المستخدمين</CardTitle>
                <CardDescription>عرض وإدارة حسابات المستخدمين.</CardDescription>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                    <TableRow>
                        <TableHead>الاسم</TableHead>
                        <TableHead>رقم العقد / البريد</TableHead>
                        <TableHead>حالة البطاقة</TableHead>
                        <TableHead>كلمة المرور المؤقتة</TableHead>
                        <TableHead>
                        <span className="sr-only">الإجراءات</span>
                        </TableHead>
                    </TableRow>
                    </TableHeader>
                    <TableBody>
                    {isLoadingUsers || isAdminLoading ? (
                        <TableRow>
                            <TableCell colSpan={5} className="text-center">جاري تحميل المستخدمين...</TableCell>
                        </TableRow>
                    ) : users && users.length > 0 ? (
                        users.map((user) => (
                            <TableRow key={user.id}>
                                <TableCell className="font-medium">{user.displayName}</TableCell>
                                <TableCell>{user.email}</TableCell>
                                <TableCell>
                                   {user.wallet ? (
                                     <Badge variant={user.wallet?.status === 'active' ? 'default' : 'destructive'}>
                                        {user.wallet?.status === 'active' ? 'نشطة' : 'معلقة'}
                                    </Badge>
                                   ) : (
                                    <Badge variant="outline">لا توجد</Badge>
                                   )}
                                </TableCell>
                                <TableCell>
                                    <div className="flex items-center gap-2">
                                        <span className="font-mono">{user.tempPassword}</span>
                                        {user.tempPassword && <Button variant="ghost" size="icon" onClick={() => copyToClipboard(user.tempPassword!)}>
                                            <Copy className="h-4 w-4" />
                                        </Button>}
                                    </div>
                                </TableCell>
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
                                        <DropdownMenuItem onSelect={() => router.push('/admin/cards')}>إدارة البطاقة</DropdownMenuItem>
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
                             <TableCell colSpan={5} className="text-center h-24">لا يوجد مستخدمين لعرضهم.</TableCell>
                        </TableRow>
                    )}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
         <AlertDialog open={isDeleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
            <AlertDialogContent dir="rtl">
                <AlertDialogHeader>
                <AlertDialogTitle>هل أنت متأكد تماماً؟</AlertDialogTitle>
                <AlertDialogDescription>
                    هذا الإجراء سيحذف بيانات المستخدم بشكل نهائي ولا يمكن التراجع عنه.
                    <br/>
                    <strong className='py-2 block'>ملاحظة: هذا سيحذف بيانات المستخدم من قاعدة البيانات فقط، وليس حساب المصادقة الخاص به.</strong>
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
