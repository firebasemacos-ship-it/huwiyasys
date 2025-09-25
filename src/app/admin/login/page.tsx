
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

// This page is now the root page. Redirect to root.
export default function AdminLoginPage() {
    const router = useRouter();
    useEffect(() => {
        router.replace('/');
    }, [router]);

    return null;
}
