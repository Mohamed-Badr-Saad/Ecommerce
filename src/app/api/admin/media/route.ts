import { z } from "zod";

import { mediaMetadataSchema } from "@/lib/admin-content";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getSupabaseAdminClient, supabaseStorageBucket } from "@/lib/supabase-admin";

const allowedTypes = new Map([
  ["image/jpeg", "jpg"], ["image/png", "png"], ["image/webp", "webp"],
  ["image/gif", "gif"], ["image/avif", "avif"],
]);
const maxFileSize = 6 * 1024 * 1024;

const uploadRequestSchema = z.discriminatedUnion("operation", [
  z.object({
    operation: z.literal("sign"),
    files: z.array(z.object({ name: z.string().min(1).max(255), type: z.string(), size: z.number().int().positive().max(maxFileSize) })).min(1).max(6),
  }),
  z.object({
    operation: z.literal("complete"),
    files: z.array(z.object({
      path: z.string().startsWith("catalog/").max(500),
      originalName: z.string().min(1).max(255),
      mimeType: z.string(),
      size: z.number().int().positive().max(maxFileSize),
      width: z.number().int().positive().max(20_000).optional(),
      height: z.number().int().positive().max(20_000).optional(),
      altText: z.string().trim().max(255).optional(),
    })).min(1).max(6),
  }),
]);

function defaultAltText(name: string) {
  return name.replace(/\.[^.]+$/, "").replace(/[-_]+/g, " ").trim() || "Talié product image";
}

export async function POST(request: Request) {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session || session.user.banned || session.user.role !== "ADMIN" || !session.user.adminRole) {
    return Response.json({ error: "Administrator access is required." }, { status: 403 });
  }

  try {
    const parsed = uploadRequestSchema.safeParse(await request.json());
    if (!parsed.success) return Response.json({ error: "The image upload request is invalid." }, { status: 400 });
    const supabase = getSupabaseAdminClient();

    if (parsed.data.operation === "sign") {
      const now = new Date();
      const folder = `catalog/${now.getUTCFullYear()}/${String(now.getUTCMonth() + 1).padStart(2, "0")}`;
      const uploads = [];
      for (const file of parsed.data.files) {
        const extension = allowedTypes.get(file.type);
        if (!extension) return Response.json({ error: `${file.name} must be a JPG, PNG, WebP, GIF, or AVIF image.` }, { status: 400 });
        const path = `${folder}/${crypto.randomUUID()}.${extension}`;
        const { data, error } = await supabase.storage.from(supabaseStorageBucket).createSignedUploadUrl(path);
        if (error || !data?.token) throw new Error(error?.message || "Supabase did not issue an upload token.");
        uploads.push({ path, token: data.token });
      }
      return Response.json({ bucket: supabaseStorageBucket, uploads });
    }

    const uploaded = [];
    for (const file of parsed.data.files) {
      const filename = file.path.split("/").at(-1) ?? "";
      const folder = file.path.slice(0, -(filename.length + 1));
      const extension = allowedTypes.get(file.mimeType);
      if (!extension || !filename.endsWith(`.${extension}`)) return Response.json({ error: "An uploaded image has an invalid type." }, { status: 400 });

      const { data: objects, error: listError } = await supabase.storage.from(supabaseStorageBucket).list(folder, { search: filename, limit: 2 });
      const object = objects?.find((item) => item.name === filename);
      if (listError || !object) return Response.json({ error: `Supabase could not verify ${file.originalName}.` }, { status: 409 });
      if (Number(object.metadata?.size ?? file.size) !== file.size) return Response.json({ error: `The uploaded size for ${file.originalName} does not match.` }, { status: 409 });
      const storedMimeType = String(object.metadata?.mimetype ?? object.metadata?.contentType ?? file.mimeType);
      if (storedMimeType !== file.mimeType) return Response.json({ error: `The uploaded type for ${file.originalName} does not match.` }, { status: 409 });

      const { data: publicUrl } = supabase.storage.from(supabaseStorageBucket).getPublicUrl(file.path);
      const metadata = mediaMetadataSchema.parse({
        altText: file.altText || defaultAltText(file.originalName), filename, folder,
        mimeType: file.mimeType, originalName: file.originalName, size: file.size,
        uploadedBy: session.user.id, url: publicUrl.publicUrl,
      });
      uploaded.push(await prisma.media.upsert({
        where: { url: metadata.url },
        update: { altText: metadata.altText, height: file.height, width: file.width },
        create: { ...metadata, height: file.height, width: file.width },
      }));
    }

    await prisma.adminActivityLog.create({
      data: { action: "UPLOAD_MEDIA", adminId: session.user.id, details: { count: uploaded.length, mediaIds: uploaded.map((item) => item.id) }, entityType: "Media" },
    });
    return Response.json({ media: uploaded }, { status: 201 });
  } catch (error) {
    console.error("[admin-media] Upload failed", { name: error instanceof Error ? error.name : "UnknownError", message: error instanceof Error ? error.message : undefined });
    return Response.json({ error: "Image upload could not be completed. Check the Supabase Storage environment variables and try again." }, { status: 500 });
  }
}
