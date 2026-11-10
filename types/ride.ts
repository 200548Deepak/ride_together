export interface CreateRideRequest {
  driver_id?: string;
  vehicle_id?: string;
  vehicle_make?: string;
  vehicle_model?: string;
  vehicle_color?: string;
  license_plate?: string;

  departure_city: string;
  departure_location_name: string;
  departure_lat?: number;
  departure_lon?: number;
  departure_time: string; // ISO string

  arrival_city: string;
  arrival_location_name: string;
  arrival_lat?: number;
  arrival_lon?: number;
  arrival_time: string; // ISO string

  total_seats: number;
  available_seats?: number;
  price_amount: number;
  currency?: string;

  instant_booking?: boolean;
  two_max_back?: boolean;
  air_conditioning?: boolean;
  power_outlets?: boolean;
  smoking_allowed?: boolean;
  pets_allowed?: boolean;

  waypoints?: Array<{
    location_name: string;
    latitude?: number;
    longitude?: number;
    estimated_arrival?: string;
    stop_order?: number;
  }>;
}

export interface DriverRideBooking {
  id: string;
  trip_id: string;
  passenger_id: string;
  seats_reserved: number;
  total_price: number;
  currency: string;
  status: 'pending' | 'confirmed' | 'cancelled';
  payment_method: string;
  created_at: string;
  passenger?: {
    id: string;
    name: string;
    email?: string;
    phone?: string;
    avatar_url?: string;
    rating?: number;
    ratings_count?: number;
  };
}

export interface DriverRideItem {
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
  duration_minutes: number;
  is_overnight: boolean;
  total_seats: number;
  available_seats: number;
  price_amount: number;
  currency: string;
  status: 'SCHEDULED' | 'ACTIVE' | 'COMPLETED' | 'CANCELLED';
  instant_booking: boolean;
  two_max_back: boolean;
  air_conditioning: boolean;
  power_outlets: boolean;
  smoking_allowed: boolean;
  pets_allowed: boolean;
  created_at: string;
  driver?: {
    id?: string;
    name: string;
    avatar_url?: string;
    rating?: number;
    is_verified?: boolean;
  };
  vehicle?: {
    id?: string;
    make: string;
    model: string;
    color?: string;
    license_plate?: string;
  };
  waypoints?: Array<{
    id: string;
    stop_order: number;
    location_name: string;
    estimated_arrival: string;
  }>;
  bookings?: DriverRideBooking[];
}

