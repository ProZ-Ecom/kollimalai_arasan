import { apiClient } from "@/lib/api/api-client";
import type {
  AdminContactMessageListParams,
  AdminContactMessageListResponse,
  AdminContactMessageListItem,
  ContactMessageResponse,
  ContactMessageStatus,
} from "../types";
import type {
  AdminContactListInput,
  UpdateContactStatusInput,
  ReplyContactInput,
} from "../validations/contact.schema";

/**
 * Fetch paginated list of contact messages for admin
 * Postman: POST /api/admin/contact-messages/list
 */
export async function getAdminContactMessages(
  params?: Partial<AdminContactListInput>
): Promise<AdminContactMessageListResponse> {
  const response = await apiClient.post<AdminContactMessageListItem[]>(
    "/api/admin/contact-messages/list",
    params ?? {
      page: 1,
      pageSize: 20,
      sortBy: "createdAt",
      sortOrder: "desc",
    }
  );

  return {
    data: response.data ?? [],
    meta: (response.meta as AdminContactMessageListResponse["meta"]) ?? {
      page: params?.page ?? 1,
      limit: params?.pageSize ?? 20,
      pageSize: params?.pageSize ?? 20,
      total: response.data?.length ?? 0,
      totalPages: 1,
    },
  };
}

/**
 * Fetch single contact message detail (transitions "new" -> "read")
 * Postman: GET /api/admin/contact-messages/:uuid
 */
export async function getAdminContactMessageDetail(
  uuid: string
): Promise<ContactMessageResponse> {
  const cleanUuid = uuid.trim();
  const response = await apiClient.get<ContactMessageResponse>(
    `/api/admin/contact-messages/${encodeURIComponent(cleanUuid)}`
  );

  return response.data;
}

/**
 * Update contact message status ("new" | "read" | "replied")
 * Postman: PUT /api/admin/contact-messages/:uuid/status
 */
export async function updateContactMessageStatus(
  uuid: string,
  status: ContactMessageStatus
): Promise<ContactMessageResponse> {
  const cleanUuid = uuid.trim();
  const response = await apiClient.put<ContactMessageResponse>(
    `/api/admin/contact-messages/${encodeURIComponent(cleanUuid)}/status`,
    { status }
  );

  return response.data;
}

/**
 * Send email reply to customer contact message (sets status to "replied")
 * Postman: POST /api/admin/contact-messages/:uuid/reply
 */
export async function replyContactMessage(
  uuid: string,
  message: string
): Promise<ContactMessageResponse> {
  const cleanUuid = uuid.trim();
  const response = await apiClient.post<ContactMessageResponse>(
    `/api/admin/contact-messages/${encodeURIComponent(cleanUuid)}/reply`,
    { message }
  );

  return response.data;
}
