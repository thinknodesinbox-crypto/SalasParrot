import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type {
  AdminUser,
  AdminUserListResponse,
  AdminUserUpdate,
  PartnerCode,
  PartnerCodeDetail,
  PartnerCodeListResponse,
  PartnerCodeCreate,
  PartnerCodeUpdate,
  PartnerCodeTemplate,
  PartnerCodeAnalytics,
  ImpersonateResponse,
  AdminOverviewStats,
  AdminSignupTrends,
} from '@/lib/types';

// ============ Users ============

interface UseAdminUsersParams {
  page?: number;
  perPage?: number;
  search?: string;
  isActive?: boolean;
  isAdmin?: boolean;
  subscriptionStatus?: string;
  plan?: string;
}

export function useAdminUsers(params: UseAdminUsersParams = {}) {
  const { page = 1, perPage = 20, search, isActive, isAdmin, subscriptionStatus, plan } = params;

  return useQuery({
    queryKey: ['admin', 'users', params],
    queryFn: async () => {
      const searchParams = new URLSearchParams();
      searchParams.set('page', page.toString());
      searchParams.set('per_page', perPage.toString());
      if (search) searchParams.set('search', search);
      if (isActive !== undefined) searchParams.set('is_active', isActive.toString());
      if (isAdmin !== undefined) searchParams.set('is_admin', isAdmin.toString());
      if (subscriptionStatus) searchParams.set('subscription_status', subscriptionStatus);
      if (plan) searchParams.set('plan', plan);

      const response = await api.get<AdminUserListResponse>(`/admin/users?${searchParams}`);
      return response.data;
    },
  });
}

export function useAdminUser(userId: string) {
  return useQuery({
    queryKey: ['admin', 'users', userId],
    queryFn: async () => {
      const response = await api.get<AdminUser>(`/admin/users/${userId}`);
      return response.data;
    },
    enabled: !!userId,
  });
}

export function useUpdateAdminUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ userId, data }: { userId: string; data: AdminUserUpdate }) => {
      const response = await api.patch<AdminUser>(`/admin/users/${userId}`, data);
      return response.data;
    },
    onSuccess: (_, { userId }) => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'users', userId] });
    },
  });
}

export function useDeleteAdminUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ userId, permanent = false }: { userId: string; permanent?: boolean }) => {
      await api.delete(`/admin/users/${userId}`, {
        params: permanent ? { permanent: true } : undefined,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
    },
  });
}

export function useImpersonateUser() {
  return useMutation({
    mutationFn: async (userId: string) => {
      const response = await api.post<ImpersonateResponse>(`/admin/users/${userId}/impersonate`);
      return response.data;
    },
  });
}

// ============ Partner Codes ============

interface UsePartnerCodesParams {
  page?: number;
  perPage?: number;
  search?: string;
  isActive?: boolean;
  expired?: boolean;
}

export function usePartnerCodes(params: UsePartnerCodesParams = {}) {
  const { page = 1, perPage = 20, search, isActive, expired } = params;

  return useQuery({
    queryKey: ['admin', 'partner-codes', params],
    queryFn: async () => {
      const searchParams = new URLSearchParams();
      searchParams.set('page', page.toString());
      searchParams.set('per_page', perPage.toString());
      if (search) searchParams.set('search', search);
      if (isActive !== undefined) searchParams.set('is_active', isActive.toString());
      if (expired !== undefined) searchParams.set('expired', expired.toString());

      const response = await api.get<PartnerCodeListResponse>(
        `/admin/partner-codes?${searchParams}`
      );
      return response.data;
    },
  });
}

export function usePartnerCode(codeId: string) {
  return useQuery({
    queryKey: ['admin', 'partner-codes', codeId],
    queryFn: async () => {
      const response = await api.get<PartnerCodeDetail>(`/admin/partner-codes/${codeId}`);
      return response.data;
    },
    enabled: !!codeId,
  });
}

export function usePartnerCodeTemplates() {
  return useQuery({
    queryKey: ['admin', 'partner-codes', 'templates'],
    queryFn: async () => {
      const response = await api.get<PartnerCodeTemplate[]>('/admin/partner-codes/templates');
      return response.data;
    },
  });
}

export function usePartnerCodeAnalytics(codeId: string) {
  return useQuery({
    queryKey: ['admin', 'partner-codes', codeId, 'analytics'],
    queryFn: async () => {
      const response = await api.get<PartnerCodeAnalytics>(
        `/admin/partner-codes/${codeId}/analytics`
      );
      return response.data;
    },
    enabled: !!codeId,
  });
}

export function usePartnerCodeUsers(codeId: string, page: number = 1, perPage: number = 20) {
  return useQuery({
    queryKey: ['admin', 'partner-codes', codeId, 'users', { page, perPage }],
    queryFn: async () => {
      const response = await api.get(
        `/admin/partner-codes/${codeId}/users?page=${page}&per_page=${perPage}`
      );
      return response.data;
    },
    enabled: !!codeId,
  });
}

export function useCreatePartnerCode() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: PartnerCodeCreate) => {
      const response = await api.post<PartnerCode>('/admin/partner-codes', data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'partner-codes'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'stats'] });
    },
  });
}

export function useUpdatePartnerCode() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ codeId, data }: { codeId: string; data: PartnerCodeUpdate }) => {
      const response = await api.patch<PartnerCode>(`/admin/partner-codes/${codeId}`, data);
      return response.data;
    },
    onSuccess: (_, { codeId }) => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'partner-codes'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'partner-codes', codeId] });
    },
  });
}

export function useDisablePartnerCode() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (codeId: string) => {
      const response = await api.post<PartnerCode>(`/admin/partner-codes/${codeId}/disable`);
      return response.data;
    },
    onSuccess: (_, codeId) => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'partner-codes'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'partner-codes', codeId] });
    },
  });
}

export function useEnablePartnerCode() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (codeId: string) => {
      const response = await api.post<PartnerCode>(`/admin/partner-codes/${codeId}/enable`);
      return response.data;
    },
    onSuccess: (_, codeId) => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'partner-codes'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'partner-codes', codeId] });
    },
  });
}

export function useDuplicatePartnerCode() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ codeId, newCode }: { codeId: string; newCode?: string }) => {
      const params = newCode ? `?new_code=${newCode}` : '';
      const response = await api.post<PartnerCode>(
        `/admin/partner-codes/${codeId}/duplicate${params}`
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'partner-codes'] });
    },
  });
}

export function useDeletePartnerCode() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (codeId: string) => {
      await api.delete(`/admin/partner-codes/${codeId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'partner-codes'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'stats'] });
    },
  });
}

// ============ Stats ============

export function useAdminStats() {
  return useQuery({
    queryKey: ['admin', 'stats'],
    queryFn: async () => {
      const response = await api.get<AdminOverviewStats>('/admin/stats');
      return response.data;
    },
  });
}

export function useAdminSignupTrends(days: number = 30) {
  return useQuery({
    queryKey: ['admin', 'stats', 'signups', days],
    queryFn: async () => {
      const response = await api.get<AdminSignupTrends>(`/admin/stats/signups?days=${days}`);
      return response.data;
    },
  });
}
