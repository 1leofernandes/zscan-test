'use client';

import { useState, useMemo } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  useDroppable,
} from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { format, parseISO, addMinutes, setHours, setMinutes, parse } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Clock, GripVertical, Loader2 } from 'lucide-react';

// Função para converter Date para formato "naive datetime" (sem timezone/Z)
// Isso faz o servidor entender como local time em vez de UTC
function toLocalDateTime(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');
  const ms = String(date.getMilliseconds()).padStart(3, '0');
  return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}.${ms}`;
}

interface Schedule {
  id: string;
  patientName: string;
  professionalName: string;
  startTime: string;
  endTime: string;
  status: string;
  procedureType: string;
}

interface DragDropScheduleViewProps {
  date: string;
  schedules: Schedule[];
  onScheduleReschedule: (scheduleId: string, newStartTime: string, newEndTime: string) => Promise<void>;
  onSelectSchedule: (schedule: Schedule) => void;
  isLoading: boolean;
}

// Componente de item arrastável
function SortableScheduleItem({ 
  schedule, 
  onSelect 
}: { 
  schedule: Schedule; 
  onSelect: (schedule: Schedule) => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: schedule.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const startTime = parseISO(schedule.startTime);
  const endTime = parseISO(schedule.endTime);
  const duration = Math.round((endTime.getTime() - startTime.getTime()) / 60000);

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      scheduled: 'bg-blue-100 text-blue-800',
      confirmed: 'bg-green-100 text-green-800',
      in_attendance: 'bg-yellow-100 text-yellow-800',
      completed: 'bg-gray-100 text-gray-800',
      cancelled: 'bg-red-100 text-red-800',
      no_show: 'bg-orange-100 text-orange-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="cursor-grab active:cursor-grabbing"
    >
      <Card 
        className="mb-2 hover:shadow-md transition-shadow cursor-pointer"
        onClick={() => onSelect(schedule)}
      >
        <CardContent className="p-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 flex-1">
              <GripVertical className="h-5 w-5 text-gray-400" />
              <div className="flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="font-semibold text-sm">{schedule.patientName}</p>
                  <Badge className={getStatusColor(schedule.status)}>
                    {schedule.status}
                  </Badge>
                </div>
                <div className="flex items-center gap-4 mt-1 text-xs text-gray-500">
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {format(startTime, "HH:mm")} - {format(endTime, "HH:mm")}
                  </span>
                  <span>({duration} min)</span>
                  <span>{schedule.professionalName}</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Componente de slot de horário (área onde pode soltar) - com suporte a dnd-kit
function TimeSlot({ 
  hour,
  baseDate,
}: { 
  hour: number;
  baseDate: Date;
}) {
  const { setNodeRef, isOver } = useDroppable({
    id: `hour-${hour}`,
  });

  // Usar a data base sendo visualizada, não a hora atual
  const slotTime = setMinutes(setHours(new Date(baseDate), hour), 0);

  return (
    <div
      ref={setNodeRef}
      className={`border rounded-lg p-3 min-h-[100px] transition-all ${
        isOver ? 'bg-indigo-100 border-indigo-400 border-2 shadow-md' : 'border-gray-200 bg-white'
      }`}
    >
      <div className="text-xs font-medium text-gray-600 mb-2">
        {format(slotTime, "HH:mm")}
      </div>
      {!isOver && (
        <div className="text-xs text-gray-400">Solte aqui</div>
      )}
    </div>
  );
}

export function DragDropScheduleView({
  date,
  schedules,
  onScheduleReschedule,
  onSelectSchedule,
  isLoading,
}: DragDropScheduleViewProps) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor)
  );

  // Agrupar agendamentos por hora
  const schedulesByHour = useMemo(() => {
    const grouped: Record<number, Schedule[]> = {};
    for (let hour = 8; hour <= 18; hour++) {
      grouped[hour] = [];
    }
    schedules.forEach((schedule) => {
      const hour = parseISO(schedule.startTime).getHours();
      if (grouped[hour]) {
        grouped[hour].push(schedule);
      }
    });
    return grouped;
  }, [schedules]);

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);
    setError(null);

    if (!over) return;

    const scheduleId = active.id as string;
    const overId = over.id as string;

    // Extrair hora do ID (formato: "hour-8", "hour-9", etc)
    if (!overId.startsWith('hour-')) return;
    
    const targetHour = parseInt(overId.replace('hour-', ''));
    if (isNaN(targetHour)) return;

    const schedule = schedules.find(s => s.id === scheduleId);
    if (!schedule) return;

    // Calcular novo horário (manter mesma duração)
    const oldStart = parseISO(schedule.startTime);
    const oldEnd = parseISO(schedule.endTime);
    const duration = oldEnd.getTime() - oldStart.getTime();
    
    // Criar novo horário usando parse para interpretar corretamente a data em formato 'yyyy-MM-dd'
    // sem problemas de timezone
    const baseDateFormatted = parse(date, 'yyyy-MM-dd', new Date());
    const newStart = setMinutes(setHours(baseDateFormatted, targetHour), 0);
    const newEnd = new Date(newStart.getTime() + duration);

    setIsProcessing(true);
    try {
      // Converter para local datetime (sem Z, para o servidor entender como local time)
      const newStartLocal = toLocalDateTime(newStart);
      const newEndLocal = toLocalDateTime(newEnd);
      
      // Calcular timezone offset para debug
      const offset = new Date().getTimezoneOffset();
      const offsetHours = Math.ceil(offset / 60);
      
      console.clear();
      console.log('%c=== DRAG & DROP DEBUG ===', 'background: #222; color: #bada55; font-weight: bold; padding: 5px');
      console.log('%cTimezone Info:', 'background: #333; color: #ff9800; font-weight: bold');
      console.log(`Browser Timezone Offset: ${offset} minutes (${offsetHours} hours)`);
      console.log('%cAgendamento Original:', 'background: #333; color: #2196f3; font-weight: bold');
      console.log(`ID: ${scheduleId}`);
      console.log(`Start: ${oldStart.toLocaleString()} (${oldStart.toISOString()})`);
      console.log(`End: ${oldEnd.toLocaleString()} (${oldEnd.toISOString()})`);
      console.log('%cNovo Agendamento:', 'background: #333; color: #4caf50; font-weight: bold');
      console.log(`Data: ${date}`);
      console.log(`Hora Alvo: ${targetHour}:00`);
      console.log(`Duração: ${duration / 60000} minutos`);
      console.log(`Start Local: ${newStart.toLocaleString()}`);
      console.log(`Start Local DateTime (enviando): ${newStartLocal}`);
      console.log(`End Local: ${newEnd.toLocaleString()}`);
      console.log(`End Local DateTime (enviando): ${newEndLocal}`);
      console.log('%c=== Enviando para backend ===', 'background: #222; color: #bada55');
      console.log({ scheduleId, startTime: newStartLocal, endTime: newEndLocal });
      
      await onScheduleReschedule(scheduleId, newStartLocal, newEndLocal);
      console.log('%cAgendamento reagendado com sucesso ✓', 'background: #4caf50; color: white; font-weight: bold');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido ao reagendar';
      console.error('Erro ao reagendar:', error);
      setError(`Erro ao reagendar: ${errorMessage}`);
    } finally {
      setIsProcessing(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  const activeSchedule = schedules.find(s => s.id === activeId);

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="space-y-4">
        <div className="bg-blue-50 p-3 rounded-lg text-sm text-blue-800">
          💡 Dica: Arraste os agendamentos para a hora desejada na coluna da direita
        </div>
        
        {error && (
          <div className="bg-red-50 border border-red-200 p-3 rounded-lg text-sm text-red-800 flex items-center justify-between">
            <span>{error}</span>
            <button
              onClick={() => setError(null)}
              className="text-red-600 hover:text-red-800 font-semibold"
            >
              ✕
            </button>
          </div>
        )}
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Lista de agendamentos */}
          <div className="md:col-span-2">
            <h3 className="font-semibold mb-3 text-gray-700">Agendamentos</h3>
            <SortableContext
              items={schedules.map(s => s.id)}
              strategy={verticalListSortingStrategy}
            >
              <div className="space-y-2">
                {schedules.map((schedule) => (
                  <SortableScheduleItem
                    key={schedule.id}
                    schedule={schedule}
                    onSelect={onSelectSchedule}
                  />
                ))}
                {schedules.length === 0 && (
                  <p className="text-center text-gray-500 py-8">
                    Nenhum agendamento para este dia
                  </p>
                )}
              </div>
            </SortableContext>
          </div>

          {/* Grade de horários */}
          <div>
            <h3 className="font-semibold mb-3 text-gray-700">Horários disponíveis</h3>
            <div className="space-y-2">
              {Object.entries(schedulesByHour).map(([hour]) => {
                const baseDateFormatted = parse(date, 'yyyy-MM-dd', new Date());
                return (
                  <TimeSlot 
                    key={hour} 
                    hour={parseInt(hour)}
                    baseDate={baseDateFormatted}
                  />
                );
              })}
            </div>
          </div>
        </div>
      </div>

      <DragOverlay>
        {activeSchedule && (
          <Card className="shadow-lg border-indigo-300">
            <CardContent className="p-3 bg-indigo-50">
              <div className="flex items-center gap-3">
                <GripVertical className="h-5 w-5 text-indigo-500" />
                <div>
                  <p className="font-semibold text-sm">{activeSchedule.patientName}</p>
                  <p className="text-xs text-gray-500">{activeSchedule.professionalName}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </DragOverlay>

      {isProcessing && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 flex items-center gap-3">
            <Loader2 className="h-6 w-6 animate-spin text-indigo-600" />
            <span>Reagendando consulta...</span>
          </div>
        </div>
      )}
    </DndContext>
  );
}