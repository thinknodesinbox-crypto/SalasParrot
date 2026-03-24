import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api, getErrorMessage } from '../../api';
import { queryKeys } from '../../queryClient';
import type {
  BillingOverview,
  Invoice,
  PricingInfo,
  GrowthCheckoutRequest,
  AgencyCheckoutRequest,
  UpdateGrowthSendersRequest,
  UpdateAgencyExtraSendersRequest,
} from '../../types';

// =============================================================================
// Queries
// =============================================================================

export const usePricingInfo = () => {
  return useQuery({
    queryKey: queryKeys.billing.pricing,
    queryFn: async () => {
      const response = await api.get<PricingInfo>('/billing/pricing');
      return response.data;
    },
    staleTime: 1000 * 60 * 60, // 1 hour - pricing rarely changes
  });
};

export const useBillingOverview = () => {
  return useQuery({
    queryKey: queryKeys.billing.overview,
    queryFn: async () => {
      const response = await api.get<BillingOverview>('/billing/overview');
      return response.data;
    },
  });
};

export const useInvoices = (limit: number = 10) => {
  return useQuery({
    queryKey: queryKeys.billing.invoices,
    queryFn: async () => {
      const response = await api.get<Invoice[]>(`/billing/invoices?limit=${limit}`);
      return response.data;
    },
  });
};

// =============================================================================
// Growth Plan Mutations
// =============================================================================

export const useCreateGrowthCheckout = () => {
  return useMutation({
    mutationFn: async (data: GrowthCheckoutRequest) => {
      const response = await api.post<{ checkout_url: string }>('/billing/growth/checkout', data);
      return response.data;
    },
    onError: (error) => {
      throw new Error(getErrorMessage(error));
    },
  });
};

export const useUpdateGrowthSenders = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: UpdateGrowthSendersRequest) => {
      const response = await api.post<BillingOverview>('/billing/growth/update-senders', data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.billing.overview });
    },
    onError: (error) => {
      throw new Error(getErrorMessage(error));
    },
  });
};

// =============================================================================
// Agency Plan Mutations
// =============================================================================

export const useCreateAgencyCheckout = () => {
  return useMutation({
    mutationFn: async (data: AgencyCheckoutRequest = {}) => {
      const response = await api.post<{ checkout_url: string }>('/billing/agency/checkout', data);
      return response.data;
    },
    onError: (error) => {
      throw new Error(getErrorMessage(error));
    },
  });
};

export const useUpdateAgencyExtraSenders = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: UpdateAgencyExtraSendersRequest) => {
      const response = await api.post<BillingOverview>('/billing/agency/extra-senders', data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.billing.overview });
    },
    onError: (error) => {
      throw new Error(getErrorMessage(error));
    },
  });
};

// =============================================================================
// Common Billing Mutations
// =============================================================================

export const useCreatePortalSession = () => {
  return useMutation({
    mutationFn: async () => {
      const response = await api.post<{ portal_url: string }>('/billing/portal');
      return response.data;
    },
    onError: (error) => {
      throw new Error(getErrorMessage(error));
    },
  });
};

export const useCancelSubscription = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const response = await api.post<BillingOverview>('/billing/cancel');
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.billing.overview });
    },
    onError: (error) => {
      throw new Error(getErrorMessage(error));
    },
  });
};

export const useReactivateSubscription = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const response = await api.post<BillingOverview>('/billing/reactivate');
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.billing.overview });
    },
    onError: (error) => {
      throw new Error(getErrorMessage(error));
    },
  });
};
