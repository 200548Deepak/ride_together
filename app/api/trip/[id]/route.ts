import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient, isSupabaseConfigured } from '@/lib/supabaseClient';
import { getSharedRideById, PublishedRide } from '@/lib/ridesStore';
import { RideDetailsData } from '@/types/booking';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const supabase = getSupabaseClient();

    // Check if ID is UUID or multimodal
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);

    let query = supabase
      .from('rides')
      .select(`
        *,
        driver:driver_id (
          id,
          name,
          avatar_url,
          rating,
          ratings_count,
          is_verified
        ),
        vehicle:vehicle_id (
          make,
          model,
          color
        ),
        bookings:bookings (
          id,
          seats_reserved,
          passenger:passenger_id (
            id,
            name,
            avatar_url
          )
        )
      `);

    if (isUuid) {
      query = query.eq('id', id);
    } else {
      query = query.eq('multimodal_id', id);
    }

    let activeRide: any = null;
    if (isSupabaseConfigured()) {
      try {
        const { data: dbRide } = await query.maybeSingle();
        if (dbRide) activeRide = dbRide;
      } catch (e) {
        console.warn('Database query error in /trip/[id]:', e);
      }
    }

    if (!activeRide) {
      const shared = getSharedRideById(id);
      if (shared) {
        const depTime = new Date(shared.departure_time);
        const arrTime = new Date(shared.arrival_time);
        activeRide = {
          ...shared,
          duration_minutes: Math.max(30, Math.round((arrTime.getTime() - depTime.getTime()) / (60 * 1000))),
          is_overnight: arrTime.getDate() !== depTime.getDate(),
        };
      }
    }

    if (activeRide) {
      const ride = activeRide;
      const depDate = new Date(ride.departure_time);
      const arrDate = new Date(ride.arrival_time);

      const formattedDepTime = depDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
      const formattedArrTime = arrDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
      const durationHours = Math.floor(ride.duration_minutes / 60);
      const durationMins = ride.duration_minutes % 60;
      const durationLabel = `${durationHours}h${durationMins < 10 ? '0' : ''}${durationMins}`;

      const dateStr = depDate.toLocaleDateString('en-US', {
        weekday: 'long',
        day: 'numeric',
        month: 'long'
      });

      const passengers = (ride.bookings || []).map((b: any) => ({
        id: b.passenger?.id || b.id,
        displayName: b.passenger?.name || 'Passenger',
        profilePictureURL: b.passenger?.avatar_url || 'https://cdn.blablacar.com/comuto3/images/avatar/pixar/passenger-m-02.png',
        seatsBooked: b.seats_reserved || 1,
        itineraryDescription: `${ride.departure_city} → ${ride.arrival_city}`
      }));

      const rideDetails: RideDetailsData = {
        id: ride.id,
        multimodalId: {
          id: ride.multimodal_id || ride.id,
          source: 'CARPOOLING'
        },
        head: {
          title: 'Ride details',
          pageMeta: `Ride from ${ride.departure_city} to ${ride.arrival_city} on Outbound • ${dateStr}`,
          date: `Outbound • ${dateStr}`
        },
        itinerary: {
          legs: [
            {
              type: 'activeStop',
              formattedTime: formattedDepTime,
              formattedDuration: {
                label: durationLabel,
                isOvernight: ride.is_overnight
              },
              address: {
                primary: ride.departure_city,
                secondary: ride.departure_location_name
              },
              a11yLabel: `The ride departs at ${formattedDepTime} from ${ride.departure_location_name}, ${ride.departure_city}. It lasts ${durationLabel}.`,
              action: {
                type: 'EMBEDDED_MAP',
                coordinates: {
                  latitude: ride.departure_lat,
                  longitude: ride.departure_lon
                }
              }
            },
            {
              type: 'activeStop',
              formattedTime: formattedArrTime,
              address: {
                primary: ride.arrival_city,
                secondary: ride.arrival_location_name
              },
              a11yLabel: `The ride arrives at ${formattedArrTime} at ${ride.arrival_city}, ${ride.arrival_location_name}.`,
              action: {
                type: 'EMBEDDED_MAP',
                coordinates: {
                  latitude: ride.arrival_lat,
                  longitude: ride.arrival_lon
                }
              }
            }
          ]
        },
        totalPrice: {
          label: '1 passenger',
          price: [
            { type: 'CURRENCY', value: '₹' },
            { type: 'INTEGER', value: String(Math.floor(ride.price_amount)) },
            { type: 'FRACTION', value: `.${(ride.price_amount % 1).toFixed(2).split('.')[1] || '00'}` }
          ],
          amount: Number(ride.price_amount),
          currency: ride.currency || 'INR',
          code: ride.multimodal_id || ride.id
        },
        driver: {
          displayName: ride.driver?.name || 'Driver',
          profilePictureURL: ride.driver?.avatar_url || 'https://cdn.blablacar.com/user-profile-picture/le1WcLGZezEmeBJxkTi4s7/thumbnail_144x144.jpeg',
          rating: {
            rating: `${ride.driver?.rating || 5.0}/5`,
            totalReviews: ` ${ride.driver?.ratings_count || 8} ratings `
          },
          status: {
            code: ride.driver?.is_verified ? 'VERIFIED_IDENTITY' : 'UNVERIFIED'
          },
          info: [
            { type: 'VERIFICATION_STATUS', label: 'Verified Profile' },
            { type: 'CANCELLATION_RATE', code: 'RARELY', label: 'Rarely cancels rides' }
          ],
          preferences: [
            ...(ride.instant_booking ? [{ type: 'APPROVAL_AUTO', label: 'Your booking will be confirmed instantly' }] : []),
            ...(ride.smoking_allowed ? [{ type: 'SMOKING_OK', label: 'Smoking allowed' }] : [{ type: 'NO_SMOKING', label: 'No smoking, please' }]),
            ...(ride.vehicle ? [{ type: 'VEHICLE', label: `${ride.vehicle.make} ${ride.vehicle.model}${ride.vehicle.color ? ' - ' + ride.vehicle.color : ''}` }] : [])
          ]
        },
        passengers,
        vehicle: ride.vehicle ? {
          make: ride.vehicle.make,
          model: ride.vehicle.model,
          color: ride.vehicle.color
        } : undefined,
        available_seats: ride.available_seats,
        total_seats: ride.total_seats,
        instant_booking: ride.instant_booking,
        two_max_back: ride.two_max_back,
        air_conditioning: ride.air_conditioning,
        power_outlets: ride.power_outlets,
        smoking_allowed: ride.smoking_allowed,
        pets_allowed: ride.pets_allowed,
        co2SavingsKg: 22.4
      };

      return NextResponse.json(rideDetails);
    }

    // Fallback: Default mock matching the exact HAR capture ride
    const defaultDetails: RideDetailsData = {
      id: id || '01a1b542-36f0-78c4-8638-94462a4758dd',
      multimodalId: {
        id: id || 'KpmVENEvSDaFUCjblX39yweGeSgw9MT4-spC6nJx-L6A',
        source: 'CARPOOLING'
      },
      head: {
        title: 'Ride details',
        pageMeta: 'Ride from Bengaluru to Hutagalli on Outbound • Tuesday, 10 November',
        date: 'Outbound • Tuesday, 10 November'
      },
      itinerary: {
        legs: [
          {
            type: 'activeStop',
            formattedTime: '05:30',
            formattedDuration: {
              label: '2h10',
              isOvernight: false
            },
            address: {
              primary: 'Bengaluru',
              secondary: '822, 24th Main Rd, KR Layout, 2nd Phase, J. P. Nagar, Karnataka'
            },
            a11yLabel: 'The ride departs at 05:30 from 822, 24th Main Rd, KR Layout, 2nd Phase, J. P. Nagar, Karnataka, Bengaluru. It lasts 2h10. Open map of exact location.',
            action: {
              type: 'EMBEDDED_MAP',
              coordinates: { latitude: 12.906094, longitude: 77.585532 }
            }
          },
          {
            type: 'activeStop',
            formattedTime: '07:40',
            address: {
              primary: 'Hutagalli',
              secondary: 'Hootagalli Industrial Area, 1-C, Koorgalli, Hootagalli, Karnataka'
            },
            a11yLabel: 'The ride arrives at 07:40 at Hutagalli, Hootagalli Industrial Area, 1-C, Koorgalli, Hootagalli, Karnataka. Open map of exact location.',
            action: {
              type: 'EMBEDDED_MAP',
              coordinates: { latitude: 12.345924, longitude: 76.5772 }
            }
          },
          {
            type: 'inactiveStop',
            address: { primary: 'Piriyapatna' },
            a11yLabel: 'After dropping you off, the ride will end at Piriyapatna.'
          }
        ]
      },
      totalPrice: {
        label: '1 passenger',
        price: [
          { type: 'CURRENCY', value: '₹' },
          { type: 'INTEGER', value: '500' },
          { type: 'FRACTION', value: '.00' }
        ],
        amount: 500,
        currency: 'INR',
        code: id || 'KpmVENEvSDaFUCjblX39yweGeSgw9MT4-spC6nJx-L6A'
      },
      driver: {
        displayName: 'ANISH',
        profilePictureURL: 'https://cdn.blablacar.com/user-profile-picture/le1WcLGZezEmeBJxkTi4s7/thumbnail_144x144.jpeg',
        rating: {
          rating: '5/5',
          totalReviews: ' 8 ratings '
        },
        status: {
          code: 'VERIFIED_IDENTITY'
        },
        info: [
          { type: 'VERIFICATION_STATUS', label: 'Verified Profile' },
          { type: 'CANCELLATION_RATE', code: 'RARELY', label: 'Rarely cancels rides' }
        ],
        preferences: [
          { type: 'APPROVAL_AUTO', label: 'Your booking will be confirmed instantly' },
          { type: 'NO_SMOKING', label: 'No smoking, please' },
          { type: 'VEHICLE', label: 'HYUNDAI i20 - white' }
        ]
      },
      passengers: [
        {
          id: 'p-1',
          displayName: 'Devika',
          profilePictureURL: 'https://cdn.blablacar.com/comuto3/images/avatar/pixar/passenger-m-02.png',
          seatsBooked: 2,
          itineraryDescription: 'Bengaluru → Piriyapatna'
        },
        {
          id: 'p-2',
          displayName: 'Babitha',
          profilePictureURL: 'https://cdn.blablacar.com/comuto3/images/avatar/pixar/passenger-m-02.png',
          seatsBooked: 1,
          itineraryDescription: 'Bengaluru → Hutagalli'
        }
      ],
      vehicle: {
        make: 'Hyundai',
        model: 'i20',
        color: 'white'
      },
      available_seats: 1,
      total_seats: 4,
      instant_booking: true,
      two_max_back: true,
      air_conditioning: true,
      power_outlets: false,
      smoking_allowed: false,
      pets_allowed: false,
      co2SavingsKg: 22.4
    };

    return NextResponse.json(defaultDetails);
  } catch (err: unknown) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Failed to fetch ride details' },
      { status: 500 }
    );
  }
}

