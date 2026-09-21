import { ApiError } from "@/lib/api/api-error";
import { addressRepository } from "../repositories/address.repository";
import type {
  AddressItem,
  CreateAddressInput,
  UpdateAddressInput,
} from "../types";

function toAddressItem(address: Record<string, unknown>): AddressItem {
  const fullName = (address.full_name as string) || "";
  const [firstName = "", ...rest] = fullName.split(" ");
  const lastName = rest.join(" ");

  return {
    id: Number(address.id),
    userId: Number(address.userId),
    firstName: (address.firstName as string) || firstName,
    lastName: (address.lastName as string) || lastName,
    phone: (address.phone as string) || "",
    addressLine1: (address.address_line1 as string) || (address.addressLine1 as string) || "",
    addressLine2: (address.address_line2 as string | null) ?? (address.addressLine2 as string | null) ?? null,
    city: (address.city as string) || "",
    state: (address.state as string) || "",
    postalCode: (address.pincode as string) || (address.postalCode as string) || "",
    country: (address.country as string) || "India",
    isDefault: Boolean(address.isDefault),
    createdAt: address.createdAt as Date,
    updatedAt: address.updatedAt as Date,
  };
}

export const addressService = {
  async getAddresses(userId: number) {
    const addresses = await addressRepository.findAllByUser(userId);
    return addresses.map((a) =>
      toAddressItem(a as unknown as Record<string, unknown>)
    );
  },

  async getAddress(userId: number, id: number) {
    const address = await addressRepository.findById(id, userId);
    if (!address) {
      throw ApiError.notFound("Address not found");
    }
    return toAddressItem(address as unknown as Record<string, unknown>);
  },

  async createAddress(userId: number, input: CreateAddressInput) {
    const count = await addressRepository.countByUser(userId);
    if (count >= 10) {
      throw ApiError.badRequest("Maximum 10 addresses allowed per user");
    }

    const makeDefault = input.isDefault || count === 0;

    if (makeDefault) {
      await addressRepository.clearDefault(userId);
    }

    const fullName = `${input.firstName} ${input.lastName ?? ""}`.trim();
    const address = await addressRepository.create(userId, {
      full_name: fullName,
      phone: input.phone,
      address_line1: input.addressLine1,
      address_line2: input.addressLine2 ?? undefined,
      city: input.city,
      state: input.state,
      pincode: input.postalCode,
      country: input.country ?? "India",
      isDefault: makeDefault,
    });

    return toAddressItem(address as unknown as Record<string, unknown>);
  },

  async updateAddress(userId: number, id: number, input: UpdateAddressInput) {
    const existing = await addressRepository.findById(id, userId);
    if (!existing) {
      throw ApiError.notFound("Address not found");
    }

    if (input.isDefault) {
      await addressRepository.clearDefault(userId);
    }

    const data: Record<string, unknown> = {};
    if (input.firstName !== undefined || input.lastName !== undefined) {
      const first = input.firstName ?? "";
      const last = input.lastName ?? "";
      data.full_name = `${first} ${last}`.trim();
    }
    if (input.phone !== undefined) data.phone = input.phone;
    if (input.addressLine1 !== undefined) data.address_line1 = input.addressLine1;
    if (input.addressLine2 !== undefined) data.address_line2 = input.addressLine2;
    if (input.city !== undefined) data.city = input.city;
    if (input.state !== undefined) data.state = input.state;
    if (input.postalCode !== undefined) data.pincode = input.postalCode;
    if (input.country !== undefined) data.country = input.country;
    if (input.isDefault !== undefined) data.isDefault = input.isDefault;

    const result = await addressRepository.update(id, userId, data as never);

    if (result.count === 0) {
      throw ApiError.notFound("Address not found");
    }

    const updated = await addressRepository.findById(id, userId);
    return toAddressItem((updated as unknown as Record<string, unknown>) ?? {});
  },

  async deleteAddress(userId: number, id: number) {
    const existing = await addressRepository.findById(id, userId);
    if (!existing) {
      throw ApiError.notFound("Address not found");
    }

    const result = await addressRepository.delete(id, userId);
    if (result.count === 0) {
      throw ApiError.notFound("Address not found");
    }

    if (existing.isDefault) {
      const remaining = await addressRepository.findAllByUser(userId);
      if (remaining.length > 0) {
        await addressRepository.setDefault(Number(remaining[0].id), userId);
      }
    }

    return { success: true };
  },

  async setDefaultAddress(userId: number, id: number) {
    const existing = await addressRepository.findById(id, userId);
    if (!existing) {
      throw ApiError.notFound("Address not found");
    }

    await addressRepository.setDefault(id, userId);
    return this.getAddresses(userId);
  },
};
