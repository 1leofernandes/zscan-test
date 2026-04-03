'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { keepPreviousData } from '@tanstack/react-query';
import apiClient from './api-client';
import {
  ScheduleResponse,
  DayAgenda,
  WeekAgenda,
  AvailableSlot,
  CreateScheduleInput,
  UpdateScheduleStatusInput,
  UpdateScheduleDto,
} from '@/types/schedule';

const SCHEDULE_QUERY_KEY = ['schedules'];

export function useDayAgenda(date: string, professionalId?: string) {
  return useQuery({
    queryKey: [...SCHEDULE_QUERY_KEY, 'day', date, professionalId],
    queryFn: async () => {
      const params = new URLSearchParams();
      params.append('date', date);
      if (professionalId) params.append('professionalIds', professionalId);

      const response = await apiClient.get<DayAgenda>(
        `/schedule/day-view?${params.toString()}`
      );
      return response.data;
    },
    placeholderData: keepPreviousData,
  });
}

export function useWeekAgenda(weekStart: string, professionalId?: string) {
  return useQuery({
    queryKey: [...SCHEDULE_QUERY_KEY, 'week', weekStart, professionalId],
    queryFn: async () => {
      const params = new URLSearchParams();
      params.append('startDate', weekStart);
      if (professionalId) params.append('professionalIds', professionalId);

      const response = await apiClient.get<WeekAgenda>(
        `/schedule/week-view?${params.toString()}`
      );
      return response.data;
    },
    placeholderData: keepPreviousData,
  });
}

export function useScheduleAvailability(
  date: string,
  professionalId: string,
  durationMinutes = 30
) {
  return useQuery({
    queryKey: [...SCHEDULE_QUERY_KEY, 'availability', date, professionalId, durationMinutes],
    queryFn: async () => {
      const response = await apiClient.get<AvailableSlot[]>(
        `/schedule/availability?date=${date}&professionalId=${professionalId}&durationMinutes=${durationMinutes}`
      );
      return response.data;
    },
    enabled: !!date && !!professionalId,
  });
}

export function useCreateSchedule() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateScheduleInput) => {
      const response = await apiClient.post<ScheduleResponse>('/schedule', data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: SCHEDULE_QUERY_KEY });
    },
  });
}

export function useUpdateScheduleStatus(scheduleId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: UpdateScheduleStatusInput) => {
      const response = await apiClient.patch<ScheduleResponse>(
        `/schedule/${scheduleId}/status`,
        data
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: SCHEDULE_QUERY_KEY });
    },
  });
}

export function useDeleteSchedule(scheduleId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      await apiClient.delete(`/schedule/${scheduleId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: SCHEDULE_QUERY_KEY });
    },
  });
}

export function useUpdateSchedule(scheduleId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: UpdateScheduleDto) => {
      const response = await apiClient.patch<ScheduleResponse>(
        `/schedule/${scheduleId}`,
        data
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: SCHEDULE_QUERY_KEY });
    },
  });
}

export function useValidateSchedule() {
  return useMutation({
    mutationFn: async (data: {
      professionalId: string;
      startTime: string;
      endTime: string;
      scheduleId?: string;
    }) => {
      const response = await apiClient.post<any>(
        '/schedule/validate/conflicts',
        data
      );
      return response.data;
    },
  });
}


export function useRescheduleSchedule() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      scheduleId, 
      startTime, 
      endTime 
    }: { 
      scheduleId: string; 
      startTime: string; 
      endTime: string;
    }) => {
      const response = await apiClient.patch<ScheduleResponse>(
        `/schedule/${scheduleId}/reschedule`,
        { startTime, endTime }
      );
      return response.data;
    },
    onSuccess: async () => {
      // Invalidar cache e forçar refetch imediato
      await queryClient.invalidateQueries({ 
        queryKey: SCHEDULE_QUERY_KEY,
        refetchType: 'all',
      });
    },
    onError: (error) => {
      console.error('Erro ao reagendar:', error);
    },
  });
}

