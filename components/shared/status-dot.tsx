import { cn } from '@/lib/utils';

/**
 * Titik status hijau/merah plus label (misal jumlah online/offline).
 *
 * Dipake di: gateway/client.tsx, analytic-card.tsx, column/gateway.tsx,
 *   column/rooms.tsx.
 */
export function StatusDot({
  label,
  tone = 'success',
}: {
  label: string | number;
  tone?: 'success' | 'error';
}) {
  return (
    <div className="flex items-center gap-2">
      <span
        className={cn(
          'size-2 rounded-full',
          tone === 'success'
            ? 'bg-green-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]'
            : 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.4)]'
        )}
      />
      <span
        className={cn(
          'text-xs',
          tone === 'success' ? 'text-green-500' : 'text-red-500'
        )}
      >
        {label}
      </span>
    </div>
  );
}
