import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Lead from '@/models/Lead';
import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';

const secret = new TextEncoder().encode(process.env.JWT_SECRET);

export async function POST(request: Request) {
    try {
        await dbConnect();
        const body = await request.json();

        const lead = await Lead.create(body);

        return NextResponse.json({ success: true, data: lead }, { status: 201 });
    } catch (error) {
        console.error('Error creating lead:', error);
        return NextResponse.json(
            { success: false, message: 'Failed to create lead' },
            { status: 400 }
        );
    }
}

export async function GET(request: Request) {
    try {
        // Verify authentication
        const cookieStore = await cookies();
        const token = cookieStore.get('admin_token')?.value;

        if (!token) {
            return NextResponse.json(
                { success: false, message: 'Unauthorized' },
                { status: 401 }
            );
        }

        try {
            await jwtVerify(token, secret);
        } catch (e) {
            return NextResponse.json(
                { success: false, message: 'Invalid token' },
                { status: 401 }
            );
        }

        await dbConnect();
        const leads = await Lead.find({}).sort({ createdAt: -1 });

        return NextResponse.json({ success: true, data: leads });
    } catch (error) {
        console.error('Error fetching leads:', error);
        return NextResponse.json(
            { success: false, message: 'Failed to fetch leads' },
            { status: 500 }
        );
    }
}

export async function DELETE(request: Request) {
    try {
        // Verify authentication
        const cookieStore = await cookies();
        const token = cookieStore.get('admin_token')?.value;

        if (!token) {
            return NextResponse.json(
                { success: false, message: 'Unauthorized' },
                { status: 401 }
            );
        }

        try {
            await jwtVerify(token, secret);
        } catch (e) {
            return NextResponse.json(
                { success: false, message: 'Invalid token' },
                { status: 401 }
            );
        }

        await dbConnect();

        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');

        if (!id) {
            return NextResponse.json(
                { success: false, message: 'Lead ID is required' },
                { status: 400 }
            );
        }

        const deletedLead = await Lead.findByIdAndDelete(id);

        if (!deletedLead) {
            return NextResponse.json(
                { success: false, message: 'Lead not found' },
                { status: 404 }
            );
        }

        return NextResponse.json({ success: true, message: 'Lead deleted successfully' });
    } catch (error) {
        console.error('Error deleting lead:', error);
        return NextResponse.json(
            { success: false, message: 'Failed to delete lead' },
            { status: 500 }
        );
    }
}
