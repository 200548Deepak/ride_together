'use client';

import React, { useState, useEffect, Suspense, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Header from '@/components/Header';
import FilterSidebar, { FilterState, DEFAULT_FILTERS, filterAndSortTrips } from '@/components/FilterSidebar';
import SearchResults from '@/components/SearchResults';
import { BlaBlaCarSearchResponse, TripSearchItem } from '@/types/blablacar-search';

function SearchResultsContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const fn = searchParams?.get('fn') ?? '';
  const tn = searchParams?.get('tn') ?? '';
  const db = searchParams?.get('db') || new Date().toISOString().split('T')[0];
  const seatsParam = searchParams?.get('seats') || '1';
  const seats = parseInt(seatsParam, 10) || 1;

  const [filters, setFilters] = useState<FilterState>(DEFAULT_FILTERS);
  const [searchResponse, setSearchResponse] = useState<BlaBlaCarSearchResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Search input bar state on search page
  const [originInput, setOriginInput] = useState(fn);
  const [destInput, setDestInput] = useState(tn);
  const [dateInput, setDateInput] = useState(db);

  const fetchTrips = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const queryParams = new URLSearchParams({
        seats: String(seats)
      });
      if (fn.trim()) queryParams.set('fn', fn.trim());
      if (tn.trim()) queryParams.set('tn', tn.trim());
      if (db) queryParams.set('db', db);

      const res = await fetch(`/api/search?${queryParams.toString()}`);
      if (!res.ok) {
        throw new Error(`Failed to load rides (${res.status})`);
      }

      const data: BlaBlaCarSearchResponse = await res.json();
      setSearchResponse(data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'An error occurred while fetching rides.');
    } finally {
      setLoading(false);
    }
  }, [fn, tn, db, seats]);

  useEffect(() => {
    fetchTrips();
    setOriginInput(fn);
    setDestInput(tn);
    setDateInput(db);

    const handleRidePublished = () => {
      fetchTrips();
    };
    window.addEventListener('ride-published', handleRidePublished);
    return () => window.removeEventListener('ride-published', handleRidePublished);
  }, [fetchTrips, fn, tn, db]);

  // Extract raw trips from backend response
  const allTrips: TripSearchItem[] = (searchResponse?.resultsContent?.searchItems?.filter(
    (item) => item.type === 'TRIP'
  ) as TripSearchItem[]) || [];

  // Filter and sort trips dynamically on client
  const displayedTrips = filterAndSortTrips(allTrips, filters);

  // Calculate dynamic facet counts based on current dataset
  const dynamicCounts = {
    verified_id: allTrips.filter((t) => t.travelDetails.provider.profiles.some((p) => p.status.type === 'VERIFIED')).length,
    auto_approve: allTrips.filter((t) => t.travelDetails.amenities.some((a) => a.id === 'AUTOMATIC_APPROVAL')).length,
    two_max_back: allTrips.filter((t) => t.travelDetails.amenities.some((a) => a.id === 'TWO_MAX_IN_THE_BACK')).length,
    ac: allTrips.filter((t) => t.travelDetails.amenities.some((a) => a.id === 'AIR_CONDITIONING')).length,
    power: allTrips.filter((t) => t.travelDetails.amenities.some((a) => a.id === 'POWER_OUTLETS')).length,
    smokers: allTrips.filter((t) => t.travelDetails.amenities.some((a) => a.id === 'SMOKERS_ALLOWED')).length,
    pets: allTrips.filter((t) => t.travelDetails.amenities.some((a) => a.id === 'PETS_ALLOWED')).length,
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const query = new URLSearchParams({
      fn: originInput.trim(),
      tn: destInput.trim(),
      db: dateInput,
      seats: String(seats)
    });
    router.push(`/search?${query.toString()}`);
  };

  return (
    <div className="min-h-screen bg-[#f4f7f8] text-[#054752] pb-16 flex flex-col">
      <Header />
      {/* Search Header Banner */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
          {/* Quick Modifier Search Form */}
          <form
            onSubmit={handleSearchSubmit}
            className="flex flex-col md:flex-row items-center gap-2 bg-[#f4f7f8] p-2 rounded-2xl border border-gray-200"
          >
            <div className="flex-1 flex items-center px-3.5 py-2.5 bg-white rounded-xl w-full border border-gray-100">
              <span className="text-[#708c91] mr-2">📍</span>
              <input
                type="text"
                value={originInput}
                onChange={(e) => setOriginInput(e.target.value)}
                placeholder="Leaving from"
                className="w-full bg-transparent text-sm font-bold text-[#054752] focus:outline-none"
              />
            </div>

            <div className="flex-1 flex items-center px-3.5 py-2.5 bg-white rounded-xl w-full border border-gray-100">
              <span className="text-[#00aff5] mr-2">📍</span>
              <input
                type="text"
                value={destInput}
                onChange={(e) => setDestInput(e.target.value)}
                placeholder="Going to"
                className="w-full bg-transparent text-sm font-bold text-[#054752] focus:outline-none"
              />
            </div>

            <div className="flex-none md:w-44 flex items-center px-3.5 py-2.5 bg-white rounded-xl w-full border border-gray-100">
              <span className="text-[#708c91] mr-2">📅</span>
              <input
                type="date"
                value={dateInput}
                onChange={(e) => setDateInput(e.target.value)}
                className="w-full bg-transparent text-xs font-bold text-[#054752] focus:outline-none cursor-pointer"
              />
            </div>

            <button
              type="submit"
              className="w-full md:w-auto px-6 py-2.5 bg-[#00aff5] hover:bg-[#0098d6] text-white font-bold text-sm rounded-xl transition-colors shadow-xs"
            >
              Update
            </button>
          </form>
        </div>
      </div>

      {/* Main Grid: Filter Sidebar (Left) + Search Results (Right) */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        <div className="flex flex-col lg:flex-row gap-8 items-start">
          {/* Left Column: Filter Sidebar */}
          <aside className="w-full lg:w-80 shrink-0 sticky top-4">
            <FilterSidebar
              initialFilters={filters}
              onFilterChange={(newFilters) => setFilters(newFilters)}
              counts={dynamicCounts}
              onShowMapClick={() => {
                const mapsUrl = `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(fn)}&destination=${encodeURIComponent(tn)}`;
                window.open(mapsUrl, '_blank');
              }}
            />
          </aside>

          {/* Right Column: Search Results */}
          <main className="flex-1 w-full">
            <SearchResults
              trips={displayedTrips}
              loading={loading}
              error={error}
              fromCity={fn}
              toCity={tn}
              departureDate={db}
              seats={seats}
              onResetFilters={() => setFilters(DEFAULT_FILTERS)}
              onRetry={fetchTrips}
            />
          </main>
        </div>
      </div>
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#f4f7f8] flex items-center justify-center">
          <div className="text-center space-y-3">
            <div className="w-10 h-10 border-4 border-[#00aff5] border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-sm font-semibold text-[#054752]">Loading carpools...</p>
          </div>
        </div>
      }
    >
      <SearchResultsContent />
    </Suspense>
  );
}
