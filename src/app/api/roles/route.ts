import { createApiHandler } from "@/lib/api/api-handler";
import { apiSuccess, apiCreated } from "@/lib/api/api-response";
import { roleService } from "@/features/roles/services/role.service";
import { createRoleSchema } from "@/features/roles/validations/role.schema";

export const GET = createApiHandler(
  {
    GET: async () => {
      const roles = await roleService.getRoles();
      return apiSuccess(roles, "Roles fetched successfully");
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
      const body = context.body as ReturnType<typeof createRoleSchema.parse>;
      const role = await roleService.createRole(body);
      return apiCreated(role, "Role created successfully");
    },
  },
  {
    method: "POST",
    requireAuth: true,
    requiredRole: ["ADMIN"],
    bodySchema: createRoleSchema,
  }
);
