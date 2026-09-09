import { db } from "@/lib/db/prisma";
import { ApiError } from "@/lib/api/api-error";
import { userRepository } from "@/features/users/repositories/user.repository";
import { offerService } from "@/features/offers/services/offer.service";
import { orderRepository } from "../repositories/order.repository";
import type {
  OrderDetailResponse,
  OrderListItemResponse,
  OrderListResponse,
  OrderStatusTransitionResponse,
  AdminOrdersCountResponse,
} from "../types";
import type {
  CustomerCreateOrderInput,
  CustomerOrdersQueryInput,
  CustomerOrdersListInput,
  AdminOrdersListInput,
  CancelOrderInput,
  ReturnOrderInput,
  OrderStatusTransitionInput,
} from "../validations/order.schema";
import type { orders_order_status } from "@/generated/prisma";

export const orderService = {
  async createCustomerOrder(
    sessionUserId: string,
    input: CustomerCreateOrderInput
  ): Promise<OrderDetailResponse> {
    const user = await userRepository.findById(sessionUserId);
    if (!user || !user.internalId) {
      throw ApiError.unauthorized("User not found");
    }
    if (!user.isActive || user.is_active === false) {
      throw ApiError.forbidden("Your account is inactive or blocked. Please contact support.");
    }

    const userId = user.internalId;

    // 1. Find active cart with active cart items
    const cart = await db.cart.findFirst({
      where: {
        userId,
        status: "active",
        is_active: true,
      },
      include: {
        items: {
          where: {
            is_active: true,
          },
          include: {
            product: true,
            variant_unit_price: {
              include: {
                variant: true,
              },
            },
          },
        },
      },
    });

    if (!cart || cart.items.length === 0) {
      throw ApiError.badRequest("Cart is empty or no active cart found");
    }

    // 2. Validate every cart item's product and variant unit price
    const orderItemsData: Array<{
      productId: bigint;
      variantId: bigint;
      variantUnitPriceId: bigint;
      productName: string;
      variantName: string;
      sku: string;
      quantity: number;
      unitPrice: number;
      discountAmount: number;
      taxAmount: number;
      totalPrice: number;
      itemUuid: string;
    }> = [];

    let subtotal = 0;

    for (const item of cart.items) {
      const unitPriceRow = item.variant_unit_price;
      const variant = unitPriceRow?.variant;

      if (
        !item.product ||
        !item.product.isActive ||
        item.product.deleted_at !== null ||
        !unitPriceRow ||
        !unitPriceRow.isActive ||
        unitPriceRow.deleted_at !== null ||
        !variant ||
        !variant.isActive ||
        variant.deleted_at !== null
      ) {
        throw ApiError.badRequest(
          `Product variant "${variant?.variant_name || item.product?.name || "item"}" is no longer available`
        );
      }

      // The stored base price is the only price trusted here - never a value
      // that came in with the request. Offers are applied below, once every
      // line is known, because a minimum-cart-value offer depends on the
      // subtotal of the whole cart.
      const unitPrice = Number(unitPriceRow.base_price);

      const totalPrice = unitPrice * item.quantity;
      subtotal += totalPrice;

      orderItemsData.push({
        productId: item.productId,
        variantId: variant.id,
        variantUnitPriceId: item.variantUnitPriceId!,
        productName: item.product.name,
        variantName: variant.variant_name,
        sku: unitPriceRow.sku,
        quantity: item.quantity,
        unitPrice,
        discountAmount: 0,
        taxAmount: 0,
        totalPrice,
        itemUuid: unitPriceRow.uuid,
      });
    }

    // 2b. Apply offers. This is the same engine the storefront, cart and
    // checkout quote from, so the price the customer was shown is the price
    // the order is written at.
    const pricing = await offerService.priceCartItems(
      orderItemsData.map((item) => ({
        itemId: item.itemUuid,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
      }))
    );

    for (const [index, line] of pricing.lines.entries()) {
      const orderItem = orderItemsData[index];
      orderItem.discountAmount = line.discountAmount;
      orderItem.totalPrice = line.finalLineTotal;
    }

    const offerDiscount = pricing.totalDiscount;
    subtotal = pricing.subtotal;

    // 3. Validate shipping address
    const isShippingNumeric = /^\d+$/.test(input.shippingAddressId);
    const shippingAddress = await db.customerAddress.findFirst({
      where: {
        userId,
        is_active: true,
        deleted_at: null,
        OR: [
          { uuid: input.shippingAddressId },
          ...(isShippingNumeric ? [{ id: BigInt(input.shippingAddressId) }] : []),
        ],
      },
    });

    if (!shippingAddress) {
      throw ApiError.badRequest(
        "Shipping address not found or does not belong to customer"
      );
    }

    // 4. Validate billing address if provided
    let billingAddress = shippingAddress;
    if (input.billingAddressId) {
      const isBillingNumeric = /^\d+$/.test(input.billingAddressId);
      const foundBilling = await db.customerAddress.findFirst({
        where: {
          userId,
          is_active: true,
          deleted_at: null,
          OR: [
            { uuid: input.billingAddressId },
            ...(isBillingNumeric ? [{ id: BigInt(input.billingAddressId) }] : []),
          ],
        },
      });

      if (!foundBilling) {
        throw ApiError.badRequest(
          "Billing address not found or does not belong to customer"
        );
      }

      billingAddress = foundBilling;
    }

    const paymentMethod = input.paymentMethod || "CARD";
    const isPaid = paymentMethod === "CARD" || paymentMethod === "UPI";
    const paymentStatus: "paid" | "pending" = isPaid ? "paid" : "pending";
    const orderStatus: "confirmed" | "pending" = isPaid ? "confirmed" : "pending";

    // Free delivery is judged on what the customer actually pays, after offers.
    const payableBeforeShipping = subtotal - offerDiscount;
    const shippingCharge = payableBeforeShipping >= 499 ? 0 : 49;
    const totalAmount = payableBeforeShipping + shippingCharge;

    // 5. Execute creation transaction
    return orderRepository.createCustomerOrderTransaction({
      userId,
      cartId: cart.id,
      subtotal,
      discountAmount: offerDiscount,
      shippingCharge,
      totalAmount,
      orderStatus,
      paymentStatus,
      paymentMethod,
      notes: input.notes,
      shippingAddress: {
        fullName: shippingAddress.full_name,
        phone: shippingAddress.phone,
        addressLine1: shippingAddress.address_line1,
        addressLine2: shippingAddress.address_line2,
        landmark: shippingAddress.landmark,
        city: shippingAddress.city,
        state: shippingAddress.state,
        pincode: shippingAddress.pincode ?? "",
        country: shippingAddress.country ?? "India",
        latitude: shippingAddress.latitude ? Number(shippingAddress.latitude) : null,
        longitude: shippingAddress.longitude ? Number(shippingAddress.longitude) : null,
      },
      billingAddress: {
        fullName: billingAddress.full_name,
        phone: billingAddress.phone,
        addressLine1: billingAddress.address_line1,
        addressLine2: billingAddress.address_line2,
        landmark: billingAddress.landmark,
        city: billingAddress.city,
        state: billingAddress.state,
        pincode: billingAddress.pincode ?? "",
        country: billingAddress.country ?? "India",
        latitude: billingAddress.latitude ? Number(billingAddress.latitude) : null,
        longitude: billingAddress.longitude ? Number(billingAddress.longitude) : null,
      },
      items: orderItemsData,
    });
  },

  async getCustomerOrders(
    sessionUserId: string,
    query: CustomerOrdersListInput | CustomerOrdersQueryInput = {}
  ): Promise<OrderListResponse<OrderDetailResponse>> {
    const user = await userRepository.findById(sessionUserId);
    if (!user || !user.internalId) {
      throw ApiError.unauthorized("User not found");
    }
    if (!user.isActive || user.is_active === false) {
      throw ApiError.forbidden("Your account is inactive or blocked. Please contact support.");
    }

    return orderRepository.findCustomerOrders(user.internalId, query);
  },

  async getCustomerOrderByUuid(
    sessionUserId: string,
    uuid: string
  ): Promise<OrderDetailResponse> {
    const user = await userRepository.findById(sessionUserId);
    if (!user || !user.internalId) {
      throw ApiError.unauthorized("User not found");
    }
    if (!user.isActive || user.is_active === false) {
      throw ApiError.forbidden("Your account is inactive or blocked. Please contact support.");
    }

    const order = await orderRepository.findCustomerOrderByUuid(
      user.internalId,
      uuid
    );

    if (!order) {
      throw ApiError.notFound("Order not found");
    }

    return order;
  },

  async getAdminOrders(
    query: AdminOrdersListInput
  ): Promise<OrderListResponse<OrderListItemResponse>> {
    return orderRepository.findAdminOrders(query);
  },

  async countAdminOrders(
    query: AdminOrdersListInput
  ): Promise<AdminOrdersCountResponse> {
    return orderRepository.countAdminOrders(query);
  },

  async getAdminOrderByUuid(uuid: string): Promise<OrderDetailResponse> {
    const order = await orderRepository.findAdminOrderByUuid(uuid);
    if (!order) {
      throw ApiError.notFound("Order not found");
    }
    return order;
  },

  async cancelCustomerOrder(
    sessionUserId: string,
    uuid: string,
    input?: CancelOrderInput
  ): Promise<OrderDetailResponse> {
    const user = await userRepository.findById(sessionUserId);
    if (!user || !user.internalId) {
      throw ApiError.unauthorized("User not found");
    }

    const order = await db.order.findFirst({
      where: {
        uuid,
        userId: user.internalId,
        is_active: true,
      },
    });

    if (!order) {
      throw ApiError.notFound("Order not found");
    }

    // Cancellation window: pending, confirmed, processing
    const cancellableStatuses = ["pending", "confirmed", "processing"];
    if (!cancellableStatuses.includes(order.order_status)) {
      throw ApiError.badRequest(
        `Order cannot be cancelled in '${order.order_status}' status`
      );
    }

    return orderRepository.cancelOrderTransaction({
      orderId: order.id,
      note: input?.note || "Cancelled by customer",
      changedBy: user.internalId,
    });
  },

  async cancelAdminOrder(
    adminSessionUserId: string,
    uuid: string,
    input?: CancelOrderInput
  ): Promise<OrderDetailResponse> {
    const adminUser = await userRepository.findById(adminSessionUserId);
    if (!adminUser || !adminUser.internalId) {
      throw ApiError.unauthorized("Session expired. Please log in again.");
    }

    const order = await db.order.findFirst({
      where: {
        uuid,
        is_active: true,
      },
    });

    if (!order) {
      throw ApiError.notFound("Order not found");
    }

    if (
      order.order_status === "delivered" ||
      order.order_status === "returned" ||
      order.order_status === "cancelled"
    ) {
      throw ApiError.badRequest(
        `Cannot cancel an order that is already '${order.order_status}'`
      );
    }

    return orderRepository.cancelOrderTransaction({
      orderId: order.id,
      note: input?.note || "Cancelled by admin",
      changedBy: adminUser.internalId,
    });
  },

  async returnCustomerOrder(
    sessionUserId: string,
    uuid: string,
    input?: ReturnOrderInput
  ): Promise<OrderDetailResponse> {
    const user = await userRepository.findById(sessionUserId);
    if (!user || !user.internalId) {
      throw ApiError.unauthorized("User not found");
    }

    const order = await db.order.findFirst({
      where: {
        uuid,
        userId: user.internalId,
        is_active: true,
      },
    });

    if (!order) {
      throw ApiError.notFound("Order not found");
    }

    if (order.order_status !== "delivered") {
      throw ApiError.badRequest("Only delivered orders can be returned");
    }

    return orderRepository.returnOrderTransaction({
      orderId: order.id,
      note: input?.note || "Return requested by customer",
      changedBy: user.internalId,
    });
  },

  async returnAdminOrder(
    adminSessionUserId: string,
    uuid: string,
    input?: ReturnOrderInput
  ): Promise<OrderDetailResponse> {
    const adminUser = await userRepository.findById(adminSessionUserId);
    if (!adminUser || !adminUser.internalId) {
      throw ApiError.unauthorized("Session expired. Please log in again.");
    }

    const order = await db.order.findFirst({
      where: {
        uuid,
        is_active: true,
      },
    });

    if (!order) {
      throw ApiError.notFound("Order not found");
    }

    if (order.order_status !== "delivered") {
      throw ApiError.badRequest("Only delivered orders can be returned");
    }

    return orderRepository.returnOrderTransaction({
      orderId: order.id,
      note: input?.note || "Return processed by admin",
      changedBy: adminUser.internalId,
    });
  },

  async transitionOrderStatus(
    adminSessionUserId: string,
    uuid: string,
    expectedCurrentStatus: orders_order_status,
    newStatus: orders_order_status,
    input?: OrderStatusTransitionInput
  ): Promise<OrderStatusTransitionResponse> {
    const adminUser = await userRepository.findById(adminSessionUserId);
    if (!adminUser || !adminUser.internalId) {
      throw ApiError.unauthorized("Session expired. Please log in again.");
    }

    const order = await db.order.findFirst({
      where: {
        uuid,
        is_active: true,
      },
    });

    if (!order) {
      throw ApiError.notFound("Order not found");
    }

    if (order.order_status !== expectedCurrentStatus) {
      throw ApiError.badRequest(
        `Order status is '${order.order_status}'. Only '${expectedCurrentStatus}' orders can be transitioned to '${newStatus}'.`
      );
    }

    const updated = await orderRepository.updateOrderStatusWithHistory({
      orderId: order.id,
      status: newStatus,
      note: input?.note,
      changedBy: adminUser.internalId,
    });

    return {
      id: updated.id,
      orderNumber: updated.orderNumber,
      status: updated.status,
    };
  },

  async confirmOrder(
    adminSessionUserId: string,
    uuid: string,
    input?: OrderStatusTransitionInput
  ): Promise<OrderStatusTransitionResponse> {
    return this.transitionOrderStatus(
      adminSessionUserId,
      uuid,
      "pending",
      "confirmed",
      input
    );
  },

  async startProcessingOrder(
    adminSessionUserId: string,
    uuid: string,
    input?: OrderStatusTransitionInput
  ): Promise<OrderStatusTransitionResponse> {
    return this.transitionOrderStatus(
      adminSessionUserId,
      uuid,
      "confirmed",
      "processing",
      input
    );
  },

  async markOrderAsPacked(
    adminSessionUserId: string,
    uuid: string,
    input?: OrderStatusTransitionInput
  ): Promise<OrderStatusTransitionResponse> {
    return this.transitionOrderStatus(
      adminSessionUserId,
      uuid,
      "processing",
      "packed",
      input
    );
  },

  async getOrders(userId: number | string | bigint, params: any = {}) {
    return this.getCustomerOrders(String(userId), params);
  },

  async placeOrder(userId: number | string | bigint, input: any) {
    return this.createCustomerOrder(String(userId), {
      shippingAddressId: input.shippingAddressId || String(input.addressId),
      billingAddressId: input.billingAddressId,
      notes: input.notes,
      paymentMethod: input.paymentMethod || "CARD",
      paymentDetails: input.paymentDetails,
    });
  },

  async getCheckoutSummary(
    userId: number | string | bigint,
    deliveryMethod?: string,
    _couponCode?: string
  ) {
    const user = await userRepository.findById(String(userId));
    if (!user || !user.internalId) throw ApiError.unauthorized("User not found");
    const cart = await db.cart.findFirst({
      where: { userId: user.internalId, status: "active", is_active: true },
      include: {
        items: {
          where: { is_active: true },
          include: { variant_unit_price: true },
        },
      },
    });

    // Priced from the live `base_price`, not the price captured when the item
    // was added, so the summary reflects today's catalog and today's offers.
    const lines = (cart?.items ?? [])
      .filter((it) => it.variant_unit_price)
      .map((it) => ({
        itemId: it.variant_unit_price!.uuid,
        quantity: it.quantity,
        unitPrice: Number(it.variant_unit_price!.base_price ?? 0),
      }));

    const pricing = await offerService.priceCartItems(lines);
    const deliveryCharge = deliveryMethod === "EXPRESS" ? 100 : 0;

    return {
      subtotal: pricing.subtotal,
      deliveryCharge,
      discount: pricing.totalDiscount,
      totalSavings: pricing.totalSavings,
      items: pricing.lines,
      total: pricing.total + deliveryCharge,
    };
  },
};
