import { api } from '@/lib/axios';
import type { RoleDTO } from './dto';
import type { RoleFormValues } from './schema';

export const rolesClientApi = {
  create: (payload: RoleFormValues) =>
    api.post<RoleDTO>('/roles', payload).then((res) => res.data),

  update: (id: string, payload: RoleFormValues) =>
    api.put<RoleDTO>(`/roles/${id}`, payload).then((res) => res.data),

  remove: (id: string) => api.delete(`/roles/${id}`).then(() => undefined),
};
