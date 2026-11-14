import { NextRequest, NextResponse } from 'next/server';
import { createUser, findUserByEmail } from '@/lib/userStore';
import { signAccessToken, signRefreshToken } from '@/lib/jwt';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, email, password, role, phone } = body;

    if (!name || !email || !password) {
      return NextResponse.json(
        { success: false, error: 'Name, email, and password are required.' },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { success: false, error: 'Password must be at least 8 characters long.' },
        { status: 400 }
      );
    }

    const existing = findUserByEmail(email);
    if (existing) {
      return NextResponse.json(
        { success: false, error: 'An account with this email address already exists. Please log in.' },
        { status: 409 }
      );
    }

    const newUser = await createUser({
      name,
      email,
      password,
      role: role === 'driver' ? 'driver' : 'passenger',
      phone
    });

    const tokenPayload = {
      userId: newUser.id,
      email: newUser.email,
      name: newUser.name,
      role: newUser.role
    };

    const accessToken = signAccessToken(tokenPayload);
    const refreshToken = signRefreshToken(tokenPayload);

    const safeUser = {
      id: newUser.id,
      name: newUser.name,
      email: newUser.email,
      role: newUser.role,
      phone: newUser.phone,
      rating: newUser.rating,
      ratings_count: newUser.ratings_count,
      grade: newUser.grade,
      id_verified: newUser.id_verified,
      avatar_url: newUser.avatar_url,
      created_at: newUser.created_at
    };

    const response = NextResponse.json({
      success: true,
      message: 'Registration successful.',
      user: safeUser,
      token: accessToken,
      refreshToken
    });

    // Set secure auth cookie
    response.cookies.set('auth_token', accessToken, {
      httpOnly: false, // Accessible to client scripts if needed
      path: '/',
      maxAge: 7 * 24 * 60 * 60,
      sameSite: 'lax'
    });

    return response;
  } catch (error: any) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error during registration.' },
      { status: 500 }
    );
  }
}
