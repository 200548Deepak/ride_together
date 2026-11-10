'use client';

import React, { useState, useEffect, useId } from 'react';

// ====================================================================
// Types
// ====================================================================

export type SortOption =
  | 'dep_time:asc'
  | 'price:asc'
  | 'dep_dist:asc'
  | 'arr_dist:asc'
  | 'duration:asc';

export interface FilterState {
  sort: SortOption;
  verified_id: boolean;
  two_max_back: boolean;
  auto_approve: boolean;
  ac: boolean;
  power: boolean;
  smokers: boolean;
  pets: boolean;
}

export interface TripCounts {
  verified_id?: number;
  two_max_back?: number;
  auto_approve?: number;
  ac?: number;
  power?: number;
  smokers?: number;
  pets?: number;
}

export interface FilterSidebarProps {
  initialFilters?: Partial<FilterState>;
  onFilterChange?: (filters: FilterState) => void;
  counts?: TripCounts;
  onShowMapClick?: () => void;
  className?: string;
}

export const DEFAULT_FILTERS: FilterState = {
  sort: 'dep_time:asc',
  verified_id: false,
  two_max_back: false,
  auto_approve: false,
  ac: false,
  power: false,
  smokers: false,
  pets: false,
};

// ====================================================================
// SVG Icons (Extracted directly from BlaBlaCar production bundle)
// ====================================================================

function ClockIcon({ className = 'w-5 h-5 text-[#708c91]' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" className={className}>
      <path
        fill="currentColor"
        fillRule="evenodd"
        d="M12 20.5a8.5 8.5 0 1 0 0-17 8.5 8.5 0 0 0 0 17m0 1.5c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10"
        clipRule="evenodd"
      />
      <path
        fill="currentColor"
        fillRule="evenodd"
        d="M12 5.75a.75.75 0 0 1 .75.75V12a.75.75 0 0 1-.75.75H8a.75.75 0 0 1 0-1.5h3.25V6.5a.75.75 0 0 1 .75-.75"
        clipRule="evenodd"
      />
    </svg>
  );
}

function PriceTagIcon({ className = 'w-5 h-5 text-[#708c91]' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" className={className}>
      <path
        fill="currentColor"
        fillRule="evenodd"
        d="M8.5 5v2.5h8V5zM7 4.5v3H6a1 1 0 0 0-1 1v3H4a1 1 0 0 0-1 1V16a1 1 0 0 0 1 1h1v3a1 1 0 0 0 1 1h9.5a5.5 5.5 0 0 0 .5-10.978V9h1a1 1 0 0 0 1-1V4.5a1 1 0 0 0-1-1H8a1 1 0 0 0-1 1m7.5 5.59V9h-8v2.5h5.225a5.5 5.5 0 0 1 2.775-1.41M10.6 13H4.5v2.5H10c0-.9.216-1.75.6-2.5m-.393 4H6.5v2.5h5.225a5.5 5.5 0 0 1-1.518-2.5m9.293-1.5a4 4 0 1 1-8 0 4 4 0 0 1 8 0"
        clipRule="evenodd"
      />
    </svg>
  );
}

function CloseToDepartureIcon({ className = 'w-5 h-5 text-[#008ecc]' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" className={className}>
      <path
        fill="currentColor"
        fillRule="evenodd"
        d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10m2-15.5a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0m-.97 4.735a1.5 1.5 0 0 0-.37-.47l-.19 1.524c-.1.794.287 1.57.98 1.97a3.5 3.5 0 0 1 1.652 2.22l.378 1.599a.75.75 0 1 1-1.46.345l-.378-1.599a2 2 0 0 0-.942-1.266 3.49 3.49 0 0 1-1.719-3.455l.2-1.6a1.5 1.5 0 0 0-.377.207L8.95 12.1a.75.75 0 1 1-.9-1.2l1.854-1.39a2.99 2.99 0 0 1 4.467 1.054c.21.42.64.686 1.11.686h.769a.75.75 0 1 1 0 1.5h-.77a2.74 2.74 0 0 1-2.45-1.515m-2.79 3.443-.056.198a4.25 4.25 0 0 1-1.288 2.031l-.89.779a.75.75 0 0 0 .988 1.129l.89-.78a5.75 5.75 0 0 0 1.438-1.925 5 5 0 0 1-1.081-1.432"
        clipRule="evenodd"
      />
    </svg>
  );
}

