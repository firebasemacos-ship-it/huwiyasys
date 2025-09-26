
'use client';

import { useState } from 'react';
import AdminSubPageLayout from '../layout';
import { Button } from '@/components/ui/button';
import { MoreHorizontal, Truck, CheckCircle } from 'lucide-react';
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
import { useToast } from '@/hooks/use-toast';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, doc, updateDoc, DocumentData, query, orderBy } from 'firebase/firestore';
import Image from 'next/image';

interface OrderItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
}

interface Order extends DocumentData {
  id: string;
  userName: string;
  items: OrderItem[];
  totalAmount: number;
  status: 'pending' | 'processing' | 'completed' | 'cancelled';
  createdAt: any;
  paymentMethod: string;
}


export default function OrdersPage() {
    const firestore = useFirestore();
    const { toast } = useToast();

    const ordersQuery = useMemoFirebase(() => firestore ? query(collection(firestore, 'orders'), orderBy('createdAt', 'desc')) : null, [firestore]);
    const { data: orders, isLoading, error } = useCollection<Order>(ordersQuery);

    const updateOrderStatus = async (orderId: string, status: Order['status']) => {
        if (!firestore) return;
        const orderRef = doc(firestore, 'orders', orderId);
        try {
            await updateDoc(orderRef, { status });
            toast({ title: 'تم تحديث حالة الطلب بنجاح' });
        } catch (err) {
            console.error("Error updating order status:", err);
            toast({ variant: 'destructive', title: 'فشل تحديث الحالة', description: (err as Error).message });
        }
    };
    
    const getStatusVariant = (status: Order['status']) => {
        switch (status) {
            case 'completed': return 'default';
            case 'processing': return 'secondary';
            case 'cancelled': return 'destructive';
            default: return 'outline';
        }
    }
    const getStatusText = (status: Order['status']) => {
        switch (status) {
            case 'pending': return 'قيد الانتظار';
            case 'processing': return 'قيد المعالجة';
            case 'completed': return 'مكتمل';
            case 'cancelled': return 'ملغي';
            default: return status;
        }
    }


  return (
    <AdminSubPageLayout title="إدارة الطلبات">
        <Card>
            <CardHeader>
                <CardTitle>قائمة الطلبات</CardTitle>
                <CardDescription>عرض وإدارة الطلبات الواردة من المستخدمين.</CardDescription>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>الزبون</TableHead>
                            <TableHead>الحالة</TableHead>
                            <TableHead>تاريخ الطلب</TableHead>
                            <TableHead className="text-right">المبلغ الإجمالي</TableHead>
                            <TableHead><span className="sr-only">الإجراءات</span></TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            <TableRow><TableCell colSpan={5} className="h-24 text-center">جاري تحميل الطلبات...</TableCell></TableRow>
                        ) : orders?.length ? (
                            orders.map((order) => (
                                <TableRow key={order.id}>
                                    <TableCell className="font-medium">{order.userName}</TableCell>
                                    <TableCell>
                                        <Badge variant={getStatusVariant(order.status)}>
                                            {getStatusText(order.status)}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>{order.createdAt?.toDate().toLocaleDateString('ar-LY')}</TableCell>
                                    <TableCell className="text-right font-mono">{order.totalAmount.toFixed(2)} د.ل</TableCell>
                                    <TableCell>
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button aria-haspopup="true" size="icon" variant="ghost">
                                                    <MoreHorizontal className="h-4 w-4" />
                                                    <span className="sr-only">Toggle menu</span>
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end" dir="rtl">
                                                <DropdownMenuLabel>تغيير الحالة</DropdownMenuLabel>
                                                <DropdownMenuItem onSelect={() => updateOrderStatus(order.id, 'processing')}>
                                                    <Truck className="ml-2 h-4 w-4" />
                                                    <span>قيد المعالجة</span>
                                                </DropdownMenuItem>
                                                <DropdownMenuItem onSelect={() => updateOrderStatus(order.id, 'completed')}>
                                                    <CheckCircle className="ml-2 h-4 w-4" />
                                                    <span>مكتمل</span>
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </TableCell>
                                </TableRow>
                            ))
                        ) : (
                            <TableRow><TableCell colSpan={5} className="h-24 text-center">لا توجد طلبات لعرضها.</TableCell></TableRow>
                        )}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    </AdminSubPageLayout>
  );
}

    