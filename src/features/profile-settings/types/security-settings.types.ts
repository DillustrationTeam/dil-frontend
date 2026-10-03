export interface LinkedAccountsDto {
  hasPassword: boolean;
  linkedProviders: string[];
}

export interface SessionDto {
  id: string;
  createdByIp?: string | null;
  userAgent?: string | null;
  createdAt: string;
  lastUsedAt?: string | null;
  isCurrent: boolean;
}
