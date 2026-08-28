export interface PermissionDTO {
  id: string;
  module: string;
  action: string;
}

export interface RolePermissionDTO {
  permission: PermissionDTO;
}

export interface RoleDTO {
  id: string;
  name: string;
  description: string | null;
  isSystem: boolean;
  permissions?: RolePermissionDTO[];
  _count?: { users: number };
}
