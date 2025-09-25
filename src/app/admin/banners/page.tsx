'use client';

import { useState, useEffect } from 'react';
import AdminSubPageLayout from '../layout';
import { Button } from '@/components/ui/button';
import { PlusCircle, MoreHorizontal, LoaderCircle, Trash2, Edit } from 'lucide-react';
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
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, addDoc, doc, updateDoc, deleteDoc, serverTimestamp, DocumentData, query, orderBy } from 'firebase/firestore';
import Image from 'next/image';

interface Banner extends DocumentData {
  id: string;
  title: string;
  description?: string;
  imageUrl: string;
  status: 'active' | 'draft';
  link?: string;
}

function BannerDialog({ banner, onSave, onClose }: { banner?: Banner | null, onSave: () => void, onClose: () => void }) {
    const firestore = useFirestore();
    const { toast } = useToast();

    const [title, setTitle] = useState(banner?.title || '');
    const [description, setDescription] = useState(banner?.description || '');
    const [imageUrl, setImageUrl] = useState(banner?.imageUrl || '');
    const [status, setStatus] = useState<'active' | 'draft'>(banner?.status || 'active');
    const [link, setLink] = useState(banner?.link || '');
    
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async () => {
        if (!title || !imageUrl || !firestore) {
            toast({ variant: 'destructive', title: "بيانات ناقصة", description: "الرجاء إدخال العنوان ورابط الصورة على الأقل." });
            return;
        }
        setIsLoading(true);

        const bannerData = {
            title,
            description,
            imageUrl,
            status,
            link,
            updatedAt: serverTimestamp(),
        };

        try {
            if (banner) {
                // Update
                const bannerDocRef = doc(firestore, 'banners', banner.id);
                await updateDoc(bannerDocRef, bannerData);
                toast({ title: "تم تحديث البنر بنجاح" });
            } else {
                // Create
                await addDoc(collection(firestore, 'banners'), { 
                    ...bannerData, 
                    createdAt: serverTimestamp() 
                });
                toast({ title: "تمت إضافة البنر بنجاح" });
            }
            onSave();
            onClose();
        } catch (error: any) {
            console.error("Error saving banner: ", error);
            toast({ variant: 'destructive', title: "خطأ", description: error.message });
        } finally {
            setIsLoading(false);
        }
    };
    
    return (
         <DialogContent dir="rtl" className="sm:max-w-[425px]">
            <DialogHeader>
                <DialogTitle>{banner ? 'تعديل البنر' : 'إضافة بنر جديد'}</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
                <div className="space-y-2">
                    <Label htmlFor="banner-title">العنوان</Label>
                    <Input id="banner-title" value={title} onChange={(e) => setTitle(e.target.value)} />
                </div>
                 <div className="space-y-2">
                    <Label htmlFor="banner-description">الوصف (اختياري)</Label>
                    <Textarea id="banner-description" value={description} onChange={(e) => setDescription(e.target.value)} />
                </div>
                 <div className="space-y-2">
                    <Label htmlFor="banner-image-url">رابط صورة البنر</Label>
                    <Input id="banner-image-url" value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} placeholder="https://example.com/image.png" />
                </div>
                 <div className="space-y-2">
                    <Label htmlFor="banner-link">الرابط (اختياري)</Label>
                    <Input id="banner-link" value={link} onChange={(e) => setLink(e.target.value)} placeholder="/products/some-id" />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="banner-status">الحالة</Label>
                    <Select value={status} onValueChange={(val) => setStatus(val as 'active' | 'draft')}>
                        <SelectTrigger id="banner-status">
                            <SelectValue placeholder="اختر الحالة" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="active">نشط</SelectItem>
                            <SelectItem value="draft">مسودة</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                 {imageUrl && (
                    <div className="space-y-2">
                        <Label>معاينة الصورة</Label>
                        <Image src={imageUrl} alt={title} width={120} height={60} className="rounded-md object-cover aspect-[2/1]" />
                    </div>
                 )}
            </div>
            <DialogFooter>
                <Button onClick={onClose} variant="outline">إلغاء</Button>
                <Button onClick={handleSubmit} disabled={isLoading}>
                    {isLoading ? <LoaderCircle className="ml-2 h-4 w-4 animate-spin" /> : (banner ? 'حفظ التغييرات' : 'إضافة بنر')}
                </Button>
            </DialogFooter>
        </DialogContent>
    );
}

