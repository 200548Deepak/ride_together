'use client';

import React, { useState, useEffect } from 'react';
import { getSupabaseClient, isSupabaseConfigured, getLocalUser } from '@/lib/supabaseClient';
import { getAuthToken, getAuthUser } from '@/lib/authClient';
import { CreateRideRequest } from '@/types/ride';
import DeparturePlaceAutocomplete from './DeparturePlaceAutocomplete';

interface PublishRideFlowProps {
  onSuccess?: (createdRide: any) => void;
  onCancel?: () => void;
  onOpenLogin?: () => void;
}

const CITY_PRESETS = [
  'Bengaluru',
  'Mysuru',
  'Hutagalli',
  'Chennai',
  'Hyderabad',
  'Pune',
  'Mumbai',
  'Coimbatore'
];

export const PublishRideFlow: React.FC<PublishRideFlowProps> = ({
  onSuccess,
  onCancel,
  onOpenLogin
}) => {
  const [currentStep, setCurrentStep] = useState<number>(1);
  const totalSteps = 6;

  // Form state
  const [departureCity, setDepartureCity] = useState('');
  const [departureLocation, setDepartureLocation] = useState('');
  const [arrivalCity, setArrivalCity] = useState('');
  const [arrivalLocation, setArrivalLocation] = useState('');
  const [stopovers, setStopovers] = useState<string[]>([]);
  const [newStopover, setNewStopover] = useState('');

  const [departureDate, setDepartureDate] = useState(() => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  });
  const [departureTime, setDepartureTime] = useState('07:00');

  const [totalSeats, setTotalSeats] = useState(3);
  const [twoMaxBack, setTwoMaxBack] = useState(true);

  const [priceAmount, setPriceAmount] = useState(500);
  const recommendedPrice = 500;

  const [instantBooking, setInstantBooking] = useState(true);
  const [vehicleMake, setVehicleMake] = useState('Hyundai');
  const [vehicleModel, setVehicleModel] = useState('i20');
  const [vehicleColor, setVehicleColor] = useState('White');
  const [licensePlate, setLicensePlate] = useState('KA 01 AB 1234');

  const [airConditioning, setAirConditioning] = useState(true);
  const [powerOutlets, setPowerOutlets] = useState(false);
  const [smokingAllowed, setSmokingAllowed] = useState(false);
  const [petsAllowed, setPetsAllowed] = useState(false);

  // Status
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [publishedRide, setPublishedRide] = useState<any | null>(null);
  const [currentUser, setCurrentUser] = useState<{ id: string; name?: string; email?: string } | null>(null);

  useEffect(() => {
    // 1. Initial hydration from local demo storage
    const local = getLocalUser();
    if (local) {
      setCurrentUser({
        id: local.id,
        name: local.name || local.email?.split('@')[0] || 'Driver',
        email: local.email
      });
    }

    // 2. Supabase auth check if configured
    if (isSupabaseConfigured()) {
      const supabase = getSupabaseClient();
      supabase.auth.getUser().then(({ data }) => {
        if (data?.user) {
          setCurrentUser({
            id: data.user.id,
            name: data.user.user_metadata?.name || data.user.email?.split('@')[0] || 'Driver',
            email: data.user.email
          });
        }
      }).catch(() => {});
    }

    // 3. Update if user logs in during the flow
    const handleAuthChange = () => {
      const updated = getLocalUser();
      if (updated) {
        setCurrentUser({
          id: updated.id,
          name: updated.name || updated.email?.split('@')[0] || 'Driver',
          email: updated.email
        });
      }
    };
    window.addEventListener('auth-change', handleAuthChange);

    // 4. Initial prefill from URL or sessionStorage (e.g. from /offer-seats/departure)
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const urlDepCity = params.get('dep_city') || sessionStorage.getItem('ride_together_publish_departure_city');
      const urlDepAddr = params.get('dep_addr') || sessionStorage.getItem('ride_together_publish_departure_address');
      const urlStep = params.get('step');

      if (urlDepCity) {
        setDepartureCity(urlDepCity);
        if (urlDepAddr) setDepartureLocation(urlDepAddr);
        if (urlStep === '2') setCurrentStep(2);
      }
    }

    return () => window.removeEventListener('auth-change', handleAuthChange);
  }, []);

  const handleAddStopover = () => {
    if (newStopover.trim() && !stopovers.includes(newStopover.trim())) {
      setStopovers(prev => [...prev, newStopover.trim()]);
      setNewStopover('');
    }
  };

  const handleRemoveStopover = (index: number) => {
    setStopovers(prev => prev.filter((_, i) => i !== index));
  };

  const canProceed = () => {
    switch (currentStep) {
      case 1:
        return departureCity.trim().length > 0;
      case 2:
        return arrivalCity.trim().length > 0 && arrivalCity.toLowerCase() !== departureCity.toLowerCase();
      case 3:
        return true; // Stopovers are optional
      case 4:
        return departureDate.length > 0 && departureTime.length > 0;
      case 5:
        return totalSeats >= 1 && totalSeats <= 8 && priceAmount > 0;
      case 6:
        return vehicleMake.trim().length > 0 && vehicleModel.trim().length > 0;
      default:
        return true;
    }
  };

  const handleNext = () => {
    if (canProceed()) {
      setErrorMessage(null);
      setCurrentStep(prev => Math.min(totalSteps, prev + 1));
    }
  };

  const handleBack = () => {
    setErrorMessage(null);
    setCurrentStep(prev => Math.max(1, prev - 1));
  };

  const handleSubmit = async () => {
    if (!currentUser) {
      if (onOpenLogin) {
        onOpenLogin();
      } else {
        setErrorMessage('Please sign in or create an account to publish this ride.');
      }
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    try {
      const depDateTime = new Date(`${departureDate}T${departureTime}:00`);

      const payload: CreateRideRequest & { driver_name?: string; driver_email?: string } = {
        driver_id: currentUser.id,
        driver_name: currentUser.name || 'Driver',
        driver_email: currentUser.email || undefined,
        departure_city: departureCity,
        departure_location_name: departureLocation || `${departureCity} City Center`,
        departure_time: depDateTime.toISOString(),
        arrival_city: arrivalCity,
        arrival_location_name: arrivalLocation || `${arrivalCity} Main Stand`,
        arrival_time: new Date(depDateTime.getTime() + 2.5 * 60 * 60 * 1000).toISOString(),
        total_seats: totalSeats,
        price_amount: priceAmount,
        currency: 'INR',
        instant_booking: instantBooking,
        two_max_back: twoMaxBack,
        air_conditioning: airConditioning,
        power_outlets: powerOutlets,
        smoking_allowed: smokingAllowed,
        pets_allowed: petsAllowed,
        vehicle_make: vehicleMake,
        vehicle_model: vehicleModel,
        vehicle_color: vehicleColor,
        license_plate: licensePlate,
        waypoints: stopovers.map((wp, idx) => ({
          location_name: wp,
          stop_order: idx + 1
        }))
      };

      const token = getAuthToken();
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const res = await fetch('/api/rides', {
        method: 'POST',
        headers,
        body: JSON.stringify(payload)
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error?.message || 'Failed to publish ride.');
      }

      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('ride-published', { detail: data.ride }));
      }

      if (!res.ok || !data.success) {
        throw new Error(data.error?.message || 'Failed to publish ride.');
      }

      setPublishedRide(data.ride);
      if (onSuccess) {
        onSuccess(data.ride);
      }
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : 'Error publishing ride.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden my-6">
      {/* Top Header & Progress */}
      <div className="px-6 sm:px-8 pt-6 pb-4 border-b border-gray-100">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            {currentStep > 1 && !publishedRide && (
              <button
                type="button"
                onClick={handleBack}
                className="p-1.5 rounded-full hover:bg-slate-100 text-[#708c91] transition-colors"
                aria-label="Previous step"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
            )}
            <h1 className="text-xl font-bold text-[#054752]">
              {publishedRide ? 'Ride Published!' : 'Offer a ride'}
            </h1>
          </div>

          {onCancel && !publishedRide && (
            <button
              type="button"
              onClick={onCancel}
              className="text-sm font-semibold text-[#708c91] hover:text-[#054752] transition-colors"
            >
              Cancel
            </button>
          )}
        </div>

        {/* Progress Bar */}
        {!publishedRide && (
          <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
            <div
              className="bg-[#00aff5] h-full transition-all duration-300 rounded-full"
              style={{ width: `${(currentStep / totalSteps) * 100}%` }}
            />
          </div>
        )}
      </div>

      {/* Wizard Body */}
      <div className="p-6 sm:p-8">
        {publishedRide ? (
          /* Success Screen */
          <div className="text-center py-6 space-y-6">
            <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
              <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
              </svg>
            </div>

            <div>
              <h2 className="text-2xl font-black text-[#054752]">Your ride is published! 🎉</h2>
              <p className="text-[#708c91] text-sm mt-1 max-w-md mx-auto">
                Passengers travelling from {publishedRide.departure_city} to {publishedRide.arrival_city} can now view and book your ride.
              </p>
            </div>

            <div className="bg-slate-50 border border-slate-200/70 rounded-2xl p-5 max-w-md mx-auto text-left space-y-3">
              <div className="flex justify-between items-center text-xs text-[#708c91] font-semibold uppercase">
                <span>Ride Reference</span>
                <span className="font-mono text-[#054752] font-bold">
                  {publishedRide.multimodal_id?.slice(0, 10).toUpperCase() || 'RT-RIDE'}
                </span>
              </div>

              <div className="border-t border-slate-200/60 pt-2">
                <div className="font-bold text-base text-[#054752]">
                  {publishedRide.departure_city} → {publishedRide.arrival_city}
                </div>
                <div className="text-xs text-[#708c91] mt-0.5">
                  {new Date(publishedRide.departure_time).toLocaleDateString('en-US', {
                    weekday: 'short',
                    month: 'short',
                    day: 'numeric'
                  })} at {new Date(publishedRide.departure_time).toLocaleTimeString('en-US', {
                    hour: '2-digit',
                    minute: '2-digit',
                    hour12: false
                  })}
                </div>
              </div>

              <div className="flex justify-between items-center border-t border-slate-200/60 pt-2 text-sm">
                <span className="text-[#708c91]">Available Seats</span>
                <span className="font-bold text-[#054752]">{publishedRide.total_seats} seats</span>
              </div>

              <div className="flex justify-between items-center border-t border-slate-200/60 pt-2 text-sm font-bold text-[#054752]">
                <span>Price per seat</span>
                <span className="text-lg text-emerald-600">₹{Number(publishedRide.price_amount).toFixed(2)}</span>
              </div>
            </div>

            <div className="pt-4 flex flex-col sm:flex-row gap-3 justify-center max-w-md mx-auto">
              <button
                type="button"
                onClick={() => {
                  setPublishedRide(null);
                  setCurrentStep(1);
                }}
                className="py-3.5 px-6 rounded-full font-bold text-[#00aff5] border border-[#00aff5] hover:bg-[#00aff5]/5 transition-all text-sm"
              >
                Publish Another Ride
              </button>

              <button
                type="button"
                onClick={() => {
                  if (onCancel) onCancel();
                }}
                className="py-3.5 px-8 rounded-full font-bold text-white bg-[#00aff5] hover:bg-[#0098d6] transition-all shadow-md text-sm"
              >
                Go to Dashboard
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Step 1: Departure Location */}
            {currentStep === 1 && (
              <DeparturePlaceAutocomplete
                mode="departure"
                title="Where are you leaving from?"
                defaultValue={departureLocation || departureCity}
                embedded={true}
                onSelectLocation={(loc) => {
                  setDepartureCity(loc.city);
                  setDepartureLocation(loc.address);
                  setCurrentStep(2);
                }}
              />
            )}

            {/* Step 2: Arrival Location */}
            {currentStep === 2 && (
              <DeparturePlaceAutocomplete
                mode="arrival"
                title="Where are you heading?"
                defaultValue={arrivalLocation || arrivalCity}
                embedded={true}
                onSelectLocation={(loc) => {
                  setArrivalCity(loc.city);
                  setArrivalLocation(loc.address);
                  setCurrentStep(3);
                }}
              />
            )}

            {/* Step 3: Stopovers (Waypoints) */}
            {currentStep === 3 && (
              <div className="space-y-5 animate-in fade-in duration-200">
                <div>
                  <h2 className="text-2xl font-black text-[#054752]">Add stopovers on your way</h2>
                  <p className="text-[#708c91] text-sm mt-1">
                    Adding stopovers helps you pick up passengers along your route and covers more costs.
                  </p>
                </div>

                {/* Route Overview Preview */}
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 flex items-center justify-between text-sm font-bold text-[#054752]">
                  <span>{departureCity}</span>
                  <span className="text-[#00aff5]">➔</span>
                  <span>{arrivalCity}</span>
                </div>

                {/* Added Stopovers List */}
                {stopovers.length > 0 && (
                  <div className="space-y-2">
                    <span className="text-xs font-bold text-[#708c91] uppercase tracking-wider">
                      Confirmed Stopovers:
                    </span>
                    <div className="divide-y divide-gray-100 border border-gray-200 rounded-2xl overflow-hidden">
                      {stopovers.map((stop, idx) => (
                        <div key={idx} className="p-3.5 bg-white flex items-center justify-between">
                          <div className="flex items-center gap-2.5">
                            <span className="w-6 h-6 rounded-full bg-[#00aff5]/10 text-[#00aff5] font-bold text-xs flex items-center justify-center">
                              {idx + 1}
                            </span>
                            <span className="text-sm font-bold text-[#054752]">{stop}</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleRemoveStopover(idx)}
                            className="text-gray-400 hover:text-red-500 p-1"
                            aria-label="Remove stopover"
                          >
                            ✕
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Add Stopover Input */}
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="e.g. Mandya, Ramanagara, Channapatna"
                    value={newStopover}
                    onChange={e => setNewStopover(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddStopover();
                      }
                    }}
                    className="flex-1 px-4 py-3 rounded-2xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#00aff5] text-sm text-[#054752]"
                  />
                  <button
                    type="button"
                    onClick={handleAddStopover}
                    className="px-5 py-3 rounded-2xl bg-[#00aff5] text-white font-bold text-sm hover:bg-[#0098d6] transition-colors"
                  >
                    Add
                  </button>
                </div>
              </div>
            )}

            {/* Step 4: Date & Time Picker */}
            {currentStep === 4 && (
              <div className="space-y-5 animate-in fade-in duration-200">
                <div>
                  <h2 className="text-2xl font-black text-[#054752]">When are you going?</h2>
                  <p className="text-[#708c91] text-sm mt-1">
                    Select your departure date and time.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-[#054752] uppercase tracking-wider mb-1.5">
                      Departure Date
                    </label>
                    <input
                      type="date"
                      value={departureDate}
                      min={new Date().toISOString().split('T')[0]}
                      onChange={e => setDepartureDate(e.target.value)}
                      className="w-full px-4 py-3.5 rounded-2xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#00aff5] text-[#054752] font-semibold text-base"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#054752] uppercase tracking-wider mb-1.5">
                      Departure Time
                    </label>
                    <input
                      type="time"
                      value={departureTime}
                      onChange={e => setDepartureTime(e.target.value)}
                      className="w-full px-4 py-3.5 rounded-2xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#00aff5] text-[#054752] font-semibold text-base"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Step 5: Seats & Price Setting */}
            {currentStep === 5 && (
              <div className="space-y-6 animate-in fade-in duration-200">
                <div>
                  <h2 className="text-2xl font-black text-[#054752]">Passengers & Pricing</h2>
                  <p className="text-[#708c91] text-sm mt-1">
                    How many passengers can you take, and what is your price per seat?
                  </p>
                </div>

                {/* Seat Counter */}
                <div className="p-4 border border-gray-200 rounded-2xl flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-[#054752]">Number of seats</h3>
                    <p className="text-xs text-[#708c91]">Max passengers you can comfortably fit</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => setTotalSeats(prev => Math.max(1, prev - 1))}
                      disabled={totalSeats <= 1}
                      className="w-10 h-10 rounded-full border border-gray-300 flex items-center justify-center text-[#00aff5] text-xl font-bold hover:bg-slate-50 disabled:opacity-40"
                    >
                      −
                    </button>
                    <span className="w-6 text-center font-bold text-lg text-[#054752]">{totalSeats}</span>
                    <button
                      type="button"
                      onClick={() => setTotalSeats(prev => Math.min(8, prev + 1))}
                      disabled={totalSeats >= 8}
                      className="w-10 h-10 rounded-full border border-gray-300 flex items-center justify-center text-[#00aff5] text-xl font-bold hover:bg-slate-50 disabled:opacity-40"
                    >
                      +
                    </button>
                  </div>
                </div>

                {/* 2 Max in the back */}
                <label className="flex items-start gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-200 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={twoMaxBack}
                    onChange={e => setTwoMaxBack(e.target.checked)}
                    className="mt-1 w-4 h-4 rounded text-[#00aff5] focus:ring-[#00aff5]"
                  />
                  <div className="text-xs">
                    <span className="font-bold text-[#054752] block">Keep middle seat empty (Max 2 in the back)</span>
                    <span className="text-[#708c91]">Recommended for passenger comfort and higher ride bookings.</span>
                  </div>
                </label>

                {/* Price Selector */}
                <div className="p-5 border border-gray-200 rounded-2xl text-center space-y-3">
                  <span className="text-xs font-bold text-[#708c91] uppercase tracking-wider block">
                    Price per seat
                  </span>

                  <div className="flex items-center justify-center gap-6">
                    <button
                      type="button"
                      onClick={() => setPriceAmount(prev => Math.max(50, prev - 50))}
                      className="w-12 h-12 rounded-full border border-gray-300 text-2xl font-bold text-[#00aff5] hover:bg-slate-50 transition-colors"
                    >
                      −
                    </button>
                    <div className="text-4xl font-black text-[#054752]">
                      ₹{priceAmount}
                    </div>
                    <button
                      type="button"
                      onClick={() => setPriceAmount(prev => prev + 50)}
                      className="w-12 h-12 rounded-full border border-gray-300 text-2xl font-bold text-[#00aff5] hover:bg-slate-50 transition-colors"
                    >
                      +
                    </button>
                  </div>

                  {priceAmount === recommendedPrice && (
                    <span className="inline-block px-3 py-1 bg-emerald-50 text-emerald-700 text-xs font-bold rounded-full border border-emerald-200">
                      ✓ Recommended price for this route
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* Step 6: Vehicle, Instant Booking & Amenities */}
            {currentStep === 6 && (
              <div className="space-y-6 animate-in fade-in duration-200">
                <div>
                  <h2 className="text-2xl font-black text-[#054752]">Vehicle & Ride Preferences</h2>
                  <p className="text-[#708c91] text-sm mt-1">
                    Configure your car information and passenger preferences.
                  </p>
                </div>

                {/* Instant Booking Toggle */}
                <div
                  onClick={() => setInstantBooking(!instantBooking)}
                  className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                    instantBooking
                      ? 'border-[#00aff5] bg-[#00aff5]/5'
                      : 'border-slate-200 bg-white'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-xl">⚡</span>
                      <div>
                        <h3 className="font-bold text-sm text-[#054752]">Instant Booking</h3>
                        <p className="text-xs text-[#708c91] mt-0.5">
                          Passengers book instantly without waiting for your approval (recommended).
                        </p>
                      </div>
                    </div>
                    <div className={`w-6 h-6 rounded-full border flex items-center justify-center ${
                      instantBooking ? 'bg-[#00aff5] border-[#00aff5] text-white' : 'border-gray-300'
                    }`}>
                      {instantBooking && <span className="text-xs font-bold">✓</span>}
                    </div>
                  </div>
                </div>

                {/* Vehicle Details */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-[#054752] uppercase tracking-wider mb-1">
                      Car Make
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Hyundai"
                      value={vehicleMake}
                      onChange={e => setVehicleMake(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 text-sm font-semibold text-[#054752]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#054752] uppercase tracking-wider mb-1">
                      Car Model
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. i20"
                      value={vehicleModel}
                      onChange={e => setVehicleModel(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 text-sm font-semibold text-[#054752]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#054752] uppercase tracking-wider mb-1">
                      Color
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. White"
                      value={vehicleColor}
                      onChange={e => setVehicleColor(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 text-sm text-[#054752]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#054752] uppercase tracking-wider mb-1">
                      License Plate
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. KA 01 AB 1234"
                      value={licensePlate}
                      onChange={e => setLicensePlate(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 text-sm text-[#054752]"
                    />
                  </div>
                </div>

                {/* Amenities Toggles */}
                <div className="space-y-2">
                  <span className="text-xs font-bold text-[#708c91] uppercase tracking-wider block">
                    Amenities & Guidelines
                  </span>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <label className="flex items-center gap-2.5 p-3 rounded-xl border border-slate-200 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={airConditioning}
                        onChange={e => setAirConditioning(e.target.checked)}
                        className="rounded text-[#00aff5]"
                      />
                      <span className="font-semibold text-[#054752]">❄️ Air Conditioning</span>
                    </label>

                    <label className="flex items-center gap-2.5 p-3 rounded-xl border border-slate-200 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={powerOutlets}
                        onChange={e => setPowerOutlets(e.target.checked)}
                        className="rounded text-[#00aff5]"
                      />
                      <span className="font-semibold text-[#054752]">🔌 Power Outlets</span>
                    </label>

                    <label className="flex items-center gap-2.5 p-3 rounded-xl border border-slate-200 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={smokingAllowed}
                        onChange={e => setSmokingAllowed(e.target.checked)}
                        className="rounded text-[#00aff5]"
                      />
                      <span className="font-semibold text-[#054752]">🚭 Smoking Allowed</span>
                    </label>

                    <label className="flex items-center gap-2.5 p-3 rounded-xl border border-slate-200 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={petsAllowed}
                        onChange={e => setPetsAllowed(e.target.checked)}
                        className="rounded text-[#00aff5]"
                      />
                      <span className="font-semibold text-[#054752]">🐾 Pets Allowed</span>
                    </label>
                  </div>
                </div>
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

            {/* Action Buttons */}
            <div className="pt-4 flex items-center justify-between border-t border-gray-100">
              {currentStep > 1 ? (
                <button
                  type="button"
                  onClick={handleBack}
                  className="px-6 py-3.5 rounded-full font-bold text-sm text-[#054752] hover:bg-slate-100 transition-colors"
                >
                  Back
                </button>
              ) : (
                <div />
              )}

              {currentStep < totalSteps ? (
                <button
                  type="button"
                  onClick={handleNext}
                  disabled={!canProceed()}
                  className="px-8 py-3.5 rounded-full font-bold text-white bg-[#00aff5] hover:bg-[#0098d6] disabled:bg-gray-300 disabled:cursor-not-allowed transition-all shadow-md text-sm"
                >
                  Continue
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={isLoading || !canProceed()}
                  className="px-8 py-3.5 rounded-full font-bold text-white bg-[#00aff5] hover:bg-[#0098d6] disabled:bg-gray-300 disabled:cursor-not-allowed transition-all shadow-md text-sm flex items-center gap-2"
                >
                  {isLoading ? (
                    <>
                      <svg className="animate-spin w-4 h-4 text-white" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                      </svg>
                      <span>Publishing...</span>
                    </>
                  ) : (
                    <span>Publish Ride 🚀</span>
                  )}
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PublishRideFlow;

