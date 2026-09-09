import { createApiHandler } from "@/lib/api/api-handler";
import { apiSuccess } from "@/lib/api/api-response";
import { ApiError } from "@/lib/api/api-error";
import { contactService } from "@/features/contact/services/contact.service";
import { contactUuidParamSchema } from "@/features/contact/validations/contact.schema";

export const GET = createApiHandler(
  {
    GET: async (_request, context) => {
      const rawUuid = context.params?.uuid;
      const parsedParam = contactUuidParamSchema.safeParse({ uuid: rawUuid });
      if (!parsedParam.success) {
        throw ApiError.badRequest("Invalid Contact Message UUID format");
      }

      const result = await contactService.getAdminContactMessageByUuid(
        parsedParam.data.uuid
      );

      return apiSuccess(result, "Contact message fetched successfully", 200);
    },
  },
  {
    requireAuth: true,
    requiredRole: ["ADMIN"],
  }
);
