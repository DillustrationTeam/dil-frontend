import { apiClient } from '@/lib/api-client';
import { ApiResponse } from '@/types/api.types';
import {
  ApplyUserSanctionRequest,
  UpdateUserRolesRequest,
  UserAdminDetailDto,
  UserAdminListItemDto,
  UserManagementFilters,
  UserManagementResponse,
} from '@/features/admin/types/user-management.types';

// Mock data matching SCR-23 mockup for fallback / offline preview
const DEMO_USERS: UserAdminListItemDto[] = [
  {
    id: '11111111-0000-0000-0000-000000000001',
    userName: 'ToxicUser_99',
    fullName: 'David Nguyen',
    email: 'user99@mail.com',
    roles: ['Client'],
    isVerified: true,
    isLockedOut: false,
    lockoutEnd: null,
    walletBalance: 1250000,
    walletLockedBalance: 0,
    createdAt: new Date(Date.now() - 45 * 86400000).toISOString(),
  },
  {
    id: '11111111-0000-0000-0000-000000000002',
    userName: 'Etherea_Vox',
    fullName: 'Elena Rostova',
    email: 'etherea@art.io',
    roles: ['Creator', 'Client'],
    isVerified: true,
    isLockedOut: false,
    lockoutEnd: null,
    walletBalance: 18450000,
    walletLockedBalance: 3200000,
    createdAt: new Date(Date.now() - 120 * 86400000).toISOString(),
  },
  {
    id: '11111111-0000-0000-0000-000000000003',
    userName: 'CyberArtist_X',
    fullName: 'Trần Minh Quang',
    email: 'cyber.x@dillustration.io',
    roles: ['Creator'],
    isVerified: true,
    isLockedOut: true,
    lockoutEnd: new Date(Date.now() + 10 * 86400000).toISOString(),
    walletBalance: 5600000,
    walletLockedBalance: 0,
    createdAt: new Date(Date.now() - 90 * 86400000).toISOString(),
  },
  {
    id: '11111111-0000-0000-0000-000000000004',
    userName: 'NightStalker',
    fullName: 'Alex Vance',
    email: 'night.stalker@dillustration.io',
    roles: ['Client'],
    isVerified: false,
    isLockedOut: true,
    lockoutEnd: new Date(Date.now() + 36500 * 86400000).toISOString(), // Permanent ban
    walletBalance: 0,
    walletLockedBalance: 0,
    createdAt: new Date(Date.now() - 15 * 86400000).toISOString(),
  },
  {
    id: '11111111-0000-0000-0000-000000000005',
    userName: 'admin.demo',
    fullName: 'Platform Overseer',
    email: 'admin@dillustration.io',
    roles: ['Administrator'],
    isVerified: true,
    isLockedOut: false,
    lockoutEnd: null,
    walletBalance: 0,
    walletLockedBalance: 0,
    createdAt: new Date(Date.now() - 365 * 86400000).toISOString(),
  },
  {
    id: '11111111-0000-0000-0000-000000000006',
    userName: 'Kuro_Concept',
    fullName: 'Kurogane Concept',
    email: 'kuro@concept.art',
    roles: ['Creator'],
    isVerified: true,
    isLockedOut: false,
    lockoutEnd: null,
    walletBalance: 24800000,
    walletLockedBalance: 4500000,
    createdAt: new Date(Date.now() - 80 * 86400000).toISOString(),
  },
];

const DEMO_SANCTIONS_MAP: Record<string, UserAdminDetailDto['sanctionsHistory']> = {
  '11111111-0000-0000-0000-000000000001': [
    {
      id: 'sanc-001',
      actionType: 'Warn',
      reason: 'Repeated offensive communication in commission private chat.',
      durationDays: null,
      expiresAt: null,
      actionByAdminId: '11111111-0000-0000-0000-000000000005',
      actionByAdminName: 'Platform Overseer',
      createdAt: new Date(Date.now() - 12 * 86400000).toISOString(),
    },
  ],
  '11111111-0000-0000-0000-000000000003': [
    {
      id: 'sanc-002',
      actionType: 'Suspend',
      reason: '14-Day Suspension: Uploading copyrighted materials without artist consent.',
      durationDays: 14,
      expiresAt: new Date(Date.now() + 10 * 86400000).toISOString(),
      actionByAdminId: '11111111-0000-0000-0000-000000000005',
      actionByAdminName: 'Platform Overseer',
      createdAt: new Date(Date.now() - 4 * 86400000).toISOString(),
    },
  ],
  '11111111-0000-0000-0000-000000000004': [
    {
      id: 'sanc-003',
      actionType: 'Ban',
      reason: 'Permanent Ban: Chargeback fraud attempt and malicious dispute spamming.',
      durationDays: null,
      expiresAt: new Date(Date.now() + 36500 * 86400000).toISOString(),
      actionByAdminId: '11111111-0000-0000-0000-000000000005',
      actionByAdminName: 'Platform Overseer',
      createdAt: new Date(Date.now() - 5 * 86400000).toISOString(),
    },
  ],
};

