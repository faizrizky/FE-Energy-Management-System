'use client';

import { useEffect, useState } from 'react';
import { ArrowLeft, Edit, Loader2, Router } from 'lucide-react';
import { useRouter } from 'next/navigation';

import { Button } from '@/components/ui/button';
import { gatewaysApi } from '@/feat/gateway/api';
import type { GatewayDetailDTO } from '@/feat/gateway/dto';

function formatDate(value?: string | null) {
  if (!value) return '-';

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  }).format(date);
}

function formatDateTime(value?: string | null) {
  if (!value) return '-';

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

function StatusBadge({ status }: { status?: string | null }) {
  const online = status?.toLowerCase() === 'online';

  return (
    <span
      className={[
        'inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-medium',
        online
          ? 'bg-emerald-50 text-emerald-600'
          : 'bg-slate-100 text-slate-500',
      ].join(' ')}
    >
      <span
        className={[
          'size-2 rounded-full',
          online ? 'bg-emerald-500' : 'bg-slate-400',
        ].join(' ')}
      />

      {status || '-'}
    </span>
  );
}

function InfoItem({
  label,
  value,
}: {
  label: string;
  value?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1">
      <p className="text-xs font-medium text-slate-500">{label}</p>

      <p className="text-sm font-medium text-slate-900">{value || '-'}</p>
    </div>
  );
}

interface GatewayDetailClientProps {
  id: string;
}

export function GatewayDetailClient({ id }: GatewayDetailClientProps) {
  const router = useRouter();

  const [gateway, setGateway] = useState<GatewayDetailDTO | null>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadGateway() {
      try {
        setLoading(true);
        setError(null);

        const result = await gatewaysApi.getById(id);

        if (!cancelled) {
          setGateway(result);
        }
      } catch (error) {
        console.error('Failed to load gateway detail:', error);

        if (!cancelled) {
          setError('Failed to load gateway detail.');
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadGateway();

    return () => {
      cancelled = true;
    };
  }, [id]);

  if (loading) {
    return (
      <div className="flex min-h-[400px] w-full items-center justify-center bg-slate-50">
        <Loader2 className="size-6 animate-spin text-slate-400" />
      </div>
    );
  }

  if (error || !gateway) {
    return (
      <div className="flex w-full flex-1 flex-col gap-6 bg-slate-50 p-8">
        <Button
          variant="ghost"
          className="w-fit"
          onClick={() => router.push('/gateway')}
        >
          <ArrowLeft className="size-4" />
          Back to gateways
        </Button>

        <div className="rounded-xl border border-red-200 bg-red-50 p-6">
          <p className="font-medium text-red-700">
            {error || 'Gateway not found.'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex w-full flex-1 flex-col gap-6 overflow-y-auto bg-slate-50 p-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push('/gateway')}
          >
            <ArrowLeft className="size-4" />
          </Button>

          <div>
            <p className="text-xs text-slate-500">Gateway</p>

            <h1 className="text-xl font-semibold text-slate-900">
              {gateway.name}
            </h1>
          </div>
        </div>

        <Button
          variant="outline"
          onClick={() => router.push(`/gateway?edit=${gateway.id}`)}
        >
          <Edit className="size-4" />
          Edit
        </Button>
      </div>

      {/* Gateway Information */}
      <section className="rounded-xl border border-slate-200 bg-white">
        <div className="border-b border-slate-200 px-6 py-5">
          <h2 className="text-base font-semibold text-slate-900">
            Gateway Information
          </h2>
        </div>

        <div className="grid grid-cols-1 gap-x-8 gap-y-6 p-6 md:grid-cols-2 lg:grid-cols-3">
          <InfoItem label="Gateway Name" value={gateway.name} />

          <InfoItem label="Gateway EUI" value={gateway.eui} />

          <InfoItem label="Gateway Model" value={gateway.modelUnit} />

          <InfoItem label="SIM Card" value={gateway.simcard} />

          <InfoItem label="Power Source" value={gateway.powerSource} />

          <InfoItem
            label="Installation Date"
            value={formatDate(gateway.installationDate)}
          />

          <InfoItem label="Installation Source" value={gateway.powerSource} />

          <InfoItem
            label="Installed By"
            value={gateway.installedBy?.fullName}
          />

          <InfoItem
            label="Status"
            value={<StatusBadge status={gateway.status} />}
          />

          <InfoItem
            label="Last Seen"
            value={formatDateTime(gateway.lastSeenAt)}
          />
        </div>

        <div className="border-t border-slate-200 px-6 py-5">
          <p className="mb-2 text-xs font-medium text-slate-500">Description</p>

          <p className="whitespace-pre-wrap text-sm leading-6 text-slate-700">
            {gateway.description || '-'}
          </p>
        </div>
      </section>

      {/* Connected Devices */}
      <section className="rounded-xl border border-slate-200 bg-white">
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-5">
          <div>
            <h2 className="text-base font-semibold text-slate-900">
              Connected Devices
            </h2>

            <p className="mt-1 text-xs text-slate-500">
              {gateway.devices?.length ?? 0} device(s)
            </p>
          </div>
        </div>

        {!gateway.devices?.length ? (
          <div className="flex flex-col items-center justify-center gap-3 px-6 py-12">
            <Router className="size-8 text-slate-300" />

            <p className="text-sm text-slate-500">
              No devices connected to this gateway.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50 text-left">
                  <th className="px-6 py-3 text-xs font-medium text-slate-500">
                    Device
                  </th>

                  <th className="px-6 py-3 text-xs font-medium text-slate-500">
                    Device EUI
                  </th>

                  <th className="px-6 py-3 text-xs font-medium text-slate-500">
                    Component
                  </th>

                  <th className="px-6 py-3 text-xs font-medium text-slate-500">
                    Status
                  </th>
                </tr>
              </thead>

              <tbody>
                {gateway.devices.map((device) => (
                  <tr
                    key={device.id}
                    className="border-b border-slate-100 last:border-0"
                  >
                    <td className="px-6 py-4 text-sm font-medium text-slate-900">
                      {device.name}
                    </td>

                    <td className="px-6 py-4 font-mono text-xs text-slate-600">
                      {device.eui || '-'}
                    </td>

                    <td className="px-6 py-4 text-sm text-slate-700">
                      {device.deviceType || '-'}
                    </td>

                    <td className="px-6 py-4">
                      <StatusBadge status={device.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
