'use client';

import { useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Logo } from '@/components/icons';

export default function UserLoginPage() {
  const router = useRouter();
  const clickCount = useRef(0);
  const resetTimeout = useRef<NodeJS.Timeout | null>(null);

  const handleLogoClick = () => {
    // Clear the previous timeout if it exists
    if (resetTimeout.current) {
      clearTimeout(resetTimeout.current);
    }

    clickCount.current += 1;

    if (clickCount.current >= 15) {
      router.push('/admin/login');
      clickCount.current = 0; // Reset after navigation
    } else {
      // Reset the counter if there's no click for 1 second
      resetTimeout.current = setTimeout(() => {
        clickCount.current = 0;
      }, 1000);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/40 p-4" dir="rtl">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
            <div
                className="mb-4 flex justify-center"
                onClick={handleLogoClick}
            >
                <Logo className="h-12 w-12 text-primary cursor-pointer" />
            </div>
            <CardTitle className="text-2xl">مرحباً بك</CardTitle>
            <CardDescription>سجل الدخول أو أنشئ حساباً للمتابعة.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">البريد الإلكتروني</Label>
              <Input
                id="email"
                type="email"
                placeholder="user@example.com"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">كلمة المرور</Label>
              <Input
                id="password"
                type="password"
                required
              />
            </div>
        </CardContent>
        <CardFooter className="flex-col gap-4">
            <Button className="w-full">
              تسجيل الدخول
            </Button>
            <Button variant="outline" className="w-full">
              إنشاء حساب جديد
            </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
