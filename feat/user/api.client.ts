import { api } from '@/lib/axios';
import type { UserDTO, UserListResponseDTO } from './dto';
import type { UserFormValues } from './schema';

export interface UserListParams {
  page?: number;
  rowsPerPage?: number;
  search?: string;
  roleId?: string;
}

export const usersClientApi = {
  list: ({ page = 1, rowsPerPage = 10, search, roleId }: UserListParams = {}) =>
    api
      .get<UserListResponseDTO>('/users', {
        params: { page, rowsPerPage, search: search || undefined, roleId },
      })
      .then((res) => res.data),

  create: (payload: UserFormValues) =>
    api
      .post<UserDTO>('/users', {
        ...payload,
        password: payload.password || undefined,
      })
      .then((res) => res.data),

  update: (id: string, payload: UserFormValues) =>
    api
      .put<UserDTO>(`/users/${id}`, {
        ...payload,
        password: payload.password || undefined,
      })
      .then((res) => res.data),

  remove: (id: string) => api.delete(`/users/${id}`).then(() => undefined),
};
