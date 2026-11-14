# BlaBlaCar India (`https://www.blablacar.in/`) Reverse Engineering Analysis

This repository contains the complete reverse engineering mapping of **BlaBlaCar India**, extracted and synthesized using **REA (Reverse Engineer Anything v6.8.0)**, Chrome DevTools Protocol network traces, Webpack AST source reconstruction, and HTTP Archive (HAR) analysis.

---

## 📁 Repository Directory Structure

```
blablacar/
├── README.md                 # Executive summary, methodology, and catalog index
├── content.md                # Full content inventory: copywriting, value props, FAQs, slogans
├── structure.md              # DOM layout, page hierarchy, route tree, SSR state hydrations
├── features.md               # Complete functional feature matrix and business logic
├── navigation.md             # Navigation architecture: header, mobile drawers, wizard steppers, footer
├── design_system.md          # Visual tokens: colors, typography (GT Eesti Pro), component library
├── api_endpoints.md          # Comprehensive edge API catalog, request/response schemas, parameters
├── backend.md                # Infrastructure architecture: edge gateways, microservices, session auth, RUM
└── hax/                      # Raw HTTP Archive eXchange (.hax & .json) endpoint traces
    ├── 01_GET_location_suggestions.hax
    ├── 01_GET_location_suggestions.json
    ├── 02_GET_notification_count_v4.hax
    ├── 02_GET_notification_count_v4.json
    ├── 03_POST_publication_flow_v10.hax
    ├── 03_POST_publication_flow_v10.json
    ├── 04_GET_driver_grade.hax
    ├── 04_GET_driver_grade.json
    ├── 05_POST_booking_v12.hax
    ├── 05_POST_booking_v12.json
    ├── 06_GET_trip_search_v9.hax
    ├── 06_GET_trip_search_v9.json
    ├── 07_GET_trip_details_v3.hax
    ├── 07_GET_trip_details_v3.json
    ├── 08_GET_booking_checkout.hax
    ├── 08_GET_booking_checkout.json
    ├── 09_GET_web_manifest.hax
    ├── 09_GET_web_manifest.json
    ├── 10_POST_telemetry_metrics.hax
    ├── 10_POST_telemetry_metrics.json
    ├── 11_POST_tracking_events.hax
    ├── 11_POST_tracking_events.json
    ├── 12_POST_braze_crm.hax
    ├── 12_POST_braze_crm.json
    ├── all_endpoints.hax     # Full aggregated HTTP Archive 1.2 bundle (.hax)
    └── all_endpoints.har     # Standard HAR 1.2 for import into Charles/Postman/DevTools
```

---

## 🔎 Analysis Methodology with REA

1. **Network & Protocol Analysis**:
   - Inspected live HTTP traffic using REA's `inspect_web_network_capture` and `environment-build` pipelines across 5 comprehensive production captures.
   - Decoded 169 unique network interactions, isolating edge gateway endpoints (`https://edge.blablacar.in/`), CDN asset distribution pipelines (`https://cdn.blablacar.com/`), and behavioral telemetry (`https://telemetry.prod.blabla.tech/`, `https://t.blablacar.com/`).

2. **Frontend Architecture Reconstruction**:
   - Decoded the SSR state container (`window["__INFRASTRUCTURE__cache"]`, `window["__INFRASTRUCTURE__render"]`, `window["__INFRASTRUCTURE__authentication"]`).
   - Mapped the client hydration lifecycle combining **Redux**, **TanStack Query (React Query)**, and **Loadable Components**.

3. **Design System & Typography**:
   - Decompiled minified production stylesheets (`index.35bacfc6957d2455.css`, `search-results-page.cf15dd4b09b13c34.chunk.css`, etc.).
   - Mapped 1,100+ design tokens, exact hex/rgb values, and custom web fonts (`GT Eesti Pro Display`).

---

## ⚡ Core Insights & Key Metrics

* **Primary Color**: `#00aff5` (BlaBlaCar Cyan / Blue)
* **Primary Deep Text**: `#054752` (BlaBlaCar Dark Teal)
* **Muted Text**: `#708c91` (Slate Gray)
* **Background Canvas**: `#f4f7f8` / `#ffffff`
* **Primary Font**: `GT Eesti Pro Display` (Fallbacks: `Google Sans`, `-apple-system`, `sans-serif`)
* **API Gateway Host**: `https://edge.blablacar.in`
* **Session Auth**: JWT Bearer Tokens with automated refresh cycle via cookies

