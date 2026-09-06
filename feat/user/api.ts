import { http } from '@/lib/http';
import type { UserDTO, UserListResponseDTO } from './dto';

export interface UserListParams {
  page?: number;
  rowsPerPage?: number;
  search?: string;
  roleId?: string;
}

export const usersApi = {
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
      next: { revalidate: 15 },
    });
  },

  listSummary: async (): Promise<UserDTO[]> => {
    const result = await http<UserListResponseDTO>(
      '/users?page=1&rowsPerPage=1000',
      { next: { revalidate: 30 } }
    );
    return result.data;
  },

  getById: (id: string) =>
    http<UserDTO>(`/users/${id}`, { next: { revalidate: 15 } }),
};
