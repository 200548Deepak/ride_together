import { NextRequest, NextResponse } from 'next/server';
import { executeSearch } from '@/lib/searchService';
import { SearchQueryRequest } from '@/types/blablacar-search';

/**
 * Endpoint: /api/trip/search/v9
 * Direct replica of BlaBlaCar's edge search endpoint (edge.blablacar.in/trip/search/v9)
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;

    const query: SearchQueryRequest = {
      fn: searchParams.get('fn') || searchParams.get('from_text') || undefined,
      tn: searchParams.get('tn') || searchParams.get('to_text') || undefined,
      db: searchParams.get('db') || searchParams.get('departure_date') || undefined,
      departure_date: searchParams.get('departure_date') || searchParams.get('db') || undefined,
      seats: searchParams.get('seats') || searchParams.get('requested_seats') || 1,
      requested_seats: Number(searchParams.get('requested_seats') || searchParams.get('seats') || 1),
      search_origin: (searchParams.get('search_origin') as any) || 'HOME',
      transport_type: (searchParams.get('transport_type') as any) || 'CARPOOLING',
      from_place_id: searchParams.get('from_place_id') || undefined,
      to_place_id: searchParams.get('to_place_id') || undefined,
      sort: (searchParams.get('sort') as any) || 'dep_time:asc',
      verified_id: searchParams.get('verified_id') || undefined,
      auto_approve: searchParams.get('auto_approve') || undefined,
      '2_max_back': searchParams.get('2_max_back') || undefined,
      ac: searchParams.get('ac') || undefined,
      power: searchParams.get('power') || undefined,
      smokers: searchParams.get('smokers') || undefined,
      pets: searchParams.get('pets') || undefined
    };

    const result = await executeSearch(query);
    return NextResponse.json(result, { status: 200 });
  } catch (error: any) {
    return NextResponse.json(
      {
        type: 'technical_error',
        code: 'SEARCH_INTERNAL_ERROR',
        message: error.message || 'An unexpected error occurred.'
      },
      { status: 500 }
    );
  }
}
