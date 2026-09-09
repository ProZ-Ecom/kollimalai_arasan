export interface RoleListItem {
  id: number;
  name: string;
  description: string | null;
  _count?: {
    users?: number;
    rolePermissions?: number;
  };
}

export interface PermissionListItem {
  id: number;
  name: string;
  description: string | null;
  module: string;
}

export interface RoleDetail extends RoleListItem {
  permissions: PermissionListItem[];
}

export interface CreateRoleInput {
  name: string;
  description?: string;
  permissionIds?: number[];
}

export interface UpdateRoleInput extends Partial<CreateRoleInput> {}

export interface CreatePermissionInput {
  name: string;
  description?: string;
  module: string;
}

export interface UpdatePermissionInput extends Partial<CreatePermissionInput> {}
