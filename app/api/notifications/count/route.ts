import { NextRequest, NextResponse } from 'next/server';
import { getAuthUserFromRequest } from '@/lib/jwt';
import { getSharedRidesByDriver } from '@/lib/ridesStore';

export async function GET(req: NextRequest) {
  try {
    const auth = getAuthUserFromRequest(req);
    if (!auth) {
      return NextResponse.json({
        count: 0,
        unread: false,
        timestamp: new Date().toISOString()
      });
    }

    // Find pending bookings across all rides published by this driver
    const driverRides = getSharedRidesByDriver(auth.userId, auth.email);
    let pendingCount = 0;
    driverRides.forEach(r => {
      const pending = (r.bookings || []).filter(b => b.status === 'pending' || (b.status as string) === 'PENDING_APPROVAL');
      pendingCount += pending.length;
    });

    return NextResponse.json({
      count: pendingCount,
      unread: pendingCount > 0,
      timestamp: new Date().toISOString()
    });
  } catch {
    return NextResponse.json({
      count: 0,
      unread: false,
      timestamp: new Date().toISOString()
    });
  }
}
