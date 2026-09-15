import { http } from '@/lib/http';
import type { RoleDTO, PermissionDTO, RoleListResponseDTO } from './dto';

export interface RoleListParams {
  page?: number;
  rowsPerPage?: number;
  search?: string;
}

export const rolesApi = {
  /**
   * GET /roles dari server (tanpa cache).
   *
   * Dipake di: role/page.tsx.
   */
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

  /**
   * Ngambil sampe 1000 role sekaligus dari server buat dropdown, langsung
   * balikin array-nya.
   *
   * Dipake di: user/page.tsx.
   */
  listSummary: async (): Promise<RoleDTO[]> => {
    const result = await http<RoleListResponseDTO>(
      '/roles?page=1&rowsPerPage=1000',
      { cache: 'no-store' }
    );
    return result.data;
  },

  /**
   * GET /roles/permissions dari server, di-cache 5 menit karena katalognya
   * jarang berubah.
   *
   * Dipake di: role/page.tsx.
   */
  listPermissions: () =>
    http<PermissionDTO[]>('/roles/permissions', { next: { revalidate: 300 } }),
};