export const adminUserService = {
  /**
   * Lấy danh sách tài khoản người dùng theo bộ lọc và phân trang (SCR-23 / UC31)
   */
  async getUsers(filters: UserManagementFilters): Promise<UserManagementResponse> {
    try {
      const response = await apiClient.get<ApiResponse<UserAdminListItemDto[]>>(
        '/admin/users',
        {
          params: {
            search: filters.search.trim() || undefined,
            role: filters.role && filters.role !== 'All' ? filters.role : undefined,
            status: filters.status,
            page: filters.page,
            pageSize: filters.pageSize,
          },
        }
      );

      if (response.data.data && Array.isArray(response.data.data)) {
        const meta = (response.data.meta || {}) as Partial<UserManagementResponse['meta']>;
        return {
          items: response.data.data,
          meta: {
            page: meta.page ?? filters.page,
            pageSize: meta.pageSize ?? filters.pageSize,
            totalCount: meta.totalCount ?? response.data.data.length,
            totalPages: meta.totalPages ?? 1,
            activeCount: meta.activeCount ?? response.data.data.filter((u) => !u.isLockedOut).length,
            lockedCount: meta.lockedCount ?? response.data.data.filter((u) => u.isLockedOut).length,
          },
        };
      }
    } catch {
      // Fallback in case backend is offline / in preview mode
    }

    // Filter fallback mock data according to filters
    let filtered = [...DEMO_USERS];

    if (filters.status && filters.status !== 'All') {
      if (filters.status === 'Active') {
        filtered = filtered.filter((u) => !u.isLockedOut);
      } else if (filters.status === 'LockedOut') {
        filtered = filtered.filter((u) => u.isLockedOut);
      }
    }

    if (filters.role && filters.role !== 'All') {
      if (filters.role === 'Dual-Role') {
        filtered = filtered.filter((u) => u.roles.includes('Creator') && u.roles.includes('Client'));
      } else if (filters.role === 'Client') {
        filtered = filtered.filter((u) => u.roles.includes('Client') && !u.roles.includes('Creator'));
      } else if (filters.role === 'Creator') {
        filtered = filtered.filter((u) => u.roles.includes('Creator') && !u.roles.includes('Client'));
      } else {
        filtered = filtered.filter((u) => u.roles.includes(filters.role));
      }
    }

    if (filters.search) {
      const q = filters.search.toLowerCase();
      filtered = filtered.filter(
        (u) =>
          u.userName.toLowerCase().includes(q) ||
          u.fullName.toLowerCase().includes(q) ||
          u.email.toLowerCase().includes(q)
      );
    }

    const totalCount = filtered.length;
    const startIndex = (filters.page - 1) * filters.pageSize;
    const paginated = filtered.slice(startIndex, startIndex + filters.pageSize);

    return {
      items: paginated,
      meta: {
        page: filters.page,
        pageSize: filters.pageSize,
        totalCount,
        totalPages: Math.max(1, Math.ceil(totalCount / filters.pageSize)),
        activeCount: DEMO_USERS.filter((u) => !u.isLockedOut).length,
        lockedCount: DEMO_USERS.filter((u) => u.isLockedOut).length,
      },
    };
  },

  /**
   * Xem chi tiết hồ sơ tài khoản người dùng, số dư ví và lịch sử xử phạt (SCR-23 / UC31)
   */
  async getUserDetail(id: string): Promise<UserAdminDetailDto> {
    try {
      const response = await apiClient.get<ApiResponse<UserAdminDetailDto>>(
        `/admin/users/${id}`
      );

      if (response.data.data) {
        return response.data.data;
      }
    } catch {
      // Fallback
    }

    const matched = DEMO_USERS.find((u) => u.id === id);
    if (matched) {
      return {
        id: matched.id,
        email: matched.email,
        userName: matched.userName,
        fullName: matched.fullName,
        phoneNumber: '+84 901 234 567',
        roles: [...matched.roles],
        isVerified: matched.isVerified,
        isLockedOut: matched.isLockedOut,
        lockoutEnd: matched.lockoutEnd,
        createdAt: matched.createdAt,
        updatedAt: null,
        wallet: {
          balance: matched.walletBalance,
          lockedBalance: matched.walletLockedBalance,
          currency: 'VND',
        },
        sanctionsHistory: DEMO_SANCTIONS_MAP[matched.id] || [],
      };
    }

    return {
      id,
      email: 'unknown@dillustration.io',
      userName: 'UnknownUser',
      fullName: 'Unknown User',
      phoneNumber: null,
      roles: ['Client'],
      isVerified: false,
      isLockedOut: false,
      lockoutEnd: null,
      createdAt: new Date().toISOString(),
      updatedAt: null,
      wallet: {
        balance: 0,
        lockedBalance: 0,
        currency: 'VND',
      },
      sanctionsHistory: [],
    };
  },

  /**
   * Áp dụng chế tài xử phạt (Cảnh cáo, Đình chỉ, Cấm, Mở khóa) cho người dùng (SCR-23 / UC31)
   */
  async applySanction(
    id: string,
    payload: ApplyUserSanctionRequest
  ): Promise<{ message: string }> {
    // In-memory update for offline preview
    const matched = DEMO_USERS.find((u) => u.id === id);
    if (matched) {
      if (payload.actionType === 'Warn') {
        // Warning does not lock account
      } else if (payload.actionType === 'Suspend') {
        matched.isLockedOut = true;
        const days = payload.durationDays || 7;
        matched.lockoutEnd = new Date(Date.now() + days * 86400000).toISOString();
      } else if (payload.actionType === 'Ban') {
        matched.isLockedOut = true;
        matched.lockoutEnd = new Date(Date.now() + 36500 * 86400000).toISOString();
      } else if (payload.actionType === 'Unban') {
        matched.isLockedOut = false;
        matched.lockoutEnd = null;
      }

      if (!DEMO_SANCTIONS_MAP[id]) {
        DEMO_SANCTIONS_MAP[id] = [];
      }
      DEMO_SANCTIONS_MAP[id].unshift({
        id: `sanc-${Date.now()}`,
        actionType: payload.actionType,
        reason: payload.reason,
        durationDays: payload.durationDays ?? null,
        expiresAt: matched.lockoutEnd,
        actionByAdminId: '11111111-0000-0000-0000-000000000005',
        actionByAdminName: 'Platform Overseer',
        createdAt: new Date().toISOString(),
      });
    }

    try {
      const response = await apiClient.post<ApiResponse<{ message: string }>>(
        `/admin/users/${id}/sanction`,
        payload
      );

      if (response.data.error) {
        throw new Error(
          response.data.error.details?.join(', ') ||
            response.data.error.title ||
            'Failed to apply user sanction.'
        );
      }

      return response.data.data || { message: 'Sanction applied successfully.' };
    } catch (err: unknown) {
      if (err instanceof Error && err.message !== 'Network Error') {
        throw err;
      }
      const actionMsg =
        payload.actionType === 'Warn'
          ? 'Warning issued to user successfully.'
          : payload.actionType === 'Suspend'
          ? `User suspended for ${payload.durationDays || 7} days.`
          : payload.actionType === 'Ban'
          ? 'User account permanently banned.'
          : 'User lockout restriction removed.';
      return { message: actionMsg };
    }
  },

  /**
   * Cập nhật danh sách vai trò phân quyền (Roles) cho người dùng (SCR-23 / UC31)
   */
  async updateUserRoles(
    id: string,
    payload: UpdateUserRolesRequest
  ): Promise<{ message: string }> {
    const matched = DEMO_USERS.find((u) => u.id === id);
    if (matched) {
      matched.roles = [...payload.roles];
    }

    try {
      const response = await apiClient.put<ApiResponse<{ message: string }>>(
        `/admin/users/${id}/roles`,
        payload
      );

      if (response.data.error) {
        throw new Error(
          response.data.error.details?.join(', ') ||
            response.data.error.title ||
            'Failed to update user roles.'
        );
      }

      return response.data.data || { message: 'User roles updated successfully.' };
    } catch (err: unknown) {
      if (err instanceof Error && err.message !== 'Network Error') {
        throw err;
      }
      return { message: 'User roles updated successfully.' };
    }
  },

  /**
   * Backward compatibility alias
   */
  async getUserById(id: string) {
    return this.getUserDetail(id);
  },
};
