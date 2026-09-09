import { db } from "@/lib/db/prisma";
import { Prisma } from "@/generated/prisma";

export const addressRepository = {
  async findAllByUser(userId: number) {
    return db.customerAddress.findMany({
      where: { userId },
      orderBy: [{ isDefault: "desc" }, { createdAt: "desc" }],
    });
  },

  async findById(id: number, userId: number) {
    return db.customerAddress.findFirst({
      where: { id, userId },
    });
  },

  async findDefault(userId: number) {
    return db.customerAddress.findFirst({
      where: { userId, isDefault: true },
    });
  },

  async countByUser(userId: number) {
    return db.customerAddress.count({ where: { userId } });
  },

  async create(userId: number, data: Omit<Prisma.CustomerAddressCreateInput, "user">) {
    return db.customerAddress.create({
      data: {
        ...data,
        user: { connect: { id: userId } },
      },
    });
  },

  async update(id: number, userId: number, data: Prisma.CustomerAddressUpdateInput) {
    return db.customerAddress.updateMany({
      where: { id, userId },
      data,
    });
  },

  async delete(id: number, userId: number) {
    return db.customerAddress.deleteMany({
      where: { id, userId },
    });
  },

  async clearDefault(userId: number) {
    return db.customerAddress.updateMany({
      where: { userId, isDefault: true },
      data: { isDefault: false },
    });
  },

  async setDefault(id: number, userId: number) {
    return db.$transaction([
      db.customerAddress.updateMany({
        where: { userId, isDefault: true },
        data: { isDefault: false },
      }),
      db.customerAddress.updateMany({
        where: { id, userId },
        data: { isDefault: true },
      }),
    ]);
  },
};
