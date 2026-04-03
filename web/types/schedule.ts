export type ScheduleStatus = 'scheduled' | 'confirmed' | 'in_attendance' | 'completed' | 'cancelled' | 'no_show';
export type ProcedureType = 'consultation' | 'checkup' | 'imaging' | 'exam' | 'follow_up' | 'surgery';
export type OriginType = 'in_person' | 'phone' | 'online';

export interface ScheduleResponse {
  id: string;
  patientId: string;
  patientName: string;
  professionalId: string;
  professionalName: string;
  resourceRoom?: string;
  startTime: string;
  endTime: string;
  status: ScheduleStatus;
  procedureType: ProcedureType;
  origin: OriginType;
  notes?: string;
  clinicalNotes?: string;
  isConfirmed?: boolean;
  confirmedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AvailableSlot {
  time: string;
  startTime: string;
  endTime: string;
  available: boolean;
}

export interface DayAgenda {
  date: string;
  dayOfWeek: string;
  schedules: ScheduleResponse[];
  stats: {
    total: number;
    booked: number;
    available: number;
  };
  slots: AvailableSlot[];
}

export interface WeekAgenda {
  weekStart: string;
  weekEnd: string;
  days: DayAgenda[];
}

export interface CreateScheduleInput {
  patientId: string;
  professionalId: string;
  professionalName: string;
  startTime: string;
  endTime: string;
  procedureType: ProcedureType;
  origin: OriginType;
  notes?: string;
}

export interface UpdateScheduleStatusInput {
  status: ScheduleStatus;
  notes?: string;
}

export interface UpdateScheduleDto {
  patientId?: string;
  professionalId?: string;
  professionalName?: string;
  startTime?: string;
  endTime?: string;
  procedureType?: ProcedureType;
  origin?: OriginType;
  status?: ScheduleStatus;
  notes?: string;
  resourceRoom?: string;
}
