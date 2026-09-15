import { api } from '@/lib/axios';
import type { RoleDTO, RoleListResponseDTO } from './dto';
import type { RoleFormValues } from './schema';

export interface RoleListParams {
  page?: number;
  rowsPerPage?: number;
  search?: string;
}

export const rolesClientApi = {
  /**
   * GET /roles dari browser dengan paginasi & search.
   *
   * Dipake di: role/client.tsx.
   */
  list: ({ page = 1, rowsPerPage = 10, search }: RoleListParams = {}) =>
    api
      .get<RoleListResponseDTO>('/roles', {
        params: {
          page,
          rowsPerPage,
          search: search || undefined,
        },
      })
      .then((res) => res.data),

  /**
   * POST /roles.
   *
   * Dipake di: role/_partials/modal.tsx.
   */
  create: (payload: RoleFormValues) =>
    api.post<RoleDTO>('/roles', payload).then((res) => res.data),

  /**
   * PUT /roles/:id.
   *
   * Dipake di: role/_partials/modal.tsx.
   */
  update: (id: string, payload: RoleFormValues) =>
    api.put<RoleDTO>(`/roles/${id}`, payload).then((res) => res.data),

  /**
   * DELETE /roles/:id.
   *
   * Dipake di: role/client.tsx.
   */
  remove: (id: string) => api.delete(`/roles/${id}`).then(() => undefined),
};
