import { getSession } from '@/lib/auth';
import { Header } from '@/components/shared/header';
import { devicesApi } from '@/feat/device/api';
import { roomsApi } from '@/feat/rooms/api';
import { gatewaysApi } from '@/feat/gateway/api';
import { DeviceClient } from './client';

export default async function DevicePage() {
  const [session, devices, roomsRes, gateways] = await Promise.all([
    getSession(),
    devicesApi.list(),
    roomsApi.list({ page: 1, rowsPerPage: 1000 }),
    gatewaysApi.list(),
  ]);

  return (
    <>
      <Header breadcrumb={['Devices']} user={session!} />
      <DeviceClient
        initialData={devices}
        rooms={roomsRes.data}
        gateways={gateways}
      />
    </>
  );
}
