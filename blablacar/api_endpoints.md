# BlaBlaCar India — Edge API Endpoints Catalog

This document provides a comprehensive technical reference for the production backend and edge gateway APIs powering **BlaBlaCar India** (`https://www.blablacar.in/`), reverse engineered via REA and HTTP Archive extraction.

All endpoint request/response traces are preserved in `blablacar/hax/`.

---

## 1. Master API Endpoints Directory

| # | Method | Path | Host | Purpose | Auth |
| :- | :--- | :--- | :--- | :--- | :--- |
| **01** | `GET` | `/location/suggestions` | `edge.blablacar.in` | Places, landmarks & history autocomplete | Optional |
| **02** | `GET` | `/notification/count/v4` | `edge.blablacar.in` | Unread notifications badge counter | Bearer Token |
| **03** | `POST` | `/experience/publication-flow/v10` | `edge.blablacar.in` | Publication wizard state machine | Bearer Token |
| **04** | `GET` | `/experience/driver-grade` | `edge.blablacar.in` | Driver reputation, grade & verification | Bearer Token |
| **05** | `POST` | `/booking/v12` | `edge.blablacar.in` | Passenger seat reservation & checkout | Bearer Token |
| **06** | `GET` | `/trip/search/v9` | `edge.blablacar.in` | Search matching carpool rides | Public |
| **07** | `GET` | `/trip/details/v3` | `edge.blablacar.in` | Detailed trip metadata, legs & vehicle | Public |
| **08** | `GET` | `/booking/checkout` | `www.blablacar.in` | SSR checkout page & fare breakdown | Session / Cookie |
| **09** | `GET` | `/manifest.json` | `www.blablacar.in` | PWA manifest & application icons | Public |
| **10** | `POST` | `/v1/metrics` | `telemetry.prod.blabla.tech` | Core Web Vitals & client telemetry | Public |
| **11** | `POST` | `/v2/c` | `t.blablacar.com` | User behavioral clickstream analytics | Anonymous Token |
| **12** | `POST` | `/api/v3/data/` | `customer.fra-01.braze.eu` | Braze CRM in-app messaging sync | API Key |

---

## 2. Endpoint Specifications

