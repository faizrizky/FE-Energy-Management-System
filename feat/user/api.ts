import { http } from '@/lib/http';
import type { UserDTO, UserListResponseDTO } from './dto';

export interface UserListParams {
  page?: number;
  rowsPerPage?: number;
  search?: string;
  roleId?: string;
}

export const usersApi = {
  /**
   * GET /users dari server (tanpa cache).
   *
   * Dipake di: user/page.tsx.
   */
  list: ({
    page = 1,
    rowsPerPage = 10,
    search,
    roleId,
  }: UserListParams = {}) => {
    const query = new URLSearchParams({
      page: String(page),
      rowsPerPage: String(rowsPerPage),
      ...(search ? { search } : {}),
      ...(roleId ? { roleId } : {}),
    });
    return http<UserListResponseDTO>(`/users?${query.toString()}`, {
      cache: 'no-store',
    });
  },

  /**
   * Ngambil sampe 1000 user sekaligus dari server buat dropdown PIC/installer,
   * langsung balikin array-nya.
   *
   * Dipake di: rooms/page.tsx, rooms/detail/[roomId]/page.tsx,
   *   gateway/page.tsx.
   */
  listSummary: async (): Promise<UserDTO[]> => {
    const result = await http<UserListResponseDTO>(
      '/users?page=1&rowsPerPage=1000',
      { cache: 'no-store' }
    );
    return result.data;
  },

  /**
   * GET /users/:id dari server (tanpa cache).
   *
   * Dipake di: Belom dipake.
   */
  getById: (id: string) =>
    http<UserDTO>(`/users/${id}`, { cache: 'no-store' }),
};
