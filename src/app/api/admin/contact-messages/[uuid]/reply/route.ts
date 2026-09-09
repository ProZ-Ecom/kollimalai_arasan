import { createApiHandler } from "@/lib/api/api-handler";
import { apiSuccess } from "@/lib/api/api-response";
import { ApiError } from "@/lib/api/api-error";
import { contactService } from "@/features/contact/services/contact.service";
import {
  contactUuidParamSchema,
  replyContactSchema,
  type ReplyContactInput,
} from "@/features/contact/validations/contact.schema";

export const POST = createApiHandler(
  {
    POST: async (_request, context) => {
      const rawUuid = context.params?.uuid;
      const parsedParam = contactUuidParamSchema.safeParse({ uuid: rawUuid });
      if (!parsedParam.success) {
        throw ApiError.badRequest("Invalid Contact Message UUID format");
      }

      const body = context.body as ReplyContactInput;
      const adminEmail = context.session?.user?.email;

      const result = await contactService.replyContactMessage(
        parsedParam.data.uuid,
        body.message,
        adminEmail
      );

      return apiSuccess(result, "Reply sent successfully", 200);
    },
  },
  {
    requireAuth: true,
    requiredRole: ["ADMIN"],
    bodySchema: replyContactSchema,
  }
);
