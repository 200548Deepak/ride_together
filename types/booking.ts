import { TokenizedPrice } from './blablacar-search';

export type BookingStatus = 'pending' | 'confirmed' | 'cancelled';
export type PaymentMethod = 'CASH' | 'ONLINE' | 'CARD';

export interface BookingRequest {
  trip_id?: string;
  multimodal_id?: string;
  passenger_id?: string;
  passenger_name?: string;
  passenger_email?: string;
  seats_reserved: number;
  total_price: number;
  currency?: string;
  payment_method?: PaymentMethod;
}

export interface BookingResponse {
  success: boolean;
  booking?: {
    id: string;
    trip_id: string;
    passenger_id: string;
    seats_reserved: number;
    total_price: number;
    currency: string;
    status: BookingStatus;
    payment_method: PaymentMethod;
    created_at: string;
  };
  trip?: {
    id: string;
    multimodal_id?: string;
    departure_city: string;
    arrival_city: string;
    departure_time: string;
    arrival_time: string;
    remaining_seats: number;
  };
  message?: string;
  error?: {
    code: string;
    message: string;
    available_seats?: number;
  };
}

export interface RideLeg {
  type: 'activeStop' | 'inactiveStop';
  formattedTime?: string;
  dayDelta?: string;
  formattedDuration?: {
    label: string;
    isOvernight?: boolean;
  };
  address: {
    primary: string;
    secondary?: string;
  };
  a11yLabel?: string;
  action?: {
    type: string;
    coordinates: {
      latitude: number;
      longitude: number;
    };
    a11yLabel?: string;
  };
}

export interface DriverProfileInfo {
  displayName: string;
  profilePictureURL?: string;
  rating?: {
    rating: string;
    totalReviews: string;
  };
  status?: {
    code: string;
  };
  info?: Array<{
    type: string;
    label: string;
    code?: string;
  }>;
  preferences?: Array<{
    type: string;
    label: string;
  }>;
}

export interface BookedPassenger {
  id?: string;
  displayName: string;
  profilePictureURL?: string;
  seatsBooked: number;
  itineraryDescription?: string;
}

export interface RideDetailsData {
  id: string;
  multimodalId: {
    id: string;
    source: string;
  };
  head: {
    title: string;
    pageMeta: string;
    date: string;
  };
  itinerary: {
    legs: RideLeg[];
  };
  totalPrice: {
    label: string;
    price: TokenizedPrice[];
    amount: number;
    currency: string;
    code: string;
  };
  driver: DriverProfileInfo;
  passengers: BookedPassenger[];
  vehicle?: {
    make: string;
    model: string;
    color?: string;
  };
  available_seats: number;
  total_seats: number;
  instant_booking: boolean;
  two_max_back: boolean;
  air_conditioning: boolean;
  power_outlets: boolean;
  smoking_allowed: boolean;
  pets_allowed: boolean;
  co2SavingsKg?: number;
}

