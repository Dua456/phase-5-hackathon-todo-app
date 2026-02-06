'use client';

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

export default function SearchParamsHandler() {
  const router = useRouter();
  const { login } = useAuth();
  const searchParams = useSearchParams();

  // Check for token in query params (from OAuth callback)
  useEffect(() => {
    const token = searchParams.get('token');
    if (token) {
      login(token);
      router.push('/'); // Redirect to dashboard (now root page)
    }
  }, [searchParams, router, login]);

  return null; // This component doesn't render anything
}