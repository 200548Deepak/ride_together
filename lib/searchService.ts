import {
  BlaBlaCarSearchResponse,
  SearchQueryRequest,
  SearchItem,
  SummaryHeaderItem,
  TripSearchItem,
  Amenity,
  TokenizedPrice,
  FacetGroup,
} from '../types/blablacar-search';
import { randomUUID } from 'crypto';
import { getAllSharedRides, PublishedRide } from './ridesStore';

interface RawRideRecord {
  ride_id: string;
  multimodal_id: string;
  driver_id: string;
  driver_name: string;
  driver_avatar: string;
  driver_is_verified: boolean;
  driver_rating: number;
  vehicle_make?: string;
  vehicle_model?: string;
  departure_city: string;
  departure_location_name: string;
  departure_lat: number;
  departure_lon: number;
  departure_time: string;
  arrival_city: string;
  arrival_location_name: string;
  arrival_lat: number;
  arrival_lon: number;
  arrival_time: string;
  duration_minutes: number;
  is_overnight: boolean;
  available_seats: number;
  price_amount: number;
  currency: string;
  instant_booking: boolean;
  two_max_back: boolean;
  air_conditioning: boolean;
  power_outlets: boolean;
  smoking_allowed: boolean;
  pets_allowed: boolean;
}

// Fallback seed dataset directly matching captured BlaBlaCar search HAR
const MOCK_RIDES: RawRideRecord[] = [
  {
    ride_id: '11111111-1111-1111-1111-111111111111',
    multimodal_id: 'M2H8MPaRSPWtAxUaaKtKdwRYo4G9TJSrW5s6bS884iyg',
    driver_id: 'd1111111-1111-1111-1111-111111111111',
    driver_name: 'Karthik',
    driver_avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&h=150&q=80',
    driver_is_verified: true,
    driver_rating: 4.9,
    vehicle_make: 'Maruti Suzuki',
    vehicle_model: 'Swift',
    departure_city: 'Bengaluru',
    departure_location_name: 'Majestic, Bengaluru',
    departure_lat: 12.942646,
    departure_lon: 77.574737,
    departure_time: '2026-11-09T20:20:00Z',
    arrival_city: 'Mysuru',
    arrival_location_name: 'Suburban Bus Stand, Mysuru',
    arrival_lat: 12.349975,
    arrival_lon: 76.660180,
    arrival_time: '2026-11-09T22:20:00Z',
    duration_minutes: 120,
    is_overnight: false,
    available_seats: 3,
    price_amount: 400.0,
    currency: 'INR',
    instant_booking: true,
    two_max_back: false,
    air_conditioning: false,
    power_outlets: false,
    smoking_allowed: false,
    pets_allowed: false,
  },
  {
    ride_id: '22222222-2222-2222-2222-222222222222',
    multimodal_id: 'M2H8MPaRSPWtAxUaaKtKdweCZ04VhmQGi0VuXqSmroXQ',
    driver_id: 'd2222222-2222-2222-2222-222222222222',
    driver_name: 'Arjun',
    driver_avatar: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?auto=format&fit=crop&w=150&h=150&q=80',
    driver_is_verified: true,
    driver_rating: 4.7,
    vehicle_make: 'Hyundai',
    vehicle_model: 'Creta',
    departure_city: 'Bengaluru',
    departure_location_name: 'Electronic City, Bengaluru',
    departure_lat: 12.883108,
    departure_lon: 77.623644,
    departure_time: '2026-11-09T21:40:00Z',
    arrival_city: 'Mysuru',
    arrival_location_name: 'Columbia Asia Hospital, Mysuru',
    arrival_lat: 12.342539,
    arrival_lon: 76.634790,
    arrival_time: '2026-11-10T00:10:00Z',
    duration_minutes: 150,
    is_overnight: true,
    available_seats: 2,
    price_amount: 420.0,
    currency: 'INR',
    instant_booking: true,
    two_max_back: true,
    air_conditioning: true,
    power_outlets: true,
    smoking_allowed: false,
    pets_allowed: false,
  },
  {
    ride_id: '33333333-3333-3333-3333-333333333333',
    multimodal_id: 'M2H8MPaRSPWtAxUaaKtKdw06BjR5BeSeuc4T8wBm9fqw',
    driver_id: 'd3333333-3333-3333-3333-333333333333',
    driver_name: 'Rohit',
    driver_avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&h=150&q=80',
    driver_is_verified: true,
    driver_rating: 4.85,
    vehicle_make: 'Tata',
    vehicle_model: 'Nexon EV',
    departure_city: 'Bengaluru',
    departure_location_name: 'Silk Board, Bengaluru',
    departure_lat: 12.917200,
    departure_lon: 77.622700,
    departure_time: '2026-11-09T18:30:00Z',
    arrival_city: 'Mysuru',
    arrival_location_name: 'Mysore Palace North Gate, Mysuru',
    arrival_lat: 12.305100,
    arrival_lon: 76.655100,
    arrival_time: '2026-11-09T21:00:00Z',
    duration_minutes: 150,
    is_overnight: false,
    available_seats: 3,
    price_amount: 380.0,
    currency: 'INR',
    instant_booking: true,
    two_max_back: true,
    air_conditioning: true,
    power_outlets: true,
    smoking_allowed: false,
    pets_allowed: true,
  },
  {
    ride_id: '44444444-4444-4444-4444-444444444444',
    multimodal_id: 'M2H8MPaRSPWtAxUaaKtKdw8Xx7ATCvQ3-8BCpGMNg44Q',
    driver_id: 'd4444444-4444-4444-4444-444444444444',
    driver_name: 'Priya',
    driver_avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&h=150&q=80',
    driver_is_verified: true,
    driver_rating: 5.0,
    vehicle_make: 'Honda',
    vehicle_model: 'City',
    departure_city: 'Bengaluru',
    departure_location_name: 'Kengeri Satellite Town, Bengaluru',
    departure_lat: 12.912100,
    departure_lon: 77.483300,
    departure_time: '2026-11-09T19:00:00Z',
    arrival_city: 'Mysuru',
    arrival_location_name: 'Infosys Mysore Campus, Mysuru',
    arrival_lat: 12.355000,
    arrival_lon: 76.595000,
    arrival_time: '2026-11-09T21:15:00Z',
    duration_minutes: 135,
    is_overnight: false,
    available_seats: 2,
    price_amount: 450.0,
    currency: 'INR',
    instant_booking: false,
    two_max_back: true,
    air_conditioning: true,
    power_outlets: true,
    smoking_allowed: false,
    pets_allowed: false,
  }
];

