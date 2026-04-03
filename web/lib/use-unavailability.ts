'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from './api-client';
import type { Unavailability } from '@/components/schedule/unavailability-modal';

const UNAVAILABILITY_QUERY_KEY = ['unavailabilities'];

export function useUnavailabilities(professionalId?: string, startDate?: string, endDate?: string) {
  return useQuery({
    queryKey: [...UNAVAILABILITY_QUERY_KEY, professionalId, startDate, endDate],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (professionalId) params.append('professionalId', professionalId);
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);
      
      const response = await apiClient.get<Unavailability[]>(`/unavailability?${params.toString()}`);
      return response.data;
    },
    enabled: true,
  });
}

export function useCreateUnavailability() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: Unavailability) => {
      // Converter para o formato esperado pelo backend
      const payload: any = {
        professionalId: data.professionalId,
        professionalName: data.professionalName,
        type: data.type,
        isAllDay: data.isAllDay ?? true,
      };
      
      if (data.title) payload.title = data.title;
      if (data.description) payload.description = data.description;
      if (data.startTime) payload.startTime = data.startTime.toISOString();
      if (data.endTime) payload.endTime = data.endTime.toISOString();
      if (data.resourceRoom) payload.resourceRoom = data.resourceRoom;
      
      const response = await apiClient.post('/unavailability', payload);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: UNAVAILABILITY_QUERY_KEY });
    },
  });
}

export function useDeleteUnavailability(id: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      await apiClient.delete(`/unavailability/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: UNAVAILABILITY_QUERY_KEY });
    },
  });
}