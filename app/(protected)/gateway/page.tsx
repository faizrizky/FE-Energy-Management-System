import { getSession } from '@/lib/auth';
import { Header } from '@/components/shared/header';
import { gatewaysApi } from '@/feat/gateway/api';
import { usersApi } from '@/feat/user/api';
import { GatewayClient } from './client';

export default async function GatewayPage() {
  const [session, gateways, users] = await Promise.all([
    getSession(),
    gatewaysApi.list({ page: 1, rowsPerPage: 10 }),
    usersApi.list(),
  ]);

  return (
    <>
      <Header breadcrumb={['Gateways']} user={session!} />
      <GatewayClient initialData={gateways} users={users} />
    </>
  );
}
