import { getSession } from '@/lib/auth';
import { Header } from '@/components/shared/header';
import { usersApi } from '@/feat/user/api';
import { rolesApi } from '@/feat/role/api';
import { UserClient } from './client';

export default async function UserPage() {
  const [session, users, roles] = await Promise.all([
    getSession(),
    usersApi.list(),
    rolesApi.list(),
  ]);

  return (
    <>
      <Header breadcrumb={['Users']} user={session!} />
      <UserClient initialData={users} roles={roles} />
    </>
  );
}
