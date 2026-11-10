import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

export interface PublishedRide {
  id: string;
  multimodal_id: string;
  driver_id: string;
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
  total_seats: number;
  available_seats: number;
  price_amount: number;
  currency: string;
  status: 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  instant_booking: boolean;
  two_max_back: boolean;
  air_conditioning: boolean;
  power_outlets: boolean;
  smoking_allowed: boolean;
  pets_allowed: boolean;
  created_at: string;
  driver: {
    id: string;
    name: string;
    email?: string;
    phone?: string;
    avatar_url: string;
    rating: number;
    ratings_count?: number;
    is_verified: boolean;
  };
  vehicle: {
    id?: string;
    make: string;
    model: string;
    color: string;
    license_plate: string;
  };
  waypoints?: Array<{
    location_name: string;
    stop_order: number;
    latitude?: number;
    longitude?: number;
    estimated_arrival?: string;
  }>;
  bookings: Array<{
    id: string;
    trip_id: string;
    passenger_id: string;
    seats_reserved: number;
    total_price: number;
    currency: string;
    status: 'pending' | 'confirmed' | 'cancelled';
    payment_method: 'CASH' | 'ONLINE' | 'CARD';
    created_at: string;
    passenger?: {
      id: string;
      name: string;
      email?: string;
      phone?: string;
      avatar_url: string;
      rating?: number;
      ratings_count?: number;
    };
  }>;
}

// Global in-memory cache shared across API routes in the same Node.js process
declare global {
  // eslint-disable-next-line no-var
  var __RIDE_TOGETHER_STORE__: PublishedRide[] | undefined;
}

const DATA_DIR = path.join(process.cwd(), 'data');
const RIDES_FILE = path.join(DATA_DIR, 'rides.json');

function loadRidesFromDisk(): PublishedRide[] | null {
  try {
    if (fs.existsSync(RIDES_FILE)) {
      const content = fs.readFileSync(RIDES_FILE, 'utf-8');
      const data = JSON.parse(content);
      if (Array.isArray(data) && data.length > 0) {
        const idSet = new Set(data.map((r: any) => r.id));
        const missingSeeds = INITIAL_SEED_RIDES.filter(s => !idSet.has(s.id));
        return [...data, ...missingSeeds];
      }
    }
  } catch (err) {
    console.warn('Could not read rides from disk cache:', err);
  }
  return null;
}

function saveRidesToDisk(rides: PublishedRide[]): void {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(RIDES_FILE, JSON.stringify(rides, null, 2), 'utf-8');
  } catch (err) {
    console.warn('Could not save rides to disk cache:', err);
  }
}

