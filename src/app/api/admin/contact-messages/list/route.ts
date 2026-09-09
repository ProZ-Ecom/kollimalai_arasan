import { createApiHandler } from "@/lib/api/api-handler";
import { apiSuccess } from "@/lib/api/api-response";
import { contactService } from "@/features/contact/services/contact.service";
import {
  adminContactListSchema,
  type AdminContactListInput,
} from "@/features/contact/validations/contact.schema";

export const POST = createApiHandler(
  {
    POST: async (_request, context) => {
      const body = (context.body || {}) as AdminContactListInput;
      const result = await contactService.getAdminContactMessages(body);

      return apiSuccess(
        result.data,
        "Contact messages fetched successfully",
        200,
        result.meta
      );
    },
  },
  {
    requireAuth: true,
    requiredRole: ["ADMIN"],
    bodySchema: adminContactListSchema,
  }
);
