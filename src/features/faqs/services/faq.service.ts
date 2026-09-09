import { ApiError } from "@/lib/api/api-error";
import { userRepository } from "@/features/users/repositories/user.repository";
import { faqRepository, formatFaq } from "../repositories/faq.repository";
import type {
  CreateFaqInput,
  UpdateFaqInput,
  FaqListQueryInput,
  PublicFaqQueryInput,
  UpdateFaqOrderInput,
  UpdateFaqStatusInput,
} from "../validations/faq.schema";
import type {
  FaqDto,
  FaqListResponse,
  PublicFaqDto,
} from "../types/faq.types";

async function resolveInternalUserId(
  sessionUserId?: string
): Promise<bigint | undefined> {
  if (!sessionUserId) return undefined;
  const user = await userRepository.findById(sessionUserId);
  return user?.internalId;
}

async function requireFaq(id: number) {
  const record = await faqRepository.findById(BigInt(id));
  if (!record) {
    throw ApiError.notFound("FAQ not found");
  }
  return record;
}

export const faqService = {
  async createFaq(
    input: CreateFaqInput,
    sessionUserId?: string
  ): Promise<FaqDto> {
    const userInternalId = await resolveInternalUserId(sessionUserId);
    return faqRepository.create(input, userInternalId);
  },

  async getFaqs(params: FaqListQueryInput): Promise<FaqListResponse> {
    return faqRepository.findAll(params);
  },

  async getFaqById(id: number): Promise<FaqDto> {
    const record = await requireFaq(id);
    return formatFaq(record);
  },

  async updateFaq(
    id: number,
    input: UpdateFaqInput,
    sessionUserId?: string
  ): Promise<FaqDto> {
    await requireFaq(id);
    const userInternalId = await resolveInternalUserId(sessionUserId);
    return faqRepository.update(BigInt(id), input, userInternalId);
  },

  async updateFaqStatus(
    id: number,
    input: UpdateFaqStatusInput,
    sessionUserId?: string
  ): Promise<FaqDto> {
    await requireFaq(id);
    const userInternalId = await resolveInternalUserId(sessionUserId);
    return faqRepository.update(
      BigInt(id),
      { status: input.status },
      userInternalId
    );
  },

  async updateFaqOrder(
    input: UpdateFaqOrderInput,
    sessionUserId?: string
  ): Promise<void> {
    const ids = input.items.map((item) => BigInt(item.id));
    const existing = await faqRepository.findExistingIds(ids);

    const missing = input.items
      .filter((item) => !existing.has(String(item.id)))
      .map((item) => item.id);

    if (missing.length > 0) {
      throw ApiError.notFound(
        `FAQ not found for id(s): ${missing.join(", ")}`
      );
    }

    const userInternalId = await resolveInternalUserId(sessionUserId);
    await faqRepository.updateDisplayOrders(input.items, userInternalId);
  },

  async deleteFaq(id: number): Promise<void> {
    const record = await requireFaq(id);
    await faqRepository.delete(record.id);
  },

  async getCategories(): Promise<string[]> {
    return faqRepository.findCategories();
  },

  async getPublicFaqs(params: PublicFaqQueryInput): Promise<PublicFaqDto[]> {
    return faqRepository.findActivePublicFaqs(params);
  },
};
