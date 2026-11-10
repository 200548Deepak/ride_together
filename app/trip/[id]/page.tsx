'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { RideDetailsData } from '@/types/booking';
import RideDetails from '@/components/RideDetails';
import LoginModal from '@/components/LoginModal';
import RegisterFlow from '@/components/RegisterFlow';

export default function TripPage() {
  const params = useParams();
  const router = useRouter();
  const id = (params?.id as string) || 'KpmVENEvSDaFUCjblX39yweGeSgw9MT4-spC6nJx-L6A';

  const [ride, setRide] = useState<RideDetailsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Auth modal states
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);

  const loadRide = React.useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/trip/${encodeURIComponent(id)}`);
      if (!res.ok) {
        throw new Error('Failed to load ride details.');
      }
      const data: RideDetailsData = await res.json();
      setRide(data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error fetching ride');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (id) {
      loadRide();
    }
  }, [id, loadRide]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f4f7f8] flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 border-4 border-[#00aff5] border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-[#054752] font-semibold">Loading ride details...</p>
        </div>
      </div>
    );
  }

  if (error || !ride) {
    return (
      <div className="min-h-screen bg-[#f4f7f8] flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl p-8 max-w-md w-full text-center shadow-lg border border-gray-100">
          <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl font-bold">
            !
          </div>
          <h2 className="text-xl font-bold text-[#054752]">Ride Not Found</h2>
          <p className="text-sm text-[#708c91] mt-2">
            {error || 'The requested trip is unavailable or has expired.'}
          </p>
          <button
            onClick={() => router.push('/search')}
            className="mt-6 w-full py-3.5 px-6 rounded-full font-bold text-white bg-[#00aff5] hover:bg-[#0098d6] transition-all"
          >
            Search Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <RideDetails
        ride={ride}
        onBack={() => router.push('/search')}
        onBookingSuccess={() => loadRide()}
        onOpenLogin={() => setIsLoginOpen(true)}
      />

      {/* Login Modal */}
      <LoginModal
        isOpen={isLoginOpen}
        onClose={() => setIsLoginOpen(false)}
        onSwitchToRegister={() => {
          setIsLoginOpen(false);
          setIsRegisterOpen(true);
        }}
        onSuccess={() => {
          setIsLoginOpen(false);
        }}
      />

      {/* Registration Flow Modal */}
      <RegisterFlow
        isOpen={isRegisterOpen}
        onClose={() => setIsRegisterOpen(false)}
        onSwitchToLogin={() => {
          setIsRegisterOpen(false);
          setIsLoginOpen(true);
        }}
        onSuccess={() => {
          setIsRegisterOpen(false);
        }}
      />
    </>
  );
}

