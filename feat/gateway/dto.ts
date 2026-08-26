export interface GatewayDTO {
  id: string;
  eui: string;
  name: string;
  description: string | null;
  simcard: string | null;
  powerSource: string | null;
  modelUnit: string | null;
  installationDate: string | null;
  status: string;
  lastSeenAt: string | null;
  createdAt: string;
  updatedAt: string;
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
