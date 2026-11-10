'use client';

import React, { useState, useEffect, useRef } from 'react';
import { LocationSuggestion } from '../app/api/location/suggestions/route';

interface DeparturePlaceAutocompleteProps {
  title?: string;
  placeholder?: string;
  defaultValue?: string;
  onSelectLocation: (loc: {
    city: string;
    address: string;
    latitude?: number;
    longitude?: number;
    mainText: string;
  }) => void;
  onBack?: () => void;
  onCancel?: () => void;
  mode?: 'departure' | 'arrival';
  embedded?: boolean;
}

export const DeparturePlaceAutocomplete: React.FC<DeparturePlaceAutocompleteProps> = ({
  title,
  placeholder = 'Enter the full address',
  defaultValue = '',
  onSelectLocation,
  onBack,
  onCancel,
  mode = 'departure',
  embedded = false
}) => {
  const [query, setQuery] = useState(defaultValue);
  const [suggestions, setSuggestions] = useState<LocationSuggestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [activeIndex, setActiveIndex] = useState<number>(-1);
  const inputRef = useRef<HTMLInputElement>(null);

  const defaultTitle = mode === 'departure' ? 'Pick-up' : 'Drop-off';
  const displayTitle = title || defaultTitle;
  const subtitle = mode === 'departure' 
    ? 'Where would you like to pick up passengers?' 
    : 'Where would you like to drop passengers off?';

  // 1. Fetch suggestions from our BlaBlaCar-mirrored edge API
  const fetchSuggestions = async (searchTerm: string) => {
    try {
      setIsLoading(true);
      const res = await fetch(`/api/location/suggestions?query=${encodeURIComponent(searchTerm.trim())}`);
      if (res.ok) {
        const data: LocationSuggestion[] = await res.json();
        setSuggestions(data);
      }
    } catch (err) {
      console.error('Failed to fetch location suggestions:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Initial load (recent history from HAR)
  useEffect(() => {
    fetchSuggestions(defaultValue);
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, [defaultValue]);

  // Handle live search with debouncing
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchSuggestions(query);
    }, 200);

    return () => clearTimeout(timer);
  }, [query]);

  const handleSelect = (item: LocationSuggestion) => {
    const city = item.city || item.main_text.split(',')[0].trim();
    onSelectLocation({
      city,
      address: item.address,
      latitude: item.latitude,
      longitude: item.longitude,
      mainText: item.main_text
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex(prev => (prev < suggestions.length - 1 ? prev + 1 : prev));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex(prev => (prev > 0 ? prev - 1 : -1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (activeIndex >= 0 && activeIndex < suggestions.length) {
        handleSelect(suggestions[activeIndex]);
      } else if (query.trim().length > 0) {
        onSelectLocation({
          city: query.trim().split(',')[0].trim(),
          address: query.trim(),
          mainText: query.trim()
        });
      }
    } else if (e.key === 'Escape') {
      if (query) {
        setQuery('');
      } else if (onBack) {
        onBack();
      }
    }
  };

  const handleClear = () => {
    setQuery('');
    setActiveIndex(-1);
    if (inputRef.current) {
      inputRef.current.focus();
    }
    fetchSuggestions('');
  };

  const mainContent = (
    <div className={embedded ? 'space-y-5 animate-in fade-in duration-200' : 'p-6 sm:p-8 space-y-6'}>
      <div>
        <h1 className="text-2xl sm:text-3xl font-black text-[#054752] tracking-tight">
          {displayTitle}
        </h1>
        <p className="text-[#708c91] text-sm mt-1.5 font-medium">
          {subtitle}
        </p>
      </div>

      {/* Autocomplete Input Bar */}
      <div className="relative">
        <div className="relative flex items-center bg-[#f4f7f8] rounded-2xl border-2 border-transparent focus-within:border-[#00aff5] focus-within:bg-white transition-all shadow-inner">
          <div className="pl-4 pr-2 text-[#708c91] flex items-center pointer-events-none">
            <svg className="w-5 h-5 text-[#708c91]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>

          <input
            ref={inputRef}
            type="text"
            name="departure"
            data-testid="e2e-address-field-input"
            value={query}
            onChange={e => {
              setQuery(e.target.value);
              setActiveIndex(-1);
            }}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            autoComplete="off"
            className="w-full py-4 pr-10 text-base font-semibold text-[#054752] placeholder-[#708c91] bg-transparent focus:outline-none"
          />

          {query.length > 0 && (
            <button
              type="button"
              onClick={handleClear}
              className="absolute right-3 p-1 rounded-full bg-slate-200 hover:bg-slate-300 text-slate-600 transition-colors cursor-pointer"
              aria-label="Clear address input"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Suggestions List */}
      <div className="space-y-1">
        <div className="text-xs font-bold text-[#708c91] uppercase tracking-wider px-2 pb-1">
          {query.trim().length === 0 ? 'Recent Places & Cities' : 'Matching Locations'}
        </div>

        <div className="divide-y divide-gray-100 max-h-[340px] overflow-y-auto rounded-2xl border border-gray-100">
          {suggestions.map((item, index) => {
            const isSelected = activeIndex === index;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleSelect(item)}
                onMouseEnter={() => setActiveIndex(index)}
                className={`w-full text-left p-3.5 flex items-center justify-between gap-3 transition-colors cursor-pointer ${
                  isSelected ? 'bg-cyan-50/80' : 'hover:bg-slate-50'
                }`}
              >
                <div className="flex items-start gap-3 min-w-0">
                  <div className={`mt-0.5 w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${
                    item.user_history ? 'bg-cyan-100 text-[#00aff5]' : 'bg-slate-100 text-[#708c91]'
                  }`}>
                    {item.user_history ? (
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    ) : (
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    )}
                  </div>

                  <div className="min-w-0">
                    <div className="text-sm font-bold text-[#054752] truncate">
                      {item.main_text}
                    </div>
                    <div className="text-xs text-[#708c91] truncate mt-0.5">
                      {item.secondary_text || item.address}
                    </div>
                  </div>
                </div>

                <div className="text-[#00aff5] shrink-0 pl-2">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </button>
            );
          })}

          {/* Custom address option if user entered something specific */}
          {query.trim().length > 0 && (
            <button
              type="button"
              onClick={() => {
                onSelectLocation({
                  city: query.trim().split(',')[0].trim(),
                  address: query.trim(),
                  mainText: query.trim()
                });
              }}
              className="w-full text-left p-3.5 flex items-center justify-between gap-3 hover:bg-slate-50 transition-colors cursor-pointer bg-slate-50/50"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-9 h-9 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0 font-bold text-sm">
                  ✓
                </div>
                <div className="min-w-0">
                  <div className="text-sm font-bold text-[#054752] truncate">
                    Use &quot;{query.trim()}&quot;
                  </div>
                  <div className="text-xs text-[#708c91]">
                    Click to confirm this custom location
                  </div>
                </div>
              </div>

              <div className="text-emerald-600 shrink-0 pl-2">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </button>
          )}
        </div>
      </div>
    </div>
  );

  if (embedded) {
    return mainContent;
  }

  return (
    <div className="w-full max-w-xl mx-auto bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden my-4 transition-all">
      {/* Top Header Navigation */}
      <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
        <div className="flex items-center gap-3">
          {onBack && (
            <button
              type="button"
              onClick={onBack}
              className="p-2 -ml-2 rounded-full hover:bg-slate-100 text-[#708c91] transition-colors cursor-pointer"
              aria-label="Back"
            >
              <svg className="w-5 h-5 text-[#054752]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
          )}
          <span className="text-xs font-bold uppercase tracking-wider text-[#00aff5]">
            {mode === 'departure' ? 'Step 1 of 6' : 'Step 2 of 6'}
          </span>
        </div>

        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="text-sm font-semibold text-[#708c91] hover:text-[#054752] transition-colors cursor-pointer"
          >
            Cancel
          </button>
        )}
      </div>

      {mainContent}
    </div>
  );
};

export default DeparturePlaceAutocomplete;
