export type GatewayStatus = 'online' | 'offline';

export interface GatewayInstallerDTO {
  id: string;
  fullName: string;
}

export interface GatewayDTO {
  id: string;
  eui: string;
  name: string;
  description: string | null;
  simcard: string | null;
  powerSource: string | null;
  modelUnit: string | null;
  installationDate: string | null;
  status: GatewayStatus;
  lastSeenAt: string | null;
  installedById: string | null;
  installedBy: GatewayInstallerDTO | null;
  createdAt: string;
  updatedAt: string;
}

export interface GatewayListResponseDTO {
  data: GatewayDTO[];
  page: number;
  rowsPerPage: number;
  totalRows: number;
  totalPages: number;
}

export interface GatewayDeviceSummaryDTO {
  id: string;
  eui: string;
  name: string;
  deviceType: string | null;
  status: string;
}

export interface GatewayDetailDTO extends GatewayDTO {
  devices: GatewayDeviceSummaryDTO[];
}
