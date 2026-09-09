import { createApiHandler } from "@/lib/api/api-handler";
import { apiSuccess } from "@/lib/api/api-response";
import { uploadService } from "@/features/uploads/services/upload.service";

export const POST = createApiHandler(
  {
    POST: async (request) => {
      const formData = await request.formData();
      const result = await uploadService.handleSingleFileUpload(formData);

      return apiSuccess(result, "File uploaded successfully");
    },
  },
  {
    method: "POST",
    requireAuth: true,
    requiredRole: ["ADMIN"],
  }
);
