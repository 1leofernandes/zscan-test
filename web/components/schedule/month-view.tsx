'use client';

import { useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
} from 'lucide-react';
import {
  format,
  parse,
  eachDayOfInterval,
  startOfMonth,
  endOfMonth,
  isSameMonth,
  eachMonthOfInterval,
} from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface MonthViewProps {
  currentMonth: string; // yyyy-MM-dd
  allSchedules: Array<{
    id: string;
    date: string; // yyyy-MM-dd
    status: string;
  }>;
  onMonthChange?: (date: string) => void;
  onDayClick?: (date: string) => void;
}

export function ScheduleMonthView({
  currentMonth,
  allSchedules,
  onMonthChange,
  onDayClick,
}: MonthViewProps) {
  const monthDate = useMemo(() => {
    try {
      return parse(currentMonth, 'yyyy-MM-dd', new Date());
    } catch {
      return new Date();
    }
  }, [currentMonth]);

  const monthStart = useMemo(() => startOfMonth(monthDate), [monthDate]);
  const monthEnd = useMemo(() => endOfMonth(monthDate), [monthDate]);

  // Get all days to display (including prev/next month padding)
  const calendarDays = useMemo(() => {
    const firstDayOfMonth = monthStart.getDay(); // 0 = Sunday
    const adjustedStart = new Date(monthStart);
    adjustedStart.setDate(adjustedStart.getDate() - firstDayOfMonth);

    const lastDayOfMonth = monthEnd.getDay();
    const adjustedEnd = new Date(monthEnd);
    adjustedEnd.setDate(adjustedEnd.getDate() + (6 - lastDayOfMonth));

    return eachDayOfInterval({
      start: adjustedStart,
      end: adjustedEnd,
    });
  }, [monthStart, monthEnd]);

  const schedulesByDate = useMemo(() => {
    const map = new Map<string, typeof allSchedules>();
    allSchedules.forEach((schedule) => {
      const key = schedule.date;
      if (!map.has(key)) {
        map.set(key, []);
      }
      map.get(key)!.push(schedule);
    });
    return map;
  }, [allSchedules]);

  const handlePreviousMonth = () => {
    const prev = new Date(monthDate);
    prev.setMonth(prev.getMonth() - 1);
    onMonthChange?.(format(prev, 'yyyy-MM-dd'));
  };

  const handleNextMonth = () => {
    const next = new Date(monthDate);
    next.setMonth(next.getMonth() + 1);
    onMonthChange?.(format(next, 'yyyy-MM-dd'));
  };

  const statusColors: Record<string, string> = {
    scheduled: 'bg-blue-100 text-blue-700',
    confirmed: 'bg-green-100 text-green-700',
    in_attendance: 'bg-yellow-100 text-yellow-700',
    completed: 'bg-gray-100 text-gray-700',
    cancelled: 'bg-red-100 text-red-700',
    no_show: 'bg-orange-100 text-orange-700',
  };

  const statusLabels: Record<string, string> = {
    scheduled: 'Agendado',
    confirmed: 'Confirmado',
    in_attendance: 'Em Atendimento',
    completed: 'Concluído',
    cancelled: 'Cancelado',
    no_show: 'Falta',
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          size="sm"
          onClick={handlePreviousMonth}
          className="gap-1"
        >
          <ChevronLeft className="h-4 w-4" />
          Anterior
        </Button>

        <h2 className="text-lg font-semibold">
          {format(monthDate, "MMMM 'de' yyyy", { locale: ptBR })}
        </h2>

        <Button
          variant="outline"
          size="sm"
          onClick={handleNextMonth}
          className="gap-1"
        >
          Próximo
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      {/* Calendar Grid */}
      <Card>
        <div className="p-4">
          {/* Day headers */}
          <div className="grid grid-cols-7 gap-2 mb-2 text-center">
            {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sab'].map((day) => (
              <div
                key={day}
                className="font-semibold text-sm text-muted-foreground py-2"
              >
                {day}
              </div>
            ))}
          </div>

          {/* Calendar days */}
          <div className="grid grid-cols-7 gap-2">
            {calendarDays.map((day) => {
              const isCurrentMonth = isSameMonth(day, monthDate);
              const dateStr = format(day, 'yyyy-MM-dd');
              const schedules = schedulesByDate.get(dateStr) || [];

              return (
                <button
                  key={dateStr}
                  onClick={() => onDayClick?.(dateStr)}
                  className={`min-h-24 p-2 rounded border-2 transition-colors ${
                    isCurrentMonth
                      ? 'bg-white hover:bg-gray-50 border-gray-200'
                      : 'bg-gray-50 border-gray-100'
                  }`}
                >
                  <div className="flex flex-col h-full">
                    <div
                      className={`text-sm font-semibold mb-1 ${
                        isCurrentMonth
                          ? 'text-foreground'
                          : 'text-muted-foreground'
                      }`}
                    >
                      {format(day, 'd')}
                    </div>

                    {/* Schedule count indicator */}
                    {schedules.length > 0 && (
                      <div className="space-y-1 text-xs flex-1">
                        <Badge variant="secondary" className="text-xs">
                          {schedules.length} agendamentos
                        </Badge>

                        {/* Status distribution */}
                        <div className="flex flex-wrap gap-0.5">
                          {schedules.map((schedule) => (
                            <div
                              key={schedule.id}
                              className={`w-2 h-2 rounded-full ${
                                {
                                  scheduled: 'bg-blue-500',
                                  confirmed: 'bg-green-500',
                                  in_attendance: 'bg-yellow-500',
                                  completed: 'bg-gray-500',
                                  cancelled: 'bg-red-500',
                                  no_show: 'bg-orange-500',
                                }[schedule.status] || 'bg-gray-300'
                              }`}
                              title={statusLabels[schedule.status]}
                            />
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Legend */}
          <div className="mt-4 pt-4 border-t">
            <p className="text-xs font-semibold mb-2 text-muted-foreground">
              Legenda
            </p>
            <div className="grid grid-cols-3 gap-2 text-xs">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-blue-500" />
                <span>Agendado</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-green-500" />
                <span>Confirmado</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-yellow-500" />
                <span>Em Atendimento</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-red-500" />
                <span>Cancelado</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-orange-500" />
                <span>Falta</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-gray-500" />
                <span>Concluído</span>
              </div>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
