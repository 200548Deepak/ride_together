import { NextRequest, NextResponse } from 'next/server';

export interface LocationSuggestion {
  id: string;
  address: string;
  types: string[];
  user_history: boolean;
  precise: boolean;
  main_text: string;
  secondary_text: string;
  city?: string;
  latitude?: number;
  longitude?: number;
}

// History extracted directly from BlaBlaCar offer-seats departure HAR file
const DEFAULT_SUGGESTIONS_HISTORY: LocationSuggestion[] = [
  {
    id: 'ChIJsc1rHzcjjsRJLjyQ31LpqU',
    address: '27, 6th Cross Rd, Visveshwaraiah Layout, Vigneshwara Layout, Bagalagunte, Bengaluru, Karnataka',
    types: ['POSTAL_ADDRESS', 'PRECISE_ADDRESS', 'POINT_OF_INTEREST'],
    user_history: true,
    precise: true,
    main_text: '27, 6th Cross Rd',
    secondary_text: '27, 6th Cross Rd, Visveshwaraiah Layout, Vigneshwara Layout, Bagalagunte, Bengaluru, Karnataka',
    city: 'Bengaluru',
    latitude: 13.0475,
    longitude: 77.4984
  },
  {
    id: 'ChIJ5SJhss4wkrjsR8XFKJ1tqEVg',
    address: 'KSCA Stadium, 3CQX+22R, Alur, Bengaluru, Karnataka',
    types: ['POINT_OF_INTEREST'],
    user_history: true,
    precise: true,
    main_text: 'KSCA Stadium',
    secondary_text: '3CQX+22R, Alur, Bengaluru, Karnataka',
    city: 'Bengaluru',
    latitude: 13.0886,
    longitude: 77.4395
  },
  {
    id: 'ChIJbU60yXAWkrjsR4E9-UejD3_g',
    address: 'Bengaluru, Karnataka, India',
    types: ['TYPE_UNKNOWN'],
    user_history: true,
    precise: false,
    main_text: 'Bengaluru, Karnataka',
    secondary_text: 'India',
    city: 'Bengaluru',
    latitude: 12.9716,
    longitude: 77.5946
  },
  {
    id: 'ChIJ-T5XHT-hwrzsRbTn4wOjsiSs',
    address: 'Mysuru, Karnataka, India',
    types: ['TYPE_UNKNOWN'],
    user_history: true,
    precise: false,
    main_text: 'Mysuru, Karnataka',
    secondary_text: 'India',
    city: 'Mysuru',
    latitude: 12.2958,
    longitude: 76.6394
  }
];

