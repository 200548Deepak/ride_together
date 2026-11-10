-- ====================================================================
-- RIDE TOGETHER - Seed Data (Bengaluru to Mysuru Rides)
-- ====================================================================

-- 1. Create Mock Auth Users & Profiles
DO $$
DECLARE
    user1_id UUID := '11111111-1111-1111-1111-111111111111';
    user2_id UUID := '22222222-2222-2222-2222-222222222222';
    user3_id UUID := '33333333-3333-3333-3333-333333333333';
    user4_id UUID := '44444444-4444-4444-4444-444444444444';
    veh1_id UUID := uuid_generate_v4();
    veh2_id UUID := uuid_generate_v4();
    veh3_id UUID := uuid_generate_v4();
    veh4_id UUID := uuid_generate_v4();
BEGIN
    -- Insert auth users if not present
    INSERT INTO auth.users (id, email)
    VALUES
        (user1_id, 'karthik@example.com'),
        (user2_id, 'arjun@example.com'),
        (user3_id, 'rohit@example.com'),
        (user4_id, 'priya@example.com')
    ON CONFLICT (id) DO NOTHING;

    -- Profiles
    INSERT INTO public.profiles (id, name, avatar_url, is_verified, rating, ratings_count)
    VALUES
        (user1_id, 'Karthik', 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&h=150&q=80', true, 4.90, 48),
        (user2_id, 'Arjun', 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?auto=format&fit=crop&w=150&h=150&q=80', true, 4.70, 32),
        (user3_id, 'Rohit', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&h=150&q=80', true, 4.85, 27),
        (user4_id, 'Priya', 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&h=150&q=80', true, 5.00, 19)
    ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, avatar_url = EXCLUDED.avatar_url;

    -- Vehicles
    INSERT INTO public.vehicles (id, user_id, make, model, color, license_plate, year)
    VALUES
        (veh1_id, user1_id, 'Maruti Suzuki', 'Swift', 'Pearl White', 'KA-01-MJ-1234', 2023),
        (veh2_id, user2_id, 'Hyundai', 'Creta', 'Phantom Black', 'KA-03-NB-5678', 2022),
        (veh3_id, user3_id, 'Tata', 'Nexon EV', 'Teal Blue', 'KA-05-EV-9012', 2024),
        (veh4_id, user4_id, 'Honda', 'City', 'Silver Metallic', 'KA-51-AB-3456', 2021)
    ON CONFLICT (id) DO NOTHING;

    -- Insert Sample Rides (matching HAR data times and locations)
    INSERT INTO public.rides (
        driver_id, vehicle_id,
        departure_city, departure_location_name, departure_lat, departure_lon, departure_time,
        arrival_city, arrival_location_name, arrival_lat, arrival_lon, arrival_time,
        total_seats, available_seats, price_amount, currency,
        instant_booking, two_max_back, air_conditioning, power_outlets, smoking_allowed, pets_allowed,
        multimodal_id
    ) VALUES
    -- Trip 1 (Karthik)
    (
        user1_id, veh1_id,
        'Bengaluru', 'Majestic, Bengaluru', 12.942646, 77.574737, CURRENT_DATE + TIME '20:20:00',
        'Mysuru', 'Suburban Bus Stand, Mysuru', 12.349975, 76.66018, CURRENT_DATE + TIME '22:20:00',
        3, 3, 400.00, 'INR',
        true, false, false, false, false, false,
        'M2H8MPaRSPWtAxUaaKtKdwRYo4G9TJSrW5s6bS884iyg'
    ),
    -- Trip 2 (Arjun)
    (
        user2_id, veh2_id,
        'Bengaluru', 'Electronic City Phase 1, Bengaluru', 12.883108, 77.623644, CURRENT_DATE + TIME '21:40:00',
        'Mysuru', 'Columbia Asia Hospital, Mysuru', 12.342539, 76.63479, CURRENT_DATE + INTERVAL '1 day' + TIME '00:10:00',
        3, 2, 420.00, 'INR',
        true, true, true, true, false, false,
        'M2H8MPaRSPWtAxUaaKtKdweCZ04VhmQGi0VuXqSmroXQ'
    ),
    -- Trip 3 (Rohit)
    (
        user3_id, veh3_id,
        'Bengaluru', 'Silk Board Junction, Bengaluru', 12.917200, 77.622700, CURRENT_DATE + TIME '18:30:00',
        'Mysuru', 'Mysore Palace North Gate, Mysuru', 12.305100, 76.655100, CURRENT_DATE + TIME '21:00:00',
        3, 3, 380.00, 'INR',
        true, true, true, true, false, true,
        'M2H8MPaRSPWtAxUaaKtKdw06BjR5BeSeuc4T8wBm9fqw'
    ),
    -- Trip 4 (Priya)
    (
        user4_id, veh4_id,
        'Bengaluru', 'Kengeri Satellite Town, Bengaluru', 12.912100, 77.483300, CURRENT_DATE + TIME '19:00:00',
        'Mysuru', 'Infosys Mysore Campus Gate 1, Mysuru', 12.355000, 76.595000, CURRENT_DATE + TIME '21:15:00',
        2, 2, 450.00, 'INR',
        false, true, true, true, false, false,
        'M2H8MPaRSPWtAxUaaKtKdw8Xx7ATCvQ3-8BCpGMNg44Q'
    );
END $$;

