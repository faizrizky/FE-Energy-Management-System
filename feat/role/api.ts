import { http } from '@/lib/http';
import type { RoleDTO, PermissionDTO, RoleListResponseDTO } from './dto';

export interface RoleListParams {
  page?: number;
  rowsPerPage?: number;
  search?: string;
}

export const rolesApi = {
  list: ({ page = 1, rowsPerPage = 10, search }: RoleListParams = {}) => {
    const query = new URLSearchParams({
      page: String(page),
      rowsPerPage: String(rowsPerPage),
      ...(search ? { search } : {}),
    });
    return http<RoleListResponseDTO>(`/roles?${query.toString()}`, {
      next: { revalidate: 30 },
    });
  },

  listSummary: async (): Promise<RoleDTO[]> => {
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