function CloseToArrivalIcon({ className = 'w-5 h-5 text-[#008ecc]' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" className={className}>
      <path
        fill="currentColor"
        fillRule="evenodd"
        d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10m2-15.5a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0m-.97 4.735a1.5 1.5 0 0 0-.37-.47l-.19 1.524c-.1.794.287 1.57.98 1.97a3.5 3.5 0 0 1 1.652 2.22l.378 1.599a.75.75 0 1 1-1.46.345l-.378-1.599a2 2 0 0 0-.942-1.266 3.49 3.49 0 0 1-1.719-3.455l.2-1.6a1.5 1.5 0 0 0-.377.207L8.95 12.1a.75.75 0 1 1-.9-1.2l1.854-1.39a2.99 2.99 0 0 1 4.467 1.054c.21.42.64.686 1.11.686h.769a.75.75 0 1 1 0 1.5h-.77a2.74 2.74 0 0 1-2.45-1.515m-2.79 3.443-.056.198a4.25 4.25 0 0 1-1.288 2.031l-.89.779a.75.75 0 0 0 .988 1.129l.89-.78a5.75 5.75 0 0 0 1.438-1.925 5 5 0 0 1-1.081-1.432"
        clipRule="evenodd"
      />
    </svg>
  );
}

function DurationIcon({ className = 'w-5 h-5 text-[#708c91]' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" className={className}>
      <path
        fill="currentColor"
        fillRule="evenodd"
        d="M4 2.75A.75.75 0 0 1 4.75 2h14.5a.75.75 0 0 1 0 1.5h-.351l-.458 4.352A5.47 5.47 0 0 1 15.765 12a5.47 5.47 0 0 1 2.676 4.148l.458 4.352h.351a.75.75 0 0 1 0 1.5H4.75a.75.75 0 0 1 0-1.5h.351l.458-4.352A5.47 5.47 0 0 1 8.235 12a5.47 5.47 0 0 1-2.676-4.148L5.101 3.5H4.75A.75.75 0 0 1 4 2.75M17.39 20.5H6.61l.337-3.207.296-.185a3.926 3.926 0 0 1 4.857.553 5.43 5.43 0 0 0 3.837 1.59h1.322zm-.289-2.75h-1.164a3.93 3.93 0 0 1-2.776-1.15 5.43 5.43 0 0 0-5.915-1.176A3.97 3.97 0 0 1 11 12.75v-1.5a3.97 3.97 0 0 1 3.949 3.555z"
        clipRule="evenodd"
      />
    </svg>
  );
}

function VerifiedShieldIcon({ className = 'w-5 h-5 text-[#00aff5]' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" className={className}>
      <path
        fill="currentColor"
        fillRule="evenodd"
        d="M11.665 2.133a.49.49 0 0 1 .67 0C15.02 4.71 16.787 5.634 20.64 6.56c.211.05.359.232.359.441 0 7.438-2.587 12.403-8.813 14.963a.5.5 0 0 1-.374 0C5.587 19.403 3 14.438 3 7c0-.209.148-.39.359-.441 3.854-.925 5.621-1.85 8.306-4.426m4.615 8.147a.75.75 0 1 0-1.06-1.06l-4.47 4.47-1.97-1.97a.75.75 0 0 0-1.06 1.06l2.5 2.5a.75.75 0 0 0 1.06 0z"
        clipRule="evenodd"
      />
    </svg>
  );
}

