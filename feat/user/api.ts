import { http } from '@/lib/http';
import type { UserDTO } from './dto';

export const usersApi = {
  list: () => http<UserDTO[]>('/users', { next: { revalidate: 30 } }),
  getById: (id: string) =>
    http<UserDTO>(`/users/${id}`, { next: { revalidate: 15 } }),
};