### 2.1 Location Suggestions & History
* **URL**: `GET https://edge.blablacar.in/location/suggestions`
* **HAR / HAX File**: [`blablacar/hax/01_GET_location_suggestions.hax`](file:///d:/Deepak/work/ride_together/blablacar/hax/01_GET_location_suggestions.hax)
* **Query Parameters**:
  * `query` (string, required): Search query term (e.g. `Bengaluru`). If empty, returns recent history.
  * `with_user_history` (boolean, optional): `true` to include prior searches.
  * `locale` (string, optional): Default `en_IN`.
* **Sample Response (200 OK)**:
```json
[
  {
    "id": "ChIJsc1rHzcjjsRJLjyQ31LpqU",
    "address": "27, 6th Cross Rd, Visveshwaraiah Layout, Bagalagunte, Bengaluru, Karnataka",
    "types": ["POSTAL_ADDRESS", "PRECISE_ADDRESS"],
    "user_history": true,
    "precise": true,
    "main_text": "27, 6th Cross Rd",
    "secondary_text": "Bengaluru, Karnataka",
    "city": "Bengaluru",
    "latitude": 13.0475,
    "longitude": 77.4984
  },
  {
    "id": "ChIJbU60yXAWkrjsR4E9-UejD3_g",
    "address": "Bengaluru, Karnataka, India",
    "types": ["LOCALITY"],
    "user_history": true,
    "precise": false,
    "main_text": "Bengaluru, Karnataka",
    "secondary_text": "India",
    "city": "Bengaluru",
    "latitude": 12.9716,
    "longitude": 77.5946
  }
]
```

---

### 2.2 Notification Counter
* **URL**: `GET https://edge.blablacar.in/notification/count/v4`
* **HAR / HAX File**: [`blablacar/hax/02_GET_notification_count_v4.hax`](file:///d:/Deepak/work/ride_together/blablacar/hax/02_GET_notification_count_v4.hax)
* **Headers**: `Authorization: Bearer <jwt_access_token>`
* **Sample Response (200 OK)**:
```json
{
  "count": 0,
  "unread": false,
  "channels": {
    "booking_requests": 0,
    "messages": 0,
    "ride_updates": 0
  },
  "timestamp": "2026-11-09T14:52:43.120Z"
}
```

---

### 2.3 Publication Flow State Machine
* **URL**: `POST https://edge.blablacar.in/experience/publication-flow/v10`
* **HAR / HAX File**: [`blablacar/hax/03_POST_publication_flow_v10.hax`](file:///d:/Deepak/work/ride_together/blablacar/hax/03_POST_publication_flow_v10.hax)
* **Request Payload**:
```json
{
  "step": "START",
  "locale": "en-IN",
  "currency": "INR",
  "client_version": "web-v10.4.1"
}
```
* **Sample Response (200 OK)**:
```json
{
  "step": "STEP_START",
  "stepName": "DEPARTURE",
  "screen_title": "Pick-up",
  "auto_complete_place_holder": "Enter the full address",
  "suggestions_history": [
    {
      "id": "ChIJsc1rHzcjjsRJLjyQ31LpqU",
      "main_text": "27, 6th Cross Rd",
      "secondary_text": "Bengaluru, Karnataka",
      "user_history": true
    }
  ],
  "navigation": {
    "can_go_back": false,
    "current_step_number": 1,
    "total_step_count": 6
  }
}
```

---

### 2.4 Driver Grade & Reputation
* **URL**: `GET https://edge.blablacar.in/experience/driver-grade`
* **HAR / HAX File**: [`blablacar/hax/04_GET_driver_grade.hax`](file:///d:/Deepak/work/ride_together/blablacar/hax/04_GET_driver_grade.hax)
* **Sample Response (200 OK)**:
```json
{
  "grade": "AMBASSADOR",
  "driver_score": 98,
  "rating": 4.9,
  "ratings_count": 42,
  "total_rides_shared": 84,
  "member_since": "2022-04-12",
  "verifications": {
    "id_document": true,
    "phone": true,
    "email": true
  }
}
```

---

### 2.5 Seat Reservation & Checkout
* **URL**: `POST https://edge.blablacar.in/booking/v12`
* **HAR / HAX File**: [`blablacar/hax/05_POST_booking_v12.hax`](file:///d:/Deepak/work/ride_together/blablacar/hax/05_POST_booking_v12.hax)
* **Request Payload**:
```json
{
  "trip_id": "KpmVENEvSDaFUCjblX39yweGeSgw9MT4-spC6nJx-L6A",
  "requested_seats": 1,
  "payment_method": "CASH",
  "passenger_notes": "Traveling with a backpack."
}
```
* **Sample Response (200 OK)**:
```json
{
  "booking_id": "bk_98317e10-09a2-4a21-9876",
  "status": "CONFIRMED",
  "trip_id": "KpmVENEvSDaFUCjblX39yweGeSgw9MT4-spC6nJx-L6A",
  "seats_reserved": 1,
  "pricing": {
    "base_fare": 350.00,
    "service_fee": 35.00,
    "total_amount": 385.00,
    "currency": "INR"
  },
  "driver_contact": {
    "phone_unlocked": true,
    "phone_number": "+91 98765 43210"
  }
}
```

---

### 2.6 Trip Search Engine
* **URL**: `GET https://edge.blablacar.in/trip/search/v9`
* **HAR / HAX File**: [`blablacar/hax/06_GET_trip_search_v9.hax`](file:///d:/Deepak/work/ride_together/blablacar/hax/06_GET_trip_search_v9.hax)
* **Query Parameters**:
  * `departure_date`: `YYYY-MM-DD`
  * `from_place_id`: Geocoded origin ID
  * `to_place_id`: Geocoded destination ID
  * `requested_seats`: Integer (1 to 8)
  * `transport_type`: `CARPOOLING`

