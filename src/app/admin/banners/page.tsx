
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
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, addDoc, doc, updateDoc, deleteDoc, serverTimestamp, DocumentData, query, orderBy } from 'firebase/firestore';

interface Banner extends DocumentData {
  id: string;
  youtubeUrl: string;
  status: 'active' | 'draft';
}

function getYouTubeVideoId(url: string) {
    if (!url) return null;
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
}

function BannerDialog({ banner, onSave, onClose }: { banner?: Banner | null, onSave: () => void, onClose: () => void }) {
    const firestore = useFirestore();
    const { toast } = useToast();

    const [youtubeUrl, setYoutubeUrl] = useState(banner?.youtubeUrl || '');
    const [status, setStatus] = useState<'active' | 'draft'>(banner?.status || 'active');
    
    const [isLoading, setIsLoading] = useState(false);
    
    const videoId = getYouTubeVideoId(youtubeUrl);

    const handleSubmit = async () => {
        if (!youtubeUrl || !firestore) {
            toast({ variant: 'destructive', title: "بيانات ناقصة", description: "الرجاء إدخال رابط فيديو يوتيوب." });
            return;
        }
        if (!getYouTubeVideoId(youtubeUrl)) {
            toast({ variant: 'destructive', title: "رابط غير صالح", description: "الرجاء إدخال رابط فيديو يوتيوب صحيح." });
            return;
        }
        setIsLoading(true);

        const bannerData = {
            youtubeUrl,
            status,
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
         <DialogContent dir="rtl" className="sm:max-w-2xl">
            <DialogHeader>
                <DialogTitle>{banner ? 'تعديل البنر' : 'إضافة بنر جديد'}</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
                <div className="space-y-2">
                    <Label htmlFor="banner-youtube-url">رابط فيديو يوتيوب</Label>
                    <Input 
                        id="banner-youtube-url" 
                        value={youtubeUrl} 
                        onChange={(e) => setYoutubeUrl(e.target.value)} 
                        className="font-mono text-left"
                        dir="ltr"
                        placeholder="https://www.youtube.com/watch?v=..."
                    />
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
                 {videoId && (
                    <div className="space-y-2">
                        <Label>معاينة</Label>
                        <div className="p-4 border rounded-md aspect-video">
                           <iframe
                                src={`https://www.youtube.com/embed/${videoId}?autoplay=1&mute=1&loop=1&playlist=${videoId}&controls=0&showinfo=0&modestbranding=1&rel=0&iv_load_policy=3`}
                                frameBorder="0"
                                allow="autoplay; encrypted-media"
                                allowFullScreen
                                className="w-full h-full"
                            ></iframe>
                        </div>
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

    const [isBannerDialogOpen, setBannerDialogOpen] = useState(false);
    const [isDeleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [selectedBanner, setSelectedBanner] = useState<Banner | null>(null);
    const [bannerToDelete, setBannerToDelete] = useState<Banner | null>(null);
    
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
                                <TableHead>رابط الفيديو</TableHead>
                                <TableHead>الحالة</TableHead>
                                <TableHead><span className="sr-only">الإجراءات</span></TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isLoading ? (
                                <TableRow><TableCell colSpan={3} className="h-24 text-center">جاري تحميل البنرات...</TableCell></TableRow>
                            ) : banners?.length ? (
                                banners.map((banner) => (
                                    <TableRow key={banner.id}>
                                        <TableCell className="font-mono text-xs max-w-md truncate">
                                          <a href={banner.youtubeUrl} target="_blank" rel="noopener noreferrer" className="hover:underline">{banner.youtubeUrl}</a>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant={banner.status === 'active' ? 'default' : 'outline'}>
                                                {banner.status === 'active' ? 'نشط' : 'مسودة'}
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
                                                    <DropdownMenuItem onSelect={() => handleEditBanner(banner)}>تعديل</DropdownMenuItem>
                                                    <DropdownMenuItem onSelect={() => confirmDelete(banner)} className="text-destructive">حذف</DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow><TableCell colSpan={3} className="h-24 text-center">لا توجد بنرات لعرضها.</TableCell></TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

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
    

    