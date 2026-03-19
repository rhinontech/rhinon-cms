import { NextResponse } from "next/server";
import { getObjectFromS3, INBOX_BUCKET } from "@/lib/s3";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ key: string[] }> }
) {
  try {
    const { key } = await params;
    const s3Key = key.join("/");

    const s3File = await getObjectFromS3(INBOX_BUCKET!, s3Key);

    if (!s3File || !s3File.Body) {
      return new NextResponse("File not found", { status: 404 });
    }

    // Convert S3 Body to a ReadableStream for Next.js response
    const stream = s3File.Body as any;

    return new NextResponse(stream, {
      headers: {
        "Content-Type": s3File.ContentType || "application/octet-stream",
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch (error) {
    console.error("Media Proxy Error:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
