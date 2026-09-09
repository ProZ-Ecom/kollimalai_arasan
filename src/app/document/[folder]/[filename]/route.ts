import fs from "fs";
import path from "path";
import { Readable } from "stream";
import { NextRequest, NextResponse } from "next/server";
import {
  ALLOWED_FOLDERS,
  getUploadRoot,
  type AllowedFolder,
} from "@/features/uploads/services/upload.service";

const EXTENSION_MIME_TYPES: Record<string, string> = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
  ".gif": "image/gif",
  ".mp4": "video/mp4",
  ".webm": "video/webm",
  ".mov": "video/quicktime",
};

function isSafeFilename(filename: string): boolean {
  return (
    !!filename &&
    !filename.includes("..") &&
    !filename.includes("/") &&
    !filename.includes("\\")
  );
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ folder: string; filename: string }> }
) {
  const { folder, filename } = await params;

  if (
    !ALLOWED_FOLDERS.includes(folder as AllowedFolder) ||
    !isSafeFilename(filename)
  ) {
    return new NextResponse("Not found", { status: 404 });
  }

  const contentType = EXTENSION_MIME_TYPES[path.extname(filename).toLowerCase()];
  if (!contentType) {
    return new NextResponse("Not found", { status: 404 });
  }

  const folderDir = path.join(getUploadRoot(), folder);
  const filePath = path.join(folderDir, filename);

  const relative = path.relative(folderDir, filePath);
  if (relative.startsWith("..") || path.isAbsolute(relative)) {
    return new NextResponse("Not found", { status: 404 });
  }

  let stat: fs.Stats;
  try {
    stat = await fs.promises.stat(filePath);
    if (!stat.isFile()) throw new Error("not a file");
  } catch {
    return new NextResponse("Not found", { status: 404 });
  }

  const headers = new Headers({
    "Content-Type": contentType,
    "Cache-Control": "public, max-age=31536000, immutable",
    "Accept-Ranges": "bytes",
  });

  const range = request.headers.get("range");
  const rangeMatch = range ? /^bytes=(\d*)-(\d*)$/.exec(range) : null;

  if (rangeMatch) {
    const start = rangeMatch[1] ? parseInt(rangeMatch[1], 10) : 0;
    const end = rangeMatch[2] ? parseInt(rangeMatch[2], 10) : stat.size - 1;

    if (start >= 0 && end < stat.size && start <= end) {
      headers.set("Content-Range", `bytes ${start}-${end}/${stat.size}`);
      headers.set("Content-Length", String(end - start + 1));

      const stream = fs.createReadStream(filePath, { start, end });
      return new NextResponse(
        Readable.toWeb(stream) as unknown as ReadableStream,
        { status: 206, headers }
      );
    }
  }

  headers.set("Content-Length", String(stat.size));
  const stream = fs.createReadStream(filePath);

  return new NextResponse(Readable.toWeb(stream) as unknown as ReadableStream, {
    status: 200,
    headers,
  });
}
