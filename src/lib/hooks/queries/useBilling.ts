import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api, getErrorMessage } from '../../api';
import { queryKeys } from '../../queryClient';
import type {
  PlanInfo,
  BillingOverview,
  Invoice,
  PlanType,
  SenderBillingOverview,
} from '../../types';

// Get billing plans
export const usePlans = () => {
  return useQuery({
    queryKey: queryKeys.billing.plans,
    queryFn: async () => {
      const response = await api.get<PlanInfo[]>('/billing/plans');
      return response.data;
    },
    staleTime: 1000 * 60 * 60, // 1 hour
  });
};

// Get billing overview
export const useBillingOverview = () => {
  return useQuery({
    queryKey: queryKeys.billing.overview,
    queryFn: async () => {
      const response = await api.get<BillingOverview>('/billing/overview');
      return response.data;
    },
  });
};

// Get invoices
export const useInvoices = (limit?: number) => {
  return useQuery({
    queryKey: queryKeys.billing.invoices,
    queryFn: async () => {
      const params = new URLSearchParams();
      if (limit) params.append('limit', limit.toString());

      const response = await api.get<Invoice[]>(`/billing/invoices?${params}`);
      return response.data;
    },
  });
};

// Create checkout session
export const useCreateCheckout = () => {
  return useMutation({
    mutationFn: async (plan: PlanType) => {
      const response = await api.post<{ checkout_url: string }>('/billing/checkout', { plan });
      return response.data;
    },
    onError: (error) => {
      throw new Error(getErrorMessage(error));
    },
  });
};

// Create billing portal session
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

// Change plan
export const useChangePlan = () => {
  return useMutation({
    mutationFn: async (newPlan: PlanType) => {
      const response = await api.post<BillingOverview>('/billing/change-plan', {
        new_plan: newPlan,
      });
      return response.data;
    },
    onError: (error) => {
      throw new Error(getErrorMessage(error));
    },
  });
};

// Cancel subscription
export const useCancelSubscription = () => {
  return useMutation({
    mutationFn: async () => {
      const response = await api.post<BillingOverview>('/billing/cancel');
      return response.data;
    },
    onError: (error) => {
      throw new Error(getErrorMessage(error));
    },
  });
};

// Reactivate subscription
export const useReactivateSubscription = () => {
  return useMutation({
    mutationFn: async () => {
      const response = await api.post<BillingOverview>('/billing/reactivate');
      return response.data;
    },
    onError: (error) => {
      throw new Error(getErrorMessage(error));
    },
  });
};

// ===== Sender-based billing hooks =====

// Get sender billing overview
export const useSenderBillingOverview = () => {
  return useQuery({
    queryKey: ['billing', 'senders', 'overview'],
    queryFn: async () => {
      const response = await api.get<SenderBillingOverview>('/billing/senders/overview');
      return response.data;
    },
  });
};

// Create sender checkout session
export const useCreateSenderCheckout = () => {
  return useMutation({
    mutationFn: async (senderCount: number) => {
      const response = await api.post<{ checkout_url: string }>('/billing/senders/checkout', {
        sender_count: senderCount,
      });
      return response.data;
    },
    onError: (error) => {
      throw new Error(getErrorMessage(error));
    },
  });
};

// Update sender count
export const useUpdateSenderCount = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (senderCount: number) => {
      const response = await api.post<SenderBillingOverview>('/billing/senders/update', {
        sender_count: senderCount,
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['billing', 'senders', 'overview'] });
    },
    onError: (error) => {
      throw new Error(getErrorMessage(error));
    },
  });
};
