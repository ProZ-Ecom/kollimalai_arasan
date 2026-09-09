import { createApiHandler } from "@/lib/api/api-handler";
import { apiSuccess, apiError } from "@/lib/api/api-response";
import { permissionService } from "@/features/roles/services/role.service";
import { updatePermissionSchema } from "@/features/roles/validations/role.schema";

export const GET = createApiHandler(
  {
    GET: async (_request, context) => {
      const id = context.params?.id;
      if (!id) return apiError("Permission ID is required", 400);
      const permission = await permissionService.getPermission(parseInt(id));
      return apiSuccess(permission, "Permission fetched successfully");
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
      if (!id) return apiError("Permission ID is required", 400);
      const body = context.body as ReturnType<typeof updatePermissionSchema.parse>;
      const permission = await permissionService.updatePermission(parseInt(id), body);
      return apiSuccess(permission, "Permission updated successfully");
    },
  },
  {
    method: "PUT",
    requireAuth: true,
    requiredRole: ["ADMIN"],
    bodySchema: updatePermissionSchema,
  }
);

export const DELETE = createApiHandler(
  {
    DELETE: async (_request, context) => {
      const id = context.params?.id;
      if (!id) return apiError("Permission ID is required", 400);
      await permissionService.deletePermission(parseInt(id));
      return apiSuccess(null, "Permission deleted successfully");
    },
  },
  {
    method: "DELETE",
    requireAuth: true,
    requiredRole: ["ADMIN"],
  }
);
