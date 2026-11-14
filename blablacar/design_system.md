# BlaBlaCar India — Design System & Visual Tokens

This document specifies the exact visual design system, CSS custom properties, typography rules, color palettes, and component library used by **BlaBlaCar India** (`https://www.blablacar.in/`).

---

## 1. Color Palette & Semantic Tokens

Extracted from compiled stylesheet tokens (`index.35bacfc6957d2455.css`):

```
+-----------------------------------------------------------------------------------------+
| #00aff5        | #054752        | #708c91        | #f4f7f8        | #00a651   | #ffcc56 |
| Brand Cyan     | Dark Teal Text | Muted Slate    | Soft Canvas    | Success   | Stars   |
+-----------------------------------------------------------------------------------------+
```

### 1.1 Core Brand Colors
| Token Name | Hex Code | RGB | Tailwind Class | Semantic Usage |
| :--- | :--- | :--- | :--- | :--- |
| `--color-brand` | `#00aff5` | `rgb(0, 175, 245)` | `bg-[#00aff5]`, `text-[#00aff5]` | Primary brand color, primary CTA buttons, active radio/checkboxes, icons |
| `--color-brand-hover` | `#0098d6` | `rgb(0, 152, 214)` | `hover:bg-[#0098d6]` | Hover state for primary buttons |
| `--color-text-primary` | `#054752` | `rgb(5, 71, 82)` | `text-[#054752]` | High-contrast dark teal headings, ride titles, prices, main labels |
| `--color-text-secondary`| `#708c91` | `rgb(112, 140, 145)`| `text-[#708c91]` | Subtitles, pickup addresses, departure dates, helper captions |
| `--color-canvas-bg` | `#f4f7f8` | `rgb(244, 247, 248)`| `bg-[#f4f7f8]` | Main page background, subtle container backgrounds, input background |
| `--color-surface-card` | `#ffffff` | `rgb(255, 255, 255)`| `bg-white` | Ride cards, modals, search floating pill containers |
| `--color-border` | `#e2e8f0` | `rgb(226, 232, 240)`| `border-slate-200` | Subtle divider lines, card borders, input borders |

### 1.2 Status & Functional Accents
| Token Name | Hex Code | Tailwind Class | Semantic Usage |
| :--- | :--- | :--- | :--- |
| `--color-success` | `#00a651` / `#107046` | `text-[#00a651]`, `bg-emerald-50` | Verified ID badges, optimal price indicator, confirmed booking |
| `--color-warning` | `#ffcc56` / `#ff9800` | `text-[#ffcc56]`, `bg-amber-50` | Star ratings, driver grade badge, expensive price warning |
| `--color-danger` | `#bb1b51` / `#e53935` | `text-[#bb1b51]`, `bg-rose-50` | Form validation errors, ride cancellations, alerts |

---

## 2. Typography

BlaBlaCar uses its bespoke modern geometric sans-serif: **GT Eesti Pro Display** (with fallback to **Google Sans** or system-ui).

```css
font-family: "GT Eesti Pro Display", "Google Sans", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
```

### 2.1 Type Scale Hierarchy
| Level | Font Size | Line Height | Font Weight | CSS / Tailwind Equivalent |
| :--- | :--- | :--- | :--- | :--- |
| **Hero Title (H1)** | `36px – 44px` | `1.15` | `800` (Ultra Bold / Black) | `text-4xl font-black text-[#054752]` |
| **Page Title (H2)** | `28px – 32px` | `1.20` | `800` (Ultra Bold / Black) | `text-2xl sm:text-3xl font-black text-[#054752]` |
| **Section Header (H3)**| `20px – 24px` | `1.25` | `700` (Bold) | `text-xl font-bold text-[#054752]` |
| **Card Header / Price**| `18px – 22px` | `1.30` | `800` (Ultra Bold) | `text-lg sm:text-xl font-extrabold text-[#054752]` |
| **Body Large / Inputs**| `16px` | `1.40` | `600` (Semi-Bold) | `text-base font-semibold text-[#054752]` |
| **Body Regular** | `14px` | `1.50` | `400` / `500` (Regular/Medium) | `text-sm font-medium text-[#708c91]` |
| **Caption / Badges** | `12px` | `1.30` | `700` (Bold, Uppercase) | `text-xs font-bold uppercase tracking-wider` |

---

## 3. UI Component Library

### 3.1 Pill Button (`PillButton`)
* **Styling**: `rounded-full`, padding `14px 28px`, font size `14px`, font weight `700`.
* **Variants**:
  * **Primary**: `bg-[#00aff5] hover:bg-[#0098d6] text-white shadow-md active:scale-95 transition-all`
  * **Secondary / Outline**: `border-2 border-[#00aff5] text-[#00aff5] bg-transparent hover:bg-cyan-50`
  * **Ghost / Subdued**: `text-[#054752] hover:bg-slate-100 font-semibold`

### 3.2 Floating Search Capsule (`SearchBar`)
* **Container**: `bg-white rounded-full shadow-lg border border-slate-200 flex items-center p-2`
* **Segments**:
  * Leaving from & Going to: Input field with icon prefix, bold value, placeholder in `#708c91`.
  * Date picker: Displays formatted date e.g. `Tue, 10 Nov`.
  * Passengers: Stepper pill e.g. `1 passenger`.
  * Search Button: Circular cyan button with magnifying glass SVG icon.

### 3.3 Location Autocomplete Row
* **Container**: `flex items-center justify-between p-3.5 hover:bg-slate-50 transition-colors cursor-pointer`
* **Left Icon Circle**:
  * Recent History: `bg-cyan-100 text-[#00aff5]` with clock icon.
  * Geocoded Address: `bg-slate-100 text-[#708c91]` with location pin icon.
* **Text**: `main_text` in `#054752` bold; `secondary_text` in `#708c91` regular.
* **Right Icon**: Cyan right-chevron `>` icon.

### 3.4 Ride Result Card (`TripCard`)
* **Container**: `bg-white rounded-3xl p-5 shadow-sm hover:shadow-md border border-slate-100 transition-all cursor-pointer`
* **Itinerary Column**:
  * Departure time (e.g. `06:00`) $\to$ Origin address
  * Travel duration (e.g. `2h 15m`) with vertical dotted/line connector
  * Arrival time (e.g. `08:15`) $\to$ Destination address
* **Price Column**: Big bold price display in `#054752` (e.g. `₹350`).
* **Driver Row**:
  * 40px circular driver photo with verified checkmark badge.
  * Driver name and star rating pill (`★ 4.9`).
  * Instant booking badge (`⚡ Instant booking`) in green/cyan.

### 3.5 Timeline Stopover Component
* Vertical track (`w-0.5 bg-slate-200`) connecting circular checkpoints:
  * Origin checkpoint: Open circle (`border-4 border-[#054752]`).
  * Waypoint checkpoint: Solid small dot (`bg-[#708c91]`).
  * Destination checkpoint: Solid circle (`bg-[#054752]`).
