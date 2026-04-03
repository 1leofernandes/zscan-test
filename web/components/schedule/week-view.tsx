'use client';

import { useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScheduleResponse, DayAgenda } from '@/types/schedule';
import { format, parse, eachDayOfInterval, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface WeekViewProps {
  weekStart: string;
  days: DayAgenda[];
  onSelectSchedule?: (schedule: ScheduleResponse) => void;
  onWeekChange?: (date: string) => void;
}

const STATUS_COLORS: Record<string, string> = {
  scheduled: 'bg-blue-500',
  confirmed: 'bg-green-500',
  in_attendance: 'bg-yellow-500',
  completed: 'bg-gray-500',
  cancelled: 'bg-red-500',
  no_show: 'bg-orange-500',
};

export function ScheduleWeekView({
  weekStart,
  days,
  onSelectSchedule,
  onWeekChange,
}: WeekViewProps) {
  const weekDates = useMemo(() => {
    try {
      const start = parse(weekStart, 'yyyy-MM-dd', new Date());
      const end = new Date(start);
      end.setDate(end.getDate() + 6);

      return eachDayOfInterval({ start, end });
    } catch {
      return [];
    }
  }, [weekStart]);

  const handlePreviousWeek = () => {
    try {
      const start = parse(weekStart, 'yyyy-MM-dd', new Date());
      start.setDate(start.getDate() - 7);
      const newDate = format(start, 'yyyy-MM-dd');
      onWeekChange?.(newDate);
    } catch {
      /* */
    }
  };

  const handleNextWeek = () => {
    try {
      const start = parse(weekStart, 'yyyy-MM-dd', new Date());
      start.setDate(start.getDate() + 7);
      const newDate = format(start, 'yyyy-MM-dd');
      onWeekChange?.(newDate);
    } catch {
      /* */
    }
  };

  return (
    <div className="space-y-6">
      {/* Navigation */}
      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          size="sm"
          onClick={handlePreviousWeek}
          className="gap-1"
        >
          <ChevronLeft className="h-4 w-4" />
          Semana Anterior
        </Button>

        <h2 className="text-lg font-semibold">
          {weekDates.length > 0 &&
            `${format(weekDates[0], "d 'de' MMMM", {
              locale: ptBR,
            })} - ${format(weekDates[6], "d 'de' MMMM 'de' yyyy", {
              locale: ptBR,
            })}`}
        </h2>

        <Button
          variant="outline"
          size="sm"
          onClick={handleNextWeek}
          className="gap-1"
        >
          Próxima Semana
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      {/* Week Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-7 gap-2">
        {days.map((day) => (
          <Card key={day.date} className="flex flex-col h-full">
            {/* Date Header */}
            <CardHeader className="pb-3">
              <div className="text-center">
                <p className="text-xs font-light text-muted-foreground">
                  {day.dayOfWeek}
                </p>
                <CardTitle className="text-lg">
                  {format(parse(day.date, 'yyyy-MM-dd', new Date()), 'd')}
                </CardTitle>
              </div>
            </CardHeader>

            {/* Stats */}
            <CardContent className="flex-1 space-y-3">
              <div className="space-y-1 text-xs">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Total:</span>
                  <span className="font-semibold">{day.stats.total}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Confirmados:</span>
                  <span className="font-semibold text-green-600">
                    {day.stats.booked}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Disponível:</span>
                  <span className="font-semibold text-blue-600">
                    {day.stats.available}
                  </span>
                </div>
              </div>

              {/* Schedules Preview */}
              {day.schedules.length > 0 && (
                <div className="space-y-1">
                  {day.schedules.slice(0, 2).map((schedule) => (
                    <button
                      key={schedule.id}
                      onClick={() => onSelectSchedule?.(schedule)}
                      className={`w-full rounded px-2 py-1 text-xs font-medium text-white ${
                        STATUS_COLORS[schedule.status] || 'bg-gray-500'
                      } hover:opacity-80 transition-opacity truncate`}
                      title={schedule.patientName}
                    >
                      {format(parseISO(schedule.startTime), 'HH:mm')}
                    </button>
                  ))}
                  {day.schedules.length > 2 && (
                    <p className="text-xs text-muted-foreground text-center">
                      +{day.schedules.length - 2} mais
                    </p>
                  )}
                </div>
              )}

              {day.schedules.length === 0 && (
                <p className="text-xs text-muted-foreground text-center py-4">
                  Sem agendamentos
                </p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
