-- ====================================================================
-- RIDE TOGETHER (BlaBlaCar Clone) - Supabase PostgreSQL Schema
-- ====================================================================

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "cube";
CREATE EXTENSION IF NOT EXISTS "earthdistance";

-- 1. USERS & PROFILES (Passengers & Drivers)
CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    first_name TEXT,
    last_name TEXT,
    phone TEXT,
    birth_date DATE,
    gender TEXT,
    avatar_url TEXT,
    bio TEXT,
    is_verified BOOLEAN DEFAULT FALSE,
    rating NUMERIC(3, 2) DEFAULT 5.00 CHECK (rating >= 1.0 AND rating <= 5.0),
    ratings_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    avatar_url TEXT,
    bio TEXT,
    phone TEXT,
    is_verified BOOLEAN DEFAULT FALSE,
    rating NUMERIC(3, 2) DEFAULT 5.00 CHECK (rating >= 1.0 AND rating <= 5.0),
    ratings_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Trigger to automatically create public.users and public.profiles on auth.users sign-up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    user_name TEXT;
    user_first_name TEXT;
    user_last_name TEXT;
    user_birth_date DATE;
    user_gender TEXT;
BEGIN
    user_first_name := COALESCE(NEW.raw_user_meta_data->>'first_name', '');
    user_last_name := COALESCE(NEW.raw_user_meta_data->>'last_name', '');
    user_name := COALESCE(
        NEW.raw_user_meta_data->>'name',
        NULLIF(TRIM(user_first_name || ' ' || user_last_name), ''),
        SPLIT_PART(NEW.email, '@', 1)
    );
    
    BEGIN
        user_birth_date := (NEW.raw_user_meta_data->>'birth_date')::date;
    EXCEPTION WHEN OTHERS THEN
        user_birth_date := NULL;
    END;

    user_gender := NEW.raw_user_meta_data->>'gender';

    -- Insert into public.users
    INSERT INTO public.users (id, email, name, first_name, last_name, birth_date, gender, is_verified, rating)
    VALUES (NEW.id, NEW.email, user_name, user_first_name, user_last_name, user_birth_date, user_gender, false, 5.00)
    ON CONFLICT (id) DO UPDATE SET
        email = EXCLUDED.email,
        name = EXCLUDED.name,
        updated_at = NOW();

    -- Insert into public.profiles
    INSERT INTO public.profiles (id, name, is_verified, rating)
    VALUES (NEW.id, user_name, false, 5.00)
    ON CONFLICT (id) DO UPDATE SET
        name = EXCLUDED.name,
        updated_at = NOW();

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 2. VEHICLES
CREATE TABLE IF NOT EXISTS public.vehicles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    make TEXT NOT NULL,         -- e.g. "Maruti Suzuki", "Hyundai", "Toyota"
    model TEXT NOT NULL,        -- e.g. "Swift", "Creta", "Innova"
    color TEXT,                 -- e.g. "White", "Silver", "Red"
    license_plate TEXT,
    year INTEGER,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. RIDES (Carpool Trips)
