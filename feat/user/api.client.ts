import { api } from '@/lib/axios';
import type { UserDTO } from './dto';
import type { UserFormValues } from './schema';

export const usersClientApi = {
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
