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
      cache: 'no-store',
    });
  },

  listSummary: async (): Promise<RoleDTO[]> => {
    const result = await http<RoleListResponseDTO>(
      '/roles?page=1&rowsPerPage=1000',
      { cache: 'no-store' }
    );
    return result.data;
  },

  getById: (id: string) =>
    http<RoleDTO>(`/roles/${id}`, { cache: 'no-store' }),

  listPermissions: () =>
    http<PermissionDTO[]>('/roles/permissions', { next: { revalidate: 300 } }),
};
