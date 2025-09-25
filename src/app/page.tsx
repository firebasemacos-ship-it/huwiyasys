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
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { LoaderCircle } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const { toast } = useToast();
  const auth = useAuth();

  const [contractNumber, setContractNumber] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);

  const handleLogin = async () => {
    setIsLoading(true);
    const email = contractNumber.includes('@') ? contractNumber : `${contractNumber}@huwiyasys.app`;

    try {
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
       if (error.code === 'auth/user-not-found' || error.code === 'auth/invalid-credential') {
          toast({
            variant: 'destructive',
            title: 'فشل تسجيل الدخول',
            description: 'رقم العقد أو كلمة المرور غير صحيحة.',
          });
       } else {
         console.error('Login Error:', error);
         toast({
            variant: 'destructive',
            title: 'فشل تسجيل الدخول',
            description: error.message || 'حدث خطأ غير متوقع.',
         });
       }
    } finally {
        setIsLoading(false);
    }
  };

  const handleRegister = async () => {
    setIsLoading(true);
    const email = `${contractNumber}@huwiyasys.app`;
    try {
        await createUserWithEmailAndPassword(auth, email, password);
        toast({
            title: 'تم إنشاء الحساب بنجاح',
            description: 'جاري تسجيل دخولك...',
        });
        // Automatically sign in after registration
        await handleLogin();
    } catch (error: any) {
        if (error.code === 'auth/email-already-in-use') {
             toast({
                variant: 'destructive',
                title: 'فشل إنشاء الحساب',
                description: 'رقم العقد هذا مستخدم بالفعل.',
            });
        } else {
            console.error('Registration Error:', error);
            toast({
                variant: 'destructive',
                title: 'فشل إنشاء الحساب',
                description: error.message || 'حدث خطأ غير متوقع.',
            });
        }
    } finally {
        setIsLoading(false);
    }
  };
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isRegistering) {
        // Registration for regular users should be handled by admin,
        // so we can disable this or limit it. For now, we allow it for testing.
        handleRegister();
    } else {
        handleLogin();
    }
  }


  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/40 p-4" dir="rtl">
      <Card className="w-full max-w-sm">
        <form onSubmit={handleSubmit}>
            <CardHeader className="text-center">
                <div className="mb-4 flex justify-center">
                    <Logo className="h-12 w-12 text-primary" />
                </div>
                <CardTitle className="text-2xl">{isRegistering ? 'إنشاء حساب جديد' : 'مرحباً بك'}</CardTitle>
                <CardDescription>{isRegistering ? 'أدخل بياناتك للمتابعة.' : 'سجل الدخول للمتابعة.'}</CardDescription>
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
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={isLoading}
                />
                </div>
            </CardContent>
            <CardFooter className="flex-col gap-4">
                <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading && <LoaderCircle className="ml-2 h-4 w-4 animate-spin" />}
                    {isLoading ? 'جاري...' : (isRegistering ? 'إنشاء حساب' : 'تسجيل الدخول')}
                </Button>
                 {/* Hiding Register button as users are created by admin */}
                 {/*
                <Button 
                    type="button" 
                    variant="outline" 
                    className="w-full" 
                    onClick={() => setIsRegistering(!isRegistering)}
                    disabled={isLoading}
                >
                    {isRegistering ? 'هل لديك حساب؟ تسجيل الدخول' : 'إنشاء حساب جديد'}
                </Button>
                */}
            </CardFooter>
        </form>
      </Card>
    </div>
  );
}
