import { ApiError } from "@/lib/api/api-error";
import { addressRepository } from "../repositories/address.repository";
import type {
  AddressItem,
  CreateAddressInput,
  UpdateAddressInput,
} from "../types";

function toAddressItem(address: Record<string, unknown>): AddressItem {
  return {
    id: address.id as number,
    userId: address.userId as number,
    firstName: address.firstName as string,
    lastName: address.lastName as string,
    phone: address.phone as string,
    addressLine1: address.addressLine1 as string,
    addressLine2: (address.addressLine2 as string | null) ?? null,
    city: address.city as string,
    state: address.state as string,
    postalCode: address.postalCode as string,
    country: address.country as string,
    isDefault: address.isDefault as boolean,
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
      throw ApiError.badRequest("Maximum of 10 addresses allowed per account");
    }

    const makeDefault = input.isDefault || count === 0;

    if (makeDefault) {
      await addressRepository.clearDefault(userId);
    }

    const address = await addressRepository.create(userId, {
      firstName: input.firstName,
      lastName: input.lastName ?? "",
      phone: input.phone,
      addressLine1: input.addressLine1,
      addressLine2: input.addressLine2 ?? undefined,
      city: input.city,
      state: input.state,
      postalCode: input.postalCode,
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
    if (input.firstName !== undefined) data.firstName = input.firstName;
    if (input.lastName !== undefined) data.lastName = input.lastName;
    if (input.phone !== undefined) data.phone = input.phone;
    if (input.addressLine1 !== undefined) data.addressLine1 = input.addressLine1;
    if (input.addressLine2 !== undefined) data.addressLine2 = input.addressLine2;
    if (input.city !== undefined) data.city = input.city;
    if (input.state !== undefined) data.state = input.state;
    if (input.postalCode !== undefined) data.postalCode = input.postalCode;
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
        await addressRepository.setDefault(remaining[0].id, userId);
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
