'use client';

import { useMemo } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScheduleResponse, ScheduleStatus } from '@/types/schedule';
import { format, parse } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Clock, MapPin, User } from 'lucide-react';

interface DayViewProps {
  date: string;
  schedules: ScheduleResponse[];
  onSelectSchedule?: (schedule: ScheduleResponse) => void;
  isProfessional?: boolean;
}

const STATUS_CONFIG: Record<ScheduleStatus, { label: string; color: string }> = {
  scheduled: { label: 'Agendado', color: 'bg-blue-100 text-blue-800' },
  confirmed: { label: 'Confirmado', color: 'bg-green-100 text-green-800' },
  in_attendance: { label: 'Em Atendimento', color: 'bg-yellow-100 text-yellow-800' },
  completed: { label: 'Concluído', color: 'bg-gray-100 text-gray-800' },
  cancelled: { label: 'Cancelado', color: 'bg-red-100 text-red-800' },
  no_show: { label: 'Falta', color: 'bg-orange-100 text-orange-800' },
};

const PROCEDURE_TYPE_NAMES: Record<string, string> = {
  consultation: 'Consulta',
  checkup: 'Avaliação',
  imaging: 'Imagem',
  exam: 'Exame',
  follow_up: 'Retorno',
  surgery: 'Cirurgia',
};

export function ScheduleDayView({
  date,
  schedules,
  onSelectSchedule,
  isProfessional,
}: DayViewProps) {
  const formattedDate = useMemo(() => {
    try {
      const parsed = parse(date, 'yyyy-MM-dd', new Date());
      return format(parsed, "EEEE, d 'de' MMMM 'de' yyyy", { locale: ptBR });
    } catch {
      return date;
    }
  }, [date]);

  const sortedSchedules = useMemo(
    () =>
      [...schedules].sort(
        (a, b) =>
          new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
      ),
    [schedules]
  );

  const stats = useMemo(() => {
    return {
      total: schedules.length,
      confirmed: schedules.filter((s) => s.status === 'confirmed').length,
      inProgress: schedules.filter((s) => s.status === 'in_attendance').length,
    };
  }, [schedules]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold capitalize">{formattedDate}</h2>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total de Agendamentos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Confirmados
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.confirmed}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Em Atendimento
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{stats.inProgress}</div>
          </CardContent>
        </Card>
      </div>

      {/* Schedule List */}
      {sortedSchedules.length > 0 ? (
        <div className="space-y-3">
          {sortedSchedules.map((schedule) => {
            const startTime = new Date(schedule.startTime);
            const endTime = new Date(schedule.endTime);
            const statusConfig = STATUS_CONFIG[schedule.status];

            return (
              <Card
                key={schedule.id}
                className="cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => onSelectSchedule?.(schedule)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 space-y-3">
                      {/* Name and Status */}
                      <div className="flex items-center justify-between">
                        <h3 className="font-semibold text-lg">
                          {isProfessional ? schedule.patientName : schedule.professionalName}
                        </h3>
                        <Badge className={statusConfig.color}>
                          {statusConfig.label}
                        </Badge>
                      </div>

                      {/* Time and Location */}
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          {format(startTime, 'HH:mm')} -{' '}
                          {format(endTime, 'HH:mm')}
                        </div>

                        <div className="flex items-center gap-1">
                          <MapPin className="h-4 w-4" />
                          {schedule.origin === 'in_person'
                            ? 'Presencial'
                            : schedule.origin === 'phone'
                            ? 'Telefone'
                            : 'Online'}
                        </div>

                        <Badge variant="outline">
                          {PROCEDURE_TYPE_NAMES[schedule.procedureType] ||
                            schedule.procedureType}
                        </Badge>
                      </div>

                      {/* Notes */}
                      {schedule.notes && (
                        <p className="text-sm text-gray-600 mt-2">{schedule.notes}</p>
                      )}
                    </div>

                    {/* Action Button */}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectSchedule?.(schedule);
                      }}
                      className="ml-4"
                    >
                      Detalhes
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <Card>
          <CardContent className="p-8 text-center">
            <p className="text-muted-foreground">
              Nenhum agendamento para este dia
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