function MaxTwoIcon({ className = 'w-5 h-5 text-[#708c91]' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" className={className}>
      <path
        fill="currentColor"
        fillRule="evenodd"
        d="M7.75 7.25v-.5a1.25 1.25 0 1 0-2.5 0v.5a1.25 1.25 0 1 0 2.5 0M6.5 4a2.75 2.75 0 0 0-2.75 2.75v.5a2.75 2.75 0 0 0 5.5 0v-.5A2.75 2.75 0 0 0 6.5 4m-3 10.25c0-.28.08-.488.348-.683C4.191 13.317 4.98 13 6.62 13s2.432.318 2.78.569c.272.197.35.405.35.681v4.22c-3.552-.148-5.091-.819-5.727-1.321-.314-.248-.417-.46-.463-.597-.054-.164-.06-.317-.06-.552zM2 16v-1.75c0-1.39 1.037-2.75 4.62-2.75s4.63 1.36 4.63 2.75v5.25a.5.5 0 0 1-.506.497C2 19.889 2 16.98 2 16m12.25-1.75c0-.28.08-.488.348-.683.343-.25 1.132-.567 2.772-.567s2.432.318 2.78.569c.272.197.35.405.35.681V16c0 .235-.006.388-.06.552-.046.137-.15.35-.463.597-.636.502-2.175 1.173-5.727 1.321zm-1.5 5.25v-5.25c0-1.39 1.037-2.75 4.62-2.75S22 12.86 22 14.25V16c0 .981 0 3.89-8.744 3.997a.5.5 0 0 1-.506-.497M18.6 6.75v.5a1.25 1.25 0 1 1-2.5 0v-.5a1.25 1.25 0 1 1 2.5 0m-4 0a2.75 2.75 0 1 1 5.5 0v.5a2.75 2.75 0 1 1-5.5 0z"
        clipRule="evenodd"
      />
    </svg>
  );
}

function InstantBookingIcon({ className = 'w-5 h-5 text-[#708c91]' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" className={className}>
      <path
        fill="currentColor"
        fillRule="evenodd"
        d="M12.5 11.5V5.958L7.52 12.5h3.98v5.542l4.98-6.542zm5.999-1.498a.5.5 0 0 1 .398.801l-8.45 11.098a.25.25 0 0 1-.449-.151v-7.752H5.501a.5.5 0 0 1-.398-.801l8.45-11.098a.25.25 0 0 1 .449.151v7.752z"
        clipRule="evenodd"
      />
    </svg>
  );
}

function AcIcon({ className = 'w-5 h-5 text-[#708c91]' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" className={className}>
      <path
        fill="currentColor"
        d="M19.42 6.85a.75.75 0 1 1 .75 1.3l-1.525.88 1.575.909a.75.75 0 1 1-.75 1.299l-2.325-1.343L13.5 12l3.645 2.105 2.325-1.343a.75.75 0 0 1 .75 1.3l-1.575.909 1.524.88a.75.75 0 0 1-.75 1.298l-1.524-.88v1.82a.75.75 0 1 1-1.5 0v-2.685l-3.645-2.105v4.21l2.325 1.342a.75.75 0 0 1-.75 1.299l-1.575-.91V21a.75.75 0 0 1-1.5 0v-1.76l-1.575.91a.75.75 0 0 1-.75-1.3l2.325-1.342V13.3l-3.645 2.105v2.684a.75.75 0 0 1-1.5 0V16.27l-1.524.88a.75.75 0 0 1-.75-1.3l1.524-.88-1.575-.909a.75.75 0 1 1 .75-1.299l2.325 1.343L10.5 12 6.855 9.895 4.53 11.238a.75.75 0 0 1-.75-1.3l1.575-.909-1.524-.88a.75.75 0 1 1 .75-1.299l1.524.88V5.912a.75.75 0 1 1 1.5 0v2.684l3.645 2.105v-4.21L8.925 5.15a.75.75 0 0 1 .75-1.3l1.575.91V3a.75.75 0 0 1 1.5 0v1.76l1.575-.91a.75.75 0 1 1 .75 1.3L12.75 6.492V10.7l3.645-2.105V5.912a.75.75 0 1 1 1.5 0V7.73z"
      />
    </svg>
  );
}