const INITIAL_SEED_RIDES: PublishedRide[] = [
  {
    id: '11111111-1111-1111-1111-111111111111',
    multimodal_id: 'M2H8MPaRSPWtAxUaaKtKdwRYo4G9TJSrW5s6bS884iyg',
    driver_id: 'd1111111-1111-1111-1111-111111111111',
    departure_city: 'Bengaluru',
    departure_location_name: 'Majestic Bus Stand, Bengaluru',
    departure_lat: 12.9716,
    departure_lon: 77.5946,
    departure_time: new Date(Date.now() + 18 * 60 * 60 * 1000).toISOString(),
    arrival_city: 'Mysuru',
    arrival_location_name: 'Suburban Bus Stand, Mysuru',
    arrival_lat: 12.2958,
    arrival_lon: 76.6394,
    arrival_time: new Date(Date.now() + 21 * 60 * 60 * 1000).toISOString(),
    total_seats: 3,
    available_seats: 3,
    price_amount: 400,
    currency: 'INR',
    status: 'SCHEDULED',
    instant_booking: true,
    two_max_back: true,
    air_conditioning: true,
    power_outlets: true,
    smoking_allowed: false,
    pets_allowed: false,
    created_at: new Date().toISOString(),
    driver: {
      id: 'd1111111-1111-1111-1111-111111111111',
      name: 'Karthik',
      email: 'karthik@example.com',
      avatar_url: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&h=150&q=80',
      rating: 4.9,
      ratings_count: 28,
      is_verified: true,
    },
    vehicle: {
      make: 'Maruti Suzuki',
      model: 'Swift Dzire',
      color: 'Silver',
      license_plate: 'KA 01 MJ 2024',
    },
    waypoints: [],
    bookings: [],
  },
  {
    id: '22222222-2222-2222-2222-222222222222',
    multimodal_id: 'M2H8MPaRSPWtAxUaaKtKdweCZ04VhmQGi0VuXqSmroXQ',
    driver_id: 'd2222222-2222-2222-2222-222222222222',
    departure_city: 'Bengaluru',
    departure_location_name: 'Electronic City Toll, Bengaluru',
    departure_lat: 12.8452,
    departure_lon: 77.6602,
    departure_time: new Date(Date.now() + 26 * 60 * 60 * 1000).toISOString(),
    arrival_city: 'Mysuru',
    arrival_location_name: 'Columbia Asia Hospital, Mysuru',
    arrival_lat: 12.3425,
    arrival_lon: 76.6347,
    arrival_time: new Date(Date.now() + 29 * 60 * 60 * 1000).toISOString(),
    total_seats: 3,
    available_seats: 2,
    price_amount: 420,
    currency: 'INR',
    status: 'SCHEDULED',
    instant_booking: true,
    two_max_back: true,
    air_conditioning: true,
    power_outlets: true,
    smoking_allowed: false,
    pets_allowed: false,
    created_at: new Date().toISOString(),
    driver: {
      id: 'd2222222-2222-2222-2222-222222222222',
      name: 'Arjun',
      email: 'arjun@example.com',
      avatar_url: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?auto=format&fit=crop&w=150&h=150&q=80',
      rating: 4.7,
      ratings_count: 15,
      is_verified: true,
    },
    vehicle: {
      make: 'Hyundai',
      model: 'Creta',
      color: 'White',
      license_plate: 'KA 05 AB 8899',
    },
    waypoints: [],
    bookings: [],
  },
  {
    id: '33333333-3333-3333-3333-333333333333',
    multimodal_id: 'M2H8MPaRSPWtAxUaaKtKdw06BjR5BeSeuc4T8wBm9fqw',
    driver_id: 'd3333333-3333-3333-3333-333333333333',
    departure_city: 'Bengaluru',
    departure_location_name: 'Indiranagar Metro, Bengaluru',
    departure_lat: 12.9784,
    departure_lon: 77.6408,
    departure_time: new Date(Date.now() + 32 * 60 * 60 * 1000).toISOString(),
    arrival_city: 'Chennai',
    arrival_location_name: 'Koyambedu Bus Stand, Chennai',
    arrival_lat: 13.0694,
    arrival_lon: 80.1948,
    arrival_time: new Date(Date.now() + 38 * 60 * 60 * 1000).toISOString(),
    total_seats: 3,
    available_seats: 3,
    price_amount: 650,
    currency: 'INR',
    status: 'SCHEDULED',
    instant_booking: true,
    two_max_back: true,
    air_conditioning: true,
    power_outlets: true,
    smoking_allowed: false,
    pets_allowed: true,
    created_at: new Date().toISOString(),
    driver: {
      id: 'd3333333-3333-3333-3333-333333333333',
      name: 'Rohit',
      email: 'rohit@example.com',
      avatar_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&h=150&q=80',
      rating: 4.85,
      ratings_count: 32,
      is_verified: true,
    },
    vehicle: {
      make: 'Tata',
      model: 'Nexon',
      color: 'Blue',
      license_plate: 'KA 04 MP 3030',
    },
    waypoints: [],
    bookings: [],
  },
];

if (!global.__RIDE_TOGETHER_STORE__) {
  const fromDisk = loadRidesFromDisk();
  global.__RIDE_TOGETHER_STORE__ = fromDisk || [...INITIAL_SEED_RIDES];
}

/**
 * Returns all active rides from the shared store.
 */
export function getAllSharedRides(): PublishedRide[] {
  if (!global.__RIDE_TOGETHER_STORE__) {
    const fromDisk = loadRidesFromDisk();
    global.__RIDE_TOGETHER_STORE__ = fromDisk || [...INITIAL_SEED_RIDES];
  }
  return global.__RIDE_TOGETHER_STORE__;
}

/**
 * Adds a newly published ride into the shared store so all riders can discover it.
 */
export function addSharedRide(ride: PublishedRide): PublishedRide {
  const store = getAllSharedRides();
  const existingIdx = store.findIndex(r => r.id === ride.id || r.multimodal_id === ride.multimodal_id);
  if (existingIdx >= 0) {
    store[existingIdx] = { ...store[existingIdx], ...ride };
    saveRidesToDisk(store);
    return store[existingIdx];
  } else {
    store.unshift(ride);
    saveRidesToDisk(store);
    return ride;
  }
}

/**
 * Find ride by its UUID id or multimodal_id
 */
export function getSharedRideById(id: string): PublishedRide | undefined {
  const store = getAllSharedRides();
  return store.find(r => r.id === id || r.multimodal_id === id);
}

/**
 * Get rides created by a specific driver ID or email
 */
