import type { AlarmDTO } from '@/feat/alarm/dto';

export function formatAlarmDate(ts: number) {
  const d = new Date(ts);
  const date = new Intl.DateTimeFormat('en-CA', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(d);
  const time = d.toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
  return `${date} ${time}`;
}

export function timeAgo(ts: number) {
  const minutes = Math.floor((Date.now() - ts) / 60000);
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
  const days = Math.floor(hours / 24);
  return `${days} day${days > 1 ? 's' : ''} ago`;
}

export function alarmMessage(alarm: AlarmDTO) {
  return `${alarm.type} detected on ${alarm.deviceName} in ${alarm.roomName}`;
}

export function getAlarmColumns() {
  return {
    date: (alarm: AlarmDTO) => (
      <span className="text-slate-500">
        {formatAlarmDate(alarm.createdTime)}
      </span>
    ),
    subject: (alarm: AlarmDTO) => (
      <span className="font-medium text-slate-950">{alarm.deviceName}</span>
    ),
    status: (alarm: AlarmDTO) => {
      const unread = alarm.status === 'ACTIVE_UNACK';
      return (
        <span
          className={[
            'flex items-center gap-1.5 text-xs font-medium',
            unread ? 'text-red-500' : 'text-emerald-500',
          ].join(' ')}
        >
          <span
            className={[
              'size-2 rounded-full',
              unread ? 'bg-red-500' : 'bg-emerald-500',
            ].join(' ')}
          />
          {unread ? 'Unread' : 'Acknowledged'}
        </span>
      );
    },
    message: (alarm: AlarmDTO) => (
      <span className="text-slate-700">{alarmMessage(alarm)}</span>
    ),
  };
}
