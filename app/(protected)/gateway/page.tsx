import { getSession } from '@/lib/auth';
import { Header } from '@/components/shared/header';
import { gatewaysApi } from '@/feat/gateway/api';
import { usersApi } from '@/feat/user/api';
import { GatewayClient } from './client';

/**
 * Server component halaman /gateway: ambil session, list gateway, sama user
 * buat dropdown installer.
 *
 * Dipake di: Otomatis sama Next.js buat route /gateway.
 */
export default async function GatewayPage() {
  const [session, gateways, users] = await Promise.all([
    getSession(),
    gatewaysApi.list(),
    usersApi.listSummary(),
  ]);

  return (
    <>
      <Header breadcrumb={['Gateways']} user={session!} />
      <GatewayClient initialData={gateways} users={users} />
    </>
  );
}
