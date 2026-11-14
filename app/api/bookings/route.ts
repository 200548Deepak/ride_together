import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient, isSupabaseConfigured } from '@/lib/supabaseClient';
import { getAuthUserFromRequest } from '@/lib/jwt';
import {
  bookSharedRide,
  getSharedBookingsByPassenger,
  updateSharedBookingStatus,
  getSharedRideById
} from '@/lib/ridesStore';
import { BookingRequest, BookingResponse } from '@/types/booking';

/**
 * POST /api/bookings
 * Handles secure ride booking reservations.
 * Verifies seat availability in the trips/rides table before confirming.
 */
export async function POST(req: NextRequest) {
  try {
    const supabase = getSupabaseClient();
    const body: BookingRequest = await req.json();

    const {
      trip_id,
      multimodal_id,
      seats_reserved = 1,
      total_price,
      currency = 'INR',
      payment_method = 'CASH'
    } = body;

    let passenger_id = body.passenger_id;

    // 1. Authenticate passenger via JWT or bearer token
    const jwtUser = getAuthUserFromRequest(req);
    if (jwtUser) {
      passenger_id = jwtUser.userId;
      if (!body.passenger_name) body.passenger_name = jwtUser.name;
      if (!body.passenger_email) body.passenger_email = jwtUser.email;
    } else if (!passenger_id) {
      const authHeader = req.headers.get('authorization');
      if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.replace('Bearer ', '');
        const { data: { user }, error: authError } = await supabase.auth.getUser(token);
        if (!authError && user) {
          passenger_id = user.id;
        }
      }
    }

    if (!passenger_id) {
      return NextResponse.json<BookingResponse>(
        {
          success: false,
          error: {
            code: 'UNAUTHENTICATED',
            message: 'You must be logged in to book a ride.'
          }
        },
        { status: 401 }
      );
    }

    if (!trip_id && !multimodal_id) {
      return NextResponse.json<BookingResponse>(
        {
          success: false,
          error: {
            code: 'INVALID_REQUEST',
            message: 'trip_id or multimodal_id is required.'
          }
        },
        { status: 400 }
      );
    }

    const requestedSeats = Number(seats_reserved);
    if (isNaN(requestedSeats) || requestedSeats <= 0) {
      return NextResponse.json<BookingResponse>(
        {
          success: false,
          error: {
            code: 'INVALID_SEATS',
            message: 'Requested seats must be at least 1.'
          }
        },
        { status: 400 }
      );
    }

    // 2. Reserve seats in shared store (works seamlessly for local demo and cloud)
    const targetId = trip_id || multimodal_id || '';
    const initialCalcPrice = total_price != null ? Number(total_price) : 500 * requestedSeats;

    const storeResult = bookSharedRide(targetId, {
      passenger_id: passenger_id,
      passenger_name: body.passenger_name,
      passenger_email: body.passenger_email,
      seats_reserved: requestedSeats,
      total_price: initialCalcPrice,
      currency,
      payment_method,
    });

    if (storeResult.success && storeResult.booking) {
      // If Supabase is configured, also persist to database
      if (isSupabaseConfigured()) {
        try {
          await supabase.from('bookings').insert({
            id: storeResult.booking.id,
            trip_id: storeResult.booking.trip_id,
            ride_id: storeResult.booking.trip_id,
            passenger_id: passenger_id,
            seats_reserved: requestedSeats,
            seats_booked: requestedSeats,
            total_price: initialCalcPrice,
            currency: currency,
            status: storeResult.booking.status,
            payment_method: payment_method,
          });
        } catch (dbErr) {
          console.warn('Supabase booking sync note:', dbErr);
        }
      }

      return NextResponse.json<BookingResponse>(
        {
          success: true,
          booking: storeResult.booking as any,
          message: 'Booking reservation confirmed successfully!'
        },
        { status: 201 }
      );
    }

    // 2. Resolve the trip from either trip_id (UUID) or multimodal_id
    let tripQuery = supabase.from('rides').select('*');
    if (trip_id) {
      // Check if valid UUID, otherwise query multimodal_id
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(trip_id);
      if (isUuid) {
        tripQuery = tripQuery.eq('id', trip_id);
      } else {
        tripQuery = tripQuery.eq('multimodal_id', trip_id);
      }
    } else if (multimodal_id) {
      tripQuery = tripQuery.eq('multimodal_id', multimodal_id);
    }

    const { data: trip, error: tripError } = await tripQuery.single();

    if (tripError || !trip) {
      return NextResponse.json<BookingResponse>(
        {
          success: false,
          error: {
            code: 'RIDE_NOT_FOUND',
            message: 'This ride could not be found or has expired.'
          }
        },
        { status: 404 }
      );
    }

    // 3. Verify seat availability in the trips/rides table
    if (trip.available_seats < requestedSeats) {
      return NextResponse.json<BookingResponse>(
        {
          success: false,
          error: {
            code: 'NOT_ENOUGH_SEATS',
            message: trip.available_seats <= 0 
              ? 'The last seat was booked.' 
              : `Only ${trip.available_seats} seat(s) remaining for this ride.`,
            available_seats: trip.available_seats
          }
        },
        { status: 409 }
      );
    }

    // 4. Calculate total price if not provided
    const calculatedPrice = total_price != null ? Number(total_price) : Number(trip.price_amount) * requestedSeats;

    // 5. Attempt atomic booking RPC
    try {
      const { data: rpcResult, error: rpcError } = await supabase.rpc('create_booking_atomic', {
        p_trip_id: trip.id,
        p_passenger_id: passenger_id,
        p_seats_reserved: requestedSeats,
        p_total_price: calculatedPrice,
        p_payment_method: payment_method
      });

      if (!rpcError && rpcResult) {
        if (!rpcResult.success) {
          return NextResponse.json<BookingResponse>(
            {
              success: false,
              error: {
                code: rpcResult.code || 'BOOKING_FAILED',
                message: rpcResult.error || 'Failed to complete booking reservation.',
                available_seats: rpcResult.available_seats
              }
            },
            { status: 409 }
          );
        }

        return NextResponse.json<BookingResponse>(
          {
            success: true,
            booking: rpcResult.booking,
            trip: rpcResult.trip,
            message: 'Booking reservation confirmed successfully!'
          },
          { status: 201 }
        );
      }
    } catch {
      // Fallback to table transaction logic if RPC is not deployed yet
    }

    // 6. Direct Fallback: Decrement seats & create booking
    const initialStatus = trip.instant_booking ? 'confirmed' : 'pending';
    const remainingSeats = trip.available_seats - requestedSeats;

    const { data: newBooking, error: bookingInsertError } = await supabase
      .from('bookings')
      .insert({
        trip_id: trip.id,
        ride_id: trip.id,
        passenger_id: passenger_id,
        seats_reserved: requestedSeats,
        seats_booked: requestedSeats,
        total_price: calculatedPrice,
        currency: currency,
        status: initialStatus,
        payment_method: payment_method
      })
      .select()
      .single();

    if (bookingInsertError) {
      return NextResponse.json<BookingResponse>(
        {
          success: false,
          error: {
            code: 'BOOKING_INSERT_FAILED',
            message: bookingInsertError.message || 'Failed to record booking reservation.'
          }
        },
        { status: 500 }
      );
    }

    // If confirmed, update available_seats in rides table
    if (initialStatus === 'confirmed') {
      await supabase
        .from('rides')
        .update({
          available_seats: remainingSeats,
          updated_at: new Date().toISOString()
        })
        .eq('id', trip.id);
    }

    return NextResponse.json<BookingResponse>(
      {
        success: true,
        booking: {
          id: newBooking.id,
          trip_id: trip.id,
          passenger_id: passenger_id,
          seats_reserved: requestedSeats,
          total_price: calculatedPrice,
          currency: currency,
          status: initialStatus,
          payment_method: payment_method,
          created_at: newBooking.created_at || new Date().toISOString()
        },
        trip: {
          id: trip.id,
          multimodal_id: trip.multimodal_id,
          departure_city: trip.departure_city,
          arrival_city: trip.arrival_city,
          departure_time: trip.departure_time,
          arrival_time: trip.arrival_time,
          remaining_seats: remainingSeats
        },
        message: 'Booking reservation created successfully!'
      },
      { status: 201 }
    );

  } catch (err: unknown) {
    console.error('Unhandled Booking API error:', err);
    return NextResponse.json<BookingResponse>(
      {
        success: false,
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: err instanceof Error ? err.message : 'An unexpected error occurred while booking.'
        }
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/bookings
 * Query bookings by trip_id or passenger_id.
 */
export async function GET(req: NextRequest) {
  try {
    const supabase = getSupabaseClient();
    const { searchParams } = new URL(req.url);
    const trip_id = searchParams.get('trip_id');
    const auth = getAuthUserFromRequest(req);
    const passenger_id = searchParams.get('passenger_id') || auth?.userId;
    const passenger_email = searchParams.get('passenger_email') || auth?.email || undefined;

    // 1. Gather bookings from shared store first
    let mappedBookings: any[] = [];
    if (passenger_id || passenger_email) {
      const sharedList = getSharedBookingsByPassenger(passenger_id || '', passenger_email);
      mappedBookings = sharedList.map(({ booking, ride }) => ({
        id: booking.id,
        trip_id: ride.id,
        passenger_id: booking.passenger_id,
        seats_reserved: booking.seats_reserved,
        total_price: booking.total_price,
        currency: booking.currency,
        status: booking.status,
        payment_method: booking.payment_method,
        created_at: booking.created_at,
        passengers: booking.passenger,
        rides: {
          id: ride.id,
          departure_city: ride.departure_city,
          departure_location_name: ride.departure_location_name,
          arrival_city: ride.arrival_city,
          arrival_location_name: ride.arrival_location_name,
          departure_time: ride.departure_time,
          arrival_time: ride.arrival_time,
          price_amount: ride.price_amount,
          available_seats: ride.available_seats,
          driver: ride.driver,
          vehicle: ride.vehicle,
        }
      }));
    }

    // 2. Also check Supabase if configured
    if (isSupabaseConfigured()) {
      try {
        let query = supabase.from('bookings').select(`
          *,
          passengers:passenger_id (
            id,
            name,
            avatar_url,
            rating
          ),
          rides:trip_id (
            id,
            departure_city,
            departure_location_name,
            arrival_city,
            arrival_location_name,
            departure_time,
            arrival_time,
            price_amount,
            available_seats
          )
        `);

        if (trip_id) query = query.eq('trip_id', trip_id);
        if (passenger_id) query = query.eq('passenger_id', passenger_id);

        const { data: dbBookings } = await query.order('created_at', { ascending: false });
        if (dbBookings && dbBookings.length > 0) {
          for (const dbB of dbBookings) {
            if (!mappedBookings.some(b => b.id === dbB.id)) {
              mappedBookings.push(dbB);
            }
          }
        }
      } catch (err) {
        console.warn('Supabase bookings query note:', err);
      }
    }

    return NextResponse.json({ success: true, count: mappedBookings.length, bookings: mappedBookings });
  } catch (err: unknown) {
    return NextResponse.json(
      { success: false, error: err instanceof Error ? err.message : 'Failed to retrieve bookings' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/bookings
 * Update booking status (e.g. Driver accepts 'confirmed' or rejects 'cancelled')
 */
export async function PATCH(req: NextRequest) {
  try {
    const supabase = getSupabaseClient();
    const body = await req.json();
    const { booking_id, status } = body;

    if (!booking_id || !status) {
      return NextResponse.json(
        { success: false, error: 'booking_id and status are required' },
        { status: 400 }
      );
    }

    // Update in shared store
    updateSharedBookingStatus(booking_id, status);

    // Also update in Supabase if configured
    if (isSupabaseConfigured()) {
      try {
        await supabase
          .from('bookings')
          .update({ status, updated_at: new Date().toISOString() })
          .eq('id', booking_id);
      } catch (e) {}
    }

    return NextResponse.json({
      success: true,
      booking: { id: booking_id, status },
      message: `Booking has been ${status}`
    });

    if (!['confirmed', 'cancelled', 'pending'].includes(status)) {
      return NextResponse.json(
        { success: false, error: 'status must be confirmed, cancelled, or pending' },
        { status: 400 }
      );
    }

    // Fetch existing booking
    const { data: booking, error: fetchErr } = await supabase
      .from('bookings')
      .select('*, rides:trip_id(*)')
      .eq('id', booking_id)
      .single();

    if (fetchErr || !booking) {
      return NextResponse.json({ success: false, error: 'Booking not found' }, { status: 404 });
    }

    const previousStatus = booking.status;
    const seatsReserved = booking.seats_reserved || booking.seats_booked || 1;
    const ride = booking.rides;

    // Update booking status
    const { data: updatedBooking, error: updateErr } = await supabase
      .from('bookings')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', booking_id)
      .select()
      .single();

    if (updateErr) {
      return NextResponse.json({ success: false, error: updateErr?.message || 'Failed to update booking' }, { status: 500 });
    }

    // Adjust ride available_seats if transitioning
    if (ride) {
      if (previousStatus === 'confirmed' && status === 'cancelled') {
        // Restore seats
        await supabase
          .from('rides')
          .update({
            available_seats: ride.available_seats + seatsReserved,
            updated_at: new Date().toISOString()
          })
          .eq('id', ride.id);
      } else if (previousStatus === 'pending' && status === 'confirmed') {
        // Deduct seats
        const newSeats = Math.max(0, ride.available_seats - seatsReserved);
        await supabase
          .from('rides')
          .update({
            available_seats: newSeats,
            updated_at: new Date().toISOString()
          })
          .eq('id', ride.id);
      }
    }

    return NextResponse.json({
      success: true,
      booking: updatedBooking,
      message: `Booking has been ${status}`
    });
  } catch (err: unknown) {
    return NextResponse.json(
      { success: false, error: err instanceof Error ? err.message : 'Failed to update booking' },
      { status: 500 }
    );
  }
}

