import { createApiHandler } from "@/lib/api/api-handler";
import { apiSuccess } from "@/lib/api/api-response";
import { contactService } from "@/features/contact/services/contact.service";
import {
  createContactSchema,
  type CreateContactInput,
} from "@/features/contact/validations/contact.schema";

export const POST = createApiHandler(
  {
    POST: async (_request, context) => {
      const body = context.body as CreateContactInput;
      const result = await contactService.submitContactMessage(body);

      return apiSuccess(
        result,
        "Your message has been sent successfully. We will get back to you soon.",
        201
      );
    },
  },
  {
    requireAuth: false,
    bodySchema: createContactSchema,
  }
);
