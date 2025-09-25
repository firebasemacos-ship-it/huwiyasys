
'use client';

import { useEffect, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useUser } from '@/firebase';
import { Button } from '@/components/ui/button';
import { getAuth, signOut } from 'firebase/auth';
import { LayoutDashboard, LogOut, Menu, Box, Users, ShoppingBag, CreditCard, Image as ImageIcon, Settings } from 'lucide-react';
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Logo } from '@/components/icons';

const dashboardItems = [
    { href: '/admin/products', title: 'المنتجات', icon: Box },
    { href: '/admin/users', title: 'المستخدمون', icon: Users },
    { href: '/admin/orders', title: 'الطلبات', icon: ShoppingBag },
    { href: '/admin/cards', title: 'البطاقات', icon: CreditCard },
    { href: '/admin/banners', title: 'البنرات الإعلانية', icon: ImageIcon },
    { href: '/admin/settings', title: 'الإعدادات', icon: Settings },
];

export default function AdminSubPageLayout({ children, title }: { children: ReactNode, title: string }) {
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
    <div className="dark grid min-h-screen w-full md:grid-cols-[220px_1fr] lg:grid-cols-[280px_1fr] bg-background text-foreground" dir="rtl">
      <div className="hidden border-l bg-muted/40 md:block">
        <div className="flex h-full max-h-screen flex-col gap-2">
          <div className="flex h-14 items-center border-b px-4 lg:h-[60px] lg:px-6">
            <Link href="/admin" className="flex items-center gap-3 font-semibold text-primary">
              <Logo className="h-8 w-8" />
              <span className="text-lg">لوحة التحكم</span>
            </Link>
          </div>
          <div className="flex-1">
            <nav className="grid items-start px-2 text-sm font-medium lg:px-4">
              <Link href="/admin" className="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary">
                <LayoutDashboard className="h-4 w-4" />
                الرئيسية
              </Link>
              {dashboardItems.map(item => (
                <Link key={item.title} href={item.href} className="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary">
                  <item.icon className="h-4 w-4" />
                  {item.title}
                </Link>
              ))}
            </nav>
          </div>
          <div className="mt-auto p-4">
             <Button variant="ghost" onClick={handleLogout} className="w-full justify-start gap-3">
                <LogOut className="h-4 w-4" />
                تسجيل الخروج
            </Button>
          </div>
        </div>
      </div>
      <div className="flex flex-col">
        <header className="flex h-14 items-center gap-4 border-b bg-muted/40 px-4 lg:h-[60px] lg:px-6">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon" className="shrink-0 md:hidden">
                <Menu className="h-5 w-5" />
                <span className="sr-only">Toggle navigation menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="flex flex-col bg-background">
              <nav className="grid gap-2 text-lg font-medium">
                <Link href="/admin" className="flex items-center gap-3 text-lg font-semibold mb-4 text-primary">
                  <Logo className="h-8 w-8" />
                  <span>لوحة التحكم</span>
                </Link>
                <Link href="/admin" className="mx-[-0.65rem] flex items-center gap-4 rounded-xl px-3 py-2 text-muted-foreground hover:text-foreground">
                    <LayoutDashboard className="h-5 w-5" />
                    الرئيسية
                </Link>
                 {dashboardItems.map(item => (
                    <Link key={item.title} href={item.href} className="mx-[-0.65rem] flex items-center gap-4 rounded-xl px-3 py-2 text-muted-foreground hover:text-foreground">
                      <item.icon className="h-5 w-5" />
                      {item.title}
                    </Link>
                ))}
              </nav>
               <div className="mt-auto">
                <Button variant="ghost" onClick={handleLogout} className="w-full justify-start gap-3">
                    <LogOut className="h-5 w-5" />
                    تسجيل الخروج
                </Button>
              </div>
            </SheetContent>
          </Sheet>
          <div className="w-full flex-1">
             <h1 className="text-lg font-semibold md:text-2xl">{title}</h1>
          </div>
        </header>
        <main className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
