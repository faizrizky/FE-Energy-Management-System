import { api } from '@/lib/axios';
import type { UserDTO, UserListResponseDTO } from './dto';
import type { UserFormValues } from './schema';

export interface UserListParams {
  page?: number;
  rowsPerPage?: number;
  search?: string;
  roleId?: string;
  createdFrom?: string;
  createdTo?: string;
}

export const usersClientApi = {
  /**
   * GET /users dari browser dengan filter role, search, tanggal, & paginasi.
   *
   * Dipake di: user/client.tsx.
   */
  list: ({
    page = 1,
    rowsPerPage = 10,
    search,
    roleId,
    createdFrom,
    createdTo,
  }: UserListParams = {}) =>
    api
      .get<UserListResponseDTO>('/users', {
        params: {
          page,
          rowsPerPage,
          search: search || undefined,
          roleId,
          createdFrom,
          createdTo,
        },
      })
      .then((res) => res.data),

  /**
   * POST /users; password kosong nggak dikirim.
   *
   * Dipake di: user/_partials/modal.tsx.
   */
  create: (payload: UserFormValues) =>
    api
      .post<UserDTO>('/users', {
        ...payload,
        password: payload.password || undefined,
      })
      .then((res) => res.data),

  /**
   * PUT /users/:id; password kosong nggak dikirim.
   *
   * Dipake di: user/_partials/modal.tsx.
   */
  update: (id: string, payload: UserFormValues) =>
    api
      .put<UserDTO>(`/users/${id}`, {
        ...payload,
        password: payload.password || undefined,
      })
      .then((res) => res.data),

  /**
   * DELETE /users/:id.
   *
   * Dipake di: user/client.tsx.
   */
  remove: (id: string) => api.delete(`/users/${id}`).then(() => undefined),
};
