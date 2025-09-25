
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
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
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
} from "@/components/ui/alert-dialog";
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, addDoc, doc, updateDoc, deleteDoc, serverTimestamp, DocumentData, query, orderBy } from 'firebase/firestore';
import Image from 'next/image';
import { PlaceHolderImages } from '@/lib/placeholder-images';

interface Product extends DocumentData {
  id: string;
  name: string;
  description?: string;
  price: number;
  category: string;
  categoryId: string;
  imageUrl?: string;
  imageHint?: string;
  status: 'active' | 'draft';
}

interface Category extends DocumentData {
  id: string;
  name: string;
}

const getImage = (id: string | undefined) => {
    if (!id) return 'https://picsum.photos/seed/placeholder/40/40';
    const image = PlaceHolderImages.find((img) => img.id === id);
    return image ? image.imageUrl : 'https://picsum.photos/seed/placeholder/40/40';
};

// Category Management Dialog
function CategoryDialog({ category, onSave, onClose }: { category?: Category | null, onSave: () => void, onClose: () => void }) {
    const firestore = useFirestore();
    const { toast } = useToast();
    const [name, setName] = useState(category?.name || '');
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async () => {
        if (!name || !firestore) return;
        setIsLoading(true);
        try {
            if (category) {
                // Update existing category
                await updateDoc(doc(firestore, 'categories', category.id), { name });
                toast({ title: "تم تحديث الفئة بنجاح" });
            } else {
                // Add new category
                await addDoc(collection(firestore, 'categories'), { name });
                toast({ title: "تمت إضافة الفئة بنجاح" });
            }
            onSave();
            onClose();
        } catch (error: any) {
            toast({ variant: 'destructive', title: "خطأ", description: error.message });
        } finally {
            setIsLoading(false);
        }
    };
    
    return (
        <DialogContent dir="rtl">
            <DialogHeader>
                <DialogTitle>{category ? 'تعديل الفئة' : 'إضافة فئة جديدة'}</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="name" className="text-right">
                        اسم الفئة
                    </Label>
                    <Input id="name" value={name} onChange={(e) => setName(e.target.value)} className="col-span-3" />
                </div>
            </div>
            <DialogFooter>
                 <Button onClick={onClose} variant="outline">إلغاء</Button>
                <Button onClick={handleSubmit} disabled={isLoading}>
                    {isLoading ? <LoaderCircle className="ml-2 h-4 w-4 animate-spin" /> : (category ? 'حفظ التغييرات' : 'إضافة فئة')}
                </Button>
            </DialogFooter>
        </DialogContent>
    );
}

