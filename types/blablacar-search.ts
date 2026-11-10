/**
 * BlaBlaCar Search API Schema Definitions
 * Reverse engineered from BlaBlaCar Network Capture and Production Client Bundles
 */

export type SupplyType = 'CARPOOLING' | 'BUS' | 'ALL';
export type SearchOrigin = 'HOME' | 'SEARCH_FORM' | 'SEARCH_RESULTS';

export interface SearchQueryRequest {
  /** Departure City / Origin Name (e.g. "Bengaluru, Karnataka, India") */
  fn?: string;
  /** Arrival City / Destination Name (e.g. "Mysore, Karnataka, India") */
  tn?: string;
  /** Departure Date in YYYY-MM-DD format (e.g. "2026-11-09") */
  db?: string;
  /** Departure Date alias in trip/search/v9 format */
  departure_date?: string;
  /** Number of requested seats (default: 1) */
  seats?: number | string;
  requested_seats?: number;
  /** Search origin trigger */
  search_origin?: SearchOrigin;
  /** Transport mode */
  transport_type?: SupplyType;
  supply?: SupplyType;
  /** Encoded Place IDs */
  from_place_id?: string;
  to_place_id?: string;
  /** Origin coordinates */
  from_lat?: number;
  from_lng?: number;
  /** Destination coordinates */
  to_lat?: number;
  to_lng?: number;

  /** Sorting options: 'dep_time:asc' | 'price:asc' | 'dep_dist:asc' | 'arr_dist:asc' | 'duration:asc' */
  sort?: 'dep_time:asc' | 'price:asc' | 'dep_dist:asc' | 'arr_dist:asc' | 'duration:asc';

  /** Amenity & Trust Filters */
  verified_id?: boolean | string;
  auto_approve?: boolean | string;
  '2_max_back'?: boolean | string;
  two_max_back?: boolean | string;
  ac?: boolean | string;
  power?: boolean | string;
  smokers?: boolean | string;
  pets?: boolean | string;

  /** Pagination cursor */
  cursor?: string;
}

export interface PlaceIdPayload {
  i: string; // Google Place ID, e.g. "ChIJbU60yXAWxrjsR4E9-UejD3_g"
  p: number;
  v: number;
  t: number[];
}

export interface TokenizedPrice {
  type: 'CURRENCY' | 'INTEGER' | 'FRACTION';
  value: string;
}

export interface Amenity {
  id: 'AUTOMATIC_APPROVAL' | 'TWO_MAX_IN_THE_BACK' | 'AIR_CONDITIONING' | 'POWER_OUTLETS' | 'SMOKERS_ALLOWED' | 'PETS_ALLOWED' | string;
  label: string;
}

export interface Coordinates {
  latitude: number;
  longitude: number;
}

export interface LocationPoint {
  primaryLocation: string;
  secondaryLocation?: string;
  time: string; // HH:mm (e.g. "20:20")
  coordinates: Coordinates;
}

export interface DriverProfile {
  type: 'DRIVER';
  name: string;
  avatar: string;
  status: {
    type: 'VERIFIED' | 'UNVERIFIED';
  };
  rating: string; // e.g. "4.9"
}

export interface TripSearchItem {
  type: 'TRIP';
  id: string; // e.g. "TRIP_0"
  multimodalId: {
    source: 'CARPOOLING' | 'BUS';
    id: string; // unique hash id, e.g. "M2H8MPaRSPWtAxUaaKtKdwRYo4G9TJSrW5s6bS884iyg"
    pro_partner_id?: string | null;
  };
  action: {
    type: 'OPEN_RIDE_DETAILS';
    parameters: {
      searchUuid: string;
      multimodalId: {
        source: 'CARPOOLING' | 'BUS';
        id: string;
        pro_partner_id?: string | null;
      };
      outboundMultimodalId?: string;
      outboundFareClassCode?: string;
      passengers: {
        type: 'NUMBER_OF_SEATS';
        value: number;
      };
      searchOrigin: string;
    };
    tracking: {
      gtm: {
        price: string;
        departure_date: string;
        arrival_city: string;
        departure_city: string;
        event: 'select_trip';
      };
      tracktor: {
        name: 'search_result_choice';
        data: {
          multimodal_source: 'CARPOOLING';
          multimodal_pro_partner_id: null | string;
          multimodal_trip_id: string;
          choice_type: 'TRIP_LIST';
          uuid: string;
        };
      };
    };
  };
  travelDetails: {
    itinerary: {
      departure: LocationPoint;
      arrival: LocationPoint;
      hasConnection: boolean;
      isOvernight: boolean;
      totalDuration: {
        label: string; // e.g. "2h00"
        a11yLabel: string; // "Total ride duration"
      };
      dayDelta?: {
        label: string; // e.g. "+1"
        a11yLabel: string;
      };
    };
    amenities: Amenity[];
    provider: {
      supply: {
        type: 'CARPOOL';
        a11yLabel: 'Carpool';
      };
      profiles: DriverProfile[];
      extraProvidersLabel?: string;
      connections?: unknown;
    };
  };
  price: {
    prefix?: string;
    tokenizedPrice: TokenizedPrice[];
    discount?: unknown;
    additionalInfo?: unknown;
  };
  scarcity?: {
    label: string;
  };
}

export interface SummaryHeaderItem {
  type: 'SUMMARY_HEADER';
  id: string;
  date: string; // e.g. "Today" or "Tomorrow" or "Mon 9 Nov"
  departure: string;
  arrival: string;
  numberOfResults: string; // e.g. "11 rides available"
}

export type SearchItem = SummaryHeaderItem | TripSearchItem;

export interface FacetOption {
  label: string;
  selected: boolean;
  applicable: boolean;
  queryParam: {
    key: string;
    value: string;
  };
  icon?: string;
  disabled?: boolean;
  tripsCount?: number;
}

export interface FacetGroup {
  type: 'SINGLE_CHOICE' | 'MULTIPLE_CHOICE';
  applicable: boolean;
  title: string;
  facets: FacetOption[];
  showMore?: boolean;
}

export interface Facets {
  type: 'DETAILS';
  title: 'Filter';
  isFiltered: boolean;
  tripCounts: Array<{
    supply: SupplyType;
    count: number;
    a11yLabel: string;
  }>;
  groups: FacetGroup[];
  dataTransparencyLabel: string;
  applyAction: {
    label: 'Filter';
    tracking: {
      gtm?: unknown;
      tracktor: {
        name: 'search_filter_apply';
        data?: unknown;
      };
    };
  };
  clearAction: {
    label: 'Clear all';
    tracking: {
      gtm?: unknown;
      tracktor: {
        name: 'remove_all_filters';
        data?: unknown;
      };
    };
  };
}

export interface TabOption {
  label: string;
  supply: 'ALL' | 'CARPOOLING' | 'BUS';
  count: number;
}

export interface BlaBlaCarSearchResponse {
  searchUUID: string;
  facets: Facets;
  tabs: TabOption[];
  resultsContent: {
    type: 'RESULTS';
    resultsDatetime: string;
    searchItems: SearchItem[];
    pagination: {
      nextPageCursor?: string | null;
    };
    openMapAction?: {
      label: string;
      tracking: unknown;
    };
  };
  tracking: {
    onLoad: {
      braze: {
        name: 'Search results';
        data: Record<string, unknown>;
      };
    };
  };
}

