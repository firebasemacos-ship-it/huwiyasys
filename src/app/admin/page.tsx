
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@/firebase';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { LayoutDashboard, ShoppingBag, Users, CreditCard, Ticket, LogOut, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getAuth, signOut } from 'firebase/auth';

function AdminDashboard() {
  const { user, isUserLoading } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (!isUserLoading && !user) {
      router.replace('/admin/login');
    }
    // A simple check to see if the logged in user is the admin
    if (!isUserLoading && user && user.email !== 'admin@huwiyasys.app') {
        router.replace('/admin/login');
    }
  }, [user, isUserLoading, router]);

  const handleLogout = async () => {
    const auth = getAuth();
    await signOut(auth);
    router.push('/admin/login');
  };

  if (isUserLoading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p>جاري التحميل...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/40" dir="rtl">
       <aside className="fixed inset-y-0 right-0 z-10 hidden w-64 flex-col border-l bg-background sm:flex">
        <div className="flex h-16 items-center border-b px-6">
            <h1 className="text-lg font-bold">لوحة التحكم</h1>
        </div>
        <nav className="flex-1 space-y-2 p-4">
            <a href="#" className="flex items-center gap-3 rounded-lg bg-muted px-3 py-2 text-primary transition-all hover:text-primary">
                <LayoutDashboard className="h-4 w-4" />
                الرئيسية
            </a>
            {/* Add other nav links here */}
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
            <h1 className="text-lg font-semibold md:text-2xl sm:hidden">لوحة التحكم</h1>
        </header>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle>المنتجات</CardTitle>
              <CardDescription>إدارة المنتجات والفئات.</CardDescription>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>المستخدمون</CardTitle>
              <CardDescription>عرض وإدارة حسابات المستخدمين.</CardDescription>
            </CardHeader>
          </Card>
           <Card>
            <CardHeader>
              <CardTitle>الطلبات</CardTitle>
              <CardDescription>عرض الطلبات الواردة والسلات.</CardDescription>
            </CardHeader>
          </Card>
           <Card>
            <CardHeader>
              <CardTitle>البطاقات</CardTitle>
              <CardDescription>إدارة بطاقات الدفع.</CardDescription>
            </CardHeader>
          </Card>
           <Card>
            <CardHeader>
              <CardTitle>البنرات الإعلانية</CardTitle>
              <CardDescription>التحكم في البنرات والعروض.</CardDescription>
            </CardHeader>
          </Card>
           <Card>
            <CardHeader>
              <CardTitle>الإعدادات</CardTitle>
              <CardDescription>إعدادات لوحة التحكم.</CardDescription>
            </CardHeader>
          </Card>
        </div>
      </main>
    </div>
  );
}

export default function AdminPage() {
    return <AdminDashboard />
}

    