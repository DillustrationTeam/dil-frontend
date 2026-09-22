// ==========================================
// SCREEN 23 (SCR-23 / UC31): USER ACCOUNT MANAGEMENT & SANCTIONS
// ==========================================

export type UserSanctionActionType = 'Warn' | 'Suspend' | 'Ban' | 'Unban';

export type UserAccountStatus = 'All' | 'Active' | 'LockedOut';

export interface UserAdminListItemDto {
  id: string;
  email: string;
  userName: string;
  fullName: string;
  roles: string[];
  isVerified: boolean;
  isLockedOut: boolean;
  lockoutEnd: string | null;
  walletBalance: number;
  walletLockedBalance: number;
  createdAt: string;
}

export interface UserAdminWalletDto {
  balance: number;
  lockedBalance: number;
  currency: string;
}

export interface UserSanctionHistoryDto {
  id: string;
  actionType: string;
  reason: string;
  durationDays: number | null;
  expiresAt: string | null;
  actionByAdminId: string;
  actionByAdminName: string;
  createdAt: string;
}

export interface UserAdminDetailDto {
  id: string;
  email: string;
  userName: string;
  fullName: string;
  phoneNumber?: string | null;
  roles: string[];
  isVerified: boolean;
  isLockedOut: boolean;
  lockoutEnd: string | null;
  createdAt: string;
  updatedAt?: string | null;
  wallet: UserAdminWalletDto | null;
  sanctionsHistory: UserSanctionHistoryDto[];
}

export interface ApplyUserSanctionRequest {
  actionType: UserSanctionActionType;
  reason: string;
  durationDays?: number | null;
}

export interface UpdateUserRolesRequest {
  roles: string[];
}

export interface UserManagementFilters {
  search: string;
  role: string;
  status: UserAccountStatus;
  page: number;
  pageSize: number;
}

export interface UserManagementMeta {
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
  activeCount: number;
  lockedCount: number;
}

export interface UserManagementResponse {
  items: UserAdminListItemDto[];
  meta: UserManagementMeta;
}
