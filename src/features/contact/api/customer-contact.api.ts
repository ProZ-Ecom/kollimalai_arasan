import { apiClient } from "@/lib/api/api-client";
import type { ContactMessageResponse } from "../types";
import type { CreateContactInput } from "../validations/contact.schema";

/**
 * Submit public customer contact message
 * Postman: POST /api/contact
 */
export async function submitContactMessage(
  data: CreateContactInput
): Promise<ContactMessageResponse> {
  const response = await apiClient.post<ContactMessageResponse>(
    "/api/contact",
    data
  );
  return response.data!;
}
