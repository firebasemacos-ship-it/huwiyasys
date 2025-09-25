
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useUser } from '@/firebase';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { LayoutDashboard, LogOut, Settings, Image as ImageIcon, Box, Users, ShoppingBag, CreditCard } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getAuth, signOut } from 'firebase/auth';
import { Logo } from '@/components/icons';

const dashboardItems = [
    { href: '/admin/products', title: 'المنتجات', description: 'إدارة المنتجات والفئات.', icon: Box },
    { href: '/admin/users', title: 'المستخدمون', description: 'عرض وإدارة حسابات المستخدمين.', icon: Users },
    { href: '/admin/orders', title: 'الطلبات', description: 'عرض الطلبات الواردة والسلات.', icon: ShoppingBag },
    { href: '/admin/cards', title: 'البطاقات', description: 'إدارة بطاقات الدفع.', icon: CreditCard },
    { href: '/admin/banners', title: 'البنرات الإعلانية', description: 'التحكم في البنرات والعروض.', icon: ImageIcon },
    { href: '/admin/settings', title: 'الإعدادات', description: 'إعدادات لوحة التحكم.', icon: Settings },
];

function AdminDashboard() {
  const { user, isUserLoading } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (!isUserLoading && !user) {
      router.replace('/');
    }
    if (!isUserLoading && user && user.email !== 'admin@huwiyasys.app') {
        router.replace('/');
    }
  }, [user, isUserLoading, router]);

  const handleLogout = async () => {
    const auth = getAuth();
    await signOut(auth);
    router.push('/');
  };

  if (isUserLoading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <p>جاري التحميل...</p>
      </div>
    );
  }

  return (
    <div className="dark min-h-screen bg-background" dir="rtl">
       <aside className="fixed inset-y-0 right-0 z-10 hidden w-64 flex-col border-l bg-muted/40 sm:flex">
        <div className="flex h-16 items-center border-b px-6">
            <Link href="/admin" className="flex items-center gap-3 font-semibold text-primary">
                <Logo className="h-8 w-8" />
                <span className="text-lg">لوحة التحكم</span>
            </Link>
        </div>
        <nav className="flex-1 space-y-1 p-4">
            <Link href="/admin" className="flex items-center gap-3 rounded-lg bg-accent px-3 py-2 text-primary-foreground transition-all hover:text-primary-foreground">
                <LayoutDashboard className="h-4 w-4" />
                الرئيسية
            </Link>
            {dashboardItems.map((item) => (
                 <Link key={item.title} href={item.href} className="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary-foreground">
                    <item.icon className="h-4 w-4" />
                    {item.title}
                </Link>
            ))}
        </nav>
        <div className="mt-auto p-4">
            <Button variant="ghost" onClick={handleLogout} className="w-full justify-start gap-3">
                <LogOut className="h-4 w-4" />
                تسجيل الخروج
            </Button>
        </div>
      </aside>

      <main className="flex flex-1 flex-col gap-4 p-4 sm:mr-64 lg:gap-6 lg:p-6">
        <header className="flex h-16 items-center justify-between sm:justify-end">
            <Link href="/admin" className="flex items-center gap-2 font-semibold sm:hidden text-primary">
                <Logo className="h-8 w-8" />
                <span className="text-lg">لوحة التحكم</span>
            </Link>
        </header>
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
      </main>
    </div>
  );
}

export default function AdminPage() {
    return <AdminDashboard />
}
