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
  ".svg": "image/svg+xml",
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

async function handleFileRequest(
  request: NextRequest,
  paramsPromise: Promise<{ folder: string; filename: string }>,
  isHead = false
) {
  const { folder, filename } = await paramsPromise;

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

  // Authorization Protection: Customer Return Videos require authentication and ownership verification
  if (folder === "returns") {
    try {
      // 1. Try getPageSessionUser (covers NextAuth and cookies().get("access_token"))
      const { getPageSessionUser } = await import("@/lib/auth/require-auth");
      let currentUser = await getPageSessionUser();

      // 2. Direct fallback on NextRequest cookies and authorization header
      if (!currentUser) {
        const token =
          request.cookies.get("access_token")?.value ||
          request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
        if (token) {
          try {
            const { verifyAccessToken } = await import("@/lib/auth/jwt");
            const payload = verifyAccessToken(token);
            if (payload?.userId) {
              currentUser = {
                id: payload.userId,
                email: payload.email,
                role: payload.role || "CUSTOMER",
              };
            }
          } catch {
            // invalid token
          }
        }
      }

      if (!currentUser?.id) {
        return new NextResponse("Unauthorized", { status: 401 });
      }

      const role = currentUser.role?.toUpperCase();
      const userId = currentUser.id;

      // Admin & Staff can always review return inspection videos
      if (role !== "ADMIN" && role !== "STAFF") {
        // Customers can only view videos belonging to their own return requests
        const { db } = await import("@/lib/db/prisma");
        const userRecord = await db.user.findFirst({
          where: {
            OR: [
              { uuid: userId },
              ...(isNaN(Number(userId)) ? [] : [{ id: BigInt(userId) }]),
            ],
          },
          select: { id: true },
        });

        if (!userRecord) {
          return new NextResponse("Forbidden", { status: 403 });
        }

        const isReturnOwner = await db.return_requests.findFirst({
          where: {
            user_id: userRecord.id,
            video_url: { contains: filename },
            is_active: true,
          },
          select: { id: true },
        });

        // If the return request is not yet created (e.g. freshly uploaded during return modal filling),
        // permit access if uploaded within the last 1 hour
        if (!isReturnOwner) {
          const isFreshUpload = Date.now() - stat.mtimeMs < 60 * 60 * 1000;
          if (!isFreshUpload) {
            return new NextResponse(
              "Forbidden: You do not have permission to access this return video.",
              { status: 403 }
            );
          }
        }
      }
    } catch (authErr) {
      console.error("[Return Video Auth Error]:", authErr);
      return new NextResponse("Unauthorized", { status: 401 });
    }
  }

  const headers = new Headers({
    "Content-Type": contentType,
    "Cache-Control":
      folder === "returns"
        ? "private, max-age=3600"
        : "public, max-age=31536000, immutable",
    "Accept-Ranges": "bytes",
  });

  const range = request.headers.get("range");
  if (range) {
    const rangeMatch = /^bytes=(\d*)-(\d*)$/i.exec(range.trim());
    if (rangeMatch) {
      let start = 0;
      let end = stat.size - 1;

      if (rangeMatch[1] && rangeMatch[2]) {
        // bytes=start-end (e.g. bytes=0-1024)
        start = parseInt(rangeMatch[1], 10);
        end = parseInt(rangeMatch[2], 10);
      } else if (rangeMatch[1] && !rangeMatch[2]) {
        // bytes=start- (e.g. bytes=1024-)
        start = parseInt(rangeMatch[1], 10);
        end = stat.size - 1;
      } else if (!rangeMatch[1] && rangeMatch[2]) {
        // bytes=-suffix (e.g. bytes=-65536, requesting the tail of the file)
        const suffixLength = parseInt(rangeMatch[2], 10);
        start = Math.max(0, stat.size - suffixLength);
        end = stat.size - 1;
      }

      if (isNaN(start) || isNaN(end) || start >= stat.size || start > end) {
        return new NextResponse(null, {
          status: 416,
          headers: {
            "Content-Range": `bytes */${stat.size}`,
            "Accept-Ranges": "bytes",
          },
        });
      }

      end = Math.min(end, stat.size - 1);
      const contentLength = end - start + 1;

      headers.set("Content-Range", `bytes ${start}-${end}/${stat.size}`);
      headers.set("Content-Length", String(contentLength));

      if (isHead) {
        return new NextResponse(null, { status: 206, headers });
      }

      const stream = fs.createReadStream(filePath, { start, end });
      if (request.signal) {
        request.signal.addEventListener("abort", () => {
          stream.destroy();
        });
      }
      stream.on("error", (err: any) => {
        if (err.code !== "ERR_STREAM_PREMATURE_CLOSE") {
          console.error("[Document Stream Range Error]:", err);
        }
      });

      return new NextResponse(
        Readable.toWeb(stream) as unknown as ReadableStream,
        { status: 206, headers }
      );
    }
  }

  headers.set("Content-Length", String(stat.size));

  if (isHead) {
    return new NextResponse(null, { status: 200, headers });
  }

  const stream = fs.createReadStream(filePath);
  if (request.signal) {
    request.signal.addEventListener("abort", () => {
      stream.destroy();
    });
  }
  stream.on("error", (err: any) => {
    if (err.code !== "ERR_STREAM_PREMATURE_CLOSE") {
      console.error("[Document Stream Error]:", err);
    }
  });

  return new NextResponse(Readable.toWeb(stream) as unknown as ReadableStream, {
    status: 200,
    headers,
  });
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ folder: string; filename: string }> }
) {
  return handleFileRequest(request, params, false);
}

export async function HEAD(
  request: NextRequest,
  { params }: { params: Promise<{ folder: string; filename: string }> }
) {
  return handleFileRequest(request, params, true);
}
