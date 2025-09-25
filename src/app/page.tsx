'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Logo } from '@/components/icons';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/firebase';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { LoaderCircle } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const { toast } = useToast();
  const auth = useAuth();

  const [contractNumber, setContractNumber] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLoginAttempt = async () => {
    setIsLoading(true);
    if (!auth) {
        toast({
            variant: 'destructive',
            title: 'خطأ في التهيئة',
            description: 'لم يتم تهيئة خدمات Firebase بعد.',
        });
        setIsLoading(false);
        return;
    }
    const email = contractNumber.includes('@') ? contractNumber : `${contractNumber}@huwiyasys.app`;

    try {
      // Only attempt to sign in. User creation is handled by the admin panel.
      await signInWithEmailAndPassword(auth, email, password);
      toast({
        title: 'تم تسجيل الدخول بنجاح',
      });
      if (email === 'admin@huwiyasys.app') {
        router.push('/admin');
      } else {
        router.push('/shop');
      }
    } catch (error: any) {
        // Handle all login errors with a single, clear message.
        console.error('Login Error:', error);
        toast({
            variant: 'destructive',
            title: 'فشل تسجيل الدخول',
            description: 'رقم العقد أو كلمة المرور غير صحيحة.',
        });
    } finally {
        setIsLoading(false);
    }
  };
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!contractNumber || !password) {
        toast({
            variant: 'destructive',
            title: 'بيانات ناقصة',
            description: 'الرجاء إدخال رقم العقد وكلمة المرور.',
        });
        return;
    }
    handleLoginAttempt();
  }


  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/40 p-4" dir="rtl">
      <Card className="w-full max-w-sm">
        <form onSubmit={handleSubmit}>
            <CardHeader className="text-center">
                <div className="mb-4 flex justify-center">
                    <Logo className="h-12 w-12 text-primary" />
                </div>
                <CardTitle className="text-2xl">مرحباً بك</CardTitle>
                <CardDescription>سجل الدخول للمتابعة.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="space-y-2">
                <Label htmlFor="contract-number">رقم العقد</Label>
                <Input
                    id="contract-number"
                    type="text"
                    placeholder="أدخل رقم العقد"
                    required
                    value={contractNumber}
                    onChange={(e) => setContractNumber(e.target.value)}
                    disabled={isLoading}
                />
                </div>
                <div className="space-y-2">
                <Label htmlFor="password">كلمة المرور</Label>
                <Input
                    id="password"
                    type="password"
                    required
                    placeholder="أدخل كلمة المرور"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={isLoading}
                />
                </div>
            </CardContent>
            <CardFooter className="flex-col gap-4">
                <Button type="submit" className="w-full" disabled={isLoading || !auth}>
                    {isLoading && <LoaderCircle className="ml-2 h-4 w-4 animate-spin" />}
                    {isLoading ? 'جاري...' : 'تسجيل الدخول'}
                </Button>
            </CardFooter>
        </form>
      </Card>
    </div>
  );
}
    