'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import DeparturePlaceAutocomplete from '@/components/DeparturePlaceAutocomplete';
import LoginModal from '@/components/LoginModal';
import RegisterFlow from '@/components/RegisterFlow';
import { getLocalUser } from '@/lib/supabaseClient';

export default function DeparturePage() {
  const router = useRouter();
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);

  const handleSelectLocation = (loc: {
    city: string;
    address: string;
    latitude?: number;
    longitude?: number;
    mainText: string;
  }) => {
    // Save chosen departure details for the publication wizard
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('ride_together_publish_departure_city', loc.city);
      sessionStorage.setItem('ride_together_publish_departure_address', loc.address);
      if (loc.latitude && loc.longitude) {
        sessionStorage.setItem('ride_together_publish_departure_lat', String(loc.latitude));
        sessionStorage.setItem('ride_together_publish_departure_lon', String(loc.longitude));
      }
    }

    const params = new URLSearchParams({
      step: '2',
      dep_city: loc.city,
      dep_addr: loc.address
    });

    router.push(`/publish?${params.toString()}`);
  };

  return (
    <div className="min-h-screen bg-[#f4f7f8] pb-16">
      {/* Top Navigation Bar */}
      <header className="bg-white border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-9 h-9 rounded-full bg-[#00aff5] flex items-center justify-center text-white font-black text-lg shadow-sm">
              R
            </div>
            <span className="font-black text-xl tracking-tight text-[#054752]">
              Ride<span className="text-[#00aff5]">Together</span>
            </span>
          </Link>

          <div className="flex items-center gap-3">
            <Link
              href="/driver"
              className="py-2 px-4 rounded-full text-xs font-bold text-[#054752] hover:bg-slate-100 transition"
            >
              Driver Dashboard
            </Link>

            <Link
              href="/publish"
              className="py-2 px-4 rounded-full text-xs font-bold bg-[#00aff5] text-white hover:bg-[#008ecc] transition shadow-sm"
            >
              Offer a Ride
            </Link>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-2xl mx-auto px-4 pt-8">
        <DeparturePlaceAutocomplete
          title="Pick-up"
          placeholder="Enter the full address"
          mode="departure"
          onSelectLocation={handleSelectLocation}
          onBack={() => router.push('/')}
          onCancel={() => router.push('/')}
        />
      </main>

      {/* Auth Modals */}
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