function PowerIcon({ className = 'w-5 h-5 text-[#708c91]' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" className={className}>
      <path
        fill="currentColor"
        fillRule="evenodd"
        d="M8.25 2a.75.75 0 0 1 .75.75V8h6V2.75a.75.75 0 0 1 1.5 0V8H18a2 2 0 0 1 2 2v1a2 2 0 0 1-2 2v2a3 3 0 0 1-3 3h-.5v3a1 1 0 0 1-1 1h-3a1 1 0 0 1-1-1v-3H9a3 3 0 0 1-3-3v-2a2 2 0 0 1-2-2v-1a2 2 0 0 1 2-2h1.5V2.75A.75.75 0 0 1 8.25 2m-.75 9.5V15A1.5 1.5 0 0 0 9 16.5h2v4h2v-4h2a1.5 1.5 0 0 0 1.5-1.5v-3.5H18a.5.5 0 0 0 .5-.5v-1a.5.5 0 0 0-.5-.5H6a.5.5 0 0 0-.5.5v1a.5.5 0 0 0 .5.5z"
        clipRule="evenodd"
      />
    </svg>
  );
}

function SmokersIcon({ className = 'w-5 h-5 text-[#708c91]' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" className={className}>
      <path
        fill="currentColor"
        fillRule="evenodd"
        d="M20.5 16.5v2h-14v-2zM21 15a1 1 0 0 1 1 1v3a1 1 0 0 1-1 1H5v-5zM3.5 20v-5H2v5zM2.75 4v1.25c0 1.214.577 2.293 1.471 2.978A4.75 4.75 0 0 0 2 12.25v1.25h1.5v-1.25C3.5 10.285 5.144 9 7 9V7.5c-1.379 0-2.75-.652-2.75-2.25V4zM10 6.5a2.25 2.25 0 0 1 0 4.5H7.5A2.5 2.5 0 0 0 5 13.5h1.5a1 1 0 0 1 1-1H10A3.75 3.75 0 1 0 10 5z"
        clipRule="evenodd"
      />
    </svg>
  );
}

function PetsIcon({ className = 'w-5 h-5 text-[#708c91]' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" className={className}>
      <path
        fill="currentColor"
        fillRule="evenodd"
        d="M12 20.063c4.353-3.635 6.5-6.642 6.5-10.063a6.5 6.5 0 1 0-13 0c0 3.421 2.147 6.428 6.5 10.063M12 22c5-4 8-7.582 8-12a8 8 0 1 0-16 0c0 4.418 3 8 8 12"
        clipRule="evenodd"
      />
      <path
        fill="currentColor"
        fillRule="evenodd"
        d="M12 12a2 2 0 1 0 0-4 2 2 0 0 0 0 4m0 1.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7"
        clipRule="evenodd"
      />
    </svg>
  );
}

function MapPinIcon({ className = 'w-5 h-5 text-[#00aff5]' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" className={className}>
      <path
        fill="currentColor"
        fillRule="evenodd"
        d="M12 20.063c4.353-3.635 6.5-6.642 6.5-10.063a6.5 6.5 0 1 0-13 0c0 3.421 2.147 6.428 6.5 10.063M12 22c5-4 8-7.582 8-12a8 8 0 1 0-16 0c0 4.418 3 8 8 12"
        clipRule="evenodd"
      />
      <path
        fill="currentColor"
        fillRule="evenodd"
        d="M12 12a2 2 0 1 0 0-4 2 2 0 0 0 0 4m0 1.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7"
        clipRule="evenodd"
      />
    </svg>
  );
}

// ====================================================================
// FilterSidebar Component
// ====================================================================