export default function BannersPage() {
    const firestore = useFirestore();
    const { toast } = useToast();

    // Dialog states
    const [isBannerDialogOpen, setBannerDialogOpen] = useState(false);
    const [isDeleteDialogOpen, setDeleteDialogOpen] = useState(false);
    
    // Data states
    const [selectedBanner, setSelectedBanner] = useState<Banner | null>(null);
    const [bannerToDelete, setBannerToDelete] = useState<Banner | null>(null);
    
    // Firestore data hooks
    const bannersQuery = useMemoFirebase(() => firestore ? query(collection(firestore, 'banners'), orderBy('createdAt', 'desc')) : null, [firestore]);
    const { data: banners, isLoading, error: bannersError } = useCollection<Banner>(bannersQuery);

    useEffect(() => {
        if (bannersError) {
            toast({ variant: 'destructive', title: 'فشل تحميل البنرات', description: bannersError.message });
        }
    }, [bannersError, toast]);

    const refreshData = () => {
        // Data is real-time, no manual refresh needed.
    };

    // Handlers
    const handleAddBanner = () => {
        setSelectedBanner(null);
        setBannerDialogOpen(true);
    };
    const handleEditBanner = (banner: Banner) => {
        setSelectedBanner(banner);
        setBannerDialogOpen(true);
    };
    const confirmDelete = (banner: Banner) => {
        setBannerToDelete(banner);
        setDeleteDialogOpen(true);
    };

    const handleDelete = async () => {
        if (!bannerToDelete || !firestore) return;
        
        try {
            await deleteDoc(doc(firestore, 'banners', bannerToDelete.id));
            toast({ title: `تم حذف البنر بنجاح` });
            setDeleteDialogOpen(false);
            setBannerToDelete(null);
        } catch (error: any) {
            toast({ variant: 'destructive', title: "فشل الحذف", description: error.message });
        }
    };

    return (
        <AdminSubPageLayout title="البنرات الإعلانية">
            <Card>
                <CardHeader className="flex-row items-center justify-between">
                    <div>
                        <CardTitle>قائمة البنرات</CardTitle>
                        <CardDescription>إدارة البنرات والعروض التي تظهر في التطبيق.</CardDescription>
                    </div>
                    <Button size="sm" className="h-8 gap-1" onClick={handleAddBanner}>
                        <PlusCircle className="h-3.5 w-3.5" />
                        <span>إضافة بنر</span>
                    </Button>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="hidden w-[100px] sm:table-cell">صورة</TableHead>
                                <TableHead>العنوان</TableHead>
                                <TableHead>الحالة</TableHead>
                                <TableHead>الوصف</TableHead>
                                <TableHead><span className="sr-only">الإجراءات</span></TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isLoading ? (
                                <TableRow><TableCell colSpan={5} className="h-24 text-center">جاري تحميل البنرات...</TableCell></TableRow>
                            ) : banners?.length ? (
                                banners.map((banner) => (
                                    <TableRow key={banner.id}>
                                        <TableCell className="hidden sm:table-cell">
                                            <Image
                                                alt={banner.title}
                                                className="aspect-[2/1] rounded-md object-cover"
                                                height="50"
                                                src={banner.imageUrl}
                                                width="100"
                                            />
                                        </TableCell>
                                        <TableCell className="font-medium">{banner.title}</TableCell>
                                        <TableCell>
                                            <Badge variant={banner.status === 'active' ? 'default' : 'outline'}>
                                                {banner.status === 'active' ? 'نشط' : 'مسودة'}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="hidden md:table-cell max-w-sm truncate">{banner.description}</TableCell>
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
                                                    <DropdownMenuItem onSelect={() => handleEditBanner(banner)}>تعديل</DropdownMenuItem>
                                                    <DropdownMenuItem onSelect={() => confirmDelete(banner)} className="text-destructive">حذف</DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow><TableCell colSpan={5} className="h-24 text-center">لا توجد بنرات لعرضها.</TableCell></TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            {/* Dialogs */}
            <Dialog open={isBannerDialogOpen} onOpenChange={setBannerDialogOpen}>
                {isBannerDialogOpen && <BannerDialog banner={selectedBanner} onSave={refreshData} onClose={() => setBannerDialogOpen(false)} />}
            </Dialog>

            <AlertDialog open={isDeleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <AlertDialogContent dir="rtl">
                    <AlertDialogHeader>
                        <AlertDialogTitle>هل أنت متأكد؟</AlertDialogTitle>
                        <AlertDialogDescription>
                            هذا الإجراء لا يمكن التراجع عنه. سيؤدي هذا إلى حذف البنر نهائيًا.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel onClick={() => setBannerToDelete(null)}>إلغاء</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90">
                            نعم، قم بالحذف
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </AdminSubPageLayout>
    );
}

    