import { createApiHandler } from "@/lib/api/api-handler";
import { apiSuccess } from "@/lib/api/api-response";
import { ApiError } from "@/lib/api/api-error";
import { contactService } from "@/features/contact/services/contact.service";
import {
  contactUuidParamSchema,
  updateContactStatusSchema,
  type UpdateContactStatusInput,
} from "@/features/contact/validations/contact.schema";

export const PUT = createApiHandler(
  {
    PUT: async (_request, context) => {
      const rawUuid = context.params?.uuid;
      const parsedParam = contactUuidParamSchema.safeParse({ uuid: rawUuid });
      if (!parsedParam.success) {
        throw ApiError.badRequest("Invalid Contact Message UUID format");
      }

      const body = context.body as UpdateContactStatusInput;
      const adminEmail = context.session?.user?.email;

      const result = await contactService.updateContactMessageStatus(
        parsedParam.data.uuid,
        body.status,
        adminEmail
      );

      return apiSuccess(
        result,
        "Contact message status updated successfully",
        200
      );
    },
  },
  {
    requireAuth: true,
    requiredRole: ["ADMIN"],
    bodySchema: updateContactStatusSchema,
  }
);
