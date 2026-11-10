'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import PublishRideFlow from '@/components/PublishRideFlow';
import LoginModal from '@/components/LoginModal';
import RegisterFlow from '@/components/RegisterFlow';

export default function PublishPage() {
  const router = useRouter();
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#f4f7f8] py-8 px-4 sm:px-6">
      <PublishRideFlow
        onSuccess={() => router.push('/driver')}
        onCancel={() => router.push('/')}
        onOpenLogin={() => setIsLoginOpen(true)}
      />

      <LoginModal
        isOpen={isLoginOpen}
        onClose={() => setIsLoginOpen(false)}
        onSwitchToRegister={() => {
          setIsLoginOpen(false);
          setIsRegisterOpen(true);
        }}
        onSuccess={() => setIsLoginOpen(false)}
      />

      <RegisterFlow
        isOpen={isRegisterOpen}
        onClose={() => setIsRegisterOpen(false)}
        onSwitchToLogin={() => {
          setIsRegisterOpen(false);
          setIsLoginOpen(true);
        }}
        onSuccess={() => setIsRegisterOpen(false)}
      />
    </div>
  );
}

