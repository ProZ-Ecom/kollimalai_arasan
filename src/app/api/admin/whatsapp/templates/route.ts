import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db/prisma";
import { apiSuccess, apiError } from "@/lib/api/api-response";

const INITIAL_TEMPLATES = [
  {
    name: "Diwali 20% Special Offer",
    category: "FESTIVAL",
    message:
      "Namaste {{customer_name}}! 🪔✨\n\nCelebrate Diwali with pure & traditional products from *Kollimalai Arasan*! ❤️\n\nEnjoy an exclusive *20% OFF* on all items using coupon code *DIWALI20* at checkout.\n\nOrder fresh today: kollimalaiarasan.com 🌿",
  },
  {
    name: "Pongal Festive Combo",
    category: "FESTIVAL",
    message:
      "Iniya Pongal Nalvazhthukkal {{customer_name}}! 🌾🪁\n\nTreat your family and friends to Kollimalai Arasan authentic organic products from Kolli Hills.\n\nSpecial Pongal gift boxes available now with free delivery on orders above ₹499! 🎁",
  },
  {
    name: "Weekend Flash Sale",
    category: "OFFER",
    message:
      "Hello {{customer_name}}! ⚡\n\nStock up on pure Kolli Hills natural spices!\n\nBuy any 2 signature spice packs (Black pepper, Cardamom, Cloves) and get *10% OFF* this weekend only. Don't miss out! 🌿",
  },
  {
    name: "New Product Launch",
    category: "PROMOTION",
    message:
      "Exciting news {{customer_name}}! 🌟\n\nWe just launched our freshly harvested Kolli Hills *Wild Forest Black Pepper* & *Green Cardamom*!\n\nBe among the first to order with an introductory 15% discount. Experience pure tradition! 🌿",
  },
];

export async function GET() {
  try {
    let templates = await db.whatsAppTemplate.findMany({
      where: { is_active: true },
      orderBy: { created_at: "desc" },
    });

    // Seed default festive templates if table is empty
    if (templates.length === 0) {
      await db.whatsAppTemplate.createMany({
        data: INITIAL_TEMPLATES,
      });

      templates = await db.whatsAppTemplate.findMany({
        where: { is_active: true },
        orderBy: { created_at: "desc" },
      });
    }

    const serialized = templates.map((t) => ({
      ...t,
      id: String(t.id),
    }));

    return apiSuccess(serialized);
  } catch (err: any) {
    console.error("[WhatsApp Templates GET] Error:", err);
    return NextResponse.json(
      { success: false, message: err?.message || "Failed to fetch templates" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, category, message, media_url } = body || {};

    if (!name || typeof name !== "string") {
      return apiError("Template name is required", 400);
    }
    if (!message || typeof message !== "string") {
      return apiError("Template message content is required", 400);
    }

    const template = await db.whatsAppTemplate.create({
      data: {
        name: name.trim(),
        category: category || "CUSTOM",
        message: message.trim(),
        media_url: media_url || null,
        is_active: true,
      },
    });

    return apiSuccess(
      {
        ...template,
        id: String(template.id),
      },
      "Template created successfully",
      201
    );
  } catch (err: any) {
    console.error("[WhatsApp Templates POST] Error:", err);
    return NextResponse.json(
      { success: false, message: err?.message || "Failed to create template" },
      { status: 500 }
    );
  }
}
