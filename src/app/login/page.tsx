
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Logo } from '@/components/icons';
import { useToast } from '@/hooks/use-toast';
import { useAuth, useFirestore } from '@/firebase';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { LoaderCircle } from 'lucide-react';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';

export default function AdminLoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { toast } = useToast();
  const auth = useAuth();
  const firestore = useFirestore();

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
      const user = userCredential.user;

      const adminData = {
        uid: user.uid,
        displayName: 'المدير العام',
        email: user.email,
        isAdmin: true,
        createdAt: serverTimestamp(),
      };
      
      const managerDocRef = doc(firestore, 'managers', user.uid);
      const userDocRef = doc(firestore, 'users', user.uid);
      
      await setDoc(managerDocRef, adminData, { merge: true });
      await setDoc(userDocRef, adminData, { merge: true });

      toast({
        title: 'تم تسجيل الدخول بنجاح',
        description: 'جاري تحويلك إلى لوحة التحكم.',
      });
      router.push('/admin');

    } catch (error: any) {
        if (error.code === 'auth/invalid-credential' || error.code === 'auth/user-not-found') {
            try {
                const newUserCredential = await createUserWithEmailAndPassword(auth, email, password);
                const newUser = newUserCredential.user;

                const adminData = {
                    uid: newUser.uid,
                    displayName: 'المدير العام',
                    email: newUser.email,
                    isAdmin: true,
                    createdAt: serverTimestamp(),
                };
                
                const managerDocRef = doc(firestore, 'managers', newUser.uid);
                await setDoc(managerDocRef, adminData);

                const userDocRef = doc(firestore, 'users', newUser.uid);
                await setDoc(userDocRef, adminData);


                toast({
                    title: 'تم إنشاء حساب مدير جديد',
                    description: 'تم تسجيل دخولك بنجاح.',
                });
                router.push('/admin');

            } catch (creationError: any) {
                 toast({
                    variant: 'destructive',
                    title: 'فشل إنشاء الحساب',
                    description: creationError.message,
                });
            }
        } else {
            toast({
                variant: 'destructive',
                title: 'فشل تسجيل الدخول',
                description: error.message,
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
            <CardTitle className="text-2xl">دخول المدير</CardTitle>
            <CardDescription>الرجاء تسجيل الدخول للمتابعة إلى لوحة التحكم.</CardDescription>
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
              {isLoading ? 'جاري تسجيل الدخول...' : 'دخول'}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
