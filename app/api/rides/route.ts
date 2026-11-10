import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/lib/supabaseClient';
import { CreateRideRequest } from '@/types/ride';
import crypto from 'crypto';

// City coordinates mapping for common routes in India
const CITY_COORDINATES: Record<string, { lat: number; lon: number }> = {
  bengaluru: { lat: 12.9716, lon: 77.5946 },
  bangalore: { lat: 12.9716, lon: 77.5946 },
  mysuru: { lat: 12.2958, lon: 76.6394 },
  mysore: { lat: 12.2958, lon: 76.6394 },
  hutagalli: { lat: 12.3459, lon: 76.5772 },
  chennai: { lat: 13.0827, lon: 80.2707 },
  hyderabad: { lat: 17.3850, lon: 78.4867 },
  mumbai: { lat: 19.0760, lon: 72.8777 },
  pune: { lat: 18.5204, lon: 73.8567 },
  coimbatore: { lat: 11.0168, lon: 76.9558 },
  delhi: { lat: 28.7041, lon: 77.1025 },
  gurugram: { lat: 28.4595, lon: 77.0266 },
  jaipur: { lat: 26.9124, lon: 75.7873 }
};

function getCityCoords(city: string) {
  const normalized = city.trim().toLowerCase();
  for (const [key, coords] of Object.entries(CITY_COORDINATES)) {
    if (normalized.includes(key)) return coords;
  }
  return { lat: 12.9716, lon: 77.5946 };
}

/**
 * POST /api/rides
 * Creates a new carpool ride associated with the authenticated driver.
 */
