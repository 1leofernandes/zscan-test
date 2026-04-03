'use client';

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { ScheduleResponse } from '@/types/schedule';
import { AlertCircle, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export interface ScheduleConflict {
  schedule1: ScheduleResponse;
  schedule2: ScheduleResponse;
  type: 'time_overlap' | 'double_booking' | 'resource_conflict';
  severity: 'warning' | 'error';
}

interface ConflictDetectionProps {
  conflicts: ScheduleConflict[];
  onResolve?: (conflict: ScheduleConflict) => void;
  onViewSchedule?: (scheduleId: string) => void;
}

export function ConflictDetection({
  conflicts,
  onResolve,
  onViewSchedule,
}: ConflictDetectionProps) {
  if (conflicts.length === 0) {
    return null;
  }

  const severityColor = {
    warning: 'border-yellow-200 bg-yellow-50',
    error: 'border-red-200 bg-red-50',
  };

  const severityIcon = {
    warning: <AlertCircle className="w-5 h-5 text-yellow-600" />,
    error: <AlertCircle className="w-5 h-5 text-red-600" />,
  };

  const getConflictMessage = (conflict: ScheduleConflict): string => {
    switch (conflict.type) {
      case 'time_overlap':
        return `Agendamento de ${conflict.schedule1.patientName} sobrepõe com ${conflict.schedule2.patientName}`;
      case 'double_booking':
        return `${conflict.schedule1.professionalName} está marcado para dois agendamentos simultaneamente`;
      case 'resource_conflict':
        return `Recurso em conflito entre os agendamentos`;
      default:
        return 'Conflito detectado';
    }
  };

  return (
    <div className="space-y-3">
      {conflicts.map((conflict, idx) => (
        <Alert
          key={idx}
          className={`border-2 ${severityColor[conflict.severity]}`}
        >
          <div className="flex items-start gap-3">
            {severityIcon[conflict.severity]}
            <div className="flex-1">
              <AlertTitle className="mb-2">
                {getConflictMessage(conflict)}
              </AlertTitle>
              <AlertDescription className="space-y-2">
                <div className="text-sm">
                  <p className="font-semibold text-gray-700">
                    {conflict.schedule1.patientName} -{' '}
                    {format(parseISO(conflict.schedule1.startTime), 'HH:mm', {
                      locale: ptBR,
                    })}
                  </p>
                  <p className="text-xs text-gray-600">
                    Profissional: {conflict.schedule1.professionalName}
                  </p>
                </div>
                <div className="text-sm">
                  <p className="font-semibold text-gray-700">
                    {conflict.schedule2.patientName} -{' '}
                    {format(parseISO(conflict.schedule2.startTime), 'HH:mm', {
                      locale: ptBR,
                    })}
                  </p>
                  <p className="text-xs text-gray-600">
                    Profissional: {conflict.schedule2.professionalName}
                  </p>
                </div>
                <div className="flex gap-2 pt-2">
                  {onViewSchedule && (
                    <>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onViewSchedule(conflict.schedule1.id)}
                      >
                        Ver Agendamento 1
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onViewSchedule(conflict.schedule2.id)}
                      >
                        Ver Agendamento 2
                      </Button>
                    </>
                  )}
                  {onResolve && (
                    <Button
                      variant="default"
                      size="sm"
                      onClick={() => onResolve(conflict)}
                    >
                      <Settings className="w-3 h-3 mr-1" />
                      Resolver
                    </Button>
                  )}
                </div>
              </AlertDescription>
            </div>
          </div>
        </Alert>
      ))}
    </div>
  );
}

/**
 * Detects conflicts between schedules
 */
export function detectConflicts(schedules: ScheduleResponse[]): ScheduleConflict[] {
  const conflicts: ScheduleConflict[] = [];

  for (let i = 0; i < schedules.length; i++) {
    for (let j = i + 1; j < schedules.length; j++) {
      const s1 = schedules[i];
      const s2 = schedules[j];

      const start1 = new Date(s1.startTime).getTime();
      const end1 = new Date(s1.endTime).getTime();
      const start2 = new Date(s2.startTime).getTime();
      const end2 = new Date(s2.endTime).getTime();

      // Check for time overlap
      if (start1 < end2 && start2 < end1) {
        // Same professional = double booking (error)
        if (s1.professionalId === s2.professionalId) {
          conflicts.push({
            schedule1: s1,
            schedule2: s2,
            type: 'double_booking',
            severity: 'error',
          });
        } else {
          // Different professional = warning
          conflicts.push({
            schedule1: s1,
            schedule2: s2,
            type: 'time_overlap',
            severity: 'warning',
          });
        }
      }
    }
  }

  return conflicts;
}
