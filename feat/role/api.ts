import { http } from '@/lib/http';
import type { RoleDTO, PermissionDTO } from './dto';

export const rolesApi = {
  list: () => http<RoleDTO[]>('/roles', { next: { revalidate: 30 } }),
  getById: (id: string) =>
    http<RoleDTO>(`/roles/${id}`, { next: { revalidate: 15 } }),
  listPermissions: () =>
    http<PermissionDTO[]>('/roles/permissions', { next: { revalidate: 300 } }),
};
