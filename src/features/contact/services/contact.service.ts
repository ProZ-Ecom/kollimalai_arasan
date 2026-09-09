import { ApiError } from "@/lib/api/api-error";
import { emailService } from "@/lib/email/email.service";
import { contactRepository } from "../repositories/contact.repository";
import { userRepository } from "@/features/users/repositories/user.repository";
import type {
  ContactMessageResponse,
  AdminContactMessageListItem,
  AdminContactMessageListParams,
  AdminContactMessageListResponse,
  ContactMessageStatus,
} from "../types";
import type { CreateContactInput } from "../validations/contact.schema";

function formatContactMessageResponse(msg: any): ContactMessageResponse {
  return {
    id: msg.uuid,
    name: msg.name,
    email: msg.email,
    phone: msg.phone,
    subject: msg.subject,
    message: msg.message,
    status: msg.status as ContactMessageStatus,
    isActive: msg.is_active,
    createdAt: msg.created_at,
    updatedAt: msg.updated_at,
    createdBy: msg.users_contact_messages_created_byTousers?.uuid || null,
    updatedBy: msg.users_contact_messages_updated_byTousers?.uuid || null,
  };
}

function formatAdminContactListItem(msg: any): AdminContactMessageListItem {
  return {
    id: msg.uuid,
    name: msg.name,
    email: msg.email,
    phone: msg.phone,
    subject: msg.subject,
    message: msg.message,
    status: msg.status as ContactMessageStatus,
    isActive: msg.is_active,
    createdAt: msg.created_at,
    updatedAt: msg.updated_at,
  };
}

export const contactService = {
  async submitContactMessage(
    input: CreateContactInput
  ): Promise<ContactMessageResponse> {
    const created = await contactRepository.create(input);

    // Send auto-acknowledgement email (non-blocking failure tolerance)
    try {
      await emailService.sendContactAcknowledgementEmail(
        input.email,
        input.name,
        input.subject
      );
    } catch (err) {
      console.error("[CONTACT SERVICE] Failed to send auto acknowledgement email:", err);
    }

    return formatContactMessageResponse(created);
  },

  async getAdminContactMessages(
    params: AdminContactMessageListParams = {}
  ): Promise<AdminContactMessageListResponse> {
    const result = await contactRepository.findAdminAll(params);

    return {
      data: result.data.map(formatAdminContactListItem),
      meta: {
        page: result.page,
        limit: result.pageSize,
        pageSize: result.pageSize,
        total: result.total,
        totalPages: Math.ceil(result.total / result.pageSize) || 1,
      },
    };
  },

  async getAdminContactMessageByUuid(
    uuid: string
  ): Promise<ContactMessageResponse> {
    const message = await contactRepository.findByUuid(uuid);
    if (!message) {
      throw ApiError.notFound("Contact message not found");
    }

    // Automatically transition from "new" to "read" upon opening
    if (message.status === "new") {
      const updated = await contactRepository.updateStatusByUuid(uuid, "read");
      return formatContactMessageResponse(updated || message);
    }

    return formatContactMessageResponse(message);
  },

  async updateContactMessageStatus(
    uuid: string,
    status: ContactMessageStatus,
    adminEmail?: string | null
  ): Promise<ContactMessageResponse> {
    let adminId: bigint | null = null;
    if (adminEmail) {
      const admin = await userRepository.findByEmail(adminEmail);
      if (admin && admin.internalId) adminId = BigInt(admin.internalId);
    }

    const existing = await contactRepository.findByUuid(uuid);
    if (!existing) {
      throw ApiError.notFound("Contact message not found");
    }

    const updated = await contactRepository.updateStatusByUuid(uuid, status, adminId);
    if (!updated) {
      throw ApiError.notFound("Contact message not found");
    }

    return formatContactMessageResponse(updated);
  },

  async replyContactMessage(
    uuid: string,
    replyMessage: string,
    adminEmail?: string | null
  ): Promise<ContactMessageResponse> {
    const existing = await contactRepository.findByUuid(uuid);
    if (!existing) {
      throw ApiError.notFound("Contact message not found");
    }

    let adminId: bigint | null = null;
    if (adminEmail) {
      const admin = await userRepository.findByEmail(adminEmail);
      if (admin && admin.internalId) adminId = BigInt(admin.internalId);
    }

    // Send reply email to customer
    const emailSent = await emailService.sendContactReplyEmail(
      existing.email,
      existing.name,
      existing.subject,
      replyMessage
    );

    if (!emailSent) {
      console.warn("[CONTACT SERVICE] Email delivery reported false or SMTP not configured.");
    }

    const updated = await contactRepository.replyByUuid(uuid, adminId);
    if (!updated) {
      throw ApiError.notFound("Contact message not found");
    }

    return formatContactMessageResponse(updated);
  },
};
