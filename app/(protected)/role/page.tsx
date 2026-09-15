import { getSession } from '@/lib/auth';
import { Header } from '@/components/shared/header';
import { rolesApi } from '@/feat/role/api';
import { RoleClient } from './client';

/**
 * Server component halaman /role: ambil session, list role, sama katalog
 * permission.
 *
 * Dipake di: Otomatis sama Next.js buat route /role.
 */
export default async function RolePage() {
  const [session, roles, permissions] = await Promise.all([
    getSession(),
    rolesApi.list({ page: 1, rowsPerPage: 10 }),
    rolesApi.listPermissions(),
  ]);

  return (
    <>
      <Header breadcrumb={['Roles']} user={session!} />
      <RoleClient initialData={roles} permissions={permissions} />
    </>
  );
}