// Product Management Dialog
function ProductDialog({ product, categories, onSave, onClose }: { product?: Product | null, categories: Category[], onSave: () => void, onClose: () => void }) {
    const firestore = useFirestore();
    const { toast } = useToast();

    const [name, setName] = useState(product?.name || '');
    const [description, setDescription] = useState(product?.description || '');
    const [price, setPrice] = useState(product?.price || 0);
    const [categoryId, setCategoryId] = useState(product?.categoryId || '');
    const [status, setStatus] = useState<'active' | 'draft'>(product?.status || 'active');
    const [imageUrl, setImageUrl] = useState(product?.imageUrl || '');
    
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async () => {
        if (!name || !price || !categoryId || !firestore) {
            toast({ variant: 'destructive', title: "بيانات ناقصة", description: "الرجاء ملء جميع الحقول المطلوبة." });
            return;
        }
        setIsLoading(true);

        const selectedCategory = categories.find(c => c.id === categoryId);

        const productData = {
            name,
            description,
            price: Number(price),
            categoryId,
            category: selectedCategory?.name || '',
            status,
            imageUrl: imageUrl || `https://picsum.photos/seed/${name.replace(/\s/g, '-')}/400/400`,
            imageHint: name,
            updatedAt: serverTimestamp(),
        };

        try {
            if (product) {
                // Update
                await updateDoc(doc(firestore, 'products', product.id), productData);
                toast({ title: "تم تحديث المنتج بنجاح" });
            } else {
                // Create
                await addDoc(collection(firestore, 'products'), { ...productData, createdAt: serverTimestamp() });
                toast({ title: "تمت إضافة المنتج بنجاح" });
            }
            onSave();
            onClose();
        } catch (error: any) {
            toast({ variant: 'destructive', title: "خطأ", description: error.message });
        } finally {
            setIsLoading(false);
        }
    };
    
    return (
         <DialogContent dir="rtl" className="sm:max-w-[425px]">
            <DialogHeader>
                <DialogTitle>{product ? 'تعديل منتج' : 'إضافة منتج جديد'}</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
                <div className="space-y-2">
                    <Label htmlFor="product-name">اسم المنتج</Label>
                    <Input id="product-name" value={name} onChange={(e) => setName(e.target.value)} />
                </div>
                 <div className="space-y-2">
                    <Label htmlFor="product-description">وصف المنتج</Label>
                    <Textarea id="product-description" value={description} onChange={(e) => setDescription(e.target.value)} />
                </div>
                 <div className="grid grid-cols-2 gap-4">
                     <div className="space-y-2">
                        <Label htmlFor="product-price">السعر</Label>
                        <Input id="product-price" type="number" value={price} onChange={(e) => setPrice(Number(e.target.value))} />
                    </div>
                     <div className="space-y-2">
                        <Label htmlFor="product-category">الفئة</Label>
                        <Select value={categoryId} onValueChange={setCategoryId}>
                            <SelectTrigger id="product-category">
                                <SelectValue placeholder="اختر فئة" />
                            </SelectTrigger>
                            <SelectContent>
                                {categories.map(cat => (
                                    <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </div>
                 <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="product-status">الحالة</Label>
                        <Select value={status} onValueChange={(val) => setStatus(val as 'active' | 'draft')}>
                            <SelectTrigger id="product-status">
                                <SelectValue placeholder="اختر الحالة" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="active">نشط</SelectItem>
                                <SelectItem value="draft">مسودة</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                     <div className="space-y-2">
                        <Label htmlFor="product-image">رابط الصورة (اختياري)</Label>
                        <Input id="product-image" value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} placeholder="https://..."/>
                    </div>
                </div>
            </div>
            <DialogFooter>
                <Button onClick={onClose} variant="outline">إلغاء</Button>
                <Button onClick={handleSubmit} disabled={isLoading}>
                    {isLoading ? <LoaderCircle className="ml-2 h-4 w-4 animate-spin" /> : (product ? 'حفظ التغييرات' : 'إضافة منتج')}
                </Button>
            </DialogFooter>
        </DialogContent>
    );
}

export default function ProductsPage() {
    const firestore = useFirestore();
    const { toast } = useToast();

    // Dialog states
    const [isProductDialogOpen, setProductDialogOpen] = useState(false);
    const [isCategoryDialogOpen, setCategoryDialogOpen] = useState(false);
    const [isDeleteDialogOpen, setDeleteDialogOpen] = useState(false);
    
    // Data states
    const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
    const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
    const [itemToDelete, setItemToDelete] = useState<{ type: 'product' | 'category', id: string } | null>(null);
    
    // Firestore data hooks
    const productsQuery = useMemoFirebase(() => firestore ? query(collection(firestore, 'products'), orderBy('name')) : null, [firestore]);
    const categoriesQuery = useMemoFirebase(() => firestore ? query(collection(firestore, 'categories'), orderBy('name')) : null, [firestore]);
    
    const { data: products, isLoading: isLoadingProducts, error: productsError } = useCollection<Product>(productsQuery);
    const { data: categories, isLoading: isLoadingCategories, error: categoriesError } = useCollection<Category>(categoriesQuery);

    const refreshData = () => {
        // Data is real-time, no manual refresh needed.
        // This function can be used to trigger UI updates if necessary, but hooks handle it.
    };

    // Handlers for opening dialogs
    const handleAddProduct = () => {
        setSelectedProduct(null);
        setProductDialogOpen(true);
    };
    const handleEditProduct = (product: Product) => {
        setSelectedProduct(product);
        setProductDialogOpen(true);
    };
    const handleAddCategory = () => {
        setSelectedCategory(null);
        setCategoryDialogOpen(true);
    };
    const handleEditCategory = (category: Category) => {
        setSelectedCategory(category);
        setCategoryDialogOpen(true);
    };

    // Delete handler
    const confirmDelete = (type: 'product' | 'category', id: string) => {
        setItemToDelete({ type, id });
        setDeleteDialogOpen(true);
    };

    const handleDelete = async () => {
        if (!itemToDelete || !firestore) return;
        
        try {
            await deleteDoc(doc(firestore, itemToDelete.type === 'product' ? 'products' : 'categories', itemToDelete.id));
            toast({ title: `تم الحذف بنجاح` });
            setDeleteDialogOpen(false);
            setItemToDelete(null);
        } catch (error: any) {
            toast({ variant: 'destructive', title: "فشل الحذف", description: error.message });
        }
    };


  return (
    <AdminSubPageLayout title="المنتجات والفئات">
        {/* Categories Section */}
        <Card>
            <CardHeader className="flex-row items-center justify-between">
                <div>
                    <CardTitle>الفئات</CardTitle>
                    <CardDescription>إدارة فئات المنتجات.</CardDescription>
                </div>
                <Button size="sm" className="h-8 gap-1" onClick={handleAddCategory}>
                    <PlusCircle className="h-3.5 w-3.5" />
                    <span>إضافة فئة</span>
                </Button>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>اسم الفئة</TableHead>
                            <TableHead><span className="sr-only">الإجراءات</span></TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoadingCategories ? (
                            <TableRow><TableCell colSpan={2} className="h-24 text-center">جاري تحميل الفئات...</TableCell></TableRow>
                        ) : categories?.length ? (
                            categories.map((cat) => (
                                <TableRow key={cat.id}>
                                    <TableCell className="font-medium">{cat.name}</TableCell>
                                    <TableCell className="text-left">
                                        <div className="flex gap-2 justify-end">
                                            <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => handleEditCategory(cat)}>
                                                <Edit className="h-4 w-4" />
                                            </Button>
                                            <Button variant="destructive" size="icon" className="h-8 w-8" onClick={() => confirmDelete('category', cat.id)}>
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))
                        ) : (
                            <TableRow><TableCell colSpan={2} className="h-24 text-center">لا توجد فئات.</TableCell></TableRow>
                        )}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
      
      {/* Products Section */}
      <Card className="mt-6">
        <CardHeader className="flex-row items-center justify-between">
            <div>
              <CardTitle>قائمة المنتجات</CardTitle>
              <CardDescription>إدارة المنتجات، الفئات، والأسعار.</CardDescription>
            </div>
            <Button size="sm" className="h-8 gap-1" onClick={handleAddProduct}>
                <PlusCircle className="h-3.5 w-3.5" />
                <span>إضافة منتج</span>
            </Button>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="hidden w-[100px] sm:table-cell">صورة</TableHead>
                <TableHead>الاسم</TableHead>
                <TableHead>الحالة</TableHead>
                <TableHead>الفئة</TableHead>
                <TableHead>السعر</TableHead>
                <TableHead><span className="sr-only">الإجراءات</span></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoadingProducts ? (
                <TableRow><TableCell colSpan={6} className="h-24 text-center">جاري تحميل المنتجات...</TableCell></TableRow>
              ) : products?.length ? (
                products.map((product) => (
                    <TableRow key={product.id}>
                    <TableCell className="hidden sm:table-cell">
                        <Image
                        alt="صورة المنتج"
                        className="aspect-square rounded-md object-cover"
                        height="40"
                        src={product.imageUrl || getImage(product.imageHint)}
                        width="40"
                        data-ai-hint={product.imageHint || product.name}
                        />
                    </TableCell>
                    <TableCell className="font-medium">{product.name}</TableCell>
                    <TableCell>
                        <Badge variant={product.status === 'active' ? 'default' : 'outline'}>
                        {product.status === 'active' ? 'نشط' : 'مسودة'}
                        </Badge>
                    </TableCell>
                    <TableCell>{product.category}</TableCell>
                    <TableCell>{product.price.toFixed(2)} د.ل</TableCell>
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
                            <DropdownMenuItem onSelect={() => handleEditProduct(product)}>تعديل</DropdownMenuItem>
                            <DropdownMenuItem onSelect={() => confirmDelete('product', product.id)} className="text-destructive">حذف</DropdownMenuItem>
                        </DropdownMenuContent>
                        </DropdownMenu>
                    </TableCell>
                    </TableRow>
                ))
              ) : (
                <TableRow><TableCell colSpan={6} className="h-24 text-center">لا توجد منتجات.</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      
      {/* Dialogs */}
      <Dialog open={isProductDialogOpen} onOpenChange={setProductDialogOpen}>
          {isProductDialogOpen && <ProductDialog product={selectedProduct} categories={categories || []} onSave={refreshData} onClose={() => setProductDialogOpen(false)} />}
      </Dialog>

      <Dialog open={isCategoryDialogOpen} onOpenChange={setCategoryDialogOpen}>
          {isCategoryDialogOpen && <CategoryDialog category={selectedCategory} onSave={refreshData} onClose={() => setCategoryDialogOpen(false)} />}
      </Dialog>
      
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent dir="rtl">
            <AlertDialogHeader>
                <AlertDialogTitle>هل أنت متأكد؟</AlertDialogTitle>
                <AlertDialogDescription>
                    هذا الإجراء لا يمكن التراجع عنه. سيؤدي هذا إلى حذف العنصر نهائيًا.
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
    </AdminSubPageLayout>
  );
}

