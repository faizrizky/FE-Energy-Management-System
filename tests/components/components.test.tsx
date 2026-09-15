import { fireEvent, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Inbox, Trash2 } from 'lucide-react';
import { beforeEach, describe, expect, test, vi } from 'vitest';

vi.mock('next/link', () => ({
  default: ({ href, children }: { href: string; children: React.ReactNode }) => <a href={href}>{children}</a>,
}));

import { DevicePowerControl } from '@/components/shared/device-power-control';
import { SearchInput } from '@/components/shared/search-input';
import { EmptyState } from '@/components/shared/empty-state';
import { SegmentTabs } from '@/components/shared/segment-tabs';
import { TableActionButton } from '@/components/shared/table-action-button';
import { ErrorState } from '@/components/shared/error-state';
import { ConfirmDialog } from '@/components/shared/confirm-dialog';
import { StatusDot } from '@/components/shared/status-dot';
import { Pagination } from '@/components/ui/pagination';
import { Switch } from '@/components/ui/switch';
import { getDeviceColumns } from '@/column/device';
import { getRoomDevicesColumns } from '@/column/room-devices';
import { getRoomsColumns } from '@/column/rooms';
import { RoomCard } from '@/app/(protected)/rooms/_partials/room-card';
import type { DeviceDTO } from '@/feat/device/dto';
import type { RoomDeviceDTO, RoomListItemDTO } from '@/feat/rooms/dto';

let observerCallback: ((entries: { isIntersecting: boolean }[]) => void) | null = null;

beforeEach(() => {
  observerCallback = null;
  vi.stubGlobal(
    'IntersectionObserver',
    class {
      constructor(cb: (entries: { isIntersecting: boolean }[]) => void) {
        observerCallback = cb;
      }
      observe() {}
      disconnect() {}
    }
  );
});

describe('Switch', () => {
  test('[positive] label On/Off & aria-checked mengikuti state', () => {
    const { rerender } = render(<Switch checked onCheckedChange={() => {}} />);
    expect(screen.getByRole('switch')).toHaveAttribute('aria-checked', 'true');
    expect(screen.getByText('On')).toBeInTheDocument();
    rerender(<Switch checked={false} onCheckedChange={() => {}} offLabel="Mati" />);
    expect(screen.getByText('Mati')).toBeInTheDocument();
  });

  test('[negative] disabled -> klik tidak memanggil handler', async () => {
    const onChange = vi.fn();
    render(<Switch checked={false} disabled onCheckedChange={onChange} />);
    await userEvent.click(screen.getByRole('switch'));
    expect(onChange).not.toHaveBeenCalled();
  });
});

describe('DevicePowerControl', () => {
  test('[positive] tidak pending -> hanya switch, klik memanggil onToggle', async () => {
    const onToggle = vi.fn();
    render(<DevicePowerControl checked onToggle={onToggle} onCancel={vi.fn()} />);
    expect(screen.queryByText('Waiting for meter')).not.toBeInTheDocument();
    expect(screen.queryByLabelText('Cancel power command')).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole('switch'));
    expect(onToggle).toHaveBeenCalledTimes(1);
  });

  test('[positive] pending -> label, tooltip catatan, aria-busy & tombol batal', async () => {
    const onCancel = vi.fn();
    render(<DevicePowerControl checked={false} pending pendingTitle="Percobaan ke-2" onToggle={vi.fn()} onCancel={onCancel} />);
    expect(screen.getByRole('switch')).toHaveAttribute('aria-busy', 'true');
    expect(screen.getByText('Waiting for meter').closest('span')).toHaveAttribute('title', 'Percobaan ke-2');
    await userEvent.click(screen.getByLabelText('Cancel power command'));
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  test('[negative] pending tanpa onCancel -> tanpa tombol batal; switch tetap bisa diklik (menggantikan perintah)', async () => {
    const onToggle = vi.fn();
    render(<DevicePowerControl checked pending pendingLabel="2 pending" onToggle={onToggle} />);
    expect(screen.getByText('2 pending')).toBeInTheDocument();
    expect(screen.queryByLabelText('Cancel power command')).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole('switch'));
    expect(onToggle).toHaveBeenCalled();
  });
});

