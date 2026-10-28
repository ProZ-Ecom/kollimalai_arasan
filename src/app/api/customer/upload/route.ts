import { createApiHandler } from "@/lib/api/api-handler";
import { apiSuccess } from "@/lib/api/api-response";
import { ApiError } from "@/lib/api/api-error";
import {
  uploadService,
  ALLOWED_VIDEO_MIME_TYPES,
  MAX_VIDEO_FILE_SIZE,
} from "@/features/uploads/services/upload.service";

export const POST = createApiHandler(
  {
    POST: async (request, context) => {
      const sessionUserId = context.session?.user?.id;
      if (!sessionUserId) {
        throw ApiError.unauthorized("Authentication required");
      }

      const formData = await request.formData();
      const file = formData.get("file");

      if (!file || !(file instanceof File)) {
        throw ApiError.badRequest("Please select a video file to upload");
      }

      if (file.size === 0) {
        throw ApiError.badRequest("Selected video file is empty");
      }

      const mimeType = file.type.toLowerCase();
      if (!ALLOWED_VIDEO_MIME_TYPES[mimeType]) {
        throw ApiError.badRequest(
          "Invalid video format. Only MP4, MOV (QuickTime), and WebM videos are supported."
        );
      }

      if (file.size > MAX_VIDEO_FILE_SIZE) {
        throw ApiError.badRequest(
          `Video file size (${(file.size / (1024 * 1024)).toFixed(1)}MB) exceeds the maximum allowed limit of ${
            MAX_VIDEO_FILE_SIZE / (1024 * 1024)
          }MB.`
        );
      }

      // Validate actual file content header (magic bytes) to prevent disguised files
      const arrayBuffer = await file.arrayBuffer();
      const headerBuffer = Buffer.from(arrayBuffer.slice(0, 64));

      const isMp4OrMov = mimeType === "video/mp4" || mimeType === "video/quicktime";
      const isWebm = mimeType === "video/webm";

      if (isMp4OrMov) {
        // Standard MP4 / QuickTime box check
        const headerStr = headerBuffer.toString("latin1");
        const hasValidBox =
          headerStr.includes("ftyp") ||
          headerStr.includes("moov") ||
          headerStr.includes("mdat") ||
          headerStr.includes("wide");
        if (!hasValidBox) {
          throw ApiError.badRequest(
            "Corrupt or invalid video file: Missing standard MP4/MOV container signature."
          );
        }
      } else if (isWebm) {
        // WebM begins with standard EBML ID [0x1A, 0x45, 0xDF, 0xA3]
        if (
          headerBuffer.length < 4 ||
          headerBuffer[0] !== 0x1a ||
          headerBuffer[1] !== 0x45 ||
          headerBuffer[2] !== 0xdf ||
          headerBuffer[3] !== 0xa3
        ) {
          throw ApiError.badRequest(
            "Corrupt or invalid video file: Missing standard WebM container signature."
          );
        }
      }

      // Reconstruct file with verified buffer
      const verifiedFile = new File([arrayBuffer], file.name, { type: file.type });
      formData.set("file", verifiedFile);

      // Customer uploads are strictly placed in the dedicated "returns" storage folder
      formData.set("folder", "returns");

      const result = await uploadService.handleSingleFileUpload(formData);

      return apiSuccess(result, "Video uploaded successfully", 201);
    },
  },
  {
    method: "POST",
    requireAuth: true,
    requiredRole: ["CUSTOMER"],
  }
);

