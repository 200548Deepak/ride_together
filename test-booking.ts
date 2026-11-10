import { BookingRequest, BookingResponse, RideDetailsData } from './types/booking';

console.log('Testing booking types and flow...');

const mockBookingRequest: BookingRequest = {
  trip_id: '01a1b542-36f0-78c4-8638-94462a4758dd',
  multimodal_id: 'KpmVENEvSDaFUCjblX39yweGeSgw9MT4-spC6nJx-L6A',
  passenger_id: '21490368-dacb-4e96-bcb9-c15a2cf850dd',
  seats_reserved: 1,
  total_price: 500.0,
  currency: 'INR',
  payment_method: 'CASH'
};

const mockBookingResponse: BookingResponse = {
  success: true,
  booking: {
    id: 'b1111111-2222-3333-4444-555555555555',
    trip_id: mockBookingRequest.trip_id!,
    passenger_id: mockBookingRequest.passenger_id!,
    seats_reserved: 1,
    total_price: 500.0,
    currency: 'INR',
    status: 'confirmed',
    payment_method: 'CASH',
    created_at: new Date().toISOString()
  },
  trip: {
    id: mockBookingRequest.trip_id!,
    departure_city: 'Bengaluru',
    arrival_city: 'Hutagalli',
    departure_time: '2026-11-10T05:30:00+05:30',
    arrival_time: '2026-11-10T07:40:00+05:30',
    remaining_seats: 0
  },
  message: 'Reservation confirmed successfully'
};

console.log('Booking request valid:', mockBookingRequest.seats_reserved === 1);
console.log('Booking response valid:', mockBookingResponse.success);
console.log('All booking types compiled successfully!');

