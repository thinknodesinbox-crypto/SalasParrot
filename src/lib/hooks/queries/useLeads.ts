import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api, getErrorMessage } from '../../api'
import { queryKeys } from '../../queryClient'
import type { Lead, LeadListResponse, LeadStatus } from '../../types'

interface LeadFilters {
  workspace_id?: string
  campaign_id?: string
  status?: LeadStatus
  search?: string
  limit?: number
  offset?: number
}

interface CreateLeadData {
  linkedin_url?: string
  first_name?: string
  last_name?: string
  headline?: string
  company?: string
  title?: string
  email?: string
  campaign_id?: string
  workspace_id?: string
}

interface UpdateLeadData {
  first_name?: string
  last_name?: string
  headline?: string
  company?: string
  title?: string
  email?: string
  status?: LeadStatus
  tags?: string[]
}

interface ImportLeadsData {
  leads: CreateLeadData[]
  campaign_id?: string
  workspace_id?: string
}

interface ImportResult {
  created: number
  skipped: number
  errors: string[]
}

// List leads
export const useLeads = (filters?: LeadFilters) => {
  return useQuery({
    queryKey: queryKeys.leads.list(filters),
    queryFn: async () => {
      const params = new URLSearchParams()
      if (filters?.workspace_id) params.append('workspace_id', filters.workspace_id)
      if (filters?.campaign_id) params.append('campaign_id', filters.campaign_id)
      if (filters?.status) params.append('status', filters.status)
      if (filters?.search) params.append('search', filters.search)
      if (filters?.limit) params.append('limit', filters.limit.toString())
      if (filters?.offset) params.append('offset', filters.offset.toString())

      const response = await api.get<LeadListResponse>(`/leads?${params}`)
      return response.data
    },
  })
}

// Get lead by ID
export const useLead = (leadId: string) => {
  return useQuery({
    queryKey: queryKeys.leads.detail(leadId),
    queryFn: async () => {
      const response = await api.get<Lead>(`/leads/${leadId}`)
      return response.data
    },
    enabled: !!leadId,
  })
}

// Create lead
export const useCreateLead = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: CreateLeadData) => {
      const response = await api.post<Lead>('/leads', data)
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.leads.all })
    },
    onError: (error) => {
      throw new Error(getErrorMessage(error))
    },
  })
}

// Update lead
export const useUpdateLead = (leadId: string) => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: UpdateLeadData) => {
      const response = await api.put<Lead>(`/leads/${leadId}`, data)
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.leads.detail(leadId) })
      queryClient.invalidateQueries({ queryKey: queryKeys.leads.all })
    },
    onError: (error) => {
      throw new Error(getErrorMessage(error))
    },
  })
}

// Delete lead
export const useDeleteLead = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (leadId: string) => {
      await api.delete(`/leads/${leadId}`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.leads.all })
    },
    onError: (error) => {
      throw new Error(getErrorMessage(error))
    },
  })
}

// Import leads (bulk)
export const useImportLeads = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: ImportLeadsData) => {
      const response = await api.post<ImportResult>('/leads/import', data)
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.leads.all })
    },
    onError: (error) => {
      throw new Error(getErrorMessage(error))
    },
  })
}

// Delete leads (bulk)
export const useDeleteLeads = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (leadIds: string[]) => {
      await api.post('/leads/delete', { lead_ids: leadIds })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.leads.all })
    },
    onError: (error) => {
      throw new Error(getErrorMessage(error))
    },
  })
}

// Assign leads to campaign
export const useAssignLeadsToCampaign = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ leadIds, campaignId }: { leadIds: string[]; campaignId: string }) => {
      await api.post('/leads/assign-campaign', {
        lead_ids: leadIds,
        campaign_id: campaignId,
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.leads.all })
      queryClient.invalidateQueries({ queryKey: queryKeys.campaigns.all })
    },
    onError: (error) => {
      throw new Error(getErrorMessage(error))
    },
  })
}

// Add tags to lead
export const useAddLeadTags = (leadId: string) => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (tags: string[]) => {
      const response = await api.post<Lead>(`/leads/${leadId}/tags`, { tags })
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.leads.detail(leadId) })
      queryClient.invalidateQueries({ queryKey: queryKeys.leads.all })
    },
    onError: (error) => {
      throw new Error(getErrorMessage(error))
    },
  })
}

// Remove tags from lead
export const useRemoveLeadTags = (leadId: string) => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (tags: string[]) => {
      const response = await api.delete<Lead>(`/leads/${leadId}/tags`, { data: { tags } })
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.leads.detail(leadId) })
      queryClient.invalidateQueries({ queryKey: queryKeys.leads.all })
    },
    onError: (error) => {
      throw new Error(getErrorMessage(error))
    },
  })
}
