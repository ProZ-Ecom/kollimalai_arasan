import type { PaginationMeta } from "@/lib/api/api-response";
import type { FaqIconKey } from "../constants/faq-icons";

/**
 * The `faq` table stores activation as the boolean `is_active` (the convention
 * used by every other table in this schema). The API surface exposes it as a
 * two-state `status` instead, so admin screens and the public payload speak the
 * same language as the rest of the CMS modules.
 */
export type FaqStatus = "ACTIVE" | "INACTIVE";

export interface FaqDto {
  id: string;
  question: string;
  answer: string;
  category: string | null;
  /** Icon key chosen by the admin; null falls back to a positional default. */
  icon: FaqIconKey | null;
  displayOrder: number;
  status: FaqStatus;
  createdAt: Date;
  updatedAt: Date;
}

export interface FaqListResponse {
  data: FaqDto[];
  meta: PaginationMeta;
}

/** Trimmed shape served to the storefront — no audit or status columns. */
export interface PublicFaqDto {
  id: string;
  question: string;
  answer: string;
  category: string | null;
  icon: FaqIconKey | null;
  displayOrder: number;
}
