import { NextRequest } from "next/server";
import { apiSuccess } from "@/lib/api/api-response";
import { catalogService } from "@/features/customers/services/catalog.service";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const q = (searchParams.get("q") || "").trim();

  if (q.length < 2) {
    return apiSuccess(
      {
        categories: [],
        products: [],
        items: [],
        total: 0,
      },
      "Search results fetched successfully",
      200
    );
  }

  const result = await catalogService.globalSearch(q);

  return apiSuccess(
    result,
    "Search results fetched successfully",
    200
  );
}