// Comprehensive database of major Indian transit hubs and cities
const EXTENDED_LOCATIONS: LocationSuggestion[] = [
  {
    id: 'loc_blr_majestic',
    address: 'Majestic Bus Station, Kempegowda, Bengaluru, Karnataka 560009',
    types: ['TRANSIT_STATION', 'PRECISE_ADDRESS'],
    user_history: false,
    precise: true,
    main_text: 'Majestic Bus Station',
    secondary_text: 'Kempegowda, Bengaluru, Karnataka',
    city: 'Bengaluru',
    latitude: 12.9767,
    longitude: 77.5713
  },
  {
    id: 'loc_blr_airport',
    address: 'Kempegowda International Airport (BLR), Devanahalli, Bengaluru, Karnataka 560300',
    types: ['AIRPORT', 'PRECISE_ADDRESS'],
    user_history: false,
    precise: true,
    main_text: 'Kempegowda International Airport (BLR)',
    secondary_text: 'Devanahalli, Bengaluru, Karnataka',
    city: 'Bengaluru',
    latitude: 13.1986,
    longitude: 77.7066
  },
  {
    id: 'loc_blr_silkboard',
    address: 'Central Silk Board Junction, Hosur Road, BTM Layout, Bengaluru, Karnataka 560068',
    types: ['INTERSECTION', 'POINT_OF_INTEREST'],
    user_history: false,
    precise: true,
    main_text: 'Silk Board Junction',
    secondary_text: 'Hosur Road, Bengaluru, Karnataka',
    city: 'Bengaluru',
    latitude: 12.9174,
    longitude: 77.6238
  },
  {
    id: 'loc_blr_electronic_city',
    address: 'Electronic City Toll Plaza, Hosur Rd, Bengaluru, Karnataka 560100',
    types: ['POINT_OF_INTEREST'],
    user_history: false,
    precise: true,
    main_text: 'Electronic City Phase 1',
    secondary_text: 'Hosur Main Road, Bengaluru, Karnataka',
    city: 'Bengaluru',
    latitude: 12.8399,
    longitude: 77.6770
  },
  {
    id: 'loc_mys_suburban',
    address: 'Suburban KSRTC Bus Stand, Mother Teresa Rd, Lashkar Mohalla, Mysuru, Karnataka 570001',
    types: ['TRANSIT_STATION', 'PRECISE_ADDRESS'],
    user_history: false,
    precise: true,
    main_text: 'Suburban Bus Stand, Mysuru',
    secondary_text: 'Lashkar Mohalla, Mysuru, Karnataka',
    city: 'Mysuru',
    latitude: 12.3129,
    longitude: 76.6565
  },
  {
    id: 'loc_mys_hutagalli',
    address: 'Hootagalli Industrial Area, Hunsur Rd, Mysuru, Karnataka 570018',
    types: ['POINT_OF_INTEREST'],
    user_history: false,
    precise: true,
    main_text: 'Hootagalli Industrial Area',
    secondary_text: 'Hunsur Road, Mysuru, Karnataka',
    city: 'Mysuru',
    latitude: 12.3459,
    longitude: 76.5772
  },
  {
    id: 'loc_chn_central',
    address: 'Puratchi Thalaivar Dr. M.G. Ramachandran Central Railway Station, Kannappar Thidal, Chennai, Tamil Nadu 600003',
    types: ['TRANSIT_STATION', 'POINT_OF_INTEREST'],
    user_history: false,
    precise: true,
    main_text: 'Chennai Central Railway Station',
    secondary_text: 'Periyamet, Chennai, Tamil Nadu',
    city: 'Chennai',
    latitude: 13.0827,
    longitude: 80.2707
  },
  {
    id: 'loc_chn_koyambedu',
    address: 'Chennai Mofussil Bus Terminus (CMBT), Koyambedu, Chennai, Tamil Nadu 600107',
    types: ['TRANSIT_STATION'],
    user_history: false,
    precise: true,
    main_text: 'Koyambedu CMBT Bus Stand',
    secondary_text: 'Koyambedu, Chennai, Tamil Nadu',
    city: 'Chennai',
    latitude: 13.0674,
    longitude: 80.2057
  },
  {
    id: 'loc_hyd_jubilee',
    address: 'Jubilee Hills Check Post, Road No. 36, Jubilee Hills, Hyderabad, Telangana 500033',
    types: ['POINT_OF_INTEREST'],
    user_history: false,
    precise: true,
    main_text: 'Jubilee Hills Check Post',
    secondary_text: 'Road No. 36, Hyderabad, Telangana',
    city: 'Hyderabad',
    latitude: 17.4319,
    longitude: 78.4073
  },
  {
    id: 'loc_hyd_secunderabad',
    address: 'Secunderabad Junction Railway Station, Station Rd, Secunderabad, Telangana 500003',
    types: ['TRANSIT_STATION'],
    user_history: false,
    precise: true,
    main_text: 'Secunderabad Junction',
    secondary_text: 'Secunderabad, Telangana',
    city: 'Hyderabad',
    latitude: 17.4334,
    longitude: 78.5042
  },
  {
    id: 'loc_pun_shivajinagar',
    address: 'Shivajinagar Bus Station, Narveer Tanaji Wadi, Shivajinagar, Pune, Maharashtra 411005',
    types: ['TRANSIT_STATION'],
    user_history: false,
    precise: true,
    main_text: 'Shivajinagar Bus Stand',
    secondary_text: 'Shivajinagar, Pune, Maharashtra',
    city: 'Pune',
    latitude: 18.5308,
    longitude: 73.8474
  },
  {
    id: 'loc_mum_dadar',
    address: 'Dadar TT Circle, Dadar East, Mumbai, Maharashtra 400014',
    types: ['POINT_OF_INTEREST'],
    user_history: false,
    precise: true,
    main_text: 'Dadar TT Circle',
    secondary_text: 'Dadar East, Mumbai, Maharashtra',
    city: 'Mumbai',
    latitude: 19.0178,
    longitude: 72.8478
  },
  {
    id: 'loc_del_kashmere',
    address: 'Maharana Pratap Inter State Bus Terminus (ISBT), Kashmere Gate, New Delhi, Delhi 110006',
    types: ['TRANSIT_STATION'],
    user_history: false,
    precise: true,
    main_text: 'Kashmere Gate ISBT',
    secondary_text: 'Kashmere Gate, New Delhi, Delhi',
    city: 'Delhi',
    latitude: 28.6675,
    longitude: 77.2285
  },
  {
    id: 'loc_cbe_gandhipuram',
    address: 'Gandhipuram Central Bus Stand, Cross Cut Rd, Gandhipuram, Coimbatore, Tamil Nadu 641012',
    types: ['TRANSIT_STATION'],
    user_history: false,
    precise: true,
    main_text: 'Gandhipuram Central Bus Stand',
    secondary_text: 'Gandhipuram, Coimbatore, Tamil Nadu',
    city: 'Coimbatore',
    latitude: 11.0183,
    longitude: 76.9644
  }
];

/**
 * GET /api/location/suggestions
 * Mirrors BlaBlaCar's edge suggestion endpoint:
 * https://edge.blablacar.in/location/suggestions?query=...
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const query = searchParams.get('query')?.trim().toLowerCase() || '';

  // 1. If query is empty, return the user's recent departure history from HAR
  if (!query) {
    return NextResponse.json(DEFAULT_SUGGESTIONS_HISTORY);
  }

  // 2. Filter history and extended database matching the search term
  const allAvailable = [...DEFAULT_SUGGESTIONS_HISTORY, ...EXTENDED_LOCATIONS];
  
  const matches = allAvailable.filter(item => {
    const main = item.main_text.toLowerCase();
    const secondary = item.secondary_text.toLowerCase();
    const address = item.address.toLowerCase();
    const city = (item.city || '').toLowerCase();

    return (
      main.includes(query) ||
      secondary.includes(query) ||
      address.includes(query) ||
      city.includes(query)
    );
  });

  // Deduplicate by ID
  const seenIds = new Set<string>();
  const deduplicated: LocationSuggestion[] = [];

  for (const m of matches) {
    if (!seenIds.has(m.id)) {
      seenIds.add(m.id);
      deduplicated.push(m);
    }
  }

  // If no predefined match, synthesize a high-quality suggestion from the query
  if (deduplicated.length === 0) {
    const capitalized = query.charAt(0).toUpperCase() + query.slice(1);
    deduplicated.push({
      id: `custom_${encodeURIComponent(query)}`,
      address: `${capitalized}, Karnataka, India`,
      types: ['POSTAL_ADDRESS'],
      user_history: false,
      precise: true,
      main_text: capitalized,
      secondary_text: 'India',
      city: capitalized,
      latitude: 12.9716,
      longitude: 77.5946
    });
  }

  return NextResponse.json(deduplicated);
}

