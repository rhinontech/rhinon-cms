import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

const secret = new TextEncoder().encode(process.env.JWT_SECRET);

export async function proxy(request: NextRequest) {
    // Only apply to /admin routes
    if (request.nextUrl.pathname.startsWith('/admin')) {
        // Exclude /admin/login from protection
        if (request.nextUrl.pathname === '/admin/login') {
            return NextResponse.next();
        }

        const token = request.cookies.get('admin_token')?.value;

        if (!token) {
            return NextResponse.redirect(new URL('/admin/login', request.url));
        }

        try {
            await jwtVerify(token, secret);
            return NextResponse.next();
        } catch (error) {
            console.error("JWT verification failed:", error)
            return NextResponse.redirect(new URL('/admin/login', request.url));
        }
    }

    return NextResponse.next();
}

export const config = {
    matcher: '/admin/:path*',
};
