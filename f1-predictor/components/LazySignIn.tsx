'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import AuthSkeleton from '@/components/AuthSkeleton';

const SignIn = dynamic(
  () => import('@clerk/nextjs').then((mod) => ({ default: mod.SignIn })),
  { ssr: false, loading: () => <AuthSkeleton /> }
);

export default function LazySignIn() {
  const [ready, setReady] = useState(false);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const id = requestAnimationFrame(() => setReady(true));
    return () => cancelAnimationFrame(id);
  }, []);

  useEffect(() => {
    if (ready) {
      // Small delay then fade in
      const timeout = setTimeout(() => setVisible(true), 50);
      return () => clearTimeout(timeout);
    }
  }, [ready]);

  if (!ready) return <AuthSkeleton />;

  return (
    <div
      style={{
        opacity: visible ? 1 : 0,
        transition: 'opacity 0.3s ease-in',
      }}
    >
      <SignIn fallback={<AuthSkeleton />} />
    </div>
  );
}
