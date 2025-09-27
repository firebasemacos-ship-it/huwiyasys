
'use client';

import { useState, useEffect } from 'react';
import AdminSubPageLayout from '../layout';
import { Button } from '@/components/ui/button';
import { PlusCircle, MoreHorizontal, LoaderCircle, Trash2, Edit, Copy, Gift, Ticket } from 'lucide-react';
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
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, addDoc, doc, updateDoc, deleteDoc, serverTimestamp, DocumentData, query, orderBy, where } from 'firebase/firestore';

interface Product extends DocumentData {
  id: string;
  name: string;
}

interface Offer extends DocumentData {
  id: string;
  title: string;
  type: 'cash_gift' | 'discount_coupon';
  status: 'active' | 'inactive';
  createdAt: any;
  // cash_gift specific
  amount?: number;
  redeemedBy?: string[];
  // discount_coupon specific
  productId?: string;
  productName?: string;
  discountPercentage?: number;
  couponCode?: string;
  isUsed?: boolean;
}

function OfferDialog({ offer, onSave, onClose }: { offer?: Offer | null, onSave: () => void, onClose: () => void }) {
    const firestore = useFirestore();
    const { toast } = useToast();

    // Common fields
    const [title, setTitle] = useState(offer?.title || '');
    const [type, setType] = useState<'cash_gift' | 'discount_coupon' | ''>(offer?.type || '');
    const [status, setStatus] = useState<'active' | 'inactive'>(offer?.status || 'active');

    // Cash Gift fields
    const [amount, setAmount] = useState(offer?.amount || 0);

    // Discount Coupon fields
    const [productId, setProductId] = useState(offer?.productId || '');
    const [discountPercentage, setDiscountPercentage] = useState(offer?.discountPercentage || 10);
    
    // Products for dropdown
    const productsQuery = useMemoFirebase(() => firestore ? query(collection(firestore, 'products'), where('status', '==', 'active')) : null, [firestore]);
    const { data: products, isLoading: isLoadingProducts } = useCollection<Product>(productsQuery);

    const [isLoading, setIsLoading] = useState(false);
    
    const generateCouponCode = () => {
        return `ZETA-${Math.random().toString(36).substr(2, 8).toUpperCase()}`;
    }

    const handleSubmit = async () => {
        if (!title || !type || !firestore) {
            toast({ variant: 'destructive', title: "بيانات ناقصة", description: "الرجاء ملء جميع الحقول المطلوبة." });
            return;
        }
        setIsLoading(true);

        let offerData: Partial<Offer> = {
            title,
            type,
            status,
            updatedAt: serverTimestamp(),
        };

        if (type === 'cash_gift') {
            if (amount <= 0) {
                 toast({ variant: 'destructive', title: "مبلغ غير صالح", description: "مبلغ الهدية يجب أن يكون أكبر من صفر." });
                 setIsLoading(false);
                 return;
            }
            offerData = { ...offerData, amount, redeemedBy: offer?.redeemedBy || [] };
        } else if (type === 'discount_coupon') {
             if (!productId || discountPercentage <= 0) {
                 toast({ variant: 'destructive', title: "بيانات ناقصة", description: "الرجاء اختيار منتج وتحديد نسبة خصم صالحة." });
                 setIsLoading(false);
                 return;
            }
            const selectedProduct = products?.find(p => p.id === productId);
            offerData = { 
                ...offerData, 
                productId, 
                productName: selectedProduct?.name || '',
                discountPercentage, 
                couponCode: offer?.couponCode || generateCouponCode(),
                isUsed: offer?.isUsed || false,
            };
        }

        try {
            if (offer) {
                await updateDoc(doc(firestore, 'offers', offer.id), offerData);
                toast({ title: "تم تحديث العرض بنجاح" });
            } else {
                await addDoc(collection(firestore, 'offers'), { 
                    ...offerData, 
                    createdAt: serverTimestamp() 
                });
                toast({ title: "تمت إضافة العرض بنجاح" });
            }
            onSave();
            onClose();
        } catch (error: any) {
            console.error("Error saving offer: ", error);
            toast({ variant: 'destructive', title: "خطأ", description: error.message });
        } finally {
            setIsLoading(false);
        }
    };
    
    return (
         <DialogContent dir="rtl" className="sm:max-w-md">
            <DialogHeader>
                <DialogTitle>{offer ? 'تعديل العرض' : 'إضافة عرض جديد'}</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
                 <div className="space-y-2">
                    <Label htmlFor="offer-title">عنوان العرض</Label>
                    <Input id="offer-title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="مثال: هدية العيد، خصم الصيف..." />
                </div>
                 <div className="space-y-2">
                    <Label htmlFor="offer-type">نوع العرض</Label>
                    <Select value={type} onValueChange={(val) => setType(val as any)} disabled={!!offer}>
                        <SelectTrigger id="offer-type">
                            <SelectValue placeholder="اختر نوع العرض" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="cash_gift">هدية مالية</SelectItem>
                            <SelectItem value="discount_coupon">كوبون خصم</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                {type === 'cash_gift' && (
                    <div className="space-y-2">
                        <Label htmlFor="offer-amount">قيمة الهدية (د.ل)</Label>
                        <Input id="offer-amount" type="number" value={amount} onChange={(e) => setAmount(Number(e.target.value))} />
                    </div>
                )}
                {type === 'discount_coupon' && (
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="offer-product">المنتج</Label>
                            <Select value={productId} onValueChange={setProductId} disabled={isLoadingProducts}>
                                <SelectTrigger id="offer-product">
                                    <SelectValue placeholder={isLoadingProducts ? "جاري تحميل المنتجات..." : "اختر المنتج"} />
                                </SelectTrigger>
                                <SelectContent>
                                    {products?.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="offer-discount">نسبة الخصم (%)</Label>
                            <Input id="offer-discount" type="number" value={discountPercentage} onChange={(e) => setDiscountPercentage(Number(e.target.value))} />
                        </div>
                    </div>
                )}
                 <div className="space-y-2">
                    <Label htmlFor="offer-status">الحالة</Label>
                    <Select value={status} onValueChange={(val) => setStatus(val as any)}>
                        <SelectTrigger id="offer-status">
                            <SelectValue placeholder="اختر الحالة" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="active">نشط</SelectItem>
                            <SelectItem value="inactive">غير نشط</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>
            <DialogFooter>
                <Button onClick={onClose} variant="outline">إلغاء</Button>
                <Button onClick={handleSubmit} disabled={isLoading || !type}>
                    {isLoading ? <LoaderCircle className="ml-2 h-4 w-4 animate-spin" /> : (offer ? 'حفظ التغييرات' : 'إضافة عرض')}
                </Button>
            </DialogFooter>
        </DialogContent>
    );
}

export default function OffersPage() {
    const firestore = useFirestore();
    const { toast } = useToast();

    const [isOfferDialogOpen, setOfferDialogOpen] = useState(false);
    const [isDeleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [selectedOffer, setSelectedOffer] = useState<Offer | null>(null);
    const [offerToDelete, setOfferToDelete] = useState<Offer | null>(null);
    
    const offersQuery = useMemoFirebase(() => firestore ? query(collection(firestore, 'offers'), orderBy('createdAt', 'desc')) : null, [firestore]);
    const { data: offers, isLoading, error: offersError } = useCollection<Offer>(offersQuery);

    const handleAddOffer = () => {
        setSelectedOffer(null);
        setOfferDialogOpen(true);
    };
    const handleEditOffer = (offer: Offer) => {
        setSelectedOffer(offer);
        setOfferDialogOpen(true);
    };
    const confirmDelete = (offer: Offer) => {
        setOfferToDelete(offer);
        setDeleteDialogOpen(true);
    };

    const handleDelete = async () => {
        if (!offerToDelete || !firestore) return;
        
        try {
            await deleteDoc(doc(firestore, 'offers', offerToDelete.id));
            toast({ title: `تم حذف العرض بنجاح` });
        } catch (error: any) {
            toast({ variant: 'destructive', title: "فشل الحذف", description: error.message });
        } finally {
            setDeleteDialogOpen(false);
            setOfferToDelete(null);
        }
    };
    
    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        toast({ title: 'تم النسخ!', description: 'تم نسخ الكوبون إلى الحافظة.' });
    };

    return (
        <AdminSubPageLayout title="العروض والهدايا">
            <Card>
                <CardHeader className="flex-row items-center justify-between">
                    <div>
                        <CardTitle>قائمة العروض</CardTitle>
                        <CardDescription>إدارة الهدايا المالية وكوبونات الخصم.</CardDescription>
                    </div>
                    <Button size="sm" className="h-8 gap-1" onClick={handleAddOffer}>
                        <PlusCircle className="h-3.5 w-3.5" />
                        <span>إضافة عرض</span>
                    </Button>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>العنوان</TableHead>
                                <TableHead>النوع</TableHead>
                                <TableHead>التفاصيل</TableHead>
                                <TableHead>الحالة</TableHead>
                                <TableHead><span className="sr-only">الإجراءات</span></TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isLoading ? (
                                <TableRow><TableCell colSpan={5} className="h-24 text-center">جاري تحميل العروض...</TableCell></TableRow>
                            ) : offers?.length ? (
                                offers.map((offer) => (
                                    <TableRow key={offer.id}>
                                        <TableCell className="font-medium">{offer.title}</TableCell>
                                        <TableCell>
                                           <div className='flex items-center gap-2'>
                                                {offer.type === 'cash_gift' ? <Gift className="h-4 w-4"/> : <Ticket className="h-4 w-4"/>}
                                                <span>{offer.type === 'cash_gift' ? 'هدية مالية' : 'كوبون خصم'}</span>
                                           </div>
                                        </TableCell>
                                        <TableCell>
                                            {offer.type === 'cash_gift' ? (
                                                <span className="font-semibold">{offer.amount} د.ل</span>
                                            ) : (
                                                <div className='flex items-center gap-2'>
                                                    <span className="font-mono text-xs p-1 bg-muted rounded-md">{offer.couponCode}</span>
                                                    <Button variant="ghost" size="icon" className='h-6 w-6' onClick={() => copyToClipboard(offer.couponCode!)}>
                                                        <Copy className="h-3 w-3" />
                                                    </Button>
                                                </div>
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant={offer.status === 'active' ? 'default' : 'outline'}>
                                                {offer.status === 'active' ? 'نشط' : 'غير نشط'}
                                            </Badge>
                                        </TableCell>
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
                                                    <DropdownMenuItem onSelect={() => handleEditOffer(offer)}>تعديل</DropdownMenuItem>
                                                    <DropdownMenuItem onSelect={() => confirmDelete(offer)} className="text-destructive">حذف</DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow><TableCell colSpan={5} className="h-24 text-center">لا توجد عروض لعرضها.</TableCell></TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            <Dialog open={isOfferDialogOpen} onOpenChange={setOfferDialogOpen}>
                {isOfferDialogOpen && <OfferDialog offer={selectedOffer} onSave={() => {}} onClose={() => setOfferDialogOpen(false)} />}
            </Dialog>

            <AlertDialog open={isDeleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <AlertDialogContent dir="rtl">
                    <AlertDialogHeader>
                        <AlertDialogTitle>هل أنت متأكد؟</AlertDialogTitle>
                        <AlertDialogDescription>
                            هذا الإجراء لا يمكن التراجع عنه. سيؤدي هذا إلى حذف العرض نهائيًا.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel onClick={() => setOfferToDelete(null)}>إلغاء</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90">
                            نعم، قم بالحذف
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </AdminSubPageLayout>
    );
}

    