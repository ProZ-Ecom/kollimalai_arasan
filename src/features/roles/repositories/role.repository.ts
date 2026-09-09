import { db } from "@/lib/db/prisma";
import { Prisma } from "@/generated/prisma";

const roleListInclude = Prisma.validator<Prisma.RoleInclude>()({
  _count: {
    select: {
      users: true,
      rolePermissions: true,
    },
  },
});

const roleDetailInclude = Prisma.validator<Prisma.RoleInclude>()({
  _count: {
    select: {
      users: true,
      rolePermissions: true,
    },
  },
  rolePermissions: {
    select: {
      permission: {
        select: {
          id: true,
          name: true,
          description: true,
          module: true,
        },
      },
    },
  },
});

export const roleRepository = {
  async findAll() {
    return db.role.findMany({
      include: roleListInclude,
      orderBy: { name: "asc" },
    });
  },

  async findById(id: number) {
    const role = await db.role.findUnique({
      where: { id },
      include: roleDetailInclude,
    });

    if (!role) return null;

    return {
      ...role,
      permissions: role.rolePermissions.map((rp) => rp.permission),
    };
  },

  async findByName(name: string) {
    return db.role.findUnique({ where: { name } });
  },

  async create(data: { name: string; description?: string; permissionIds?: number[] }) {
    return db.role.create({
      data: {
        name: data.name,
        description: data.description,
        rolePermissions: data.permissionIds?.length
          ? {
              create: data.permissionIds.map((permissionId) => ({
                permissionId,
              })),
            }
          : undefined,
      },
      include: roleDetailInclude,
    });
  },

  async update(
    id: number,
    data: { name?: string; description?: string; permissionIds?: number[] }
  ) {
    if (data.permissionIds !== undefined) {
      await db.rolePermission.deleteMany({ where: { roleId: id } });
    }

    return db.role.update({
      where: { id },
      data: {
        name: data.name,
        description: data.description,
        ...(data.permissionIds !== undefined
          ? {
              rolePermissions: {
                create: data.permissionIds.map((permissionId) => ({
                  permissionId,
                })),
              },
            }
          : {}),
      },
      include: roleDetailInclude,
    });
  },

  async delete(id: number) {
    return db.role.delete({ where: { id } });
  },

  async hasUsers(id: number) {
    const count = await db.user.count({ where: { roleId: id } });
    return count > 0;
  },
};

const permissionListInclude = Prisma.validator<Prisma.PermissionInclude>()({});

export const permissionRepository = {
  async findAll() {
    return db.permission.findMany({
      include: permissionListInclude,
      orderBy: [{ module: "asc" }, { name: "asc" }],
    });
  },

  async findById(id: number) {
    return db.permission.findUnique({
      where: { id },
    });
  },

  async findByName(name: string) {
    return db.permission.findUnique({ where: { name } });
  },

  async create(data: { name: string; description?: string; module: string }) {
    return db.permission.create({
      data,
    });
  },

  async update(
    id: number,
    data: { name?: string; description?: string; module?: string }
  ) {
    return db.permission.update({
      where: { id },
      data,
    });
  },

  async delete(id: number) {
    return db.permission.delete({ where: { id } });
  },

  async hasRoles(id: number) {
    const count = await db.rolePermission.count({ where: { permissionId: id } });
    return count > 0;
  },
};
