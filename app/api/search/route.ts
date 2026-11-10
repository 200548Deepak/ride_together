import { NextRequest, NextResponse } from 'next/server';
import { executeSearch } from '../../../lib/searchService';
import { SearchQueryRequest } from '../../../types/blablacar-search';

/**
 * Next.js App Router API Route: /api/search
 * Replicates BlaBlaCar's core ride search endpoint
 */

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;

    const query: SearchQueryRequest = {
      fn: searchParams.get('fn') || undefined,
      tn: searchParams.get('tn') || undefined,
      db: searchParams.get('db') || searchParams.get('departure_date') || undefined,
      departure_date: searchParams.get('departure_date') || searchParams.get('db') || undefined,
      seats: searchParams.get('seats') || searchParams.get('requested_seats') || 1,
      requested_seats: Number(searchParams.get('requested_seats') || searchParams.get('seats') || 1),
      search_origin: (searchParams.get('search_origin') as any) || 'HOME',
      transport_type: (searchParams.get('transport_type') as any) || 'CARPOOLING',
      supply: (searchParams.get('supply') as any) || 'CARPOOLING',
      from_place_id: searchParams.get('from_place_id') || undefined,
      to_place_id: searchParams.get('to_place_id') || undefined,
      sort: (searchParams.get('sort') as any) || 'dep_time:asc',
      verified_id: searchParams.get('verified_id') || undefined,
      auto_approve: searchParams.get('auto_approve') || undefined,
      '2_max_back': searchParams.get('2_max_back') || undefined,
      ac: searchParams.get('ac') || undefined,
      power: searchParams.get('power') || undefined,
      smokers: searchParams.get('smokers') || undefined,
      pets: searchParams.get('pets') || undefined,
      cursor: searchParams.get('cursor') || undefined,
    };

    // If query parameters pass JSON encoded object (like BlaBlaCar's internal /trip/search/v9 format)
    const rawJsonQuery = searchParams.get('q');
    if (rawJsonQuery) {
      try {
        const parsed = JSON.parse(rawJsonQuery);
        Object.assign(query, parsed);
      } catch {
        // ignore JSON parse error on 'q'
      }
    }

    const result = await executeSearch(query);
    return NextResponse.json(result, { status: 200 });
  } catch (error: any) {
    console.error('Error executing ride search:', error);
    return NextResponse.json(
      {
        type: 'technical_error',
        code: 'SEARCH_INTERNAL_ERROR',
        message: error.message || 'An unexpected error occurred while searching for rides.',
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body: SearchQueryRequest = await request.json();
    const result = await executeSearch(body);
    return NextResponse.json(result, { status: 200 });
  } catch (error: any) {
    console.error('Error executing ride search POST:', error);
    return NextResponse.json(
      {
        type: 'malformed_request',
        code: 'INVALID_JSON_BODY',
        message: error.message || 'The request body could not be parsed as valid JSON.',
      },
      { status: 400 }
    );
  }
}

