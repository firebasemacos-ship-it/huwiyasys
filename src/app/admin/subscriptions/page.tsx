
'use client';

import { useState } from 'react';
import AdminSubPageLayout from '../layout';
import { Button } from '@/components/ui/button';
import { MoreHorizontal, CheckCircle, XCircle } from 'lucide-react';
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

interface Subscription extends DocumentData {
  id: string;
  userName: string;
  planName: string;
  status: 'active' | 'cancelled' | 'expired';
  endDate: any;
  createdAt: any;
}


export default function SubscriptionsPage() {
    const firestore = useFirestore();
    const { toast } = useToast();

    const subscriptionsQuery = useMemoFirebase(() => firestore ? query(collection(firestore, 'subscriptions'), orderBy('createdAt', 'desc')) : null, [firestore]);
    const { data: subscriptions, isLoading, error } = useCollection<Subscription>(subscriptionsQuery);

    const updateSubscriptionStatus = async (subscriptionId: string, status: Subscription['status']) => {
        if (!firestore) return;
        const subscriptionRef = doc(firestore, 'subscriptions', subscriptionId);
        try {
            await updateDoc(subscriptionRef, { status });
            toast({ title: 'تم تحديث حالة الاشتراك بنجاح' });
        } catch (err) {
            console.error("Error updating subscription status:", err);
            toast({ variant: 'destructive', title: 'فشل تحديث الحالة', description: (err as Error).message });
        }
    };
    
    const getStatusVariant = (status: Subscription['status']) => {
        switch (status) {
            case 'active': return 'default';
            case 'expired': return 'secondary';
            case 'cancelled': return 'destructive';
            default: return 'outline';
        }
    }
    const getStatusText = (status: Subscription['status']) => {
        switch (status) {
            case 'active': return 'نشط';
            case 'expired': return 'منتهي';
            case 'cancelled': return 'ملغي';
            default: return status;
        }
    }


  return (
    <AdminSubPageLayout title="إدارة الاشتراكات">
        <Card>
            <CardHeader>
                <CardTitle>قائمة الاشتراكات</CardTitle>
                <CardDescription>عرض وإدارة اشتراكات المستخدمين.</CardDescription>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>المشترك</TableHead>
                            <TableHead>الخطة</TableHead>
                            <TableHead>الحالة</TableHead>
                            <TableHead>تاريخ الانتهاء</TableHead>
                            <TableHead><span className="sr-only">الإجراءات</span></TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            <TableRow><TableCell colSpan={5} className="h-24 text-center">جاري تحميل الاشتراكات...</TableCell></TableRow>
                        ) : subscriptions?.length ? (
                            subscriptions.map((sub) => (
                                <TableRow key={sub.id}>
                                    <TableCell className="font-medium">{sub.userName}</TableCell>
                                    <TableCell>{sub.planName}</TableCell>
                                    <TableCell>
                                        <Badge variant={getStatusVariant(sub.status)}>
                                            {getStatusText(sub.status)}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>{sub.endDate?.toDate().toLocaleDateString('ar-LY')}</TableCell>
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
                                                <DropdownMenuItem onSelect={() => updateSubscriptionStatus(sub.id, 'active')}>
                                                    <CheckCircle className="ml-2 h-4 w-4" />
                                                    <span>تنشيط</span>
                                                </DropdownMenuItem>
                                                <DropdownMenuItem onSelect={() => updateSubscriptionStatus(sub.id, 'cancelled')} className="text-destructive">
                                                    <XCircle className="ml-2 h-4 w-4" />
                                                    <span>إلغاء</span>
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </TableCell>
                                </TableRow>
                            ))
                        ) : (
                            <TableRow><TableCell colSpan={5} className="h-24 text-center">لا توجد اشتراكات لعرضها.</TableCell></TableRow>
                        )}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    </AdminSubPageLayout>
  );
}
