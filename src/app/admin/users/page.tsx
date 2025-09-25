
'use client';

import { useState, useEffect } from 'react';
import AdminSubPageLayout from '../layout';
import { Button } from '@/components/ui/button';
import { PlusCircle, Copy, MoreHorizontal, LoaderCircle } from 'lucide-react';
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
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuLabel, DropdownMenuItem } from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useFirestore, useAuth, useUser } from '@/firebase';
import { collection, setDoc, doc, getDocs, DocumentData, updateDoc } from 'firebase/firestore';
import { createUserWithEmailAndPassword, updatePassword } from 'firebase/auth';
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

    const firestore = useFirestore();
    const auth = useAuth();

    useEffect(() => {
        const fetchUsers = async () => {
            if (firestore && adminUser && adminUser.email === 'admin@huwiyasys.app') {
                setIsLoadingUsers(true);
                try {
                    const usersCollectionRef = collection(firestore, 'users');
                    const querySnapshot = await getDocs(usersCollectionRef);
                    const usersList = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as UserData));
                    setUsers(usersList);
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
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;

            const newUserDoc: UserData = {
                id: user.uid,
                uid: user.uid,
                displayName: newUserName,
                contractNumber: newContractNumber,
                email: email,
                tempPassword: password,
                createdAt: new Date().toISOString(),
                isAdmin: false,
                wallet: {
                    balance: 0,
                    cardNumber: generateCardNumber(),
                    cvv: generateCvv(),
                    expiryDate: generateExpiryDate(),
                    status: 'active' as 'active' | 'suspended',
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
                                        <DropdownMenuItem>حذف المستخدم</DropdownMenuItem>
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
    </AdminSubPageLayout>
  );
}
