import React from 'react';
import FilterSidebar, { filterAndSortTrips, DEFAULT_FILTERS } from './components/FilterSidebar';

console.log('FilterSidebar component imported successfully!');
console.log('Default filters:', DEFAULT_FILTERS);

const sampleTrips = [
  {
    id: 1,
    price_amount: 450,
    departure_time: '2026-11-09T20:00:00Z',
    duration_minutes: 150,
    driver_is_verified: true,
    instant_booking: true,
    two_max_back: true,
    air_conditioning: true,
  },
  {
    id: 2,
    price_amount: 380,
    departure_time: '2026-11-09T18:30:00Z',
    duration_minutes: 130,
    driver_is_verified: false,
    instant_booking: true,
    two_max_back: false,
    air_conditioning: false,
  },
];

const sortedByPrice = filterAndSortTrips(sampleTrips, {
  ...DEFAULT_FILTERS,
  sort: 'price:asc',
});
console.log('Sorted by price:', sortedByPrice.map(t => ({ id: t.id, price: t.price_amount })));

const verifiedOnly = filterAndSortTrips(sampleTrips, {
  ...DEFAULT_FILTERS,
  verified_id: true,
});
console.log('Verified only:', verifiedOnly.map(t => ({ id: t.id, verified: t.driver_is_verified })));

