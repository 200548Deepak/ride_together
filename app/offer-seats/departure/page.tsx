'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';
import DeparturePlaceAutocomplete from '@/components/DeparturePlaceAutocomplete';
import AuthModal from '@/components/AuthModal';

export default function DeparturePage() {
  const router = useRouter();
  const [isAuthOpen, setIsAuthOpen] = useState(false);

  const handleSelectLocation = (loc: {
    city: string;
    address: string;
    latitude?: number;
    longitude?: number;
    mainText: string;
  }) => {
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
    <div className="min-h-screen bg-[#f4f7f8] flex flex-col">
      <Header />

      <main className="flex-1 max-w-2xl mx-auto w-full px-4 sm:px-6 py-6 sm:py-10">
        <DeparturePlaceAutocomplete
          mode="departure"
          title="Pick-up"
          placeholder="Enter the full address"
          onSelectLocation={handleSelectLocation}
          onBack={() => router.push('/')}
          onCancel={() => router.push('/')}
        />
      </main>

      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        onSuccess={() => setIsAuthOpen(false)}
      />
    </div>
  );
}
