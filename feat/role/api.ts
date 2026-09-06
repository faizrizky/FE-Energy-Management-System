import { http } from '@/lib/http';
import type {
  RoleDTO,
  PermissionDTO,
  RoleListResponseDTO,
  RolePermissionDTO,
} from './dto';

export const rolesApi = {
  list: async (): Promise<RoleDTO[]> => {
    const result = await http<RoleListResponseDTO>(
      '/roles?page=1&rowsPerPage=1000',
      { next: { revalidate: 30 } }
    );
    return result.data;
  },
  getById: (id: string) =>
    http<RoleDTO>(`/roles/${id}`, { next: { revalidate: 15 } }),
  listPermissions: () =>
    http<PermissionDTO[]>('/roles/permissions', { next: { revalidate: 300 } }),
};