export function getSharedRidesByDriver(driverId: string, driverEmail?: string): PublishedRide[] {
  const store = getAllSharedRides();
  const normalizedEmail = driverEmail?.trim().toLowerCase();
  const normalizedId = driverId?.trim().toLowerCase();

  return store.filter(r => {
    // 1. Direct match on driver_id
    if (r.driver_id && r.driver_id === driverId) return true;

    // 2. Case-insensitive match on driver_id
    if (r.driver_id && r.driver_id.toLowerCase() === normalizedId) return true;

    // 3. Match on driver's registered email
    if (normalizedEmail && r.driver?.email && r.driver.email.trim().toLowerCase() === normalizedEmail) {
      return true;
    }

    // 4. Match if driver_id was generated from email (e.g. usr_driver_abc_com)
    if (normalizedEmail) {
      const derivedId = `usr_${normalizedEmail.replace(/[^a-z0-9]/g, '_')}`;
      if (r.driver_id === derivedId) return true;
      if (r.driver_id.toLowerCase().includes(normalizedEmail.split('@')[0])) return true;
    }

    // 5. Match if driverId contains part of the email
    if (normalizedEmail && normalizedId && normalizedId.includes(normalizedEmail.split('@')[0])) {
      return true;
    }

    return false;
  });
}

/**
 * Get all passenger bookings for a specific rider/passenger
 */
export function getSharedBookingsByPassenger(passengerId: string, passengerEmail?: string) {
  const store = getAllSharedRides();
  const bookings: Array<{
    booking: PublishedRide['bookings'][0];
    ride: PublishedRide;
  }> = [];

  const normalizedEmail = passengerEmail?.trim().toLowerCase();
  const normalizedId = passengerId?.trim().toLowerCase();

  for (const ride of store) {
    for (const b of ride.bookings) {
      let isMatch = false;

      // 1. Direct match on passenger_id
      if (b.passenger_id === passengerId) isMatch = true;

      // 2. Case-insensitive match on passenger_id
      if (b.passenger_id && b.passenger_id.toLowerCase() === normalizedId) isMatch = true;

      // 3. Match on registered passenger email
      if (normalizedEmail && b.passenger?.email && b.passenger.email.trim().toLowerCase() === normalizedEmail) {
        isMatch = true;
      }

      // 4. Match if passenger_id was generated from email (e.g. usr_rider_abc_com)
      if (normalizedEmail) {
        const derivedId = `usr_${normalizedEmail.replace(/[^a-z0-9]/g, '_')}`;
        if (b.passenger_id === derivedId) isMatch = true;
        if (b.passenger_id.toLowerCase().includes(normalizedEmail.split('@')[0])) isMatch = true;
      }

      if (isMatch) {
        bookings.push({ booking: b, ride });
      }
    }
  }

  return bookings;
}

/**
 * Records a passenger reservation on a ride
 */
export function bookSharedRide(
  rideId: string,
  bookingData: {
    passenger_id: string;
    seats_reserved: number;
    total_price: number;
    currency?: string;
    payment_method?: 'CASH' | 'ONLINE' | 'CARD';
    passenger_name?: string;
    passenger_email?: string;
  }
): { success: boolean; booking?: PublishedRide['bookings'][0]; error?: string } {
  const ride = getSharedRideById(rideId);
  if (!ride) {
    return { success: false, error: 'Ride not found' };
  }

  if (ride.available_seats < bookingData.seats_reserved) {
    return {
      success: false,
      error: `Only ${ride.available_seats} seat(s) remaining for this ride.`,
    };
  }

  const newBooking: PublishedRide['bookings'][0] = {
    id: `booking_${crypto.randomUUID()}`,
    trip_id: ride.id,
    passenger_id: bookingData.passenger_id,
    seats_reserved: bookingData.seats_reserved,
    total_price: bookingData.total_price,
    currency: bookingData.currency || ride.currency || 'INR',
    status: ride.instant_booking ? 'confirmed' : 'pending',
    payment_method: bookingData.payment_method || 'CASH',
    created_at: new Date().toISOString(),
    passenger: {
      id: bookingData.passenger_id,
      name: bookingData.passenger_name || 'Passenger',
      email: bookingData.passenger_email,
      avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&h=150&q=80',
      rating: 5.0,
      ratings_count: 1,
    },
  };

  ride.available_seats = Math.max(0, ride.available_seats - bookingData.seats_reserved);
  ride.bookings.unshift(newBooking);

  const store = getAllSharedRides();
  saveRidesToDisk(store);

  return { success: true, booking: newBooking };
}

/**
 * Update reservation status (driver accepts/declines)
 */
export function updateSharedBookingStatus(
  bookingId: string,
  status: 'confirmed' | 'cancelled'
): boolean {
  const store = getAllSharedRides();
  for (const ride of store) {
    const booking = ride.bookings.find(b => b.id === bookingId);
    if (booking) {
      const prevStatus = booking.status;
      booking.status = status;

      if (prevStatus === 'confirmed' && status === 'cancelled') {
        ride.available_seats = Math.min(ride.total_seats, ride.available_seats + booking.seats_reserved);
      } else if (prevStatus === 'pending' && status === 'confirmed') {
        // Seats already deducted upon reservation request
      }
      saveRidesToDisk(store);
      return true;
    }
  }
  return false;
}
