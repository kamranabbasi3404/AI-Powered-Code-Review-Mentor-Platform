'use client';
import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { Suspense } from 'react';

function CallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login } = useAuth();

  useEffect(() => {
    const token = searchParams.get('token');
    if (token) {
      login(token);
      router.push('/dashboard');
    } else {
      router.push('/');
    }
  }, [searchParams, login, router]);

  return (
    <div className="auth-callback">
      <div className="spinner" />
      <p className="loading-text">Signing you in...</p>
    </div>
  );
}

export default function AuthCallback() {
  return (
    <Suspense fallback={<div className="auth-callback"><div className="spinner" /></div>}>
      <CallbackContent />
    </Suspense>
  );
}
