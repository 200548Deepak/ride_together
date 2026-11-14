# 🚗 Ride Together

> An exact, production-ready **BlaBlaCar replica** for intercity carpooling and ride-sharing across India, built with Next.js 14 (App Router), TypeScript, Tailwind CSS, and JWT authentication.

---

## 🌟 Highlights & BlaBlaCar Replica Capabilities

* **Exact BlaBlaCar Visual Design System**:
  * Brand Cyan (`#00aff5`), Dark Teal primary text (`#054752`), Muted Slate (`#708c91`), and Soft Canvas (`#f4f7f8`).
  * Bespoke geometric typography (`GT Eesti Pro Display` / `Google Sans`).
  * Floating Capsule Search Bar with popover dropdowns for Departure, Arrival, Date, and Seats.
* **🔐 Full JWT Authentication (Email & Password)**:
  * Secure bcrypt password hashing.
  * Signed JSON Web Tokens (`accessToken` valid for 24h, `refreshToken` for 30d).
  * HTTP-only cookies and Bearer token client storage.
  * Live password strength verification (8+ chars, 1 letter, 1 number/special char) matching BlaBlaCar's signup screens.
* **📍 Edge Autocomplete & Geocoding**:
  * Mirrored `/api/location/suggestions` endpoint matching BlaBlaCar's edge API.
  * Recent history caching (`user_history: true`) with clock icons and transit landmarks.
* **🔍 Live Trip Search & Filtering**:
  * Departure time windows (Morning, Afternoon, Evening).
  * Trust & Comfort toggles (Instant booking ⚡, Max 2 in the back, Verified ID).
  * Sort by earliest departure, lowest price, and route duration.
* **🛣️ Itinerary Details & Instant Booking**:
  * Visual route timeline with stopovers and landmarks.
  * Driver reputation card (Ambassador / Expert grade, verified ID / phone / email badges).
  * Interactive Checkout modal with cash or online payment submission.
* **🚘 Multi-Step Publication Wizard**:
  * 6-step guided wizard (Pick-up, Drop-off, Stopovers, Schedule, Seats, Recommended Price, Vehicle).
* **📊 Driver Hub & Booking Moderation**:
  * Strictly isolated dashboard for authenticated drivers.
  * Moderation actions: **Accept** or **Decline** passenger booking requests.

---

## 🔑 Demo Accounts

| Account Role | Email Address | Password | Details |
| :--- | :--- | :--- | :--- |
| **Driver (Host)** | `driver@abc.com` | `password123` | Anish Kumar • 4.9 ★ • Ambassador Tier |
| **Passenger (Rider)** | `rider@abc.com` | `password123` | Rahul Sharma • 4.8 ★ • Expert Tier |

---

## 🚀 Getting Started

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Start the development server**:
   ```bash
   npm run dev
   ```

3. Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 📂 Project Architecture

```
ride_together/
├── app/
│   ├── api/
│   │   ├── auth/                # JWT Register, Login, Me, Logout
│   │   ├── bookings/            # Seat reservations & moderation
│   │   ├── experience/          # Driver grade & publication flow v10
│   │   ├── location/suggestions# Geocoding & recent search history
│   │   ├── notifications/count  # Live unread notification badge
│   │   ├── rides/               # Published rides API
│   │   ├── search/              # Core carpool search engine
│   │   └── trip/                # Trip details & search v9
│   ├── driver/                  # Driver hub & passenger bookings
│   ├── offer-seats/departure/   # Dedicated BlaBlaCar pick-up route
│   ├── publish/                 # Multi-step publication wizard
│   ├── search/                  # Search results with filter sidebar
│   ├── trip/[id]/               # Itinerary & checkout page
│   ├── layout.tsx               # Root layout & font definitions
│   └── page.tsx                 # Homepage with hero & floating search bar
├── components/
│   ├── AuthModal.tsx            # Exact BlaBlaCar email/password & JWT modal
│   ├── CheckoutModal.tsx        # Seat reservation & fare breakdown
│   ├── DeparturePlaceAutocomplete.tsx # Replicated location autocomplete
│   ├── DriverDashboard.tsx      # Driver & passenger rides management
│   ├── FilterSidebar.tsx        # Faceted search filters
│   ├── FloatingSearchBar.tsx    # Homepage floating search capsule
│   ├── Header.tsx               # Navigation bar with live badges & auth menu
│   ├── PublishRideFlow.tsx      # 6-step ride publication wizard
│   ├── RideDetails.tsx          # Full itinerary & driver profile
│   └── SearchResults.tsx        # Trip result cards
├── lib/
│   ├── authClient.ts            # Client-side JWT auth & cookie helper
│   ├── jwt.ts                   # Token signing & verification (jsonwebtoken)
│   ├── userStore.ts             # User records & bcrypt password hashing
│   ├── ridesStore.ts            # Ride listings & booking transactions
│   └── searchService.ts         # Route matching & geodetic calculations
└── blablacar/                   # REA reverse engineering repository & HAX files
    ├── content.md
    ├── structure.md
    ├── features.md
    ├── navigation.md
    ├── design_system.md
    ├── api_endpoints.md
    ├── backend.md
    └── hax/                     # .hax endpoint request/response traces
```
