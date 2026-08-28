const MODULE_LABELS: Record<string, string> = {
  dashboard: 'Dashboard',
  schedule: 'Schedule',
  room: 'Room',
  device: 'Device',
  gateway: 'Gateway',
  report: 'Report',
  user: 'User',
  role: 'Role',
  alarm: 'Alarm',
};

const ACTION_LABELS: Record<string, string> = {
  view: 'View',
  create: 'Create',
  edit: 'Edit',
  delete: 'Delete',
  power_control: 'Power on/off',
  export: 'Export',
  list: 'List report',
  ack: 'Acknowledge alarm',
};

export function moduleLabel(module: string): string {
  return (
    MODULE_LABELS[module] ?? module.charAt(0).toUpperCase() + module.slice(1)
  );
}

export function permissionLabel(module: string, action: string): string {
  const actionText = ACTION_LABELS[action] ?? action.replace(/_/g, ' ');
  if (action === 'list') return actionText;
  return `${actionText} ${moduleLabel(module).toLowerCase()}`;
}
