'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';
import PublishRideFlow from '@/components/PublishRideFlow';
import AuthModal from '@/components/AuthModal';

export default function PublishPage() {
  const router = useRouter();
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');

  return (
    <div className="min-h-screen bg-[#f4f7f8] flex flex-col">
      <Header />
      <div className="flex-1 py-8 px-4 sm:px-6">
        <PublishRideFlow
          onSuccess={() => router.push('/driver')}
          onCancel={() => router.push('/')}
          onOpenLogin={() => {
            setAuthMode('login');
            setIsAuthOpen(true);
          }}
        />
      </div>

      <AuthModal
        isOpen={isAuthOpen}
        initialMode={authMode}
        onClose={() => setIsAuthOpen(false)}
        onSuccess={() => setIsAuthOpen(false)}
      />
    </div>
  );
}
