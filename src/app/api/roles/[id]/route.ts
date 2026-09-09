import { createApiHandler } from "@/lib/api/api-handler";
import { apiSuccess, apiError } from "@/lib/api/api-response";
import { roleService } from "@/features/roles/services/role.service";
import { updateRoleSchema } from "@/features/roles/validations/role.schema";

export const GET = createApiHandler(
  {
    GET: async (_request, context) => {
      const id = context.params?.id;
      if (!id) return apiError("Role ID is required", 400);
      const role = await roleService.getRole(parseInt(id));
      return apiSuccess(role, "Role fetched successfully");
    },
  },
  {
    requireAuth: true,
    requiredRole: ["ADMIN"],
  }
);

export const PUT = createApiHandler(
  {
    PUT: async (_request, context) => {
      const id = context.params?.id;
      if (!id) return apiError("Role ID is required", 400);
      const body = context.body as ReturnType<typeof updateRoleSchema.parse>;
      const role = await roleService.updateRole(parseInt(id), body);
      return apiSuccess(role, "Role updated successfully");
    },
  },
  {
    method: "PUT",
    requireAuth: true,
    requiredRole: ["ADMIN"],
    bodySchema: updateRoleSchema,
  }
);

export const DELETE = createApiHandler(
  {
    DELETE: async (_request, context) => {
      const id = context.params?.id;
      if (!id) return apiError("Role ID is required", 400);
      await roleService.deleteRole(parseInt(id));
      return apiSuccess(null, "Role deleted successfully");
    },
  },
  {
    method: "DELETE",
    requireAuth: true,
    requiredRole: ["ADMIN"],
  }
);
