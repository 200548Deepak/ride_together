# 🚗 Ride Together

> An exact, production-ready BlaBlaCar replica for intercity carpooling and ride-sharing across India, built with Next.js (App Router), TypeScript, Tailwind CSS, and Supabase PostgreSQL.

---

## ✨ Features

- **🔍 Smart Search & Discovery**:
  - Search rides by origin city, destination, departure date, and seat count.
  - Interactive Filter Sidebar with real-time dynamic facets (Instant booking, Air conditioning, Max 2 in the back, Smoking, Pets, etc.).
  - Sort by departure time, price, duration, and origin distance.

- **🛣️ Ride Details & Itinerary Timeline**:
  - Interactive visual timeline showing pickup/drop-off points, street landmarks, duration, and Google Maps integration.
  - Verified driver profiles with ratings, reviews count, identity checks, and vehicle specs.
  - Co-passengers list displaying booked travelers per travel segment.
  - Ecological impact badge calculating CO₂ emissions avoided.

- **💳 Instant Booking & Checkout Flow**:
  - Dynamic seat quantity selector capped to available capacity.
  - Real-time transparent pricing breakdown with zero passenger fees.
  - Payment method choices (Cash to Driver, UPI / Card).
  - Atomic database transactions preventing concurrent double-booking.

- **🚘 Driver Ride Publication Wizard**:
  - 6-step guided wizard for drivers to publish rides in under 2 minutes.
  - Departure and arrival inputs with popular Indian city presets.
  - Intermediate stopover waypoints along highway corridors.
  - Smart price recommendation indicator matching route benchmarks.
  - Instant booking vs manual request approval toggle.
  - Vehicle details and passenger guidelines.

- **📊 Driver Hub & Booking Moderation**:
  - Real-time KPI metrics: Total rides published, passengers transported, and total earnings.
  - Tab segregation for upcoming scheduled rides vs past trip history.
  - Live passenger reservation moderation: **Accept** or **Decline** pending booking requests with automatic seat count adjustment.

- **🔐 Supabase Authentication & Profile Management**:
  - Secure email/password login and multi-step registration flow.
  - Automatic synchronization with `public.users` and `public.profiles`.

---

## 🛠️ Tech Stack

- **Framework**: [Next.js 14](https://nextjs.org/) (App Router, Server & Client Components)
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/) & PostCSS
- **Database & Auth**: [Supabase](https://supabase.com/) (PostgreSQL with RLS, Stored Procedures, and Auth)
- **Font**: Inter via `next/font/google`

---

## 🚀 Getting Started

### 1. Prerequisites
- Node.js 18+ installed
- A Supabase project (URL and anon public key)

### 2. Installation

```bash
# Clone repository
git clone https://github.com/200548Deepak/ride_together.git
cd ride_together

# Install dependencies
npm install
```

### 3. Environment Variables

Create a `.env.local` file in the root directory:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 4. Database Setup

Execute the SQL script in `supabase/schema.sql` in your Supabase SQL Editor:
- Creates `users`, `profiles`, `vehicles`, `rides`, `ride_waypoints`, and `bookings` tables.
- Sets up Row Level Security (RLS) policies.
- Creates the atomic booking stored procedure `create_booking_atomic` and search function `search_rides`.

### 5. Run the Application

```bash
# Development server
npm run dev

# Production build & start
npm run build
npm run start
```

Visit [http://localhost:3000](http://localhost:3000) in your browser.

---

## 📁 Project Structure

```
ride_together/
├── app/
│   ├── api/
│   │   ├── bookings/        # POST booking reservation, GET list, PATCH moderation
│   │   ├── rides/           # POST publish ride, GET driver rides
│   │   ├── search/          # GET search rides with facets & filters
│   │   └── trip/[id]/       # GET single trip details
│   ├── driver/              # Driver hub page
│   ├── publish/             # Publish a ride page
│   ├── search/              # Search results page with filter sidebar
│   ├── trip/[id]/           # Ride details and booking page
│   ├── globals.css          # Tailwind CSS global styles
│   ├── layout.tsx           # Root layout with Inter font
│   └── page.tsx             # Homepage with search pill widget & trust pillars
├── components/
│   ├── CheckoutModal.tsx    # Reservation checkout dialog
│   ├── DriverDashboard.tsx  # Driver rides & passenger management
│   ├── FilterSidebar.tsx    # Faceted search filters & sorting
│   ├── LoginModal.tsx       # Supabase auth login modal
│   ├── PublishRideFlow.tsx  # Multi-step ride publication wizard
│   ├── RegisterFlow.tsx     # Step-by-step account registration
│   ├── RideDetails.tsx      # Comprehensive ride itinerary view
│   └── SearchResults.tsx    # Trip search results list & cards
├── lib/
│   ├── searchService.ts     # Supabase query building & facet mapping
│   └── supabaseClient.ts    # Supabase singleton client
├── supabase/
│   └── schema.sql           # Complete PostgreSQL schema, RLS & functions
└── types/
    ├── blablacar-search.ts  # BlaBlaCar schema definitions
    ├── booking.ts           # Booking & ride details types
    └── ride.ts              # Ride creation & driver item types
```

---

## 📄 License

MIT License. Built for learning and building modern mobility applications.

