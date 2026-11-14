'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { LocationSuggestion } from '@/app/api/location/suggestions/route';

interface FloatingSearchBarProps {
  initialDeparture?: string;
  initialArrival?: string;
  initialDate?: string;
  initialSeats?: number;
  className?: string;
}

export const FloatingSearchBar: React.FC<FloatingSearchBarProps> = ({
  initialDeparture = '',
  initialArrival = '',
  initialDate,
  initialSeats = 1,
  className = ''
}) => {
  const router = useRouter();

  // Form State
  const [departure, setDeparture] = useState(initialDeparture);
  const [arrival, setArrival] = useState(initialArrival);
  const [departureDate, setDepartureDate] = useState(() => {
    if (initialDate) return initialDate;
    const today = new Date();
    return today.toISOString().split('T')[0];
  });
  const [seats, setSeats] = useState(initialSeats);

  // Active Dropdown state: 'departure' | 'arrival' | 'date' | 'seats' | null
  const [activeSegment, setActiveSegment] = useState<string | null>(null);

  // Suggestions state
  const [depQuery, setDepQuery] = useState(initialDeparture);
  const [arrQuery, setArrQuery] = useState(initialArrival);
  const [suggestions, setSuggestions] = useState<LocationSuggestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setActiveSegment(null);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  // Fetch suggestions
  const fetchSuggestions = async (term: string) => {
    try {
      setIsLoading(true);
      const res = await fetch(`/api/location/suggestions?query=${encodeURIComponent(term.trim())}`);
      if (res.ok) {
        const data = await res.json();
        setSuggestions(data);
      }
    } catch {
      // silent
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (activeSegment === 'departure') {
      fetchSuggestions(depQuery);
    } else if (activeSegment === 'arrival') {
      fetchSuggestions(arrQuery);
    }
  }, [activeSegment, depQuery, arrQuery]);

  const handleSelectDeparture = (loc: LocationSuggestion) => {
    const value = loc.city || loc.main_text;
    setDeparture(value);
    setDepQuery(value);
    setActiveSegment('arrival'); // Auto-advance to arrival
  };

  const handleSelectArrival = (loc: LocationSuggestion) => {
    const value = loc.city || loc.main_text;
    setArrival(value);
    setArrQuery(value);
    setActiveSegment('date'); // Auto-advance to date
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (departure.trim()) params.set('fn', departure.trim());
    if (arrival.trim()) params.set('tn', arrival.trim());
    if (departureDate) params.set('db', departureDate);
    if (seats > 0) params.set('seats', seats.toString());
    params.set('search_origin', 'HOME');
    params.set('transport_type', 'CARPOOLING');

    router.push(`/search?${params.toString()}`);
  };

  // Format date display (e.g. "Today" or "Tue, 10 Nov")
  const formatDateLabel = (isoDate: string) => {
    const today = new Date().toISOString().split('T')[0];
    if (isoDate === today) return 'Today';
    try {
      const d = new Date(isoDate);
      return d.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' });
    } catch {
      return isoDate;
    }
  };

  return (
    <div ref={containerRef} className={`relative w-full max-w-5xl mx-auto ${className}`}>
      {/* Floating Capsule Bar */}
      <div className="bg-white rounded-3xl sm:rounded-full shadow-2xl border border-gray-100 p-2 sm:p-2.5 flex flex-col sm:flex-row items-stretch sm:items-center divide-y sm:divide-y-0 sm:divide-x divide-gray-100 transition-all">
        {/* Segment 1: Departure */}
        <div
          className={`flex-1 px-5 py-3 sm:py-2.5 rounded-2xl sm:rounded-full cursor-pointer transition-colors relative ${
            activeSegment === 'departure' ? 'bg-cyan-50/70' : 'hover:bg-slate-50'
          }`}
          onClick={() => setActiveSegment('departure')}
        >
          <div className="flex items-center gap-3">
            <div className="w-5 h-5 rounded-full border-2 border-[#054752] flex-shrink-0" />
            <div className="min-w-0 flex-1">
              <span className="block text-[11px] font-bold uppercase tracking-wider text-[#708c91]">
                Leaving from
              </span>
              <input
                type="text"
                placeholder="City or landmark"
                value={activeSegment === 'departure' ? depQuery : departure}
                onChange={e => {
                  setDepQuery(e.target.value);
                  setDeparture(e.target.value);
                }}
                onFocus={() => setActiveSegment('departure')}
                className="w-full bg-transparent font-bold text-sm sm:text-base text-[#054752] placeholder-[#708c91] outline-none truncate"
              />
            </div>
          </div>

          {/* Autocomplete Dropdown */}
          {activeSegment === 'departure' && (
            <div className="absolute left-0 top-full mt-3 w-80 sm:w-96 bg-white rounded-2xl shadow-2xl border border-gray-100 p-2 z-50 animate-in fade-in zoom-in-95 duration-100 max-h-80 overflow-y-auto">
              <div className="text-[10px] font-bold text-[#708c91] uppercase tracking-wider px-3 py-1.5">
                {depQuery.trim() === '' ? 'Recent places & cities' : 'Suggested locations'}
              </div>
              <div className="divide-y divide-gray-50">
                {suggestions.map(s => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={e => {
                      e.stopPropagation();
                      handleSelectDeparture(s);
                    }}
                    className="w-full text-left p-3 hover:bg-slate-50 rounded-xl transition-colors flex items-center justify-between gap-2"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className="w-7 h-7 rounded-full bg-slate-100 text-[#00aff5] flex items-center justify-center shrink-0 text-xs">
                        {s.user_history ? '🕒' : '📍'}
                      </span>
                      <div className="truncate">
                        <p className="text-sm font-bold text-[#054752] truncate">{s.main_text}</p>
                        <p className="text-xs text-[#708c91] truncate">{s.secondary_text || s.address}</p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Segment 2: Arrival */}
        <div
          className={`flex-1 px-5 py-3 sm:py-2.5 rounded-2xl sm:rounded-full cursor-pointer transition-colors relative ${
            activeSegment === 'arrival' ? 'bg-cyan-50/70' : 'hover:bg-slate-50'
          }`}
          onClick={() => setActiveSegment('arrival')}
        >
          <div className="flex items-center gap-3">
            <div className="w-5 h-5 rounded-full bg-[#054752] flex-shrink-0" />
            <div className="min-w-0 flex-1">
              <span className="block text-[11px] font-bold uppercase tracking-wider text-[#708c91]">
                Going to
              </span>
              <input
                type="text"
                placeholder="City or station"
                value={activeSegment === 'arrival' ? arrQuery : arrival}
                onChange={e => {
                  setArrQuery(e.target.value);
                  setArrival(e.target.value);
                }}
                onFocus={() => setActiveSegment('arrival')}
                className="w-full bg-transparent font-bold text-sm sm:text-base text-[#054752] placeholder-[#708c91] outline-none truncate"
              />
            </div>
          </div>

          {/* Autocomplete Dropdown */}
          {activeSegment === 'arrival' && (
            <div className="absolute left-0 top-full mt-3 w-80 sm:w-96 bg-white rounded-2xl shadow-2xl border border-gray-100 p-2 z-50 animate-in fade-in zoom-in-95 duration-100 max-h-80 overflow-y-auto">
              <div className="text-[10px] font-bold text-[#708c91] uppercase tracking-wider px-3 py-1.5">
                {arrQuery.trim() === '' ? 'Popular destinations' : 'Suggested locations'}
              </div>
              <div className="divide-y divide-gray-50">
                {suggestions
                  .filter(s => (s.city || s.main_text).toLowerCase() !== departure.toLowerCase())
                  .map(s => (
                    <button
                      key={s.id}
                      type="button"
                      onClick={e => {
                        e.stopPropagation();
                        handleSelectArrival(s);
                      }}
                      className="w-full text-left p-3 hover:bg-slate-50 rounded-xl transition-colors flex items-center justify-between gap-2"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span className="w-7 h-7 rounded-full bg-slate-100 text-[#00aff5] flex items-center justify-center shrink-0 text-xs">
                          {s.user_history ? '🕒' : '📍'}
                        </span>
                        <div className="truncate">
                          <p className="text-sm font-bold text-[#054752] truncate">{s.main_text}</p>
                          <p className="text-xs text-[#708c91] truncate">{s.secondary_text || s.address}</p>
                        </div>
                      </div>
                    </button>
                  ))}
              </div>
            </div>
          )}
        </div>

        {/* Segment 3: Date */}
        <div
          className={`px-5 py-3 sm:py-2.5 rounded-2xl sm:rounded-full cursor-pointer transition-colors relative min-w-[130px] ${
            activeSegment === 'date' ? 'bg-cyan-50/70' : 'hover:bg-slate-50'
          }`}
          onClick={() => setActiveSegment('date')}
        >
          <span className="block text-[11px] font-bold uppercase tracking-wider text-[#708c91]">
            Date
          </span>
          <div className="flex items-center gap-2 font-bold text-sm sm:text-base text-[#054752] truncate">
            <span>📅</span>
            <span>{formatDateLabel(departureDate)}</span>
          </div>

          {/* Date Picker Popover */}
          {activeSegment === 'date' && (
            <div
              className="absolute left-0 top-full mt-3 bg-white rounded-2xl shadow-2xl border border-gray-100 p-4 z-50 animate-in fade-in zoom-in-95 duration-100"
              onClick={e => e.stopPropagation()}
            >
              <label className="block text-xs font-bold uppercase tracking-wider text-[#054752] mb-2">
                Select Departure Date
              </label>
              <input
                type="date"
                min={new Date().toISOString().split('T')[0]}
                value={departureDate}
                onChange={e => {
                  setDepartureDate(e.target.value);
                  setActiveSegment('seats');
                }}
                className="px-4 py-2.5 rounded-xl border border-slate-200 text-[#054752] font-semibold text-sm outline-none focus:border-[#00aff5]"
              />
            </div>
          )}
        </div>

        {/* Segment 4: Passengers */}
        <div
          className={`px-5 py-3 sm:py-2.5 rounded-2xl sm:rounded-full cursor-pointer transition-colors relative min-w-[140px] ${
            activeSegment === 'seats' ? 'bg-cyan-50/70' : 'hover:bg-slate-50'
          }`}
          onClick={() => setActiveSegment('seats')}
        >
          <span className="block text-[11px] font-bold uppercase tracking-wider text-[#708c91]">
            Passengers
          </span>
          <div className="flex items-center gap-2 font-bold text-sm sm:text-base text-[#054752]">
            <span>👤</span>
            <span>{seats} {seats === 1 ? 'passenger' : 'passengers'}</span>
          </div>

          {/* Seat Stepper Popover */}
          {activeSegment === 'seats' && (
            <div
              className="absolute right-0 top-full mt-3 w-64 bg-white rounded-2xl shadow-2xl border border-gray-100 p-4 z-50 animate-in fade-in zoom-in-95 duration-100"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold text-[#054752]">Number of seats</span>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setSeats(prev => Math.max(1, prev - 1))}
                    disabled={seats <= 1}
                    className="w-8 h-8 rounded-full border border-slate-200 text-[#054752] font-bold flex items-center justify-center hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                  >
                    -
                  </button>
                  <span className="w-5 text-center font-extrabold text-base text-[#054752]">
                    {seats}
                  </span>
                  <button
                    type="button"
                    onClick={() => setSeats(prev => Math.min(8, prev + 1))}
                    disabled={seats >= 8}
                    className="w-8 h-8 rounded-full border border-slate-200 text-[#054752] font-bold flex items-center justify-center hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                  >
                    +
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Search CTA Button */}
        <div className="p-2 flex items-center justify-center sm:justify-end">
          <button
            type="button"
            onClick={handleSearch}
            className="w-full sm:w-14 sm:h-14 py-3.5 sm:py-0 rounded-2xl sm:rounded-full bg-[#00aff5] hover:bg-[#0098d6] text-white flex items-center justify-center shadow-md shadow-cyan-200/50 hover:shadow-lg transition-all active:scale-95 cursor-pointer font-bold text-sm"
            aria-label="Search rides"
          >
            <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <span className="inline sm:hidden ml-2">Search Rides</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default FloatingSearchBar;
