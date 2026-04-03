'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import apiClient from './api-client';
import {
  PatientResponse,
  PaginatedPatients,
  PatientFilters,
  PatientCreateInput,
  PatientUpdateInput,
} from '@/types/patient';

const PATIENTS_QUERY_KEY = ['patients'];

export function usePatients(filters: PatientFilters) {
  return useQuery({
    queryKey: [...PATIENTS_QUERY_KEY, filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters.search) params.append('search', filters.search);
      if (filters.gender) params.append('gender', filters.gender);
      if (filters.healthPlanId) params.append('healthPlanId', filters.healthPlanId);
      params.append('page', filters.page.toString());
      params.append('pageSize', filters.limit.toString());

      const response = await apiClient.get<PaginatedPatients>(`/patients?${params.toString()}`);
      return response.data;
    },
    staleTime: 5 * 60 * 1000,
  });
}

export function usePatient(patientId: string) {
  return useQuery({
    queryKey: [...PATIENTS_QUERY_KEY, patientId],
    queryFn: async () => {
      const response = await apiClient.get<PatientResponse>(`/patients/${patientId}`);
      return response.data;
    },
    enabled: !!patientId,
  });
}

export function useCreatePatient() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: PatientCreateInput) => {
      const response = await apiClient.post<PatientResponse>('/patients', data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PATIENTS_QUERY_KEY });
    },
  });
}

export function useUpdatePatient(patientId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: PatientUpdateInput) => {
      const response = await apiClient.patch<PatientResponse>(`/patients/${patientId}`, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PATIENTS_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: [...PATIENTS_QUERY_KEY, patientId] });
    },
  });
}

// ✅ CORRIGIDO: hook não recebe patientId como parâmetro
export function useDeletePatient() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (patientId: string) => {
      await apiClient.delete(`/patients/${patientId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PATIENTS_QUERY_KEY });
    },
  });
}