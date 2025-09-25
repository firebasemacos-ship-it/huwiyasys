
'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function AdminLoginPageRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/');
  }, [router]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
        <p>جاري تحويلك...</p>
    </div>
  );
}
