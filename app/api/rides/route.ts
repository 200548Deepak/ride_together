import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient, isSupabaseConfigured } from '@/lib/supabaseClient';
import {
  addSharedRide,
  getAllSharedRides,
  getSharedRidesByDriver,
  PublishedRide
} from '@/lib/ridesStore';
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
  delhi: { lat: 28.7041, lon: 77.1025 },
  jaipur: { lat: 26.9124, lon: 75.7873 },
  coimbatore: { lat: 11.0168, lon: 76.9558 },
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
    if (!driverId && isSupabaseConfigured()) {
      const authHeader = req.headers.get('authorization');
      if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.replace('Bearer ', '');
        const { data: { user }, error: authErr } = await supabase.auth.getUser(token);
        if (!authErr && user) {
          driverId = user.id;
        }
      }
    }

    if (!driverId && body.driver_email) {
      driverId = `usr_${body.driver_email.trim().toLowerCase().replace(/[^a-z0-9]/g, '_')}`;
    }

    if (!driverId) {
      driverId = 'driver_local_demo';
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

    const depDate = new Date(departure_time);
    let arrDate: Date;
    if (body.arrival_time) {
      arrDate = new Date(body.arrival_time);
    } else {
      arrDate = new Date(depDate.getTime() + 2.5 * 60 * 60 * 1000);
    }

    const depCoords = body.departure_lat && body.departure_lon
      ? { lat: body.departure_lat, lon: body.departure_lon }
      : getCityCoords(departure_city);

    const arrCoords = body.arrival_lat && body.arrival_lon
      ? { lat: body.arrival_lat, lon: body.arrival_lon }
      : getCityCoords(arrival_city);

    const multimodalId = crypto.randomBytes(24).toString('base64url');
    const rideId = `ride_${crypto.randomUUID()}`;

    // Construct unified published ride object
    const publishedRide: PublishedRide = {
      id: rideId,
      multimodal_id: multimodalId,
      driver_id: driverId,
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
      created_at: new Date().toISOString(),
      driver: {
        id: driverId,
        name: body.driver_name || 'Driver ANISH',
        email: body.driver_email || undefined,
        avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&h=150&q=80',
        rating: 4.95,
        ratings_count: 24,
        is_verified: true
      },
      vehicle: {
        id: body.vehicle_id || `veh_${Date.now()}`,
        make: body.vehicle_make || 'Hyundai',
        model: body.vehicle_model || 'Creta',
        color: body.vehicle_color || 'White',
        license_plate: body.license_plate || 'KA 01 AB 1234'
      },
      waypoints: (body.waypoints || []).map((wp, idx) => ({
        location_name: wp.location_name,
        stop_order: wp.stop_order ?? idx + 1,
        latitude: wp.latitude || 12.5,
        longitude: wp.longitude || 76.8,
        estimated_arrival: wp.estimated_arrival || new Date(depDate.getTime() + (idx + 1) * 45 * 60 * 1000).toISOString()
      })),
      bookings: []
    };

    // 3. Register in shared in-memory store so riders immediately see it across search & details
    addSharedRide(publishedRide);

    // 4. If Supabase is configured, also persist to database
    if (isSupabaseConfigured()) {
      try {
        await supabase.from('profiles').upsert({
          id: driverId,
          name: publishedRide.driver.name,
          rating: publishedRide.driver.rating,
          is_verified: true
        });

        await supabase.from('rides').insert({
          id: publishedRide.id,
          driver_id: driverId,
          departure_city: publishedRide.departure_city,
          departure_location_name: publishedRide.departure_location_name,
          departure_lat: publishedRide.departure_lat,
          departure_lon: publishedRide.departure_lon,
          departure_time: publishedRide.departure_time,
          arrival_city: publishedRide.arrival_city,
          arrival_location_name: publishedRide.arrival_location_name,
          arrival_lat: publishedRide.arrival_lat,
          arrival_lon: publishedRide.arrival_lon,
          arrival_time: publishedRide.arrival_time,
          total_seats: publishedRide.total_seats,
          available_seats: publishedRide.available_seats,
          price_amount: publishedRide.price_amount,
          currency: publishedRide.currency,
          status: 'SCHEDULED',
          instant_booking: publishedRide.instant_booking,
          two_max_back: publishedRide.two_max_back,
          air_conditioning: publishedRide.air_conditioning,
          power_outlets: publishedRide.power_outlets,
          smoking_allowed: publishedRide.smoking_allowed,
          pets_allowed: publishedRide.pets_allowed,
          multimodal_id: publishedRide.multimodal_id
        });
      } catch (dbErr) {
        console.warn('Supabase DB sync note:', dbErr);
      }
    }

    return NextResponse.json(
      {
        success: true,
        ride: publishedRide,
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
          message: err instanceof Error ? err.message : 'An unexpected error occurred while publishing the ride.'
        }
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/rides
 * Retrieves rides for a driver or all active rides
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const driverId = searchParams.get('driver_id');
    const driverEmail = searchParams.get('driver_email') || undefined;
    const all = searchParams.get('all') === 'true';

    // If all=true or neither driverId nor driverEmail provided, return all shared active rides
    if (all || (!driverId && !driverEmail)) {
      const allRides = getAllSharedRides();
      return NextResponse.json({
        success: true,
        count: allRides.length,
        rides: allRides
      });
    }

    let rides = getSharedRidesByDriver(driverId || '', driverEmail);

    // If no rides found in memory for this driver ID, check Supabase if configured
    if (rides.length === 0 && isSupabaseConfigured()) {
      try {
        const supabase = getSupabaseClient();
        const { data: dbRides } = await supabase
          .from('rides')
          .select(`
            *,
            vehicle:vehicle_id (*),
            waypoints:ride_waypoints (*),
            bookings:bookings (*)
          `)
          .eq('driver_id', driverId)
          .order('departure_time', { ascending: true });

        if (dbRides && dbRides.length > 0) {
          rides = dbRides as any;
        }
      } catch (err) {
        console.warn('Supabase driver rides fetch note:', err);
      }
    }

    return NextResponse.json({
      success: true,
      count: rides.length,
      rides: rides
    });
  } catch (err: unknown) {
    return NextResponse.json(
      { success: false, error: err instanceof Error ? err.message : 'Failed to retrieve driver rides' },
      { status: 500 }
    );
  }
}
