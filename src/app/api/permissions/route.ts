import { createApiHandler } from "@/lib/api/api-handler";
import { apiSuccess, apiCreated } from "@/lib/api/api-response";
import { permissionService } from "@/features/roles/services/role.service";
import { createPermissionSchema } from "@/features/roles/validations/role.schema";

export const GET = createApiHandler(
  {
    GET: async () => {
      const permissions = await permissionService.getPermissions();
      return apiSuccess(permissions, "Permissions fetched successfully");
    },
  },
  {
    requireAuth: true,
    requiredRole: ["ADMIN"],
  }
);

export const POST = createApiHandler(
  {
    POST: async (_request, context) => {
      const body = context.body as ReturnType<typeof createPermissionSchema.parse>;
      const permission = await permissionService.createPermission(body);
      return apiCreated(permission, "Permission created successfully");
    },
  },
  {
    method: "POST",
    requireAuth: true,
    requiredRole: ["ADMIN"],
    bodySchema: createPermissionSchema,
  }
);
