import { getSession } from '@/lib/auth';
import { Header } from '@/components/shared/header';
import { GatewayDetailClient } from './client';

interface GatewayDetailPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function GatewayDetailPage({
  params,
}: GatewayDetailPageProps) {
  const session = await getSession();
  const { id } = await params;

  return (
    <>
      <Header breadcrumb={['Gateways', 'Detail']} user={session!} />

      <GatewayDetailClient id={id} />
    </>
  );
}
