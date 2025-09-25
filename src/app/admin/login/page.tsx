'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useAuth, useFirestore } from '@/firebase';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, User } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { Logo } from '@/components/icons';
import { LoaderCircle } from 'lucide-react';

export default function AdminLoginPage() {
  const [email, setEmail] = useState('admin@tamweelsys.app');
  const [password, setPassword] = useState('0920064400');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { toast } = useToast();
  const auth = useAuth();
  const firestore = useFirestore();

  const ensureAdminFirestoreDocument = async (user: User, adminEmail: string) => {
    if (!firestore) return;
    const adminDocRef = doc(firestore, 'admins', user.uid);

    try {
        let displayName = 'Manager';
        if (adminEmail === 'admin@huwiyasys.app') {
            displayName = 'Admin';
        } else if (adminEmail === 'admin@tamweelsys.app') {
            displayName = 'المدير العام';
        }

        const adminUserData = {
            uid: user.uid,
            displayName: displayName,
            email: user.email,
            isAdmin: true, // This is critical for security rules
            createdAt: new Date().toISOString(),
            contractNumber: adminEmail.split('@')[0], // Use part of email as contract number
        };
        await setDoc(adminDocRef, adminUserData, { merge: true });
    } catch (error) {
        console.error("Failed to ensure admin firestore document:", error);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    if (!auth || !firestore) {
        toast({
            variant: 'destructive',
            title: 'خطأ في التهيئة',
            description: 'لم يتم تهيئة خدمات Firebase بعد.',
        });
        setIsLoading(false);
        return;
    }

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      await ensureAdminFirestoreDocument(userCredential.user, email);
      toast({
        title: 'تم تسجيل الدخول بنجاح',
        description: 'جاري تحويلك إلى لوحة التحكم.',
      });
      router.push('/admin');
    } catch (error: any) {
        if (error.code === 'auth/user-not-found' || error.code === 'auth/invalid-credential') {
            try {
                const newUserCredential = await createUserWithEmailAndPassword(auth, email, password);
                await ensureAdminFirestoreDocument(newUserCredential.user, email);

                toast({
                    title: 'تم إنشاء حساب المسؤول وتسجيل الدخول',
                    description: 'جاري تحويلك إلى لوحة التحكم.',
                });
                router.push('/admin');
            } catch (creationError: any) {
                console.error('Admin Creation/Login Error:', creationError);
                toast({
                    variant: 'destructive',
                    title: 'فشل إنشاء الحساب أو تسجيل الدخول',
                    description: creationError.message || 'حدث خطأ غير متوقع.',
                });
            }
        } else {
            console.error('Admin Login Error:', error);
            toast({
                variant: 'destructive',
                title: 'فشل تسجيل الدخول',
                description: error.message || 'البريد الإلكتروني أو كلمة المرور غير صحيحة.',
            });
        }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/40 p-4" dir="rtl">
      <Card className="w-full max-w-sm">
        <form onSubmit={handleLogin}>
          <CardHeader className="text-center">
            <div className="mb-4 flex justify-center">
              <Logo className="h-12 w-12 text-primary" />
            </div>
            <CardTitle className="text-2xl">لوحة التحكم</CardTitle>
            <CardDescription>الرجاء تسجيل الدخول للمتابعة.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">البريد الإلكتروني</Label>
              <Input
                id="email"
                type="email"
                placeholder="admin@example.com"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
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
          <CardFooter>
            <Button type="submit" className="w-full" disabled={isLoading || !auth}>
              {isLoading && <LoaderCircle className="ml-2 h-4 w-4 animate-spin" />}
              {isLoading ? 'جاري تسجيل الدخول...' : 'تسجيل الدخول'}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
