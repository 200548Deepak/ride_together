'use client';

import React, { useState } from 'react';
import DriverDashboard from '@/components/DriverDashboard';
import LoginModal from '@/components/LoginModal';
import RegisterFlow from '@/components/RegisterFlow';

export default function DriverPage() {
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);

  return (
    <>
      <DriverDashboard onOpenLogin={() => setIsLoginOpen(true)} />

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
    </>
  );
}