describe('SearchInput', () => {
  test('[positive] mengetik memanggil onChange dengan nilai input', () => {
    const onChange = vi.fn();
    render(<SearchInput value="" onChange={onChange} placeholder="Cari device" />);
    fireEvent.change(screen.getByPlaceholderText('Cari device'), { target: { value: 'AC' } });
    expect(onChange).toHaveBeenCalledWith('AC');
    expect(screen.queryByLabelText('Clear search')).not.toBeInTheDocument();
  });

  test('[positive] tombol clear muncul saat ada nilai & mengosongkan', async () => {
    const onChange = vi.fn();
    render(<SearchInput value="AC" onChange={onChange} />);
    await userEvent.click(screen.getByLabelText('Clear search'));
    expect(onChange).toHaveBeenCalledWith('');
  });
});

describe('EmptyState, ErrorState, StatusDot, TableActionButton, SegmentTabs', () => {
  test('[positive] EmptyState menampilkan judul, deskripsi & aksi opsional', () => {
    const { rerender } = render(<EmptyState icon={Inbox} title="Kosong" description="Belum ada data" action={<button>Tambah</button>} />);
    expect(screen.getByText('Kosong')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Tambah' })).toBeInTheDocument();
    rerender(<EmptyState icon={Inbox} title="Kosong" description="Belum ada data" />);
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  test('[positive/negative] ErrorState: href -> link; tanpa href -> tombol aksi', async () => {
    const { rerender } = render(<ErrorState title="Error" description="d" actionLabel="Muat ulang" actionHref="/dashboard" />);
    expect(screen.getByRole('link', { name: 'Muat ulang' })).toHaveAttribute('href', '/dashboard');
    const onAction = vi.fn();
    rerender(<ErrorState title="Error" description="d" actionLabel="Coba lagi" onAction={onAction} />);
    await userEvent.click(screen.getByRole('button', { name: 'Coba lagi' }));
    expect(onAction).toHaveBeenCalled();
  });

  test('[positive] StatusDot tone success/error', () => {
    const { rerender } = render(<StatusDot label={3} />);
    expect(screen.getByText('3')).toHaveClass('text-green-500');
    rerender(<StatusDot label={1} tone="error" />);
    expect(screen.getByText('1')).toHaveClass('text-red-500');
  });

  test('[positive/negative] TableActionButton klik & disabled', async () => {
    const onClick = vi.fn();
    const { rerender } = render(<TableActionButton icon={Trash2} aria-label="Hapus" onClick={onClick} tone="destructive" />);
    await userEvent.click(screen.getByLabelText('Hapus'));
    expect(onClick).toHaveBeenCalledTimes(1);
    rerender(<TableActionButton icon={Trash2} aria-label="Hapus" onClick={onClick} disabled />);
    await userEvent.click(screen.getByLabelText('Hapus'));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  test('[positive] SegmentTabs menandai tab aktif & memanggil onValueChange', async () => {
    const onValueChange = vi.fn();
    render(<SegmentTabs value="a" onValueChange={onValueChange} options={[{ value: 'a', label: 'A' }, { value: 'b', label: 'B' }]} />);
    expect(screen.getByRole('button', { name: 'A' })).toHaveClass('bg-emerald-500');
    await userEvent.click(screen.getByRole('button', { name: 'B' }));
    expect(onValueChange).toHaveBeenCalledWith('b');
  });
});

describe('ConfirmDialog', () => {
  test('[positive] mode bulk: jumlah item & label tombol', async () => {
    const onConfirm = vi.fn();
    render(<ConfirmDialog open title="Hapus device" count={3} itemLabel="device" onConfirm={onConfirm} onCancel={vi.fn()} />);
    expect(screen.getByText('3 selected devices')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Yes, Delete (3)' }));
    expect(onConfirm).toHaveBeenCalled();
  });

  test('[positive] satu item -> tanpa bentuk jamak; batal memanggil onCancel', async () => {
    const onCancel = vi.fn();
    render(<ConfirmDialog open title="Hapus" count={1} itemLabel="room" onConfirm={vi.fn()} onCancel={onCancel} />);
    expect(screen.getByText('1 selected room')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'No, cancel' }));
    expect(onCancel).toHaveBeenCalled();
  });

  test('[negative] sedang memproses -> tombol disabled & label Deleting...', () => {
    render(<ConfirmDialog open title="Hapus" description="Yakin?" confirming onConfirm={vi.fn()} onCancel={vi.fn()} />);
    expect(screen.getByRole('button', { name: 'Deleting...' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'No, cancel' })).toBeDisabled();
  });

  test('[negative] tertutup -> tidak dirender', () => {
    render(<ConfirmDialog open={false} title="Hapus" onConfirm={vi.fn()} onCancel={vi.fn()} />);
    expect(screen.queryByText('Hapus')).not.toBeInTheDocument();
  });
});

describe('Pagination', () => {
  function setup(page: number, totalPages: number) {
    const onPageChange = vi.fn();
    const onRowsPerPageChange = vi.fn();
    render(<Pagination page={page} totalPages={totalPages} onPageChange={onPageChange} rowsPerPage={10} onRowsPerPageChange={onRowsPerPageChange} />);
    return { onPageChange, onRowsPerPageChange };
  }

  test('[positive] ≤ 5 halaman -> semua nomor tampil, klik nomor pindah halaman', async () => {
    const { onPageChange } = setup(2, 4);
    expect(['1', '2', '3', '4'].map((n) => screen.getByRole('button', { name: n }))).toHaveLength(4);
    await userEvent.click(screen.getByRole('button', { name: '3' }));
    expect(onPageChange).toHaveBeenCalledWith(3);
  });

  test('[positive] > 5 halaman -> 1,2,3,…,terakhir', () => {
    setup(1, 12);
    expect(screen.getByText('…')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '12' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: '4' })).not.toBeInTheDocument();
  });

  test('[negative] halaman pertama -> Prev disabled; halaman terakhir -> Next disabled', async () => {
    const first = setup(1, 3);
    expect(screen.getByRole('button', { name: 'Prev' })).toBeDisabled();
    await userEvent.click(screen.getByRole('button', { name: 'Next' }));
    expect(first.onPageChange).toHaveBeenCalledWith(2);
  });

  test('[negative] halaman terakhir -> Next disabled', () => {
    setup(3, 3);
    expect(screen.getByRole('button', { name: 'Next' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Prev' })).toBeEnabled();
  });

  test('[positive] ubah jumlah baris & dock mobile muncul saat sentinel terlihat', async () => {
    const { onRowsPerPageChange } = setup(2, 5);
    fireEvent.change(screen.getAllByRole('combobox')[0], { target: { value: '50' } });
    expect(onRowsPerPageChange).toHaveBeenCalledWith(50);

    expect(screen.queryByText('Page 2/5')).not.toBeInTheDocument();
    await import('@testing-library/react').then(({ act }) => act(() => observerCallback?.([{ isIntersecting: true }])));
    expect(screen.getByText('Page 2/5')).toBeInTheDocument();
  });
});

describe('column renderers & RoomCard', () => {
  const device: DeviceDTO = {
    id: 'd1',
    eui: 'E1',
    tbDeviceId: null,
    name: 'AC',
    deviceType: null,
    intervalMinutes: 30,
    status: 'off',
    lastSeenAt: null,
    roomId: 'r1',
    gatewayId: 'g1',
    room: { id: 'r1', name: 'Server', location: null },
    gateway: null,
    createdAt: '',
    updatedAt: '',
    pendingCommand: null,
  };

  function handlers() {
    return {
      onToggleSelect: vi.fn(),
      isSelected: vi.fn(() => false),
      onTogglePower: vi.fn(),
      onCancelPower: vi.fn(),
      onView: vi.fn(),
      onEdit: vi.fn(),
      onDelete: vi.fn(),
      onViewLog: vi.fn(),
      onIntervalChange: vi.fn(),
    };
  }

  test('[positive] device column: fallback "-"/"Not mapped" & aksi memanggil handler', async () => {
    const h = handlers();
    const cols = getDeviceColumns(h);
    render(
      <div>
        {cols.component(device)}
        {cols.gateway(device)}
        {cols.tbDeviceId(device)}
        {cols.room(device)}
        {cols.action(device)}
        {cols.checkbox(device)}
      </div>
    );
    expect(screen.getByText('Not mapped')).toHaveClass('text-status-error');
    expect(screen.getAllByText('-')).toHaveLength(2);
    await userEvent.click(screen.getByLabelText('Edit AC'));
    await userEvent.click(screen.getByLabelText('Delete AC'));
    await userEvent.click(screen.getByLabelText('View AC'));
    await userEvent.click(screen.getByRole('checkbox'));
    expect(h.onEdit).toHaveBeenCalledWith(device);
    expect(h.onDelete).toHaveBeenCalledWith(device);
    expect(h.onView).toHaveBeenCalledWith(device);
    expect(h.onToggleSelect).toHaveBeenCalledWith('d1');
  });

  test('[positive] device status saat pending menampilkan TARGET perintah, bukan status lama', async () => {
    const h = handlers();
    const pending = { ...device, status: 'off' as const, pendingCommand: { id: 'c1', action: 'on' as const, notes: 'menunggu', requestedAt: '', deadline: '' } };
    render(<div>{getDeviceColumns(h).status(pending)}</div>);
    expect(screen.getByRole('switch')).toHaveAttribute('aria-checked', 'true');
    await userEvent.click(screen.getByLabelText('Cancel power command'));
    expect(h.onCancelPower).toHaveBeenCalledWith(pending);
  });

  test('[negative] device tanpa pending -> switch sesuai status & tanpa tombol batal', async () => {
    const h = handlers();
    render(<div>{getDeviceColumns(h).status(device)}</div>);
    expect(screen.getByRole('switch')).toHaveAttribute('aria-checked', 'false');
    await userEvent.click(screen.getByRole('switch'));
    expect(h.onTogglePower).toHaveBeenCalledWith(device);
  });

  test('[positive] room-devices column: pending & aksi log/hapus', async () => {
    const h = handlers();
    const row: RoomDeviceDTO = {
      id: 'd1',
      tbDeviceId: '08000000410000e4',
      deviceEui: 'E1',
      deviceType: 'AC',
      totalUsage24hKwh: 3.4,
      intervalMinutes: 30,
      isPowerOn: true,
      pendingCommand: { id: 'c1', action: 'off', notes: null, requestedAt: '', deadline: '' },
    };
    const cols = getRoomDevicesColumns(h);
    render(<div>{cols.status(row)}{cols.usage(row)}{cols.interval(row)}{cols.action(row)}</div>);
    expect(screen.getByRole('switch')).toHaveAttribute('aria-checked', 'false');
    expect(screen.getByText('3 kWh')).toBeInTheDocument();
    expect(screen.getByText('30 minute(s)')).toBeInTheDocument();
    await userEvent.click(screen.getByLabelText('View log for 08000000410000e4'));
    expect(h.onViewLog).toHaveBeenCalledWith(row);
  });

  const room: RoomListItemDTO = {
    id: 'r1',
    name: 'Server',
    location: 'Lt 1',
    gatewayId: 'g1',
    devicesOnline: 2,
    devicesOffline: 0,
    totalUsage24hKwh: 12,
    isPowerOn: true,
    pendingCommandCount: 2,
    isCritical: false,
  };

  test('[positive] rooms column: jumlah pending & status online saja (offline 0 disembunyikan)', async () => {
    const h = handlers();
    const cols = getRoomsColumns(h);
    render(<div>{cols.status(room)}{cols.device(room)}{cols.action(room)}</div>);
    expect(screen.getByText('2 pending')).toBeInTheDocument();
    expect(screen.getByText('2')).toHaveClass('text-green-500');
    expect(screen.queryByText('0')).not.toBeInTheDocument();
    await userEvent.click(screen.getByLabelText('View Server'));
    expect(h.onView).toHaveBeenCalledWith(room);
  });

  test('[negative] RoomCard tanpa pending & tanpa gateway', async () => {
    const h = handlers();
    render(<RoomCard room={{ ...room, pendingCommandCount: 0, gatewayId: null as unknown as string, devicesOnline: 0, devicesOffline: 3 }} onTogglePower={h.onTogglePower} onView={h.onView} onEdit={h.onEdit} onDelete={h.onDelete} />);
    const card = screen.getByText('Server').closest('div')!.parentElement!.parentElement!;
    expect(within(card).queryByText(/pending/)).not.toBeInTheDocument();
    expect(within(card).getByText('-')).toBeInTheDocument();
    expect(within(card).getByText('3 offline')).toBeInTheDocument();
    await userEvent.click(within(card).getByRole('switch'));
    expect(h.onTogglePower).toHaveBeenCalled();
  });
});
