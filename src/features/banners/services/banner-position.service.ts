import { ApiError } from "@/lib/api/api-error";
import { userRepository } from "@/features/users/repositories/user.repository";
import {
  bannerPositionRepository,
  formatBannerPosition,
} from "../repositories/banner-position.repository";
import type {
  CreateBannerPositionInput,
  UpdateBannerPositionInput,
  BannerPositionListQueryInput,
} from "../validations/banner-position.schema";
import type {
  BannerPositionDto,
  BannerPositionListResponse,
} from "../types/banner-position.types";

async function resolveInternalUserId(
  sessionUserId?: string
): Promise<bigint | undefined> {
  if (!sessionUserId) return undefined;
  const user = await userRepository.findById(sessionUserId);
  return user?.internalId;
}

export const bannerPositionService = {
  async createBannerPosition(
    input: CreateBannerPositionInput,
    sessionUserId?: string
  ): Promise<BannerPositionDto> {
    const existing = await bannerPositionRepository.findBySlug(input.slug);
    if (existing) {
      throw ApiError.conflict("A banner position with this slug already exists");
    }

    const userInternalId = await resolveInternalUserId(sessionUserId);
    return bannerPositionRepository.create(input, userInternalId);
  },

  async getBannerPositions(
    params: BannerPositionListQueryInput
  ): Promise<BannerPositionListResponse> {
    return bannerPositionRepository.findAll(params);
  },

  async getBannerPositionByUuid(uuid: string): Promise<BannerPositionDto> {
    const record = await bannerPositionRepository.findByUuid(uuid);
    if (!record) {
      throw ApiError.notFound("Banner position not found");
    }
    return formatBannerPosition(record);
  },

  async updateBannerPosition(
    uuid: string,
    input: UpdateBannerPositionInput,
    sessionUserId?: string
  ): Promise<BannerPositionDto> {
    const record = await bannerPositionRepository.findByUuid(uuid);
    if (!record) {
      throw ApiError.notFound("Banner position not found");
    }

    if (
      input.slug &&
      input.slug.toLowerCase().trim() !== record.slug.toLowerCase()
    ) {
      const slugConflict = await bannerPositionRepository.findBySlug(
        input.slug
      );
      if (slugConflict && slugConflict.id !== record.id) {
        throw ApiError.conflict(
          "A banner position with this slug already exists"
        );
      }
    }

    const userInternalId = await resolveInternalUserId(sessionUserId);
    return bannerPositionRepository.update(record.id, input, userInternalId);
  },
};
