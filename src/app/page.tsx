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
  const clickTimeout = useRef<NodeJS.Timeout | null>(null);
  const longPressTimeout = useRef<NodeJS.Timeout | null>(null);
  const clickCount = useRef(0);

  const handleLogoClick = () => {
    clickCount.current += 1;

    if (clickCount.current === 1) {
      clickTimeout.current = setTimeout(() => {
        clickCount.current = 0;
      }, 300); // 300ms window for double click
    } else if (clickCount.current === 2) {
      if(clickTimeout.current) clearTimeout(clickTimeout.current);
    }
  };

  const handleLogoMouseDown = () => {
    if (clickCount.current >= 2) {
      longPressTimeout.current = setTimeout(() => {
        router.push('/admin/login');
        clickCount.current = 0;
      }, 1000); // 1 second long press
    }
  };

  const handleLogoMouseUp = () => {
    if (longPressTimeout.current) {
      clearTimeout(longPressTimeout.current);
    }
    if (clickCount.current >= 2) {
        setTimeout(() => {
            clickCount.current = 0;
        }, 300)
    }
  };


  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/40 p-4" dir="rtl">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
            <div
                className="mb-4 flex justify-center"
                onClick={handleLogoClick}
                onMouseDown={handleLogoMouseDown}
                onMouseUp={handleLogoMouseUp}
                onTouchStart={handleLogoMouseDown}
                onTouchEnd={handleLogoMouseUp}
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