CREATE TABLE IF NOT EXISTS public.rides (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    driver_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    vehicle_id UUID REFERENCES public.vehicles(id) ON DELETE SET NULL,

    -- Departure Details
    departure_city TEXT NOT NULL,                  -- e.g. "Bengaluru"
    departure_location_name TEXT NOT NULL,          -- e.g. "Majestic Bus Station, Bengaluru"
    departure_lat DOUBLE PRECISION NOT NULL,       -- e.g. 12.942646
    departure_lon DOUBLE PRECISION NOT NULL,       -- e.g. 77.574737
    departure_time TIMESTAMPTZ NOT NULL,           -- e.g. "2026-11-09 20:20:00+05:30"

    -- Arrival Details
    arrival_city TEXT NOT NULL,                    -- e.g. "Mysuru"
    arrival_location_name TEXT NOT NULL,            -- e.g. "Suburban Bus Stand, Mysuru"
    arrival_lat DOUBLE PRECISION NOT NULL,         -- e.g. 12.349975
    arrival_lon DOUBLE PRECISION NOT NULL,         -- e.g. 76.66018
    arrival_time TIMESTAMPTZ NOT NULL,             -- e.g. "2026-11-09 22:20:00+05:30"

    -- Trip Metrics
    duration_minutes INTEGER GENERATED ALWAYS AS (
        EXTRACT(EPOCH FROM (arrival_time - departure_time)) / 60
    ) STORED,
    is_overnight BOOLEAN GENERATED ALWAYS AS (
        (arrival_time::date > departure_time::date)
    ) STORED,

    -- Capacity & Pricing
    total_seats INTEGER NOT NULL DEFAULT 3 CHECK (total_seats > 0),
    available_seats INTEGER NOT NULL DEFAULT 3 CHECK (available_seats >= 0),
    price_amount NUMERIC(10, 2) NOT NULL CHECK (price_amount >= 0),
    currency VARCHAR(10) DEFAULT 'INR',             -- INR / ₹

    -- Status
    status VARCHAR(20) DEFAULT 'SCHEDULED' CHECK (status IN ('SCHEDULED', 'ACTIVE', 'COMPLETED', 'CANCELLED')),

    -- BlaBlaCar Preferences & Amenities
    instant_booking BOOLEAN DEFAULT TRUE,          -- AUTOMATIC_APPROVAL
    two_max_back BOOLEAN DEFAULT TRUE,             -- TWO_MAX_IN_THE_BACK
    air_conditioning BOOLEAN DEFAULT TRUE,         -- AIR_CONDITIONING
    power_outlets BOOLEAN DEFAULT FALSE,           -- POWER_OUTLETS
    smoking_allowed BOOLEAN DEFAULT FALSE,         -- SMOKERS_ALLOWED
    pets_allowed BOOLEAN DEFAULT FALSE,            -- PETS_ALLOWED

    -- External multimodal ID for compatibility with BlaBlaCar routing
    multimodal_id TEXT UNIQUE DEFAULT encode(gen_random_bytes(24), 'base64'),

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. RIDE WAYPOINTS (Optional Stopovers)
CREATE TABLE IF NOT EXISTS public.ride_waypoints (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ride_id UUID NOT NULL REFERENCES public.rides(id) ON DELETE CASCADE,
    stop_order INTEGER NOT NULL,
    location_name TEXT NOT NULL,
    latitude DOUBLE PRECISION NOT NULL,
    longitude DOUBLE PRECISION NOT NULL,
    estimated_arrival TIMESTAMPTZ NOT NULL
);

-- 5. BOOKINGS (Reservations linking passengers and trips)
CREATE TABLE IF NOT EXISTS public.bookings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    trip_id UUID NOT NULL REFERENCES public.rides(id) ON DELETE CASCADE,
    ride_id UUID REFERENCES public.rides(id) ON DELETE CASCADE, -- Alias for backward compatibility
    passenger_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    seats_reserved INTEGER NOT NULL DEFAULT 1 CHECK (seats_reserved > 0),
    seats_booked INTEGER DEFAULT 1 CHECK (seats_booked > 0),    -- Alias for compatibility
    total_price NUMERIC(10, 2) NOT NULL CHECK (total_price >= 0),
    currency VARCHAR(10) DEFAULT 'INR',
    status VARCHAR(20) DEFAULT 'confirmed' CHECK (status IN ('pending', 'confirmed', 'cancelled', 'PENDING', 'CONFIRMED', 'CANCELLED')),
    payment_method VARCHAR(20) DEFAULT 'CASH' CHECK (payment_method IN ('CASH', 'ONLINE', 'CARD')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- View: public.trips as an alias for public.rides
CREATE OR REPLACE VIEW public.trips AS 
SELECT 
    r.*,
    r.id AS trip_id
FROM public.rides r;

-- ====================================================================
-- INDEXES FOR HIGH-PERFORMANCE SEARCH
-- ====================================================================

CREATE INDEX IF NOT EXISTS idx_rides_cities_date ON public.rides (
    departure_city,
    arrival_city,
    departure_time
);

CREATE INDEX IF NOT EXISTS idx_rides_status_seats ON public.rides (
    status,
    available_seats
);

-- Geospatial earthdistance indexes (for lat/lon radius bounding search)
CREATE INDEX IF NOT EXISTS idx_rides_dep_coords ON public.rides USING gist (
    ll_to_earth(departure_lat, departure_lon)
);

CREATE INDEX IF NOT EXISTS idx_rides_arr_coords ON public.rides USING gist (
    ll_to_earth(arrival_lat, arrival_lon)
);

-- ====================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ====================================================================

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rides ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;

-- Anyone can search and read scheduled rides
CREATE POLICY "Public read for scheduled rides"
    ON public.rides FOR SELECT
    USING (status = 'SCHEDULED');

-- Public users read
CREATE POLICY "Public read users"
    ON public.users FOR SELECT
    USING (true);

-- Authenticated users can insert/update their own user record
CREATE POLICY "Users can manage own user record"
    ON public.users FOR ALL
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

-- Public profiles read
CREATE POLICY "Public read profiles"
    ON public.profiles FOR SELECT
    USING (true);

-- Authenticated users can insert/update their own profile
CREATE POLICY "Users can manage own profile"
    ON public.profiles FOR ALL
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

-- Authenticated users can create/manage their own rides
CREATE POLICY "Drivers manage their rides"
    ON public.rides FOR ALL
    USING (auth.uid() = driver_id);

-- Booking RLS Policies
-- Authenticated passengers can view their own bookings
CREATE POLICY "Passengers view own bookings"
    ON public.bookings FOR SELECT
    USING (auth.uid() = passenger_id);

-- Authenticated passengers can insert bookings for themselves
CREATE POLICY "Passengers create own bookings"
    ON public.bookings FOR INSERT
    WITH CHECK (auth.uid() = passenger_id);

-- Drivers can view bookings placed on their rides
CREATE POLICY "Drivers view ride bookings"
    ON public.bookings FOR SELECT
    USING (EXISTS (
        SELECT 1 FROM public.rides r 
        WHERE r.id = bookings.trip_id AND r.driver_id = auth.uid()
    ));

-- ====================================================================
-- ATOMIC BOOKING FUNCTION: Ensures seat availability & prevents double-booking
-- ====================================================================

CREATE OR REPLACE FUNCTION public.create_booking_atomic(
    p_trip_id UUID,
    p_passenger_id UUID,
    p_seats_reserved INTEGER,
    p_total_price NUMERIC,
    p_payment_method TEXT DEFAULT 'CASH'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_available_seats INTEGER;
    v_instant_booking BOOLEAN;
    v_booking_status TEXT;
    v_booking_id UUID;
    v_new_available_seats INTEGER;
    v_departure_city TEXT;
    v_arrival_city TEXT;
    v_departure_time TIMESTAMPTZ;
    v_arrival_time TIMESTAMPTZ;
BEGIN
    -- 1. Lock the ride row to prevent race conditions during concurrent bookings
    SELECT 
        available_seats, 
        instant_booking, 
        departure_city, 
        arrival_city, 
        departure_time, 
        arrival_time
    INTO 
        v_available_seats, 
        v_instant_booking,
        v_departure_city,
        v_arrival_city,
        v_departure_time,
        v_arrival_time
    FROM public.rides
    WHERE id = p_trip_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RETURN jsonb_build_object(
            'success', false,
            'code', 'RIDE_NOT_FOUND',
            'error', 'Trip not found or does not exist.'
        );
    END IF;

    -- 2. Verify remaining seat availability
    IF v_available_seats < p_seats_reserved THEN
        RETURN jsonb_build_object(
            'success', false,
            'code', 'NOT_ENOUGH_SEATS',
            'error', 'The requested seats exceed available seats.',
            'available_seats', v_available_seats
        );
    END IF;

    -- 3. Determine booking status (confirmed for instant booking, pending otherwise)
    IF v_instant_booking THEN
        v_booking_status := 'confirmed';
    ELSE
        v_booking_status := 'pending';
    END IF;

    -- 4. Insert booking reservation record
    INSERT INTO public.bookings (
        trip_id,
        ride_id,
        passenger_id,
        seats_reserved,
        seats_booked,
        total_price,
        status,
        payment_method
    ) VALUES (
        p_trip_id,
        p_trip_id,
        p_passenger_id,
        p_seats_reserved,
        p_seats_reserved,
        p_total_price,
        v_booking_status,
        p_payment_method
    )
    RETURNING id INTO v_booking_id;

    -- 5. Decrement available seats atomically if confirmed
    IF v_booking_status = 'confirmed' THEN
        UPDATE public.rides
        SET available_seats = available_seats - p_seats_reserved,
            updated_at = NOW()
        WHERE id = p_trip_id
        RETURNING available_seats INTO v_new_available_seats;
    ELSE
        v_new_available_seats := v_available_seats;
    END IF;

    RETURN jsonb_build_object(
        'success', true,
        'booking', jsonb_build_object(
            'id', v_booking_id,
            'trip_id', p_trip_id,
            'passenger_id', p_passenger_id,
            'seats_reserved', p_seats_reserved,
            'total_price', p_total_price,
            'status', v_booking_status,
            'payment_method', p_payment_method,
            'created_at', NOW()
        ),
        'trip', jsonb_build_object(
            'id', p_trip_id,
            'departure_city', v_departure_city,
            'arrival_city', v_arrival_city,
            'departure_time', v_departure_time,
            'arrival_time', v_arrival_time,
            'remaining_seats', v_new_available_seats
        ),
        'message', 'Reservation created successfully'
    );
END;
$$;

-- ====================================================================
-- SEARCH FUNCTION: Matches BlaBlaCar Search API parameters
-- ====================================================================

CREATE OR REPLACE FUNCTION search_rides(
    p_departure_city TEXT DEFAULT NULL,
    p_arrival_city TEXT DEFAULT NULL,
    p_departure_date DATE DEFAULT CURRENT_DATE,
    p_seats INTEGER DEFAULT 1,
    p_from_lat DOUBLE PRECISION DEFAULT NULL,
    p_from_lon DOUBLE PRECISION DEFAULT NULL,
    p_to_lat DOUBLE PRECISION DEFAULT NULL,
    p_to_lon DOUBLE PRECISION DEFAULT NULL,
    p_max_distance_km DOUBLE PRECISION DEFAULT 40.0,
    p_sort TEXT DEFAULT 'dep_time:asc',
    p_verified_only BOOLEAN DEFAULT FALSE,
    p_auto_approve BOOLEAN DEFAULT FALSE,
    p_two_max_back BOOLEAN DEFAULT FALSE,
    p_ac BOOLEAN DEFAULT FALSE,
    p_power BOOLEAN DEFAULT FALSE,
    p_smokers BOOLEAN DEFAULT FALSE,
    p_pets BOOLEAN DEFAULT FALSE
)
RETURNS TABLE (
    ride_id UUID,
    multimodal_id TEXT,
    driver_id UUID,
    driver_name TEXT,
    driver_avatar TEXT,
    driver_is_verified BOOLEAN,
    driver_rating NUMERIC,
    vehicle_make TEXT,
    vehicle_model TEXT,
    departure_city TEXT,
    departure_location_name TEXT,
    departure_lat DOUBLE PRECISION,
    departure_lon DOUBLE PRECISION,
    departure_time TIMESTAMPTZ,
    arrival_city TEXT,
    arrival_location_name TEXT,
    arrival_lat DOUBLE PRECISION,
    arrival_lon DOUBLE PRECISION,
    arrival_time TIMESTAMPTZ,
    duration_minutes INTEGER,
    is_overnight BOOLEAN,
    available_seats INTEGER,
    price_amount NUMERIC,
    currency VARCHAR,
    instant_booking BOOLEAN,
    two_max_back BOOLEAN,
    air_conditioning BOOLEAN,
    power_outlets BOOLEAN,
    smoking_allowed BOOLEAN,
    pets_allowed BOOLEAN,
    departure_distance_km DOUBLE PRECISION,
    arrival_distance_km DOUBLE PRECISION
) LANGUAGE plpgsql AS $$
BEGIN
    RETURN QUERY
    SELECT
        r.id AS ride_id,
        r.multimodal_id,
        p.id AS driver_id,
        p.name AS driver_name,
        p.avatar_url AS driver_avatar,
        p.is_verified AS driver_is_verified,
        p.rating AS driver_rating,
        v.make AS vehicle_make,
        v.model AS vehicle_model,
        r.departure_city,
        r.departure_location_name,
        r.departure_lat,
        r.departure_lon,
        r.departure_time,
        r.arrival_city,
        r.arrival_location_name,
        r.arrival_lat,
        r.arrival_lon,
        r.arrival_time,
        r.duration_minutes,
        r.is_overnight,
        r.available_seats,
        r.price_amount,
        r.currency,
        r.instant_booking,
        r.two_max_back,
        r.air_conditioning,
        r.power_outlets,
        r.smoking_allowed,
        r.pets_allowed,
        -- Distance in km from user's origin
        CASE
            WHEN p_from_lat IS NOT NULL AND p_from_lon IS NOT NULL THEN
                earth_distance(ll_to_earth(p_from_lat, p_from_lon), ll_to_earth(r.departure_lat, r.departure_lon)) / 1000.0
            ELSE 0.0
        END AS departure_distance_km,
        -- Distance in km to user's destination
        CASE
            WHEN p_to_lat IS NOT NULL AND p_to_lon IS NOT NULL THEN
                earth_distance(ll_to_earth(p_to_lat, p_to_lon), ll_to_earth(r.arrival_lat, r.arrival_lon)) / 1000.0
            ELSE 0.0
        END AS arrival_distance_km
    FROM public.rides r
    JOIN public.profiles p ON r.driver_id = p.id
    LEFT JOIN public.vehicles v ON r.vehicle_id = v.id
    WHERE r.status = 'SCHEDULED'
      AND r.available_seats >= p_seats
      AND r.departure_time::date = p_departure_date
      -- City or coordinate matching for Departure
      AND (
          (p_departure_city IS NOT NULL AND r.departure_city ILIKE '%' || p_departure_city || '%')
          OR (p_from_lat IS NOT NULL AND p_from_lon IS NOT NULL AND
              earth_box(ll_to_earth(p_from_lat, p_from_lon), p_max_distance_km * 1000) @> ll_to_earth(r.departure_lat, r.departure_lon))
          OR (p_departure_city IS NULL AND p_from_lat IS NULL)
      )
      -- City or coordinate matching for Arrival
      AND (
          (p_arrival_city IS NOT NULL AND r.arrival_city ILIKE '%' || p_arrival_city || '%')
          OR (p_to_lat IS NOT NULL AND p_to_lon IS NOT NULL AND
              earth_box(ll_to_earth(p_to_lat, p_to_lon), p_max_distance_km * 1000) @> ll_to_earth(r.arrival_lat, r.arrival_lon))
          OR (p_arrival_city IS NULL AND p_to_lat IS NULL)
      )
      -- Amenity & Trust Filters
      AND (NOT p_verified_only OR p.is_verified = TRUE)
      AND (NOT p_auto_approve OR r.instant_booking = TRUE)
      AND (NOT p_two_max_back OR r.two_max_back = TRUE)
      AND (NOT p_ac OR r.air_conditioning = TRUE)
      AND (NOT p_power OR r.power_outlets = TRUE)
      AND (NOT p_smokers OR r.smoking_allowed = TRUE)
      AND (NOT p_pets OR r.pets_allowed = TRUE)
    ORDER BY
        CASE WHEN p_sort = 'dep_time:asc' THEN r.departure_time END ASC,
        CASE WHEN p_sort = 'price:asc' THEN r.price_amount END ASC,
        CASE WHEN p_sort = 'duration:asc' THEN r.duration_minutes END ASC,
        CASE WHEN p_sort = 'dep_dist:asc' THEN
            (CASE WHEN p_from_lat IS NOT NULL THEN earth_distance(ll_to_earth(p_from_lat, p_from_lon), ll_to_earth(r.departure_lat, r.departure_lon)) ELSE 0 END)
        END ASC,
        CASE WHEN p_sort = 'arr_dist:asc' THEN
            (CASE WHEN p_to_lat IS NOT NULL THEN earth_distance(ll_to_earth(p_to_lat, p_to_lon), ll_to_earth(r.arrival_lat, r.arrival_lon)) ELSE 0 END)
        END ASC,
        r.departure_time ASC;
END;
$$;

