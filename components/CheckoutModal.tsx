'use client';

import React, { useState, useEffect } from 'react';
import { getSupabaseClient, isSupabaseConfigured, getLocalUser } from '@/lib/supabaseClient';
import { RideDetailsData, PaymentMethod, BookingResponse } from '@/types/booking';

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  ride: RideDetailsData;
  initialSeats?: number;
  onBookingSuccess?: (result: BookingResponse) => void;
  onOpenLogin?: () => void;
}

export const CheckoutModal: React.FC<CheckoutModalProps> = ({
  isOpen,
  onClose,
  ride,
  initialSeats = 1,
  onBookingSuccess,
  onOpenLogin
}) => {
  const [seats, setSeats] = useState<number>(initialSeats);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('CASH');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [bookingResult, setBookingResult] = useState<BookingResponse | null>(null);
  const [user, setUser] = useState<{ id: string; email?: string; name?: string } | null>(null);

  useEffect(() => {
    setSeats(Math.min(initialSeats, Math.max(1, ride.available_seats || 1)));
    setErrorMessage(null);
    setBookingResult(null);

    // 1. Initial local user hydration
    const local = getLocalUser();
    if (local) {
      setUser({
        id: local.id,
        email: local.email,
        name: local.name || local.email?.split('@')[0] || 'Passenger'
      });
    }

    // 2. Fetch authenticated Supabase user if configured
    if (isSupabaseConfigured()) {
      const supabase = getSupabaseClient();
      supabase.auth.getUser().then(({ data }) => {
        if (data?.user) {
          setUser({
            id: data.user.id,
            email: data.user.email,
            name: data.user.user_metadata?.name || data.user.email?.split('@')[0] || 'Passenger'
          });
        } else if (!local) {
          setUser(null);
        }
      }).catch(() => {});
    }
  }, [isOpen, ride, initialSeats]);

  if (!isOpen) return null;

  const maxSeats = Math.max(1, ride.available_seats || 1);
  const pricePerSeat = ride.totalPrice?.amount || 500;
  const totalPrice = pricePerSeat * seats;

  const handleDecrement = () => {
    if (seats > 1) {
      setSeats(prev => prev - 1);
      setErrorMessage(null);
    }
  };

  const handleIncrement = () => {
    if (seats < maxSeats) {
      setSeats(prev => prev + 1);
      setErrorMessage(null);
    }
  };

  const handleConfirmBooking = async () => {
    if (!user) {
      if (onOpenLogin) {
        onOpenLogin();
      } else {
        setErrorMessage('Please log in or create an account to complete your booking.');
      }
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    try {
      const response = await fetch('/api/bookings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          trip_id: ride.id,
          multimodal_id: ride.multimodalId.id,
          passenger_id: user.id,
          seats_reserved: seats,
          total_price: totalPrice,
          currency: ride.totalPrice.currency || 'INR',
          payment_method: paymentMethod
        })
      });

      const data: BookingResponse = await response.json();

      if (!response.ok || !data.success) {
        const errorText = data.error?.message || 'Failed to complete reservation. Please try again.';
        setErrorMessage(errorText);
        setIsLoading(false);
        return;
      }

      setBookingResult(data);
      if (onBookingSuccess) {
        onBookingSuccess(data);
      }
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : 'A network error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto"
      role="dialog"
      aria-modal="true"
    >
      <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl overflow-hidden transition-all my-8 animate-in fade-in zoom-in-95 duration-200">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100 bg-white">
          <h2 className="text-xl font-bold text-[#054752]">
            {bookingResult ? 'Booking Confirmed' : 'Book your ride'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 transition-colors"
            aria-label="Close"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-6 max-h-[80vh] overflow-y-auto">
          {bookingResult ? (
            /* Success State */
            <div className="text-center py-4 space-y-6">
              <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
                <svg className="w-9 h-9" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
              </div>

              <div>
                <h3 className="text-2xl font-bold text-[#054752]">You&apos;re booked! 🎉</h3>
                <p className="text-[#708c91] text-sm mt-1">
                  Your reservation is confirmed. We&apos;ve sent the details to your driver {ride.driver.displayName}.
                </p>
              </div>

              <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 text-left space-y-3">
                <div className="flex justify-between items-center text-xs text-[#708c91] uppercase tracking-wider font-semibold">
                  <span>Booking Reference</span>
                  <span className="font-mono text-[#054752] font-bold">
                    {bookingResult.booking?.id?.slice(0, 8).toUpperCase() || 'RT-CONFIRMED'}
                  </span>
                </div>

                <div className="border-t border-slate-200/60 pt-2">
                  <div className="font-semibold text-[#054752] text-base">
                    {ride.itinerary.legs[0]?.address.primary} → {ride.itinerary.legs[1]?.address.primary}
                  </div>
                  <div className="text-xs text-[#708c91] mt-0.5">
                    {ride.head.date} • {ride.itinerary.legs[0]?.formattedTime}
                  </div>
                </div>

                <div className="flex justify-between items-center border-t border-slate-200/60 pt-2 text-sm">
                  <span className="text-[#708c91]">Seats reserved</span>
                  <span className="font-bold text-[#054752]">{bookingResult.booking?.seats_reserved || seats}</span>
                </div>

                <div className="flex justify-between items-center border-t border-slate-200/60 pt-2 text-sm font-bold text-[#054752]">
                  <span>Total Paid (Cash to driver)</span>
                  <span className="text-lg text-emerald-600">₹{totalPrice.toFixed(2)}</span>
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="w-full py-3.5 px-6 rounded-full font-bold text-white bg-[#00aff5] hover:bg-[#0098d6] transition-all shadow-md hover:shadow-lg"
                >
                  Done
                </button>
              </div>
            </div>
          ) : (
            /* Booking Form State */
            <div className="space-y-6">
              {/* Trip Summary Card */}
              <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-[#00aff5] tracking-wide uppercase">
                    {ride.head.date}
                  </span>
                  <span className="text-xs px-2.5 py-1 rounded-full font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                    Instant Booking
                  </span>
                </div>
                <div className="flex items-center gap-2 text-base font-bold text-[#054752]">
                  <span>{ride.itinerary.legs[0]?.address.primary}</span>
                  <svg className="w-4 h-4 text-[#708c91]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                  </svg>
                  <span>{ride.itinerary.legs[1]?.address.primary}</span>
                </div>
                <div className="text-xs text-[#708c91] mt-1">
                  Departure at {ride.itinerary.legs[0]?.formattedTime} • With {ride.driver.displayName}
                </div>
              </div>

              {/* Number of Seats Selector */}
              <div className="border border-slate-200 rounded-2xl p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-[#054752]">Number of seats</h3>
                    <p className="text-xs text-[#708c91] mt-0.5">
                      {ride.available_seats} seat{ride.available_seats === 1 ? '' : 's'} available
                    </p>
                  </div>

                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={handleDecrement}
                      disabled={seats <= 1}
                      className="w-10 h-10 rounded-full border border-gray-300 flex items-center justify-center text-[#00aff5] text-xl font-bold hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                      aria-label="Decrease seats"
                    >
                      −
                    </button>
                    <span className="w-8 text-center text-lg font-bold text-[#054752]">
                      {seats}
                    </span>
                    <button
                      type="button"
                      onClick={handleIncrement}
                      disabled={seats >= maxSeats}
                      className="w-10 h-10 rounded-full border border-gray-300 flex items-center justify-center text-[#00aff5] text-xl font-bold hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                      aria-label="Increase seats"
                    >
                      +
                    </button>
                  </div>
                </div>
              </div>

              {/* Price Breakdown */}
              <div className="space-y-3 bg-white rounded-2xl border border-slate-200 p-4">
                <h3 className="text-sm font-bold text-[#054752]">Price details</h3>
                <div className="flex justify-between text-sm text-[#708c91]">
                  <span>₹{pricePerSeat.toFixed(2)} × {seats} passenger{seats > 1 ? 's' : ''}</span>
                  <span className="font-medium text-[#054752]">₹{totalPrice.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm text-[#708c91]">
                  <span>Booking fee</span>
                  <span className="text-emerald-600 font-semibold">Free</span>
                </div>
                <div className="border-t border-slate-100 pt-3 flex justify-between items-center">
                  <span className="text-base font-bold text-[#054752]">Total price</span>
                  <span className="text-2xl font-black text-[#054752]">₹{totalPrice.toFixed(2)}</span>
                </div>
              </div>

              {/* Payment Method */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-[#708c91] uppercase tracking-wider">
                  Payment Method
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('CASH')}
                    className={`flex items-center gap-2.5 p-3.5 rounded-2xl border text-sm font-semibold text-left transition-all ${
                      paymentMethod === 'CASH'
                        ? 'border-[#00aff5] bg-[#00aff5]/5 text-[#054752]'
                        : 'border-slate-200 text-[#708c91] hover:border-slate-300'
                    }`}
                  >
                    <span className="text-lg">💵</span>
                    <div>
                      <div className="font-bold text-[#054752]">Pay in Cash</div>
                      <div className="text-xs text-[#708c91]">To driver on trip</div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentMethod('ONLINE')}
                    className={`flex items-center gap-2.5 p-3.5 rounded-2xl border text-sm font-semibold text-left transition-all ${
                      paymentMethod === 'ONLINE'
                        ? 'border-[#00aff5] bg-[#00aff5]/5 text-[#054752]'
                        : 'border-slate-200 text-[#708c91] hover:border-slate-300'
                    }`}
                  >
                    <span className="text-lg">⚡</span>
                    <div>
                      <div className="font-bold text-[#054752]">UPI / Card</div>
                      <div className="text-xs text-[#708c91]">Instant online</div>
                    </div>
                  </button>
                </div>
              </div>

              {/* Passenger Status Banner */}
              {!user ? (
                <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl flex items-start gap-3">
                  <svg className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div className="text-xs text-amber-800">
                    <span className="font-bold">Log in required:</span> You need to sign in so {ride.driver.displayName} can see your passenger profile.
                    <button
                      type="button"
                      onClick={onOpenLogin}
                      className="block mt-1 font-bold text-[#00aff5] hover:underline"
                    >
                      Click here to Log In or Register →
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-between text-xs text-[#708c91] px-1">
                  <span>Booking as: <strong className="text-[#054752]">{user.name}</strong> ({user.email})</span>
                  <span className="text-emerald-600 font-semibold flex items-center gap-1">
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                    </svg>
                    Verified
                  </span>
                </div>
              )}

              {/* Error Message */}
              {errorMessage && (
                <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-600 text-xs font-semibold flex items-center gap-2">
                  <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>{errorMessage}</span>
                </div>
              )}

              {/* Confirmation CTA */}
              <button
                type="button"
                onClick={handleConfirmBooking}
                disabled={isLoading || (ride.available_seats || 0) < 1}
                className="w-full py-4 px-6 rounded-full font-bold text-white bg-[#00aff5] hover:bg-[#0098d6] disabled:bg-gray-300 disabled:cursor-not-allowed transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2 text-base"
              >
                {isLoading ? (
                  <>
                    <svg className="animate-spin w-5 h-5 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                    </svg>
                    <span>Securing your seat...</span>
                  </>
                ) : (
                  <span>Book {seats} seat{seats > 1 ? 's' : ''} • ₹{totalPrice.toFixed(2)}</span>
                )}
              </button>

              <p className="text-center text-[11px] text-[#708c91]">
                By clicking Book, you agree to show up on time and respect Ride Together community guidelines.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CheckoutModal;

