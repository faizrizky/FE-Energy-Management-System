import { api } from '@/lib/axios';
import type { RoleDTO, RoleListResponseDTO } from './dto';
import type { RoleFormValues } from './schema';

export interface RoleListParams {
  page?: number;
  rowsPerPage?: number;
  search?: string;
}

export const rolesClientApi = {
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

  create: (payload: RoleFormValues) =>
    api.post<RoleDTO>('/roles', payload).then((res) => res.data),

  update: (id: string, payload: RoleFormValues) =>
    api.put<RoleDTO>(`/roles/${id}`, payload).then((res) => res.data),

  remove: (id: string) => api.delete(`/roles/${id}`).then(() => undefined),
};
