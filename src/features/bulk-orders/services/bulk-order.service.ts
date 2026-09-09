import { ApiError } from "@/lib/api/api-error";
import { bulkOrderRepository } from "../repositories/bulk-order.repository";
import { userRepository } from "@/features/users/repositories/user.repository";
import type {
  BulkOrderEnquiryResponse,
  AdminBulkOrderListItem,
  AdminBulkOrderListParams,
  AdminBulkOrderListResponse,
  BulkOrderEnquiryStatus,
} from "../types";
import type { CreateBulkOrderInput } from "../validations/bulk-order.schema";

function formatBulkOrderResponse(row: any): BulkOrderEnquiryResponse {
  return {
    id: row.uuid,
    name: row.name,
    email: row.email,
    phone: row.phone,
    companyName: row.company_name,
    productInterest: row.product_interest,
    quantity: row.quantity,
    message: row.message,
    adminComment: row.admin_comment,
    status: row.status as BulkOrderEnquiryStatus,
    isActive: row.is_active,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    createdBy: row.users_bulk_order_enquiries_created_byTousers?.uuid || null,
    updatedBy: row.users_bulk_order_enquiries_updated_byTousers?.uuid || null,
  };
}

function formatAdminBulkOrderListItem(row: any): AdminBulkOrderListItem {
  return {
    id: row.uuid,
    name: row.name,
    email: row.email,
    phone: row.phone,
    companyName: row.company_name,
    productInterest: row.product_interest,
    quantity: row.quantity,
    message: row.message,
    adminComment: row.admin_comment,
    status: row.status as BulkOrderEnquiryStatus,
    isActive: row.is_active,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export const bulkOrderService = {
  async submitBulkOrderEnquiry(
    input: CreateBulkOrderInput
  ): Promise<BulkOrderEnquiryResponse> {
    const created = await bulkOrderRepository.create(input);
    return formatBulkOrderResponse(created);
  },

  async getAdminBulkOrders(
    params: AdminBulkOrderListParams = {}
  ): Promise<AdminBulkOrderListResponse> {
    const result = await bulkOrderRepository.findAdminAll(params);

    return {
      data: result.data.map(formatAdminBulkOrderListItem),
      meta: {
        page: result.page,
        limit: result.pageSize,
        pageSize: result.pageSize,
        total: result.total,
        totalPages: Math.ceil(result.total / result.pageSize) || 1,
      },
    };
  },

  async getAdminBulkOrderByUuid(uuid: string): Promise<BulkOrderEnquiryResponse> {
    const row = await bulkOrderRepository.findByUuid(uuid);
    if (!row) {
      throw ApiError.notFound("Bulk order enquiry not found");
    }

    return formatBulkOrderResponse(row);
  },

  async updateBulkOrderStatus(
    uuid: string,
    status: BulkOrderEnquiryStatus,
    adminEmail?: string | null,
    comment?: string | null
  ): Promise<BulkOrderEnquiryResponse> {
    let adminId: bigint | null = null;
    if (adminEmail) {
      const admin = await userRepository.findByEmail(adminEmail);
      if (admin && admin.internalId) adminId = BigInt(admin.internalId);
    }

    const existing = await bulkOrderRepository.findByUuid(uuid);
    if (!existing) {
      throw ApiError.notFound("Bulk order enquiry not found");
    }

    const updated = await bulkOrderRepository.updateStatusByUuid(
      uuid,
      status,
      adminId,
      comment
    );
    if (!updated) {
      throw ApiError.notFound("Bulk order enquiry not found");
    }

    return formatBulkOrderResponse(updated);
  },
};