function formatDurationLabel(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${h}h${m.toString().padStart(2, '0')}`;
}

function formatTimeToHHMM(isoString: string): string {
  const date = new Date(isoString);
  return date.toISOString().substring(11, 16);
}

function parseBooleanParam(val: unknown): boolean {
  if (typeof val === 'boolean') return val;
  if (typeof val === 'string') return val.toLowerCase() === 'true' || val === '1';
  return false;
}

function publishedRideToRaw(r: PublishedRide): RawRideRecord {
  const depTime = new Date(r.departure_time);
  const arrTime = new Date(r.arrival_time);
  const durationMinutes = Math.max(30, Math.round((arrTime.getTime() - depTime.getTime()) / (60 * 1000)));

  return {
    ride_id: r.id,
    multimodal_id: r.multimodal_id,
    driver_id: r.driver_id,
    driver_name: r.driver?.name || 'Driver ANISH',
    driver_avatar: r.driver?.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
    driver_is_verified: r.driver?.is_verified ?? true,
    driver_rating: r.driver?.rating || 4.95,
    vehicle_make: r.vehicle?.make || 'Hyundai',
    vehicle_model: r.vehicle?.model || 'Creta',
    departure_city: r.departure_city,
    departure_location_name: r.departure_location_name,
    departure_lat: r.departure_lat,
    departure_lon: r.departure_lon,
    departure_time: r.departure_time,
    arrival_city: r.arrival_city,
    arrival_location_name: r.arrival_location_name,
    arrival_lat: r.arrival_lat,
    arrival_lon: r.arrival_lon,
    arrival_time: r.arrival_time,
    duration_minutes: durationMinutes,
    is_overnight: arrTime.getDate() !== depTime.getDate(),
    available_seats: r.available_seats,
    price_amount: r.price_amount,
    currency: r.currency || 'INR',
    instant_booking: r.instant_booking,
    two_max_back: r.two_max_back,
    air_conditioning: r.air_conditioning,
    power_outlets: r.power_outlets,
    smoking_allowed: r.smoking_allowed,
    pets_allowed: r.pets_allowed,
  };
}

function cityMatches(queryCity: string, rideCity: string): boolean {
  if (!queryCity) return true;
  const q = queryCity.trim().toLowerCase();
  const c = rideCity.trim().toLowerCase();
  if (c.includes(q) || q.includes(c)) return true;

  const aliases: Record<string, string[]> = {
    bengaluru: ['bangalore', 'bengaluru', 'blr'],
    mysuru: ['mysore', 'mysuru'],
    chennai: ['madras', 'chennai'],
    mumbai: ['bombay', 'mumbai'],
    delhi: ['new delhi', 'delhi', 'ncr'],
    pune: ['poona', 'pune'],
    hyderabad: ['hyderabad', 'secunderabad'],
  };

  for (const group of Object.values(aliases)) {
    const qMatches = group.some(alias => q.includes(alias));
    const cMatches = group.some(alias => c.includes(alias));
    if (qMatches && cMatches) return true;
  }

  return false;
}

export async function executeSearch(params: SearchQueryRequest): Promise<BlaBlaCarSearchResponse> {
  const searchUuid = randomUUID();

  // Extract query filters
  const departureCity = (params.fn || '').split(',')[0].trim();
  const arrivalCity = (params.tn || '').split(',')[0].trim();
  const requestedDate = params.db || params.departure_date || new Date().toISOString().split('T')[0];
  const seats = Number(params.seats || params.requested_seats || 1);
  const sort = params.sort || 'dep_time:asc';

  const filterVerified = parseBooleanParam(params.verified_id);
  const filterAutoApprove = parseBooleanParam(params.auto_approve);
  const filterTwoMaxBack = parseBooleanParam(params['2_max_back'] || params.two_max_back);
  const filterAc = parseBooleanParam(params.ac);
  const filterPower = parseBooleanParam(params.power);
  const filterSmokers = parseBooleanParam(params.smokers);
  const filterPets = parseBooleanParam(params.pets);

  // 1. Gather all published rides from the shared store (includes all driver-created rides!)
  const sharedRidesRaw = getAllSharedRides().map(publishedRideToRaw);

  // 2. Combine with seed mock rides
  const allPool: RawRideRecord[] = [...sharedRidesRaw];
  for (const seed of MOCK_RIDES) {
    if (!allPool.some(r => r.ride_id === seed.ride_id || r.multimodal_id === seed.multimodal_id)) {
      allPool.push(seed);
    }
  }

  // 3. Try querying Supabase directly if configured
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (supabaseUrl && supabaseKey && !supabaseUrl.includes('placeholder')) {
    try {
      const { createClient } = await import('@supabase/supabase-js');
      const supabase = createClient(supabaseUrl, supabaseKey);

      // Try direct select first
      const { data: dbRides } = await supabase
        .from('rides')
        .select(`
          *,
          driver:driver_id (
            id,
            name,
            avatar_url,
            rating,
            is_verified
          ),
          vehicle:vehicle_id (
            make,
            model
          )
        `)
        .order('departure_time', { ascending: true });

      if (dbRides && dbRides.length > 0) {
        for (const dr of dbRides) {
          const depTime = new Date(dr.departure_time);
          const arrTime = new Date(dr.arrival_time);
          const mapped: RawRideRecord = {
            ride_id: dr.id,
            multimodal_id: dr.multimodal_id || dr.id,
            driver_id: dr.driver_id,
            driver_name: dr.driver?.name || 'Driver',
            driver_avatar: dr.driver?.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
            driver_is_verified: dr.driver?.is_verified ?? true,
            driver_rating: dr.driver?.rating || 4.9,
            vehicle_make: dr.vehicle?.make || 'Car',
            vehicle_model: dr.vehicle?.model || 'Sedan',
            departure_city: dr.departure_city,
            departure_location_name: dr.departure_location_name,
            departure_lat: dr.departure_lat || 12.97,
            departure_lon: dr.departure_lon || 77.59,
            departure_time: dr.departure_time,
            arrival_city: dr.arrival_city,
            arrival_location_name: dr.arrival_location_name,
            arrival_lat: dr.arrival_lat || 12.29,
            arrival_lon: dr.arrival_lon || 76.63,
            arrival_time: dr.arrival_time,
            duration_minutes: Math.max(30, Math.round((arrTime.getTime() - depTime.getTime()) / (60 * 1000))),
            is_overnight: arrTime.getDate() !== depTime.getDate(),
            available_seats: dr.available_seats,
            price_amount: Number(dr.price_amount) || 450,
            currency: dr.currency || 'INR',
            instant_booking: dr.instant_booking ?? true,
            two_max_back: dr.two_max_back ?? true,
            air_conditioning: dr.air_conditioning ?? true,
            power_outlets: dr.power_outlets ?? false,
            smoking_allowed: dr.smoking_allowed ?? false,
            pets_allowed: dr.pets_allowed ?? false,
          };

          if (!allPool.some(p => p.ride_id === mapped.ride_id || p.multimodal_id === mapped.multimodal_id)) {
            allPool.unshift(mapped);
          }
        }
      }
    } catch (e) {
      console.warn('Database search check note:', e);
    }
  }

  // 4. Match against rider's search route
  let matchedRides = allPool.filter(r => {
    const depOk = cityMatches(departureCity, r.departure_city);
    const arrOk = cityMatches(arrivalCity, r.arrival_city);
    return depOk && arrOk;
  });

  // If strict city match returns 0, return all available pool rides so riders can always explore rides
  if (matchedRides.length === 0) {
    matchedRides = allPool;
  }

  // 5. Apply user filters
  let rawRides = matchedRides.filter(r => {
    if (r.available_seats < seats) return false;
    if (filterVerified && !r.driver_is_verified) return false;
    if (filterAutoApprove && !r.instant_booking) return false;
    if (filterTwoMaxBack && !r.two_max_back) return false;
    if (filterAc && !r.air_conditioning) return false;
    if (filterPower && !r.power_outlets) return false;
    if (filterSmokers && !r.smoking_allowed) return false;
    if (filterPets && !r.pets_allowed) return false;
    return true;
  });

  // 6. Apply sorting
  if (sort === 'price:asc') {
    rawRides.sort((a, b) => a.price_amount - b.price_amount);
  } else if (sort === 'duration:asc') {
    rawRides.sort((a, b) => a.duration_minutes - b.duration_minutes);
  } else {
    rawRides.sort((a, b) => new Date(a.departure_time).getTime() - new Date(b.departure_time).getTime());
  }

  // Build BlaBlaCar facet counts
  const verifiedCount = rawRides.filter(r => r.driver_is_verified).length;
  const instantBookingCount = rawRides.filter(r => r.instant_booking).length;
  const twoMaxBackCount = rawRides.filter(r => r.two_max_back).length;
  const acCount = rawRides.filter(r => r.air_conditioning).length;
  const powerCount = rawRides.filter(r => r.power_outlets).length;
  const smokersCount = rawRides.filter(r => r.smoking_allowed).length;
  const petsCount = rawRides.filter(r => r.pets_allowed).length;

  const facetGroups: FacetGroup[] = [
    {
      type: 'SINGLE_CHOICE',
      applicable: true,
      title: 'Sort by',
      facets: [
        {
          label: 'Earliest departure',
          selected: sort === 'dep_time:asc',
          applicable: true,
          queryParam: { key: 'sort', value: 'dep_time:asc' },
          icon: 'DEPARTURE_TIME',
          disabled: false,
        },
        {
          label: 'Lowest price',
          selected: sort === 'price:asc',
          applicable: true,
          queryParam: { key: 'sort', value: 'price:asc' },
          icon: 'PRICE',
          disabled: false,
        },
        {
          label: 'Close to departure point',
          selected: sort === 'dep_dist:asc',
          applicable: true,
          queryParam: { key: 'sort', value: 'dep_dist:asc' },
          icon: 'CLOSE_TO_DEPARTURE',
          disabled: false,
        },
        {
          label: 'Close to arrival point',
          selected: sort === 'arr_dist:asc',
          applicable: true,
          queryParam: { key: 'sort', value: 'arr_dist:asc' },
          icon: 'CLOSE_TO_ARRIVAL',
          disabled: false,
        },
        {
          label: 'Shortest ride',
          selected: sort === 'duration:asc',
          applicable: true,
          queryParam: { key: 'sort', value: 'duration:asc' },
          icon: 'DURATION',
          disabled: false,
        },
      ],
    },
    {
      type: 'MULTIPLE_CHOICE',
      applicable: true,
      title: 'Trust and safety',
      facets: [
        {
          label: 'Verified Profile',
          selected: filterVerified,
          applicable: true,
          queryParam: { key: 'verified_id', value: 'true' },
          icon: 'VERIFIED_IDENTITY',
          tripsCount: verifiedCount,
          disabled: verifiedCount === 0,
        },
      ],
    },
    {
      type: 'MULTIPLE_CHOICE',
      applicable: true,
      title: 'Amenities',
      facets: [
        {
          label: 'Max. 2 in the back',
          selected: filterTwoMaxBack,
          applicable: true,
          queryParam: { key: '2_max_back', value: 'true' },
          icon: 'MAX_TWO',
          tripsCount: twoMaxBackCount,
          disabled: twoMaxBackCount === 0,
        },
        {
          label: 'Instant Booking',
          selected: filterAutoApprove,
          applicable: true,
          queryParam: { key: 'auto_approve', value: 'true' },
          icon: 'AUTOMATIC_APPROVAL',
          tripsCount: instantBookingCount,
          disabled: instantBookingCount === 0,
        },
        {
          label: 'Air conditioning',
          selected: filterAc,
          applicable: true,
          queryParam: { key: 'ac', value: 'true' },
          icon: 'AIR_CONDITIONING',
          tripsCount: acCount,
          disabled: acCount === 0,
        },
        {
          label: 'Power outlets',
          selected: filterPower,
          applicable: true,
          queryParam: { key: 'power', value: 'true' },
          icon: 'POWER_OUTLETS',
          tripsCount: powerCount,
          disabled: powerCount === 0,
        },
        {
          label: 'Smoking allowed',
          selected: filterSmokers,
          applicable: true,
          queryParam: { key: 'smokers', value: 'true' },
          icon: 'SMOKERS_ALLOWED',
          tripsCount: smokersCount,
          disabled: smokersCount === 0,
        },
        {
          label: 'Pets allowed',
          selected: filterPets,
          applicable: true,
          queryParam: { key: 'pets', value: 'true' },
          icon: 'PETS_ALLOWED',
          tripsCount: petsCount,
          disabled: petsCount === 0,
        },
      ],
    },
  ];

  // 1. Summary Header
  const summaryHeader: SummaryHeaderItem = {
    type: 'SUMMARY_HEADER',
    id: 'SUMMARY_HEADER_0',
    date: 'Upcoming',
    departure: departureCity || 'All Locations',
    arrival: arrivalCity || 'All Destinations',
    numberOfResults: `${rawRides.length} rides available`,
  };

  // 2. Build Trip Search Items
  const tripItems: TripSearchItem[] = rawRides.map((ride, idx) => {
    const amenities: Amenity[] = [];
    if (ride.instant_booking) amenities.push({ id: 'AUTOMATIC_APPROVAL', label: 'Instant Booking' });
    if (ride.two_max_back) amenities.push({ id: 'TWO_MAX_IN_THE_BACK', label: 'Max. 2 in the back' });
    if (ride.air_conditioning) amenities.push({ id: 'AIR_CONDITIONING', label: 'Air conditioning' });
    if (ride.power_outlets) amenities.push({ id: 'POWER_OUTLETS', label: 'Power outlets' });
    if (ride.smoking_allowed) amenities.push({ id: 'SMOKERS_ALLOWED', label: 'Smoking allowed' });
    if (ride.pets_allowed) amenities.push({ id: 'PETS_ALLOWED', label: 'Pets allowed' });

    const integerPart = Math.floor(ride.price_amount).toString();
    const tokenizedPrice: TokenizedPrice[] = [
      { type: 'CURRENCY', value: '₹' },
      { type: 'INTEGER', value: integerPart },
      { type: 'FRACTION', value: '.00' },
    ];

    return {
      type: 'TRIP',
      id: `TRIP_${idx}`,
      multimodalId: {
        source: 'CARPOOLING',
        id: ride.multimodal_id,
        pro_partner_id: null,
      },
      action: {
        type: 'OPEN_RIDE_DETAILS',
        parameters: {
          searchUuid,
          multimodalId: {
            source: 'CARPOOLING',
            id: ride.multimodal_id,
            pro_partner_id: null,
          },
          passengers: {
            type: 'NUMBER_OF_SEATS',
            value: seats,
          },
          searchOrigin: params.search_origin || 'HOME',
        },
        tracking: {
          gtm: {
            price: `₹${ride.price_amount.toFixed(2)}`,
            departure_date: requestedDate,
            arrival_city: arrivalCity,
            departure_city: departureCity,
            event: 'select_trip',
          },
          tracktor: {
            name: 'search_result_choice',
            data: {
              multimodal_source: 'CARPOOLING',
              multimodal_pro_partner_id: null,
              multimodal_trip_id: ride.multimodal_id,
              choice_type: 'TRIP_LIST',
              uuid: searchUuid,
            },
          },
        },
      },
      travelDetails: {
        itinerary: {
          departure: {
            primaryLocation: ride.departure_city,
            time: formatTimeToHHMM(ride.departure_time),
            coordinates: {
              latitude: ride.departure_lat,
              longitude: ride.departure_lon,
            },
          },
          arrival: {
            primaryLocation: ride.arrival_city,
            time: formatTimeToHHMM(ride.arrival_time),
            coordinates: {
              latitude: ride.arrival_lat,
              longitude: ride.arrival_lon,
            },
          },
          hasConnection: false,
          isOvernight: ride.is_overnight,
          totalDuration: {
            label: formatDurationLabel(ride.duration_minutes),
            a11yLabel: 'Total ride duration',
          },
          dayDelta: ride.is_overnight
            ? {
                label: '+1',
                a11yLabel: 'Difference between arrival and departure day',
              }
            : undefined,
        },
        amenities,
        provider: {
          supply: {
            type: 'CARPOOL',
            a11yLabel: 'Carpool',
          },
          profiles: [
            {
              type: 'DRIVER',
              name: ride.driver_name,
              avatar: ride.driver_avatar,
              status: {
                type: ride.driver_is_verified ? 'VERIFIED' : 'UNVERIFIED',
              },
              rating: ride.driver_rating.toFixed(1),
            },
          ],
        },
      },
      price: {
        tokenizedPrice,
      },
    };
  });

  const searchItems: SearchItem[] = [summaryHeader, ...tripItems];

  return {
    searchUUID: searchUuid,
    facets: {
      type: 'DETAILS',
      title: 'Filter',
      isFiltered: Boolean(
        filterVerified || filterAutoApprove || filterTwoMaxBack || filterAc || filterPower || filterSmokers || filterPets
      ),
      tripCounts: [
        {
          supply: 'CARPOOLING',
          count: rawRides.length,
          a11yLabel: `${rawRides.length} carpools match your preferences.`,
        },
      ],
      groups: facetGroups,
      dataTransparencyLabel: 'Platform transparency',
      applyAction: {
        label: 'Filter',
        tracking: {
          tracktor: {
            name: 'search_filter_apply',
          },
        },
      },
      clearAction: {
        label: 'Clear all',
        tracking: {
          tracktor: {
            name: 'remove_all_filters',
          },
        },
      },
    },
    tabs: [
      {
        label: 'All',
        supply: 'ALL',
        count: rawRides.length,
      },
    ],
    resultsContent: {
      type: 'RESULTS',
      resultsDatetime: `${requestedDate}T00:00:00Z`,
      searchItems,
      pagination: {
        nextPageCursor: rawRides.length > 10 ? 'cGFnZT0x' : null,
      },
      openMapAction: {
        label: 'Show on map',
        tracking: {
          tracktor: {
            name: 'ride_map_open',
            data: {
              app_version: '1.0.0',
              client: 'SPA',
            },
          },
        },
      },
    },
    tracking: {
      onLoad: {
        braze: {
          name: 'Search results',
          data: {
            DistanceInKm: 126,
            DepartureLocation: `${departureCity}, Karnataka`,
            ArrivalLocation: `${arrivalCity}, Karnataka`,
            DepartureCity: departureCity,
            ArrivalCity: arrivalCity,
            RideDate: requestedDate,
            NumberOfResults: rawRides.length,
            NumberOfSeats: seats,
            Tab: 'CARPOOLING',
            HasVerifiedProfileResults: verifiedCount > 0,
          },
        },
      },
    },
  };
}

