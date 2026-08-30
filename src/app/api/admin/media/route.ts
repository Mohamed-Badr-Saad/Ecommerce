import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { mediaMetadataSchema } from "@/lib/admin-content";
import { prisma } from "@/lib/prisma";
import { getSupabaseAdminClient, supabaseStorageBucket } from "@/lib/supabase-admin";

const allowedTypes = new Map([
  ["image/jpeg", "jpg"],
  ["image/png", "png"],
  ["image/webp", "webp"],
  ["image/gif", "gif"],
  ["image/avif", "avif"],
]);
const maxFileSize = 6 * 1024 * 1024;

export async function POST(request: Request) {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session || session.user.banned || session.user.role !== "ADMIN" || !session.user.adminRole) {
    return NextResponse.json({ error: "Administrator access is required." }, { status: 403 });
  }

  const formData = await request.formData();
  const files = formData.getAll("files").filter((entry): entry is File => entry instanceof File);
  const requestedAltText = String(formData.get("altText") ?? "").trim();
  if (!files.length || files.length > 6) {
    return NextResponse.json({ error: "Choose between one and six images." }, { status: 400 });
  }

  const invalidFile = files.find((file) => !allowedTypes.has(file.type) || file.size <= 0 || file.size > maxFileSize);
  if (invalidFile) {
    return NextResponse.json({ error: `${invalidFile.name} must be a JPG, PNG, WebP, GIF, or AVIF image no larger than 6 MB.` }, { status: 400 });
  }

  const supabase = getSupabaseAdminClient();
  const now = new Date();
  const folder = `catalog/${now.getUTCFullYear()}/${String(now.getUTCMonth() + 1).padStart(2, "0")}`;
  const uploaded = [];

  for (const file of files) {
    const extension = allowedTypes.get(file.type)!;
    const filename = `${crypto.randomUUID()}.${extension}`;
    const path = `${folder}/${filename}`;
    const { error: uploadError } = await supabase.storage.from(supabaseStorageBucket).upload(path, await file.arrayBuffer(), {
      cacheControl: "31536000",
      contentType: file.type,
      upsert: false,
    });
    if (uploadError) {
      return NextResponse.json({ error: `Storage rejected ${file.name}: ${uploadError.message}` }, { status: 502 });
    }

    const { data: publicUrl } = supabase.storage.from(supabaseStorageBucket).getPublicUrl(path);
    const defaultAltText = file.name.replace(/\.[^.]+$/, "").replace(/[-_]+/g, " ").trim() || "Talié product image";
    try {
      const metadata = mediaMetadataSchema.parse({
        altText: requestedAltText || defaultAltText,
        filename,
        folder,
        mimeType: file.type,
        originalName: file.name,
        size: file.size,
        uploadedBy: session.user.id,
        url: publicUrl.publicUrl,
      });
      uploaded.push(await prisma.media.create({ data: metadata }));
    } catch (error) {
      await supabase.storage.from(supabaseStorageBucket).remove([path]);
      throw error;
    }
  }

  await prisma.adminActivityLog.create({
    data: {
      action: "UPLOAD_MEDIA",
      adminId: session.user.id,
      details: { count: uploaded.length, mediaIds: uploaded.map((item) => item.id) },
      entityType: "Media",
    },
  });

  return NextResponse.json({ media: uploaded }, { status: 201 });
}
