import { z } from "zod";
import { createApiHandler } from "@/lib/api/api-handler";
import { apiSuccess } from "@/lib/api/api-response";
import { ApiError } from "@/lib/api/api-error";
import { returnService } from "@/features/returns/services/return.service";
import { returnRepository } from "@/features/returns/repositories/return.repository";
import { customerReturnRequestSchema } from "@/features/returns/validations/return.schema";

export const POST = createApiHandler(
  {
    POST: async (_request, context) => {
      const sessionUserId = context.session?.user?.id;
      if (!sessionUserId) {
        throw ApiError.unauthorized("Authentication required");
      }

      const rawUuid = context.params?.uuid;
      if (!rawUuid) {
        throw ApiError.badRequest("Order UUID is required");
      }

      const order = await returnRepository.findOrderWithItems(rawUuid);
      if (!order) {
        throw ApiError.notFound("Order not found");
      }

      const body = (context.body || {}) as any;

      const videoUrl = body?.videoUrl ? String(body.videoUrl).trim() : "";
      if (!videoUrl) {
        throw ApiError.badRequest(
          "Product-condition video is mandatory before submitting a return request."
        );
      }

      const items =
        Array.isArray(body?.items) && body.items.length > 0
          ? body.items.map((i: any) => ({
              orderItemId: String(i.orderItemId),
              quantity: Number(i.quantity),
              reason: i.reason ? String(i.reason) : undefined,
            }))
          : order.items.map((item) => ({
              orderItemId: item.uuid || String(item.id),
              quantity: item.quantity,
              reason: body?.reason || body?.note || "Customer requested return",
            }));

      const reason =
        (body?.reason || body?.note || "Return requested by customer") as string;
      const description = body?.description
        ? String(body.description)
        : undefined;
      const refundDetails = body?.refundDetails;

      const result = await returnService.createCustomerReturnRequest(
        sessionUserId,
        {
          orderId: rawUuid,
          reason,
          description,
          videoUrl,
          refundDetails,
          items,
        }
      );

      return apiSuccess(result, "Order return requested successfully", 201);
    },
  },
  {
    requireAuth: true,
    requiredRole: ["CUSTOMER"],
    bodySchema: customerReturnRequestSchema,
  }
);
