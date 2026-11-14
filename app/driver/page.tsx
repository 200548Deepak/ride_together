'use client';

import React, { useState } from 'react';
import Header from '@/components/Header';
import DriverDashboard from '@/components/DriverDashboard';
import AuthModal from '@/components/AuthModal';

export default function DriverPage() {
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');

  return (
    <div className="min-h-screen bg-[#f4f7f8] flex flex-col">
      <Header />
      <div className="flex-1">
        <DriverDashboard
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
