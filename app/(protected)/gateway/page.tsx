import { getSession } from '@/lib/auth';
import { Header } from '@/components/shared/header';
import { gatewaysApi } from '@/feat/gateway/api';
import { GatewayClient } from './client';

export default async function GatewayPage() {
  const [session, gateways] = await Promise.all([
    getSession(),
    gatewaysApi.list(),
  ]);

  return (
    <>
      <Header breadcrumb={['Gateways']} user={session!} />
      <GatewayClient initialData={gateways} />
    </>
  );
}
