import { NextRequest, NextResponse } from 'next/server';
import { getAuthUserFromRequest } from '@/lib/jwt';
import { findUserById } from '@/lib/userStore';

export async function GET(req: NextRequest) {
  try {
    const authPayload = getAuthUserFromRequest(req);
    if (!authPayload) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized. No valid token found.' },
        { status: 401 }
      );
    }

    const user = findUserById(authPayload.userId);
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not found.' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
        rating: user.rating,
        ratings_count: user.ratings_count,
        grade: user.grade,
        id_verified: user.id_verified,
        avatar_url: user.avatar_url,
        created_at: user.created_at
      }
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
