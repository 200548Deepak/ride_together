import { NextRequest, NextResponse } from 'next/server';
import { getAuthUserFromRequest } from '@/lib/jwt';
import { findUserById } from '@/lib/userStore';

export async function GET(req: NextRequest) {
  try {
    const auth = getAuthUserFromRequest(req);
    if (!auth) {
      return NextResponse.json({
        grade: 'NEWCOMER',
        driver_score: 50,
        rating: 5.0,
        ratings_count: 0,
        total_rides_shared: 0,
        member_since: new Date().toISOString(),
        verifications: {
          id_document: false,
          phone: false,
          email: false
        }
      });
    }

    const user = findUserById(auth.userId);

    return NextResponse.json({
      grade: (user?.grade || 'AMBASSADOR').toUpperCase(),
      driver_score: 98,
      rating: user?.rating || 4.9,
      ratings_count: user?.ratings_count || 42,
      total_rides_shared: 84,
      member_since: user?.created_at || '2024-01-15',
      verifications: {
        id_document: user?.id_verified ?? true,
        phone: user?.phone_verified ?? true,
        email: user?.email_verified ?? true
      }
    });
  } catch {
    return NextResponse.json({
      grade: 'INTERMEDIATE',
      rating: 4.8,
      ratings_count: 10
    });
  }
}
