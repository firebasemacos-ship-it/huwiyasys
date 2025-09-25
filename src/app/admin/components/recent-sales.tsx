'use client';

import {
    Avatar,
    AvatarFallback,
    AvatarImage,
} from '@/components/ui/avatar';

export function RecentSales() {
    const salesData = [
        { name: 'علي محمد', email: 'ali.m@example.com', amount: '1,999.00' },
        { name: 'فاطمة حسن', email: 'fatima.h@example.com', amount: '399.00' },
        { name: 'خالد عبد الله', email: 'khaled.a@example.com', amount: '299.00' },
        { name: 'سارة إبراهيم', email: 'sara.i@example.com', amount: '99.00' },
        { name: 'يوسف أحمد', email: 'youssef.a@example.com', amount: '39.00' },
    ];

    return (
        <div className="space-y-8">
            {salesData.map((sale, index) => (
                <div key={index} className="flex items-center">
                    <Avatar className="h-9 w-9">
                        <AvatarImage src={`https://i.pravatar.cc/150?u=${sale.email}`} alt="Avatar" />
                        <AvatarFallback>{sale.name.substring(0, 2).toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <div className="ml-4 space-y-1">
                        <p className="text-sm font-medium leading-none">{sale.name}</p>
                        <p className="text-sm text-muted-foreground">{sale.email}</p>
                    </div>
                    <div className="ml-auto font-medium text-right">+{sale.amount} د.ل</div>
                </div>
            ))}
        </div>
    );
}
