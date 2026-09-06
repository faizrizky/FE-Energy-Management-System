import { http } from '@/lib/http';
import type { UserDTO, UserListResponseDTO } from './dto';

export const usersApi = {
  list: async (): Promise<UserDTO[]> => {
    const result = await http<UserListResponseDTO>(
      '/users?page=1&rowsPerPage=1000',
      { next: { revalidate: 30 } }
    );
    return result.data;
  },

  getById: (id: string) =>
    http<UserDTO>(`/users/${id}`, { next: { revalidate: 15 } }),
};
