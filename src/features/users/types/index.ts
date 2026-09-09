export interface UserListItem {
  id: string; // Exposed UUID identifier
  uuid?: string | null;
  custId?: string | null;
  name: string;
  email: string | null;
  phone: string | null;
  roleId: number;
  status: "active" | "inactive" | "banned" | string;
  avatar: string | null;
  createdAt: Date;
  updatedAt?: Date;
  roleName?: string;
}

export interface GetUserParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  roleId?: number;
}

export interface GetUserResult {
  data: UserListItem[];
  meta: { page: number; limit: number; total: number; totalPages: number };
}

export interface CreateUserInput {
  uuid?: string;
  name: string;
  email: string;
  password: string;
  phone?: string;
  roleId?: number;
  status?: "active" | "inactive" | "banned" | string;
}

export interface UpdateUserInput extends Partial<Omit<CreateUserInput, "password">> {}

export interface ResetPasswordInput {
  password: string;
}
