import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import LinkedInToken from "@/lib/models/LinkedInToken";

export async function POST() {
  try {
    await dbConnect();
    
    // In a real app, we'd filter by user/org. For now, deactivate all active tokens.
    const result = await LinkedInToken.updateMany(
      { is_active: true },
      { $set: { is_active: false } }
    );

    return NextResponse.json({ 
      success: true, 
      message: "LinkedIn disconnected successfully.",
      modifiedCount: result.modifiedCount 
    });
  } catch (error: any) {
    console.error("LinkedIn Disconnect Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
