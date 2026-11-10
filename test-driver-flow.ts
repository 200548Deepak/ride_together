import { CreateRideRequest, DriverRideItem } from './types/ride';

console.log('Testing Driver Ride Publication and Dashboard types...');

const mockCreateRide: CreateRideRequest = {
  driver_id: '01a1b542-36f0-78c4-8638-94462a4758dd',
  departure_city: 'Bengaluru',
  departure_location_name: 'Majestic Bus Stand',
  departure_time: '2026-11-10T06:00:00.000Z',
  arrival_city: 'Mysuru',
  arrival_location_name: 'Suburban Bus Stand',
  arrival_time: '2026-11-10T08:30:00.000Z',
  total_seats: 3,
  price_amount: 500,
  currency: 'INR',
  instant_booking: true,
  two_max_back: true,
  air_conditioning: true,
  vehicle_make: 'Hyundai',
  vehicle_model: 'i20',
  waypoints: [
    {
      location_name: 'Mandya',
      stop_order: 1
    }
  ]
};

const mockDriverRide: DriverRideItem = {
  id: 'r1111111-2222-3333-4444-555555555555',
  multimodal_id: 'KpmVENEvSDaFUCjblX39yweGeSgw9MT4-spC6nJx-L6A',
  driver_id: mockCreateRide.driver_id!,
  departure_city: mockCreateRide.departure_city,
  departure_location_name: mockCreateRide.departure_location_name,
  departure_lat: 12.9716,
  departure_lon: 77.5946,
  departure_time: mockCreateRide.departure_time,
  arrival_city: mockCreateRide.arrival_city,
  arrival_location_name: mockCreateRide.arrival_location_name,
  arrival_lat: 12.2958,
  arrival_lon: 76.6394,
  arrival_time: mockCreateRide.arrival_time,
  duration_minutes: 150,
  is_overnight: false,
  total_seats: 3,
  available_seats: 2,
  price_amount: 500,
  currency: 'INR',
  status: 'SCHEDULED',
  instant_booking: true,
  two_max_back: true,
  air_conditioning: true,
  power_outlets: false,
  smoking_allowed: false,
  pets_allowed: false,
  created_at: new Date().toISOString(),
  vehicle: {
    make: 'Hyundai',
    model: 'i20'
  },
  bookings: [
    {
      id: 'b1111111-2222-3333-4444-555555555555',
      trip_id: 'r1111111-2222-3333-4444-555555555555',
      passenger_id: 'p1111111-2222-3333-4444-555555555555',
      seats_reserved: 1,
      total_price: 500,
      currency: 'INR',
      status: 'confirmed',
      payment_method: 'CASH',
      created_at: new Date().toISOString(),
      passenger: {
        id: 'p1111111-2222-3333-4444-555555555555',
        name: 'Devika',
        rating: 5.0
      }
    }
  ]
};

console.log('Driver ride created check:', mockCreateRide.price_amount === 500);
console.log('Driver ride item bookings count:', mockDriverRide.bookings?.length === 1);
console.log('All Driver Flow types verified successfully!');

