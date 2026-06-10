import { NextResponse } from "next/server";
import { requireAuth } from "@/server/auth";
import { IMAGEKIT } from "@/lib/constants";

export async function POST(request: Request) {
  try {
    await requireAuth();

    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    if (file.size > IMAGEKIT.MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: "File size exceeds 5MB limit" },
        { status: 400 },
      );
    }

    if (!IMAGEKIT.ACCEPTED_IMAGE_TYPES.includes(file.type as typeof IMAGEKIT.ACCEPTED_IMAGE_TYPES[number])) {
      return NextResponse.json(
        { error: "File type not supported" },
        { status: 400 },
      );
    }

    const imageKitFormData = new FormData();
    imageKitFormData.append("file", file);
    imageKitFormData.append("fileName", file.name);
    imageKitFormData.append("useUniqueFileName", "true");

    const folder = (formData.get("folder") as string) || IMAGEKIT.DEFAULT_FOLDER;
    imageKitFormData.append("folder", folder);

    const response = await fetch(
      `https://upload.imagekit.io/api/v1/files/upload`,
      {
        method: "POST",
        headers: {
          Authorization: `Basic ${Buffer.from(
            `${process.env.IMAGEKIT_PRIVATE_KEY}:`,
          ).toString("base64")}`,
        },
        body: imageKitFormData,
      },
    );

    if (!response.ok) {
      const error = await response.json();
      console.error("ImageKit upload error:", error);
      return NextResponse.json(
        { error: "Failed to upload file" },
        { status: 500 },
      );
    }

    const result = await response.json();

    return NextResponse.json({
      url: result.url,
      fileId: result.fileId,
      thumbnailUrl: result.thumbnailUrl,
      filePath: result.filePath,
      name: result.name,
      size: result.size,
      mimeType: result.mimeType,
    });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
