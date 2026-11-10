'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { TripSearchItem } from '@/types/blablacar-search';

interface SearchResultsProps {
  trips: TripSearchItem[];
  loading: boolean;
  error?: string | null;
  fromCity?: string;
  toCity?: string;
  departureDate?: string;
  seats?: number;
  onResetFilters?: () => void;
  onRetry?: () => void;
}

export const SearchResults: React.FC<SearchResultsProps> = ({
  trips,
  loading,
  error,
  fromCity,
  toCity,
  departureDate,
  seats = 1,
  onResetFilters,
  onRetry
}) => {
  const router = useRouter();

  // Format date for header
  const formattedDate = departureDate
    ? new Date(departureDate + 'T00:00:00').toLocaleDateString('en-US', {
        weekday: 'short',
        day: 'numeric',
        month: 'short'
      })
    : 'Today';

  const routeTitle = fromCity && toCity
    ? `${fromCity} → ${toCity}`
    : fromCity
    ? `Rides from ${fromCity}`
    : toCity
    ? `Rides to ${toCity}`
    : 'All Scheduled Carpools';

  if (loading) {
    return (
      <div className="space-y-4">
        {/* Loading Skeletons */}
        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm animate-pulse space-y-4">
          <div className="h-6 bg-slate-200 rounded w-1/3" />
          <div className="h-4 bg-slate-100 rounded w-1/4" />
        </div>
        {[1, 2, 3].map((n) => (
          <div
            key={n}
            className="p-6 bg-white rounded-2xl shadow-sm border border-gray-100 animate-pulse flex flex-col sm:flex-row justify-between gap-6"
          >
            <div className="flex-1 space-y-4">
              <div className="flex items-center gap-4">
                <div className="w-14 h-6 bg-slate-200 rounded" />
                <div className="w-1 h-12 bg-slate-200 rounded" />
                <div className="space-y-2 flex-1">
                  <div className="h-4 bg-slate-200 rounded w-2/3" />
                  <div className="h-4 bg-slate-200 rounded w-1/2" />
                </div>
              </div>
              <div className="flex gap-2">
                <div className="w-20 h-6 bg-slate-100 rounded-full" />
                <div className="w-24 h-6 bg-slate-100 rounded-full" />
              </div>
            </div>
            <div className="w-24 space-y-2">
              <div className="h-8 bg-slate-200 rounded w-full" />
              <div className="w-10 h-10 bg-slate-200 rounded-full ml-auto" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-3xl p-10 text-center border border-red-100 shadow-sm space-y-4">
        <div className="w-14 h-14 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto text-xl font-bold">
          !
        </div>
        <h3 className="text-xl font-bold text-[#054752]">Unable to load rides</h3>
        <p className="text-sm text-[#708c91] max-w-md mx-auto">{error}</p>
        {onRetry && (
          <button
            type="button"
            onClick={onRetry}
            className="px-6 py-2.5 bg-[#00aff5] hover:bg-[#0098d6] text-white font-bold text-sm rounded-full transition-colors shadow-sm"
          >
            Try Again
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Route & Date Summary Header */}
      <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-black text-[#054752] tracking-tight">
            {routeTitle}
          </h2>
          <div className="flex items-center gap-2 text-xs text-[#708c91] mt-1 font-semibold">
            <span className="text-[#00aff5] font-bold">{formattedDate}</span>
            <span>•</span>
            <span>{seats} {seats === 1 ? 'passenger' : 'passengers'}</span>
          </div>
        </div>

        <span className="self-start sm:self-auto text-xs font-bold px-3 py-1 rounded-full bg-slate-100 text-[#054752]">
          {trips.length} {trips.length === 1 ? 'ride' : 'rides'} available
        </span>
      </div>

      {/* Trips List */}
      {trips.length === 0 ? (
        /* Empty State */
        <div className="bg-white rounded-3xl p-12 text-center border border-gray-100 shadow-sm space-y-4">
          <div className="w-16 h-16 bg-cyan-50 text-[#00aff5] rounded-full flex items-center justify-center mx-auto text-2xl font-bold">
            🔍
          </div>
          <h3 className="text-xl font-bold text-[#054752]">No rides match your search criteria</h3>
          <p className="text-sm text-[#708c91] max-w-sm mx-auto">
            Try adjusting your dates, clearing filters, or choosing neighboring pickup spots.
          </p>
          <div className="flex flex-wrap justify-center gap-3 pt-2">
            {onResetFilters && (
              <button
                type="button"
                onClick={onResetFilters}
                className="px-5 py-2.5 rounded-full border border-gray-300 text-[#054752] font-bold text-xs hover:bg-slate-50 transition-colors"
              >
                Clear Filters
              </button>
            )}
            <Link
              href="/publish"
              className="px-5 py-2.5 rounded-full bg-[#00aff5] hover:bg-[#0098d6] text-white font-bold text-xs transition-colors shadow-sm"
            >
              Offer this ride instead
            </Link>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {trips.map((trip) => {
            const dep = trip.travelDetails.itinerary.departure;
            const arr = trip.travelDetails.itinerary.arrival;
            const duration = trip.travelDetails.itinerary.totalDuration?.label || '2h 10m';
            const driver = trip.travelDetails.provider.profiles[0];
            const priceToken = trip.price.tokenizedPrice.find((p) => p.type === 'INTEGER')?.value || '500';
            const rideId = trip.multimodalId?.id || trip.id;

            return (
              <div
                key={trip.id}
                onClick={() => router.push(`/trip/${encodeURIComponent(rideId)}`)}
                className="group p-6 bg-white rounded-2xl shadow-xs border border-gray-100 hover:border-[#00aff5]/40 hover:shadow-md transition-all cursor-pointer flex flex-col sm:flex-row justify-between gap-6"
              >
                {/* Itinerary Column */}
                <div className="flex-1 space-y-4">
                  <div className="flex items-start space-x-4">
                    {/* Times & Timeline Bar */}
                    <div className="flex flex-col items-center">
                      <div className="font-black text-lg text-[#054752] w-14 text-center">
                        {dep.time}
                      </div>
                      <div className="my-1.5 flex flex-col items-center">
                        <span className="w-3 h-3 rounded-full border-2 border-[#00aff5] bg-white shadow-xs" />
                        <span className="w-0.5 h-10 bg-gradient-to-b from-[#00aff5] to-[#054752]" />
                        <span className="w-3 h-3 rounded-full border-2 border-[#054752] bg-white shadow-xs" />
                      </div>
                      <div className="font-black text-lg text-[#054752] w-14 text-center">
                        {arr.time}
                      </div>
                    </div>

                    {/* Locations & Duration */}
                    <div className="flex-1 space-y-3 pt-0.5">
                      <div>
                        <div className="font-bold text-base text-[#054752] group-hover:text-[#00aff5] transition-colors">
                          {dep.primaryLocation}
                        </div>
                        {dep.secondaryLocation && (
                          <div className="text-xs text-[#708c91] truncate max-w-md">
                            {dep.secondaryLocation}
                          </div>
                        )}
                      </div>

                      <div className="pl-1">
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#708c91] bg-slate-50 px-2.5 py-0.5 rounded-full border border-slate-100">
                          ⏱ {duration}
                        </span>
                      </div>

                      <div>
                        <div className="font-bold text-base text-[#054752] group-hover:text-[#00aff5] transition-colors">
                          {arr.primaryLocation}
                        </div>
                        {arr.secondaryLocation && (
                          <div className="text-xs text-[#708c91] truncate max-w-md">
                            {arr.secondaryLocation}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Amenities / Badges */}
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {trip.travelDetails.amenities.map((a) => (
                      <span
                        key={a.id}
                        className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-50 text-[#054752] border border-slate-100"
                      >
                        {a.id === 'AUTOMATIC_APPROVAL' && '⚡ '}
                        {a.id === 'TWO_MAX_IN_THE_BACK' && '🛡️ '}
                        {a.id === 'AIR_CONDITIONING' && '❄️ '}
                        {a.label}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Driver Profile Snippet & Price Column */}
                <div className="flex sm:flex-col justify-between sm:items-end border-t sm:border-t-0 pt-4 sm:pt-0 border-gray-100">
                  <div className="text-right">
                    <div className="text-3xl font-black text-[#054752]">
                      ₹{priceToken}
                    </div>
                    <div className="text-[11px] text-[#708c91]">per passenger</div>
                  </div>

                  <div className="flex items-center space-x-3 mt-4">
                    <div className="relative">
                      {driver?.avatar ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={driver.avatar}
                          alt={driver?.name || 'Driver'}
                          className="w-11 h-11 rounded-full object-cover border-2 border-white shadow-xs"
                        />
                      ) : (
                        <div className="w-11 h-11 rounded-full bg-slate-100 text-[#054752] font-black text-sm flex items-center justify-center">
                          {driver?.name ? driver.name[0] : 'D'}
                        </div>
                      )}
                      {driver?.status?.type === 'VERIFIED' && (
                        <div
                          className="absolute -bottom-1 -right-1 bg-[#00aff5] text-white p-0.5 rounded-full shadow-xs"
                          title="Verified ID"
                        >
                          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                      )}
                    </div>

                    <div className="text-left sm:text-right">
                      <div className="font-bold text-sm text-[#054752]">
                        {driver?.name || 'Driver'}
                      </div>
                      <div className="text-xs text-amber-500 font-semibold flex items-center gap-1">
                        <span>★ {driver?.rating || '5.0'}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default SearchResults;

