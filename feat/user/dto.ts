/**
 * Minimal shape used only to populate "Installed by" dropdowns
 * (Gateway/Device forms). This is NOT the full User module — that's Fase 7.
 */
export interface UserSummaryDTO {
  id: string;
  fullName: string;
  username: string;
}
