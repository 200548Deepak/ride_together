'use client';

import React, { useState } from 'react';
import { RideDetailsData, BookingResponse } from '@/types/booking';
import CheckoutModal from './CheckoutModal';

interface RideDetailsProps {
  ride: RideDetailsData;
  onBack?: () => void;
  onBookingSuccess?: (result: BookingResponse) => void;
  onOpenLogin?: () => void;
}

export const RideDetails: React.FC<RideDetailsProps> = ({
  ride,
  onBack,
  onBookingSuccess,
  onOpenLogin
}) => {
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [selectedSeats, setSelectedSeats] = useState(1);
  const [bookingConfirmed, setBookingConfirmed] = useState(false);

  const priceFormatted = `₹${(ride.totalPrice?.amount || 500).toFixed(2)}`;
  const availableSeats = ride.available_seats ?? 1;
  const isSoldOut = availableSeats <= 0;

  const handleBookClick = () => {
    setIsCheckoutOpen(true);
  };

  const handleBookingCompleted = (result: BookingResponse) => {
    setBookingConfirmed(true);
    if (onBookingSuccess) {
      onBookingSuccess(result);
    }
  };

  return (
    <div className="min-h-screen bg-[#f4f7f8] text-[#054752] pb-24 md:pb-16">
      {/* Top Navigation Bar */}
      <header className="sticky top-0 z-30 bg-white border-b border-gray-200">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <button
            type="button"
            onClick={onBack || (() => window.history.back())}
            className="flex items-center gap-2 text-sm font-semibold text-[#00aff5] hover:text-[#0098d6] transition-colors"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
            </svg>
            <span>Back to search results</span>
          </button>

          <span className="text-xs font-semibold px-3 py-1 bg-slate-100 rounded-full text-[#708c91]">
            Carpooling
          </span>
        </div>
      </header>

      {/* Main Content Container */}
      <main className="max-w-5xl mx-auto px-4 sm:px-6 pt-6 sm:pt-8">
        {/* Date Header */}
        <div className="mb-6">
          <h1 className="text-2xl sm:text-3xl font-black text-[#054752] tracking-tight">
            {ride.head.date}
          </h1>
          <p className="text-[#708c91] text-sm mt-1">
            {ride.itinerary.legs[0]?.address.primary} to {ride.itinerary.legs[1]?.address.primary}
          </p>
        </div>

        {/* Notice Info Message */}
        <div className="mb-6 bg-cyan-50 border border-cyan-200 rounded-2xl p-4 flex items-start gap-3">
          <svg className="w-5 h-5 text-[#00aff5] mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-sm text-[#054752] font-medium">
            You&apos;ll need to book this ride first. Then you can choose your return if needed.
          </p>
        </div>

        {/* Grid Layout: Main Timeline & Details (Left) + Sticky Checkout Card (Right) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column (8 cols on lg) */}
          <div className="lg:col-span-7 space-y-6">
            {/* 1. Itinerary Timeline Card */}
            <section className="bg-white rounded-3xl p-6 sm:p-7 shadow-sm border border-gray-100">
              <h2 className="text-lg font-bold text-[#054752] mb-6">Trip itinerary</h2>

              <div className="relative pl-6 space-y-8">
                {/* Vertical Timeline Track Line */}
                <div className="absolute left-[7px] top-3 bottom-3 w-1 bg-gradient-to-b from-[#00aff5] via-[#00aff5] to-[#708c91] rounded-full" />

                {/* Departure Stop */}
                {ride.itinerary.legs[0] && (
                  <div className="relative">
                    {/* Circle Node */}
                    <div className="absolute -left-[24px] top-1.5 w-4 h-4 rounded-full border-4 border-white bg-[#00aff5] shadow-sm" />
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-1 sm:gap-4">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xl font-black text-[#054752]">
                            {ride.itinerary.legs[0].formattedTime}
                          </span>
                          <span className="text-base font-bold text-[#054752]">
                            {ride.itinerary.legs[0].address.primary}
                          </span>
                        </div>
                        <p className="text-xs sm:text-sm text-[#708c91] mt-0.5 leading-relaxed">
                          {ride.itinerary.legs[0].address.secondary}
                        </p>
                      </div>

                      {ride.itinerary.legs[0].action?.coordinates && (
                        <a
                          href={`https://www.google.com/maps/search/?api=1&query=${ride.itinerary.legs[0].action.coordinates.latitude},${ride.itinerary.legs[0].action.coordinates.longitude}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-xs font-semibold text-[#00aff5] hover:underline mt-1 sm:mt-0 flex-shrink-0"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          </svg>
                          Map
                        </a>
                      )}
                    </div>
                  </div>
                )}

                {/* Duration Pill in Timeline */}
                {ride.itinerary.legs[0]?.formattedDuration && (
                  <div className="pl-3 py-1">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-slate-100 text-[#708c91]">
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      {ride.itinerary.legs[0].formattedDuration.label}
                    </span>
                  </div>
                )}

                {/* Arrival Stop */}
                {ride.itinerary.legs[1] && (
                  <div className="relative">
                    {/* Circle Node */}
                    <div className="absolute -left-[24px] top-1.5 w-4 h-4 rounded-full border-4 border-white bg-[#054752] shadow-sm" />
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-1 sm:gap-4">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xl font-black text-[#054752]">
                            {ride.itinerary.legs[1].formattedTime}
                          </span>
                          <span className="text-base font-bold text-[#054752]">
                            {ride.itinerary.legs[1].address.primary}
                          </span>
                        </div>
                        <p className="text-xs sm:text-sm text-[#708c91] mt-0.5 leading-relaxed">
                          {ride.itinerary.legs[1].address.secondary}
                        </p>
                      </div>

                      {ride.itinerary.legs[1].action?.coordinates && (
                        <a
                          href={`https://www.google.com/maps/search/?api=1&query=${ride.itinerary.legs[1].action.coordinates.latitude},${ride.itinerary.legs[1].action.coordinates.longitude}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-xs font-semibold text-[#00aff5] hover:underline mt-1 sm:mt-0 flex-shrink-0"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          </svg>
                          Map
                        </a>
                      )}
                    </div>
                  </div>
                )}

                {/* Final destination note if inactive stop */}
                {ride.itinerary.legs[2] && (
                  <div className="pt-2 pl-3 border-t border-dashed border-gray-200">
                    <p className="text-xs text-[#708c91]">
                      📍 After dropping you off, the ride continues to <strong className="text-[#054752]">{ride.itinerary.legs[2].address.primary}</strong>.
                    </p>
                  </div>
                )}
              </div>
            </section>

            {/* 2. Driver Profile Snippet Card */}
            <section className="bg-white rounded-3xl p-6 sm:p-7 shadow-sm border border-gray-100">
              <div className="flex items-center justify-between pb-5 border-b border-gray-100">
                <div className="flex items-center gap-4">
                  <div className="relative">
                    {ride.driver.profilePictureURL ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={ride.driver.profilePictureURL}
                        alt={ride.driver.displayName}
                        className="w-14 h-14 rounded-full object-cover border-2 border-[#00aff5]/20 shadow-sm"
                      />
                    ) : (
                      <div className="w-14 h-14 rounded-full bg-slate-100 text-[#054752] font-black text-xl flex items-center justify-center">
                        {ride.driver.displayName[0]}
                      </div>
                    )}
                    {ride.driver.status?.code === 'VERIFIED_IDENTITY' && (
                      <div
                        className="absolute -bottom-1 -right-1 bg-[#00aff5] text-white p-1 rounded-full shadow"
                        title="Verified Profile"
                      >
                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                    )}
                  </div>

                  <div>
                    <h3 className="text-lg font-bold text-[#054752]">
                      {ride.driver.displayName}
                    </h3>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="flex items-center text-amber-500 font-bold text-sm">
                        ★ {ride.driver.rating?.rating || '5.0'}
                      </span>
                      <span className="text-xs text-[#708c91]">
                        ({ride.driver.rating?.totalReviews || '8 ratings'})
                      </span>
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  className="hidden sm:inline-flex items-center gap-1.5 px-4 py-2 rounded-full border border-gray-200 text-xs font-bold text-[#054752] hover:bg-slate-50 transition-colors"
                >
                  <svg className="w-4 h-4 text-[#708c91]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                  Contact
                </button>
              </div>

              {/* Driver Badges & Preferences */}
              <div className="pt-5 space-y-3">
                {ride.driver.info?.map((info, idx) => (
                  <div key={idx} className="flex items-center gap-3 text-sm text-[#054752]">
                    <svg className="w-5 h-5 text-emerald-600 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                    <span>{info.label}</span>
                  </div>
                ))}

                {ride.driver.preferences?.map((pref, idx) => (
                  <div key={idx} className="flex items-center gap-3 text-sm text-[#054752]">
                    {pref.type === 'APPROVAL_AUTO' && (
                      <span className="text-base">⚡</span>
                    )}
                    {pref.type === 'NO_SMOKING' && (
                      <span className="text-base">🚭</span>
                    )}
                    {pref.type === 'VEHICLE' && (
                      <span className="text-base">🚗</span>
                    )}
                    <span>{pref.label}</span>
                  </div>
                ))}
              </div>
            </section>

            {/* 3. Passengers Section */}
            {ride.passengers && ride.passengers.length > 0 && (
              <section className="bg-white rounded-3xl p-6 sm:p-7 shadow-sm border border-gray-100">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-bold text-[#054752]">
                    Passengers booked
                  </h2>
                  <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-slate-100 text-[#708c91]">
                    {ride.passengers.reduce((acc, p) => acc + p.seatsBooked, 0)} booked
                  </span>
                </div>

                <div className="divide-y divide-gray-100">
                  {ride.passengers.map((p, idx) => (
                    <div key={idx} className="py-3 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {p.profilePictureURL ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={p.profilePictureURL}
                            alt={p.displayName}
                            className="w-10 h-10 rounded-full object-cover bg-slate-100"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-slate-200 text-[#054752] font-bold flex items-center justify-center text-sm">
                            {p.displayName[0]}
                          </div>
                        )}
                        <div>
                          <div className="text-sm font-bold text-[#054752] flex items-center gap-2">
                            <span>{p.displayName}</span>
                            {p.seatsBooked > 1 && (
                              <span className="text-[11px] font-semibold text-[#00aff5] bg-[#00aff5]/10 px-2 py-0.5 rounded-full">
                                +{p.seatsBooked - 1}
                              </span>
                            )}
                          </div>
                          {p.itineraryDescription && (
                            <p className="text-xs text-[#708c91]">
                              {p.itineraryDescription}
                            </p>
                          )}
                        </div>
                      </div>

                      <span className="text-xs text-[#708c91]">
                        {p.seatsBooked} seat{p.seatsBooked > 1 ? 's' : ''}
                      </span>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* 4. Ecological Impact Banner */}
            <div className="bg-emerald-50/70 border border-emerald-200/80 rounded-3xl p-5 flex items-start gap-3">
              <span className="text-2xl mt-0.5">🌱</span>
              <div className="text-xs text-emerald-900 leading-relaxed">
                <strong>By choosing this trip, you will help avoid ≈{ride.co2SavingsKg || '22.4'} kg of CO₂.</strong>
                <p className="mt-0.5 text-emerald-800">
                  Sharing a ride produces 71% less greenhouse emissions than driving alone by car.
                </p>
              </div>
            </div>

            {/* 5. Report Ride Action */}
            <div className="pt-2">
              <button
                type="button"
                className="text-xs text-[#708c91] hover:text-red-500 flex items-center gap-1.5 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9" />
                </svg>
                Report this ride
              </button>
            </div>
          </div>

          {/* Right Column: Sticky Booking Card (Desktop) */}
          <div className="hidden lg:block lg:col-span-5 sticky top-24">
            <div className="bg-white rounded-3xl p-7 shadow-lg border border-gray-100 space-y-6">
              <div>
                <div className="text-xs font-semibold text-[#708c91] uppercase tracking-wider">
                  Total price
                </div>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="text-4xl font-black text-[#054752]">
                    {priceFormatted}
                  </span>
                  <span className="text-xs text-[#708c91]">
                    for 1 passenger
                  </span>
                </div>
              </div>

              {/* Seat Availability Status */}
              <div className="flex items-center justify-between p-3.5 bg-slate-50 rounded-2xl border border-slate-100">
                <span className="text-xs font-semibold text-[#054752]">
                  Available seats
                </span>
                <span className={`text-xs font-bold px-3 py-1 rounded-full ${
                  isSoldOut 
                    ? 'bg-red-50 text-red-600 border border-red-200' 
                    : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                }`}>
                  {isSoldOut ? 'Sold out' : `${availableSeats} seat${availableSeats > 1 ? 's' : ''} left`}
                </span>
              </div>

              {/* Book CTA Button */}
              <button
                type="button"
                data-testid="e2e-ride-details-cta-button"
                onClick={handleBookClick}
                disabled={isSoldOut}
                className="w-full py-4 px-6 rounded-full font-bold text-white bg-[#00aff5] hover:bg-[#0098d6] disabled:bg-gray-300 disabled:cursor-not-allowed transition-all shadow-md hover:shadow-lg text-lg flex items-center justify-center gap-2"
              >
                <span>{isSoldOut ? 'Fully booked' : 'Book'}</span>
                {!isSoldOut && (
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                  </svg>
                )}
              </button>

              {/* Trust & Guarantee points */}
              <div className="space-y-2.5 pt-2 text-xs text-[#708c91] border-t border-gray-100">
                <div className="flex items-center gap-2">
                  <span className="text-emerald-500 font-bold">✓</span>
                  <span>Instant confirmation with driver</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-emerald-500 font-bold">✓</span>
                  <span>Free cancellation up to 24h before departure</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-emerald-500 font-bold">✓</span>
                  <span>Verified phone & profile check</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Mobile Sticky Bottom CTA Bar */}
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-gray-200 p-4 lg:hidden shadow-[0_-4px_12px_rgba(0,0,0,0.06)]">
        <div className="max-w-md mx-auto flex items-center justify-between gap-4">
          <div>
            <div className="text-2xl font-black text-[#054752]">
              {priceFormatted}
            </div>
            <div className="text-[11px] text-[#708c91]">
              {availableSeats} seat{availableSeats > 1 ? 's' : ''} left
            </div>
          </div>

          <button
            type="button"
            data-testid="e2e-ride-details-cta-button-mobile"
            onClick={handleBookClick}
            disabled={isSoldOut}
            className="py-3 px-8 rounded-full font-bold text-white bg-[#00aff5] hover:bg-[#0098d6] disabled:bg-gray-300 disabled:cursor-not-allowed shadow transition-all text-base"
          >
            {isSoldOut ? 'Sold out' : 'Book'}
          </button>
        </div>
      </div>

      {/* Checkout Booking Modal */}
      <CheckoutModal
        isOpen={isCheckoutOpen}
        onClose={() => setIsCheckoutOpen(false)}
        ride={ride}
        initialSeats={selectedSeats}
        onBookingSuccess={handleBookingCompleted}
        onOpenLogin={onOpenLogin}
      />
    </div>
  );
};

export default RideDetails;

