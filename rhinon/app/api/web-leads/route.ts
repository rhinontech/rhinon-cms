import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Lead from "@/lib/models/Lead";

export async function POST(req: Request) {
  try {
    await dbConnect();
    const body = await req.json();

    // Map incoming body from rhinonlabs to rhinon CMS Lead schema
    const leadData = {
      name: body.name || "Unknown",
      email: body.email,
      company: body.company || "N/A",
      source: "Website",
      status: "New",
      addedAt: new Date(),
      metadata: body.metadata || {}
    };

    const lead = await Lead.create(leadData);
    
    return NextResponse.json({ 
        success: true, 
        message: "Lead captured successfully", 
        leadId: lead._id 
    }, { 
        status: 201,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With, Accept',
        },
    });
  } catch (error: any) {
    console.error("Web Lead Capture Error:", error);
    return NextResponse.json({ error: error.message }, { 
      status: 500,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With, Accept',
      },
    });
  }
}

// Allow CORS for the public endpoint
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With, Accept',
      'Access-Control-Max-Age': '86400',
    },
  });
}
