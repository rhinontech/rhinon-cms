import { NextResponse } from "next/server";
import { uploadToS3, INBOX_BUCKET } from "@/lib/s3";

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const extension = file.name.split(".").pop();
    const fileName = `${crypto.randomUUID()}.${extension}`;
    const key = `blogs/${fileName}`;

    await uploadToS3(INBOX_BUCKET!, key, buffer, file.type);

    const imageUrl = `/api/blogs/media/${key}`;

    return NextResponse.json({ url: imageUrl });
  } catch (error: any) {
    console.error("Upload Error:", error);
    return NextResponse.json({ error: "Failed to upload file" }, { status: 500 });
  }
}