export default function FilterSidebar({
  initialFilters = {},
  onFilterChange,
  counts = {},
  onShowMapClick,
  className = '',
}: FilterSidebarProps) {
  const [filters, setFilters] = useState<FilterState>({
    ...DEFAULT_FILTERS,
    ...initialFilters,
  });

  const sortGroupId = useId();

  // Check if any filter is active / modified from defaults
  const isFiltered =
    filters.sort !== 'dep_time:asc' ||
    filters.verified_id ||
    filters.two_max_back ||
    filters.auto_approve ||
    filters.ac ||
    filters.power ||
    filters.smokers ||
    filters.pets;

  // Emit filter updates to parent component
  const updateFilters = (updated: Partial<FilterState>) => {
    const nextState = { ...filters, ...updated };
    setFilters(nextState);
    if (onFilterChange) {
      onFilterChange(nextState);
    }
  };

  const handleClearAll = () => {
    setFilters(DEFAULT_FILTERS);
    if (onFilterChange) {
      onFilterChange(DEFAULT_FILTERS);
    }
  };

  const handleCheckboxToggle = (key: keyof Omit<FilterState, 'sort'>) => {
    updateFilters({ [key]: !filters[key] });
  };

  const sortOptions = [
    {
      label: 'Earliest departure',
      value: 'dep_time:asc' as SortOption,
      testId: 'ab-single-choice-facet-DEPARTURE_TIME',
      Icon: ClockIcon,
    },
    {
      label: 'Lowest price',
      value: 'price:asc' as SortOption,
      testId: 'ab-single-choice-facet-PRICE',
      Icon: PriceTagIcon,
    },
    {
      label: 'Close to departure point',
      value: 'dep_dist:asc' as SortOption,
      testId: 'ab-single-choice-facet-CLOSE_TO_DEPARTURE',
      Icon: CloseToDepartureIcon,
    },
    {
      label: 'Close to arrival point',
      value: 'arr_dist:asc' as SortOption,
      testId: 'ab-single-choice-facet-CLOSE_TO_ARRIVAL',
      Icon: CloseToArrivalIcon,
    },
    {
      label: 'Shortest ride',
      value: 'duration:asc' as SortOption,
      testId: 'ab-single-choice-facet-DURATION',
      Icon: DurationIcon,
    },
  ];

  const amenityOptions = [
    {
      key: 'two_max_back' as const,
      label: 'Max. 2 in the back',
      testId: 'ab-multiple-choices-facet-MAX_TWO',
      Icon: MaxTwoIcon,
      count: counts.two_max_back,
    },
    {
      key: 'auto_approve' as const,
      label: 'Instant Booking',
      testId: 'ab-multiple-choices-facet-AUTOMATIC_APPROVAL',
      Icon: InstantBookingIcon,
      count: counts.auto_approve,
    },
    {
      key: 'ac' as const,
      label: 'Air conditioning',
      testId: 'ab-multiple-choices-facet-AIR_CONDITIONING',
      Icon: AcIcon,
      count: counts.ac,
    },
    {
      key: 'power' as const,
      label: 'Power outlets',
      testId: 'ab-multiple-choices-facet-POWER_OUTLETS',
      Icon: PowerIcon,
      count: counts.power,
    },
    {
      key: 'smokers' as const,
      label: 'Smoking allowed',
      testId: 'ab-multiple-choices-facet-SMOKERS_ALLOWED',
      Icon: SmokersIcon,
      count: counts.smokers,
    },
    {
      key: 'pets' as const,
      label: 'Pets allowed',
      testId: 'ab-multiple-choices-facet-PETS_ALLOWED',
      Icon: PetsIcon,
      count: counts.pets,
    },
  ];

  return (
    <aside
      className={`w-full max-w-xs bg-white rounded-2xl p-6 shadow-sm border border-slate-100 flex flex-col font-sans select-none ${className}`}
      data-testid="filter-sidebar"
    >
      {/* 1. Map Trigger Card */}
      <div className="mb-6">
        <button
          type="button"
          onClick={onShowMapClick}
          className="w-full relative flex items-center justify-between p-3.5 bg-slate-50 hover:bg-slate-100/80 active:bg-slate-200/80 rounded-xl border border-slate-200/70 transition-all duration-200 group text-left cursor-pointer overflow-hidden shadow-xs"
        >
          <div className="flex items-center space-x-3 z-10">
            <span className="p-2 bg-white rounded-lg shadow-2xs group-hover:scale-105 transition-transform">
              <MapPinIcon className="w-5 h-5 text-[#00aff5]" />
            </span>
            <span className="font-semibold text-sm text-[#054752] group-hover:text-[#00aff5] transition-colors">
              Show on map
            </span>
          </div>

          <div className="w-16 h-12 rounded-lg overflow-hidden relative shadow-2xs border border-slate-200/60 shrink-0">
            <img
              src="https://cdn.blablacar.com/k/a/images/map-5114cd70eaf76a73.png"
              alt="Map Preview"
              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
              onError={(e) => {
                // Fallback gradient if external asset is unreachable
                (e.target as HTMLElement).style.display = 'none';
              }}
            />
          </div>
        </button>
      </div>

      {/* 2. Sort By Section */}
      <section data-testid="ab-single-choice-facet-group-Sort by" className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-bold tracking-tight text-[#054752]">
            Sort by
          </h3>
          <button
            type="button"
            onClick={handleClearAll}
            disabled={!isFiltered}
            className={`text-sm font-semibold transition-colors duration-150 ${
              isFiltered
                ? 'text-[#00aff5] hover:text-[#008ecc] cursor-pointer'
                : 'text-slate-300 cursor-not-allowed'
            }`}
          >
            Clear all
          </button>
        </div>

        <fieldset aria-label="Sort by options" className="space-y-1">
          {sortOptions.map((opt) => {
            const isSelected = filters.sort === opt.value;
            const { Icon } = opt;
            return (
              <label
                key={opt.value}
                className="flex items-center justify-between py-2.5 px-2 rounded-xl hover:bg-slate-50 cursor-pointer transition-colors group"
              >
                <div className="flex items-center space-x-3.5">
                  {/* Custom Radio Button */}
                  <span className="relative flex items-center justify-center">
                    <input
                      type="radio"
                      name={`sort-${sortGroupId}`}
                      value={opt.value}
                      checked={isSelected}
                      onChange={() => updateFilters({ sort: opt.value })}
                      data-testid={opt.testId}
                      className="sr-only"
                    />
                    <span
                      className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                        isSelected
                          ? 'border-[#00aff5] bg-[#00aff5]'
                          : 'border-slate-300 bg-white group-hover:border-slate-400'
                      }`}
                    >
                      {isSelected && (
                        <span className="w-2 h-2 rounded-full bg-white ring-2 ring-[#00aff5]" />
                      )}
                    </span>
                  </span>

                  <span
                    className={`text-sm transition-colors ${
                      isSelected
                        ? 'font-semibold text-[#054752]'
                        : 'font-normal text-slate-700 group-hover:text-slate-900'
                    }`}
                  >
                    {opt.label}
                  </span>
                </div>

                <Icon
                  className={`w-5 h-5 transition-colors ${
                    isSelected ? 'text-[#00aff5]' : 'text-slate-400 group-hover:text-slate-600'
                  }`}
                />
              </label>
            );
          })}
        </fieldset>
      </section>

      {/* Divider */}
      <hr className="my-6 border-slate-200/80" />

      {/* 3. Trust and Safety Section */}
      <section data-testid="ab-multiple-choices-facet-group-Trust and safety" className="space-y-4">
        <h3 className="text-xl font-bold tracking-tight text-[#054752]">
          Trust and safety
        </h3>

        <fieldset aria-label="Trust and safety options">
          <label className="flex items-center justify-between py-2.5 px-2 rounded-xl hover:bg-slate-50 cursor-pointer transition-colors group">
            <div className="flex items-center space-x-3.5">
              {/* Custom Checkbox */}
              <span className="relative flex items-center justify-center">
                <input
                  type="checkbox"
                  name="verified_id"
                  checked={filters.verified_id}
                  onChange={() => handleCheckboxToggle('verified_id')}
                  data-testid="ab-multiple-choices-facet-VERIFIED_IDENTITY"
                  className="sr-only"
                />
                <span
                  className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all ${
                    filters.verified_id
                      ? 'border-[#00aff5] bg-[#00aff5]'
                      : 'border-slate-300 bg-white group-hover:border-slate-400'
                  }`}
                >
                  {filters.verified_id && (
                    <svg
                      viewBox="0 0 16 16"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                      className="w-3.5 h-3.5 text-white stroke-current stroke-2"
                    >
                      <path d="M3.5 8.5L6.5 11.5L12.5 4.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                </span>
              </span>

              <span
                className={`text-sm transition-colors ${
                  filters.verified_id
                    ? 'font-semibold text-[#054752]'
                    : 'font-normal text-slate-700 group-hover:text-slate-900'
                }`}
              >
                Verified Profile
                {typeof counts.verified_id === 'number' && (
                  <span className="ml-1.5 text-xs text-slate-400 font-normal">
                    ({counts.verified_id})
                  </span>
                )}
              </span>
            </div>

            <VerifiedShieldIcon className="w-5 h-5 text-[#00aff5]" />
          </label>
        </fieldset>
      </section>

      {/* Divider */}
      <hr className="my-6 border-slate-200/80" />

      {/* 4. Amenities Section */}
      <section data-testid="ab-multiple-choices-facet-group-Amenities" className="space-y-4">
        <h3 className="text-xl font-bold tracking-tight text-[#054752]">
          Amenities
        </h3>

        <fieldset aria-label="Amenities options" className="space-y-1">
          {amenityOptions.map((opt) => {
            const isChecked = filters[opt.key];
            const { Icon } = opt;
            return (
              <label
                key={opt.key}
                className="flex items-center justify-between py-2.5 px-2 rounded-xl hover:bg-slate-50 cursor-pointer transition-colors group"
              >
                <div className="flex items-center space-x-3.5">
                  {/* Custom Checkbox */}
                  <span className="relative flex items-center justify-center">
                    <input
                      type="checkbox"
                      name={opt.key}
                      checked={isChecked}
                      onChange={() => handleCheckboxToggle(opt.key)}
                      data-testid={opt.testId}
                      className="sr-only"
                    />
                    <span
                      className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all ${
                        isChecked
                          ? 'border-[#00aff5] bg-[#00aff5]'
                          : 'border-slate-300 bg-white group-hover:border-slate-400'
                      }`}
                    >
                      {isChecked && (
                        <svg
                          viewBox="0 0 16 16"
                          fill="none"
                          xmlns="http://www.w3.org/2000/svg"
                          className="w-3.5 h-3.5 text-white stroke-current stroke-2"
                        >
                          <path d="M3.5 8.5L6.5 11.5L12.5 4.5" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      )}
                    </span>
                  </span>

                  <span
                    className={`text-sm transition-colors ${
                      isChecked
                        ? 'font-semibold text-[#054752]'
                        : 'font-normal text-slate-700 group-hover:text-slate-900'
                    }`}
                  >
                    {opt.label}
                    {typeof opt.count === 'number' && (
                      <span className="ml-1.5 text-xs text-slate-400 font-normal">
                        ({opt.count})
                      </span>
                    )}
                  </span>
                </div>

                <Icon
                  className={`w-5 h-5 transition-colors ${
                    isChecked ? 'text-[#00aff5]' : 'text-slate-400 group-hover:text-slate-600'
                  }`}
                />
              </label>
            );
          })}
        </fieldset>
      </section>
    </aside>
  );
}

// ====================================================================
// Client-side Helper: filterAndSortTrips
// Filters and sorts any array of trips received from Supabase / API
// ====================================================================

export function filterAndSortTrips<
  T extends {
    price_amount?: number;
    departure_time?: string;
    duration_minutes?: number;
    departure_distance_km?: number;
    arrival_distance_km?: number;
    is_verified?: boolean;
    driver_is_verified?: boolean;
    two_max_back?: boolean;
    instant_booking?: boolean;
    air_conditioning?: boolean;
    power_outlets?: boolean;
    smoking_allowed?: boolean;
    pets_allowed?: boolean;
    travelDetails?: {
      itinerary?: {
        departure?: { time?: string; coordinates?: { latitude: number; longitude: number } };
        arrival?: { time?: string; coordinates?: { latitude: number; longitude: number } };
        totalDuration?: { label?: string };
      };
      amenities?: Array<{ id: string; label: string }>;
      provider?: {
        profiles?: Array<{ status?: { type: string } }>;
      };
    };
    price?: {
      tokenizedPrice?: Array<{ type: string; value: string }>;
    };
  }
>(trips: T[], filters: FilterState): T[] {
  return [...trips]
    .filter((trip) => {
      // 1. Trust & Safety: Verified Profile
      if (filters.verified_id) {
        const isVerified =
          trip.is_verified ??
          trip.driver_is_verified ??
          trip.travelDetails?.provider?.profiles?.some((p) => p.status?.type === 'VERIFIED');
        if (!isVerified) return false;
      }

      // Helper to check amenities either in direct columns or in travelDetails.amenities array
      const hasAmenity = (columnVal?: boolean, amenityId?: string) => {
        if (columnVal !== undefined) return columnVal;
        return trip.travelDetails?.amenities?.some((a) => a.id === amenityId);
      };

      // 2. Max 2 in the back
      if (filters.two_max_back && !hasAmenity(trip.two_max_back, 'TWO_MAX_IN_THE_BACK')) {
        return false;
      }

      // 3. Instant Booking
      if (filters.auto_approve && !hasAmenity(trip.instant_booking, 'AUTOMATIC_APPROVAL')) {
        return false;
      }

      // 4. Air Conditioning
      if (filters.ac && !hasAmenity(trip.air_conditioning, 'AIR_CONDITIONING')) {
        return false;
      }

      // 5. Power Outlets
      if (filters.power && !hasAmenity(trip.power_outlets, 'POWER_OUTLETS')) {
        return false;
      }

      // 6. Smoking Allowed
      if (filters.smokers && !hasAmenity(trip.smoking_allowed, 'SMOKERS_ALLOWED')) {
        return false;
      }

      // 7. Pets Allowed
      if (filters.pets && !hasAmenity(trip.pets_allowed, 'PETS_ALLOWED')) {
        return false;
      }

      return true;
    })
    .sort((a, b) => {
      const getPrice = (t: typeof a): number => {
        if (t.price_amount !== undefined) return t.price_amount;
        const intToken = t.price?.tokenizedPrice?.find((p) => p.type === 'INTEGER');
        return intToken ? parseFloat(intToken.value) : 0;
      };

      const getDepartureTimeMs = (t: typeof a): number => {
        if (t.departure_time) return new Date(t.departure_time).getTime();
        const timeStr = t.travelDetails?.itinerary?.departure?.time || '00:00';
        const [hours, mins] = timeStr.split(':').map(Number);
        return hours * 60 + mins;
      };

      switch (filters.sort) {
        case 'price:asc':
          return getPrice(a) - getPrice(b);

        case 'duration:asc':
          return (a.duration_minutes ?? 0) - (b.duration_minutes ?? 0);

        case 'dep_dist:asc':
          return (a.departure_distance_km ?? 0) - (b.departure_distance_km ?? 0);

        case 'arr_dist:asc':
          return (a.arrival_distance_km ?? 0) - (b.arrival_distance_km ?? 0);

        case 'dep_time:asc':
        default:
          return getDepartureTimeMs(a) - getDepartureTimeMs(b);
      }
    });
}

