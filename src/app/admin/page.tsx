'use client';

import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Box, Users, ShoppingBag, CreditCard, ImageIcon, Settings } from 'lucide-react';
import AdminSubPageLayout from './layout';


const dashboardItems = [
    { href: '/admin/products', title: 'المنتجات', description: 'إدارة المنتجات والفئات.', icon: Box },
    { href: '/admin/users', title: 'المستخدمون', description: 'عرض وإدارة حسابات المستخدمين.', icon: Users },
    { href: '/admin/orders', title: 'الطلبات', description: 'عرض الطلبات الواردة والسلات.', icon: ShoppingBag },
    { href: '/admin/cards', title: 'البطاقات', description: 'إدارة بطاقات الدفع.', icon: CreditCard },
    { href: '/admin/banners', title: 'البنرات الإعلانية', description: 'التحكم في البنرات والعروض.', icon: ImageIcon },
    { href: '/admin/settings', title: 'الإعدادات', description: 'إعدادات لوحة التحكم.', icon: Settings },
];

export default function AdminPage() {
  return (
    <AdminSubPageLayout title="الرئيسية">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {dashboardItems.map((item) => (
          <Link href={item.href} key={item.title}>
              <Card className="hover:bg-muted/50 transition-colors bg-muted/20 border-border">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-lg font-medium">{item.title}</CardTitle>
                      <item.icon className="h-6 w-6 text-primary" />
                  </CardHeader>
                  <CardContent>
                      <p className="text-sm text-muted-foreground">{item.description}</p>
                  </CardContent>
              </Card>
          </Link>
        ))}
      </div>
    </AdminSubPageLayout>
  );
}