export async function POST(req: NextRequest) {
  try {
    const supabase = getSupabaseClient();
    const body: CreateRideRequest = await req.json();

    let driverId = body.driver_id;

    // 1. Authenticate driver from Authorization header if driver_id not provided
    if (!driverId) {
      const authHeader = req.headers.get('authorization');
      if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.replace('Bearer ', '');
        const { data: { user }, error: authErr } = await supabase.auth.getUser(token);
        if (!authErr && user) {
          driverId = user.id;
        }
      }
    }

    if (!driverId) {
      // Check session
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        driverId = session.user.id;
      }
    }

    if (!driverId) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'UNAUTHENTICATED',
            message: 'You must be logged in as a driver to publish a ride.'
          }
        },
        { status: 401 }
      );
    }

    // 2. Validate required inputs
    const {
      departure_city,
      departure_location_name,
      departure_time,
      arrival_city,
      arrival_location_name,
      total_seats = 3,
      price_amount
    } = body;

    if (!departure_city || !arrival_city || !departure_time || price_amount == null) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'MISSING_FIELDS',
            message: 'Departure, arrival, departure time, and price are required.'
          }
        },
        { status: 400 }
      );
    }

    const priceNum = Number(price_amount);
    const seatsNum = Number(total_seats);

    if (isNaN(priceNum) || priceNum <= 0) {
      return NextResponse.json(
        { success: false, error: { code: 'INVALID_PRICE', message: 'Price must be greater than zero.' } },
        { status: 400 }
      );
    }

    if (isNaN(seatsNum) || seatsNum <= 0 || seatsNum > 8) {
      return NextResponse.json(
        { success: false, error: { code: 'INVALID_SEATS', message: 'Seats must be between 1 and 8.' } },
        { status: 400 }
      );
    }

    // Ensure profile exists in public.profiles and public.users
    const { data: existingProfile } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', driverId)
      .maybeSingle();

    if (!existingProfile) {
      await supabase.from('profiles').insert({
        id: driverId,
        name: 'Ride Together Driver',
        rating: 5.0,
        ratings_count: 1,
        is_verified: true
      });
    }

    // 3. Resolve vehicle if provided
    let vehicleId = body.vehicle_id;
    if (!vehicleId && body.vehicle_make && body.vehicle_model) {
      const { data: existingVehicle } = await supabase
        .from('vehicles')
        .select('id')
        .eq('user_id', driverId)
        .eq('make', body.vehicle_make)
        .eq('model', body.vehicle_model)
        .maybeSingle();

      if (existingVehicle) {
        vehicleId = existingVehicle.id;
      } else {
        const { data: newVehicle } = await supabase
          .from('vehicles')
          .insert({
            user_id: driverId,
            make: body.vehicle_make,
            model: body.vehicle_model,
            color: body.vehicle_color || 'White',
            license_plate: body.license_plate || 'KA 01 AB 1234'
          })
          .select('id')
          .single();

        if (newVehicle) {
          vehicleId = newVehicle.id;
        }
      }
    }

    // 4. Coordinates resolution
    const depCoords = body.departure_lat && body.departure_lon
      ? { lat: body.departure_lat, lon: body.departure_lon }
      : getCityCoords(departure_city);

    const arrCoords = body.arrival_lat && body.arrival_lon
      ? { lat: body.arrival_lat, lon: body.arrival_lon }
      : getCityCoords(arrival_city);

    // 5. Arrival Time calculation (default ~2.5h if not supplied)
    const depDate = new Date(departure_time);
    let arrDate: Date;
    if (body.arrival_time) {
      arrDate = new Date(body.arrival_time);
    } else {
      arrDate = new Date(depDate.getTime() + 2.5 * 60 * 60 * 1000);
    }

    // 6. Generate multimodal hash ID
    const multimodalId = crypto.randomBytes(24).toString('base64url');

    // 7. Insert ride into public.rides
    const newRidePayload = {
      driver_id: driverId,
      vehicle_id: vehicleId || null,
      departure_city: departure_city.trim(),
      departure_location_name: departure_location_name || `${departure_city.trim()} City Center`,
      departure_lat: depCoords.lat,
      departure_lon: depCoords.lon,
      departure_time: depDate.toISOString(),
      arrival_city: arrival_city.trim(),
      arrival_location_name: arrival_location_name || `${arrival_city.trim()} Center`,
      arrival_lat: arrCoords.lat,
      arrival_lon: arrCoords.lon,
      arrival_time: arrDate.toISOString(),
      total_seats: seatsNum,
      available_seats: seatsNum,
      price_amount: priceNum,
      currency: body.currency || 'INR',
      status: 'SCHEDULED',
      instant_booking: body.instant_booking ?? true,
      two_max_back: body.two_max_back ?? true,
      air_conditioning: body.air_conditioning ?? true,
      power_outlets: body.power_outlets ?? false,
      smoking_allowed: body.smoking_allowed ?? false,
      pets_allowed: body.pets_allowed ?? false,
      multimodal_id: multimodalId
    };

    const { data: createdRide, error: rideError } = await supabase
      .from('rides')
      .insert(newRidePayload)
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
          id,
          make,
          model,
          color,
          license_plate
        )
      `)
      .single();

    if (rideError) {
      console.error('Error inserting ride:', rideError);
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'DB_INSERT_ERROR',
            message: rideError.message || 'Failed to publish ride.'
          }
        },
        { status: 500 }
      );
    }

    // 8. Insert waypoints if specified
    if (body.waypoints && body.waypoints.length > 0 && createdRide) {
      const waypointRows = body.waypoints.map((wp, index) => {
        const wpCoords = wp.latitude && wp.longitude
          ? { lat: wp.latitude, lon: wp.longitude }
          : getCityCoords(wp.location_name);
        const estArrival = wp.estimated_arrival || new Date(depDate.getTime() + (index + 1) * 45 * 60 * 1000).toISOString();

        return {
          ride_id: createdRide.id,
          stop_order: wp.stop_order ?? index + 1,
          location_name: wp.location_name,
          latitude: wpCoords.lat,
          longitude: wpCoords.lon,
          estimated_arrival: estArrival
        };
      });

      await supabase.from('ride_waypoints').insert(waypointRows);
    }

    return NextResponse.json(
      {
        success: true,
        ride: createdRide,
        message: 'Ride published successfully!'
      },
      { status: 201 }
    );
  } catch (err: unknown) {
    console.error('Unhandled ride creation error:', err);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'SERVER_ERROR',
          message: err instanceof Error ? err.message : 'An error occurred while publishing ride.'
        }
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/rides
 * Retrieves rides published by a driver, along with passenger bookings.
 */
export async function GET(req: NextRequest) {
  try {
    const supabase = getSupabaseClient();
    const { searchParams } = new URL(req.url);
    let driverId = searchParams.get('driver_id');

    if (!driverId) {
      // Check auth header
      const authHeader = req.headers.get('authorization');
      if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.replace('Bearer ', '');
        const { data: { user } } = await supabase.auth.getUser(token);
        if (user) driverId = user.id;
      }
    }

    if (!driverId) {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) driverId = session.user.id;
    }

    let query = supabase
      .from('rides')
      .select(`
        *,
        vehicle:vehicle_id (
          id,
          make,
          model,
          color,
          license_plate
        ),
        waypoints:ride_waypoints (*),
        bookings:bookings (
          id,
          seats_reserved,
          total_price,
          currency,
          status,
          payment_method,
          created_at,
          passenger:passenger_id (
            id,
            name,
            email,
            phone,
            avatar_url,
            rating,
            ratings_count
          )
        )
      `)
      .order('departure_time', { ascending: true });

    if (driverId) {
      query = query.eq('driver_id', driverId);
    }

    const { data: rides, error } = await query;

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      count: rides?.length || 0,
      rides: rides || []
    });
  } catch (err: unknown) {
    return NextResponse.json(
      { success: false, error: err instanceof Error ? err.message : 'Failed to retrieve driver rides' },
      { status: 500 }
    );
  }
}

