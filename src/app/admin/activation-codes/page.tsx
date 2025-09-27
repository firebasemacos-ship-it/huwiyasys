
'use client';

import { useState } from 'react';
import AdminSubPageLayout from '../layout';
import { Button } from '@/components/ui/button';
import { PlusCircle, LoaderCircle, Trash2, Copy, MoreHorizontal } from 'lucide-react';
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
} from "@/components/ui/alert-dialog";
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, addDoc, doc, deleteDoc, serverTimestamp, DocumentData, query, orderBy, writeBatch } from 'firebase/firestore';

interface ActivationCode extends DocumentData {
  id: string;
  code: string;
  isUsed: boolean;
  createdAt: any;
  usedBy?: string;
  usedAt?: any;
}

export default function ActivationCodesPage() {
    const firestore = useFirestore();
    const { toast } = useToast();

    // Dialog states
    const [isGenerateDialogOpen, setGenerateDialogOpen] = useState(false);
    const [isDeleteDialogOpen, setDeleteDialogOpen] = useState(false);
    
    // Data states
    const [codeToDelete, setCodeToDelete] = useState<ActivationCode | null>(null);
    const [quantity, setQuantity] = useState(1);
    const [isGenerating, setIsGenerating] = useState(false);
    
    // Firestore data hooks
    const codesQuery = useMemoFirebase(() => firestore ? query(collection(firestore, 'activationCodes'), orderBy('createdAt', 'desc')) : null, [firestore]);
    const { data: codes, isLoading, error: codesError } = useCollection<ActivationCode>(codesQuery);
    
    const generateCodes = (count: number) => {
        const newCodes = new Set<string>();
        const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        while (newCodes.size < count) {
            let result = '';
            for (let i = 0; i < 16; i++) {
                result += characters.charAt(Math.floor(Math.random() * characters.length));
                if ((i + 1) % 4 === 0 && i < 15) {
                    result += '-';
                }
            }
            newCodes.add(result);
        }
        return Array.from(newCodes);
    };

    const handleGenerate = async () => {
        if (!firestore || quantity <= 0) {
            toast({ variant: 'destructive', title: 'عدد غير صالح', description: 'الرجاء إدخال عدد صحيح أكبر من صفر.' });
            return;
        }
        setIsGenerating(true);

        try {
            const batch = writeBatch(firestore);
            const newCodes = generateCodes(quantity);
            
            newCodes.forEach(code => {
                const newCodeRef = doc(collection(firestore, 'activationCodes'));
                batch.set(newCodeRef, {
                    code,
                    isUsed: false,
                    createdAt: serverTimestamp(),
                });
            });

            await batch.commit();
            toast({ title: `تم إنشاء ${quantity} كود تفعيل بنجاح` });
            setGenerateDialogOpen(false);
        } catch (error: any) {
            toast({ variant: 'destructive', title: 'فشل الإنشاء', description: error.message });
        } finally {
            setIsGenerating(false);
        }
    };

    const confirmDelete = (code: ActivationCode) => {
        setCodeToDelete(code);
        setDeleteDialogOpen(true);
    };

    const handleDelete = async () => {
        if (!codeToDelete || !firestore) return;
        
        try {
            await deleteDoc(doc(firestore, 'activationCodes', codeToDelete.id));
            toast({ title: `تم حذف الكود بنجاح` });
            setDeleteDialogOpen(false);
            setCodeToDelete(null);
        } catch (error: any) {
            toast({ variant: 'destructive', title: "فشل الحذف", description: error.message });
        }
    };

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        toast({ title: 'تم النسخ!', description: 'تم نسخ كود التفعيل إلى الحافظة.' });
    };

    return (
        <AdminSubPageLayout title="أكواد التفعيل">
            <Card>
                <CardHeader className="flex-row items-center justify-between">
                    <div>
                        <CardTitle>قائمة أكواد التفعيل</CardTitle>
                        <CardDescription>إدارة أكواد التفعيل لحسابات المستخدمين الجديدة.</CardDescription>
                    </div>
                     <Dialog open={isGenerateDialogOpen} onOpenChange={setGenerateDialogOpen}>
                        <DialogTrigger asChild>
                            <Button size="sm" className="h-8 gap-1">
                                <PlusCircle className="h-3.5 w-3.5" />
                                <span>توليد أكواد</span>
                            </Button>
                        </DialogTrigger>
                        <DialogContent dir="rtl">
                            <DialogHeader>
                                <DialogTitle>توليد أكواد تفعيل جديدة</DialogTitle>
                            </DialogHeader>
                             <div className="grid gap-4 py-4">
                                <div className="space-y-2">
                                    <Label htmlFor="quantity">العدد</Label>
                                    <Input id="quantity" type="number" value={quantity} onChange={(e) => setQuantity(Math.max(1, Number(e.target.value)))} />
                                </div>
                             </div>
                            <DialogFooter>
                                <Button onClick={() => setGenerateDialogOpen(false)} variant="outline">إلغاء</Button>
                                <Button onClick={handleGenerate} disabled={isGenerating}>
                                    {isGenerating ? <LoaderCircle className="ml-2 h-4 w-4 animate-spin" /> : 'توليد'}
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>كود التفعيل</TableHead>
                                <TableHead>الحالة</TableHead>
                                <TableHead>تاريخ الإنشاء</TableHead>
                                <TableHead><span className="sr-only">الإجراءات</span></TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isLoading ? (
                                <TableRow><TableCell colSpan={4} className="h-24 text-center">جاري تحميل الأكواد...</TableCell></TableRow>
                            ) : codes?.length ? (
                                codes.map((code) => (
                                    <TableRow key={code.id}>
                                        <TableCell className="font-mono">
                                            <div className="flex items-center gap-2">
                                                <span>{code.code}</span>
                                                <Button variant="ghost" size="icon" className='h-8 w-8' onClick={() => copyToClipboard(code.code)}>
                                                    <Copy className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant={code.isUsed ? 'secondary' : 'default'}>
                                                {code.isUsed ? 'مستخدم' : 'جديد'}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>{code.createdAt?.toDate().toLocaleDateString('ar-LY')}</TableCell>
                                        <TableCell className="text-left">
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button aria-haspopup="true" size="icon" variant="ghost">
                                                        <MoreHorizontal className="h-4 w-4" />
                                                        <span className="sr-only">Toggle menu</span>
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end" dir='rtl'>
                                                    <DropdownMenuLabel>الإجراءات</DropdownMenuLabel>
                                                    <DropdownMenuItem onSelect={() => confirmDelete(code)} className="text-destructive">حذف</DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow><TableCell colSpan={4} className="h-24 text-center">لا توجد أكواد تفعيل لعرضها.</TableCell></TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            <AlertDialog open={isDeleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <AlertDialogContent dir="rtl">
                    <AlertDialogHeader>
                        <AlertDialogTitle>هل أنت متأكد؟</AlertDialogTitle>
                        <AlertDialogDescription>
                            هذا الإجراء لا يمكن التراجع عنه. سيؤدي هذا إلى حذف الكود نهائيًا.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel onClick={() => setCodeToDelete(null)}>إلغاء</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90">
                            نعم، قم بالحذف
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </AdminSubPageLayout>
    );
}

    