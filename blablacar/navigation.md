# BlaBlaCar India — Navigation Systems & User Journeys

This document outlines the navigation patterns, header states, mobile drawers, multi-step wizards, and return redirections across **BlaBlaCar India** (`https://www.blablacar.in/`).

---

## 1. Top Navigation Bar (Header)

### 1.1 Desktop Layout
```
+------------------------------------------------------------------------------------------------+
|  [ BlaBlaCar Logo ]             [ Search ]    [ + Publish a ride ]    [ 🔔 (0) ]   [ Avatar ▾ ] |
+------------------------------------------------------------------------------------------------+
```
* **Logo**: Clickable anchor linking to `/`.
* **Search Link**: Direct link to `/search` or anchors focus into the homepage search bar.
* **Publish a Ride**: High-emphasis pill CTA leading directly to `/offer-seats/departure`.
* **Notification Bell**: Displays live unread count badge sourced from `GET /notification/count/v4`. Clicking opens a dropdown with recent reservation alerts and messages.
* **User Profile Menu**: Dropdown containing:
  * *Your rides* (Passenger bookings and Driver listings)
  * *Inbox / Messages*
  * *Profile & Verifications*
  * *Payments & Transfers*
  * *Log out*

### 1.2 Mobile Responsive Navigation
* **Top Bar**: Minimalist header with BlaBlaCar logo and user avatar.
* **Bottom Navigation Bar (Fixed Tab Bar)**:
  * 🔍 **Search**: `/` or `/search`
  * ➕ **Publish**: `/offer-seats/departure`
  * 🚗 **Your rides**: `/driver` or `/bookings`
  * 💬 **Inbox**: `/messages`
  * 👤 **Profile**: `/user/profile`

---

## 2. Floating Search Widget Transitions

### Desktop Floating Capsule
A unified capsule container with internal dividers:
```
+----------------------------------------------------------------------------------------------+
|  Leaving from: Bengaluru  |  Going to: Mysuru  |  Today: Tue, 10 Nov  |  1 passenger  | [ 🔍 ]|
+----------------------------------------------------------------------------------------------+
```
* Clicking any section opens an attached popover panel (Autocomplete list, Datepicker calendar, or Seat counter).
* Hitting `Enter` or clicking the cyan search icon navigates to `/search?fn=...&tn=...&db=...&seats=...`.

### Mobile Fullscreen Overlay
On viewports `< 768px`, tapping any search input transitions the user into a full-height slide-over modal:
1. Input bar pinned to top with autofocus and a `✕ Clear` button.
2. Below input: List of "Recent Places" with history clock icons.
3. Selecting a place automatically transitions to the next input (Destination -> Date -> Seats) with smooth horizontal slide animations.

---

## 3. Publication Wizard Navigation (Driver Stepper)

The publication flow maintains a deterministic linear wizard with progress feedback:

```
[ ← Back ]                          Step 1 of 6                          [ Close ✕ ]
[=========================---------------------------------------------------------] Progress Bar
```

* **Back Navigation (`←`)**: Steps backward through previous steps without losing entered form state.
* **Close / Cancel (`✕`)**: Displays a confirmation prompt: *"Are you sure you want to quit? Your progress will be saved in your draft."*
* **Forward Action**:
  * Bottom floating bar with a prominent rounded-full button: `Continue` (disabled if required field is empty).
  * Auto-advance on item selection (e.g. clicking an autocomplete address row automatically advances to the next step).

---

## 4. Trip Redirection & Deep Linking Patterns

When navigating from search results into trip details and checkout, BlaBlaCar preserves search state using URL parameters:

```
/trip?id=KpmVENEvSDaFUCjblX39yweGeSgw9MT4-spC6nJx-L6A
  &requested_seats=1
  &search_origin=SEARCH
  &search_uuid=2a999510-d12f-4836-8550-28db957dfdcb
  &jrny_stp=OUTBOUND
  &return_redirection_url=%2Fsearch%3Ffn%3DBengaluru...
```

* **`return_redirection_url`**: Allows the user to click `< Back to search results` and land on their exact previous search page with applied filters, scroll position, and pagination intact.
* **`search_uuid`**: Used for analytics conversion tracking across search $\to$ click $\to$ checkout $\to$ confirmation.

---

## 5. Global Footer Sitemap Hierarchy

```
+--------------------------------------------------------------------------------------+
| Top Carpool Routes     | About BlaBlaCar       | Safety & Help        | Language/Region|
+------------------------+-----------------------+----------------------+----------------+
| Bengaluru → Mysuru     | How it works          | Help Centre          | English (India)|
| Mumbai → Pune          | About Us              | Safety Guidelines    | ₹ INR          |
| Delhi → Jaipur         | Careers               | Terms & Conditions   |                |
| Chennai → Bengaluru    | Press & Media         | Privacy Policy       |                |
| Hyderabad → Vijayawada | Sustainability & CO₂  | Cookie Policy        |                |
+--------------------------------------------------------------------------------------+
| © 2026 BlaBlaCar, All rights reserved.                                               |
+--------------------------------------------------------------------------------------+
```
