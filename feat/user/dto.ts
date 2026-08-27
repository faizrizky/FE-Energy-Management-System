export interface UserRoleDTO {
  id: string;
  name: string;
}

export interface UserSummaryDTO {
  id: string;
  fullName: string;
  username: string;
}

export interface UserDTO extends UserSummaryDTO {
  email: string;
  phone: string | null;
  address: string | null;
  avatarUrl: string | null;
  roleId: string;
  role?: UserRoleDTO | null;
  lastActiveAt: string | null;
  createdAt: string;
  updatedAt: string;
}
