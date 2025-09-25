
'use client';

import { useState } from 'react';
import AdminSubPageLayout from '../layout';
import { Button } from '@/components/ui/button';
import { PlusCircle, MoreHorizontal, File, ListFilter } from 'lucide-react';
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
  DropdownMenuCheckboxItem,
} from '@/components/ui/dropdown-menu';
import Image from 'next/image';
import { PlaceHolderImages } from '@/lib/placeholder-images';

const products = [
    { id: 'prod-001', name: 'لبن جهينة كامل الدسم', price: 25.50, status: 'active', category: 'ألبان', image: 'category-dairy' },
    { id: 'prod-002', name: 'بيض أبيض (10 قطع)', price: 45.00, status: 'active', category: 'بيض', image: 'category-eggs' },
    { id: 'prod-003', name: 'خبز بلدي (5 أرغفة)', price: 5.00, status: 'archived', category: 'مخبوزات', image: 'category-bakery' },
    { id: 'prod-004', name: 'قهوة بريدفاست', price: 150.00, status: 'active', category: 'مشروبات', image: 'category-coffee' },
    { id: 'prod-005', name: 'آيس كريم فراولة', price: 35.00, status: 'draft', category: 'حلويات', image: 'category-sweets' },
];

const getImage = (id: string) => {
    const image = PlaceHolderImages.find((img) => img.id === id);
    return image ? image.imageUrl : 'https://picsum.photos/seed/placeholder/40/40';
};

export default function ProductsPage() {
  return (
    <AdminSubPageLayout title="المنتجات">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="h-8 gap-1">
                    <ListFilter className="h-3.5 w-3.5" />
                    <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
                    فلترة
                    </span>
                </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" dir="rtl">
                <DropdownMenuLabel>فلترة حسب</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuCheckboxItem checked>
                    نشط
                </DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem>مسودة</DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem>
                    مؤرشف
                </DropdownMenuCheckboxItem>
                </DropdownMenuContent>
            </DropdownMenu>
            <Button size="sm" variant="outline" className="h-8 gap-1">
                <File className="h-3.5 w-3.5" />
                <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
                تصدير
                </span>
            </Button>
        </div>
        <Button size="sm" className="h-8 gap-1">
          <PlusCircle className="h-3.5 w-3.5" />
          <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
            إضافة منتج
          </span>
        </Button>
      </div>

      <Card className="mt-4">
        <CardHeader>
          <CardTitle>قائمة المنتجات</CardTitle>
          <CardDescription>
            إدارة المنتجات، الفئات، والأسعار.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="hidden w-[100px] sm:table-cell">
                  <span className="sr-only">صورة</span>
                </TableHead>
                <TableHead>الاسم</TableHead>
                <TableHead>الحالة</TableHead>
                <TableHead className="hidden md:table-cell">السعر</TableHead>
                <TableHead className="hidden md:table-cell">الفئة</TableHead>
                <TableHead>
                  <span className="sr-only">الإجراءات</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {products.map((product) => (
                <TableRow key={product.id}>
                  <TableCell className="hidden sm:table-cell">
                    <Image
                      alt="صورة المنتج"
                      className="aspect-square rounded-md object-cover"
                      height="40"
                      src={getImage(product.image)}
                      width="40"
                      data-ai-hint={product.image}
                    />
                  </TableCell>
                  <TableCell className="font-medium">{product.name}</TableCell>
                  <TableCell>
                    <Badge variant={product.status === 'active' ? 'default' : 'outline'}>
                      {product.status === 'active' ? 'نشط' : (product.status === 'draft' ? 'مسودة' : 'مؤرشف')}
                    </Badge>
                  </TableCell>
                  <TableCell className="hidden md:table-cell">{product.price.toFixed(2)} د.ل</TableCell>
                  <TableCell className="hidden md:table-cell">
                    {product.category}
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
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </AdminSubPageLayout>
  );
}
