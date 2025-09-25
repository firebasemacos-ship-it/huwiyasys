'use client';

import { useState } from 'react';
import AdminSubPageLayout from '../layout';
import { Button } from '@/components/ui/button';
import { PlusCircle, Copy, MoreHorizontal } from 'lucide-react';
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
import { useFirestore, errorEmitter, FirestorePermissionError, useCollection, useMemoFirebase, addDocumentNonBlocking } from '@/firebase';
import { collection, addDoc } from 'firebase/firestore';


export default function UsersPage() {
    const { toast } = useToast();
    const [isDialogOpen, setDialogOpen] = useState(false);
    const [newUserName, setNewUserName] = useState('');
    const [newContractNumber, setNewContractNumber] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    
    const firestore = useFirestore();

    const usersCollectionRef = useMemoFirebase(() => firestore ? collection(firestore, 'users') : null, [firestore]);
    const { data: users, isLoading: isLoadingUsers } = useCollection(usersCollectionRef);

    const generatePassword = () => {
        return Math.random().toString(36).slice(-8);
    };

    const handleAddUser = async () => {
        if (!newUserName || !newContractNumber) {
            toast({ variant: 'destructive', title: 'خطأ', description: 'الرجاء إدخال الاسم ورقم العقد.' });
            return;
        }

        if (!firestore || !usersCollectionRef) {
            toast({ variant: 'destructive', title: 'خطأ', description: 'خدمات Firebase غير متاحة.' });
            return;
        }

        setIsLoading(true);
        const password = generatePassword();
        const email = `${newContractNumber}@huwiyasys.app`;

        try {
            const newUserDoc = {
                // No UID from auth at this point. It will be added later if needed.
                displayName: newUserName,
                contractNumber: newContractNumber,
                email: email,
                tempPassword: password, // Store the temp password for the admin to see
                createdAt: new Date().toISOString(),
                isAdmin: false,
            };
            
            // This is a non-blocking write. We add the doc to firestore and move on.
            addDocumentNonBlocking(usersCollectionRef, newUserDoc);

            toast({ title: 'تمت إضافة المستخدم بنجاح', description: `تم إنشاء بيانات لـ ${newUserName}.` });
            setDialogOpen(false);
            setNewUserName('');
            setNewContractNumber('');

        } catch (error: any) {
            console.error("Error adding user data:", error);
            toast({ variant: 'destructive', title: 'فشل إضافة المستخدم', description: error.message || 'حدث خطأ غير متوقع.' });
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
            <Dialog open={isDialogOpen} onOpenChange={setDialogOpen}>
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
                        أدخل بيانات المستخدم الجديد. سيتم إنشاء كلمة مرور مؤقتة تلقائيًا.
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
                        <TableHead>رقم العقد</TableHead>
                        <TableHead>كلمة المرور المؤقتة</TableHead>
                        <TableHead>
                        <span className="sr-only">الإجراءات</span>
                        </TableHead>
                    </TableRow>
                    </TableHeader>
                    <TableBody>
                    {isLoadingUsers ? (
                        <TableRow>
                            <TableCell colSpan={4} className="text-center">جاري تحميل المستخدمين...</TableCell>
                        </TableRow>
                    ) : users && users.length > 0 ? (
                        users.map((user) => (
                            <TableRow key={user.id}>
                                <TableCell className="font-medium">{user.displayName}</TableCell>
                                <TableCell>{user.contractNumber}</TableCell>
                                <TableCell>
                                    <div className="flex items-center gap-2">
                                        <span className="font-mono">{user.tempPassword}</span>
                                        {user.tempPassword && <Button variant="ghost" size="icon" onClick={() => copyToClipboard(user.tempPassword)}>
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
                                        <DropdownMenuItem>تعديل</DropdownMenuItem>
                                        <DropdownMenuItem>حذف</DropdownMenuItem>
                                    </DropdownMenuContent>
                                    </DropdownMenu>
                                </TableCell>
                            </TableRow>
                        ))
                    ) : (
                        <TableRow>
                             <TableCell colSpan={4} className="text-center">لا يوجد مستخدمين لعرضهم.</TableCell>
                        </TableRow>
                    )}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    </AdminSubPageLayout>
  );
}
    