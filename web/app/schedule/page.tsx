'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  Calendar,
  CalendarDays,
  Grid3x3,
  CalendarClock,
  Users,
  Plus,
  Clock,
  CheckCircle,
  Activity,
  AlertTriangle,
  XCircle,
  Lock,
  Loader2,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';

import { ScheduleDayView } from '@/components/schedule/day-view';
import { ScheduleWeekView } from '@/components/schedule/week-view';
import { ScheduleMonthView } from '@/components/schedule/month-view';
import { ScheduleModal } from '@/components/schedule/schedule-modal';
import { ScheduleFilterBar, type ScheduleFilters } from '@/components/schedule/schedule-filter-bar';
import { DragDropScheduleView } from '@/components/schedule/drag-drop-schedule';
import { ConflictDetection, detectConflicts, type ScheduleConflict } from '@/components/schedule/conflict-detection';
import { UnavailabilityModal, UnavailabilityList, type Unavailability } from '@/components/schedule/unavailability-modal';

import { useDayAgenda, useWeekAgenda, useUpdateScheduleStatus, useRescheduleSchedule } from '@/lib/use-schedule';
import { useUnavailabilities, useCreateUnavailability, useDeleteUnavailability } from '@/lib/use-unavailability';
import { ScheduleResponse } from '@/types/schedule';

// Configuração de status com ícones e cores aprimoradas
const STATUS_CONFIG: Record<string, { label: string; color: string; bgLight: string; icon: any }> = {
  scheduled: { 
    label: 'Agendado', 
    color: 'text-blue-700', 
    bgLight: 'bg-blue-50 border-blue-200',
    icon: Clock 
  },
  confirmed: { 
    label: 'Confirmado', 
    color: 'text-green-700', 
    bgLight: 'bg-green-50 border-green-200',
    icon: CheckCircle 
  },
  in_attendance: { 
    label: 'Em Atendimento', 
    color: 'text-yellow-700', 
    bgLight: 'bg-yellow-50 border-yellow-200',
    icon: Activity 
  },
  completed: { 
    label: 'Concluído', 
    color: 'text-gray-700', 
    bgLight: 'bg-gray-50 border-gray-200',
    icon: CheckCircle 
  },
  cancelled: { 
    label: 'Cancelado', 
    color: 'text-red-700', 
    bgLight: 'bg-red-50 border-red-200',
    icon: XCircle 
  },
  no_show: { 
    label: 'Falta', 
    color: 'text-orange-700', 
    bgLight: 'bg-orange-50 border-orange-200',
    icon: AlertTriangle 
  },
};

// Profissionais mockados
const PROFESSIONALS = [
  { id: '550e8400-e29b-41d4-a716-446655440000', name: 'Dr. Carlos Silva', specialty: 'Cardiologia' },
  { id: '550e8400-e29b-41d4-a716-446655440001', name: 'Dra. Ana Paula', specialty: 'Dermatologia' },
  { id: '550e8400-e29b-41d4-a716-446655440002', name: 'Dr. Roberto Lima', specialty: 'Ortopedia' },
];

export default function EnhancedSchedulePage() {
  const router = useRouter();
  const today = useMemo(() => format(new Date(), 'yyyy-MM-dd'), []);

  // Estados
  const [selectedDate, setSelectedDate] = useState(today);
  const [selectedWeekStart, setSelectedWeekStart] = useState(today);
  const [selectedMonthStart, setSelectedMonthStart] = useState(today);
  const [selectedSchedule, setSelectedSchedule] = useState<ScheduleResponse | null>(null);
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const [view, setView] = useState<'day' | 'week' | 'month' | 'dragdrop'>('day');
  const [scheduleModalOpen, setScheduleModalOpen] = useState(false);
  const [showUnavailabilities, setShowUnavailabilities] = useState(false);
  const [unavailabilityModalOpen, setUnavailabilityModalOpen] = useState(false);
  const [editingUnavailability, setEditingUnavailability] = useState<Unavailability | null>(null);
  const [allSchedules, setAllSchedules] = useState<Array<{ id: string; date: string; status: string }>>([]);
  const [filters, setFilters] = useState<ScheduleFilters>({
    dateRange: null,
    selectedProfessionals: [],
    selectedStatuses: [],
    selectedProcedureTypes: [],
  });

  // APIs
  const dayAgenda = useDayAgenda(selectedDate);
  const weekAgenda = useWeekAgenda(selectedWeekStart);
  const unavailabilities = useUnavailabilities(
    filters.selectedProfessionals[0],
    filters.customDateStart,
    filters.customDateEnd
  );
  const createUnavailability = useCreateUnavailability();
  const deleteUnavailability = useDeleteUnavailability(editingUnavailability?.id || '');
  const rescheduleSchedule = useRescheduleSchedule();

  // Filtragem
  const filteredSchedules = useMemo(() => {
    let result = dayAgenda.data?.schedules || [];
    if (filters.selectedStatuses.length > 0) {
      result = result.filter((s) => filters.selectedStatuses.includes(s.status));
    }
    if (filters.selectedProcedureTypes.length > 0) {
      result = result.filter((s) => filters.selectedProcedureTypes.includes(s.procedureType));
    }
    return result;
  }, [dayAgenda.data?.schedules, filters]);

  const conflicts = useMemo(() => detectConflicts(filteredSchedules), [filteredSchedules]);

  // Coleta para visão mensal
  useMemo(() => {
    const schedules: Array<{ id: string; date: string; status: string }> = [];
    if (dayAgenda.data?.schedules) {
      dayAgenda.data.schedules.forEach((s) => {
        schedules.push({ id: s.id, date: format(parseISO(s.startTime), 'yyyy-MM-dd'), status: s.status });
      });
    }
    if (weekAgenda.data?.days) {
      weekAgenda.data.days.forEach((day) => {
        day.schedules.forEach((s) => {
          if (!schedules.find((sch) => sch.id === s.id)) {
            schedules.push({ id: s.id, date: day.date, status: s.status });
          }
        });
      });
    }
    setAllSchedules(schedules);
  }, [dayAgenda.data, weekAgenda.data]);

  // Handler para selecionar agendamento (aceita ScheduleResponse ou adaptado)
  const handleSelectSchedule = (schedule: ScheduleResponse | any) => {
    if (schedule && typeof schedule === 'object') {
      setSelectedSchedule(schedule as ScheduleResponse);
      setDetailsModalOpen(true);
    }
  };

  const handleUnavailabilitySave = async (data: Unavailability) => {
    try {
      if (editingUnavailability?.id) {
        // Atualização futura
      } else {
        await createUnavailability.mutateAsync(data);
      }
      setUnavailabilityModalOpen(false);
    } catch (error) {
      console.error('Erro ao salvar indisponibilidade:', error);
    }
  };

  const handleDeleteUnavailability = async (id: string) => {
    try {
      await deleteUnavailability.mutateAsync();
      setEditingUnavailability(null);
    } catch (error) {
      console.error('Erro ao deletar indisponibilidade:', error);
    }
  };

  const handleReschedule = async (scheduleId: string, newStartTime: string, newEndTime: string) => {
    try {
      await rescheduleSchedule.mutateAsync({ scheduleId, startTime: newStartTime, endTime: newEndTime });
    } catch (error) {
      console.error('Erro ao reagendar:', error);
      throw error;
    }
  };

  // Adaptação dos schedules para o DragDropScheduleView
  const dragDropSchedules = useMemo(() => {
    return filteredSchedules.map(schedule => ({
      id: schedule.id,
      patientName: schedule.patientName,
      professionalName: schedule.professionalName,
      startTime: schedule.startTime,
      endTime: schedule.endTime,
      status: schedule.status,
      procedureType: schedule.procedureType,
    }));
  }, [filteredSchedules]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-6 space-y-8 max-w-7xl">
        {/* Cabeçalho aprimorado */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 shadow-xl">
          <div className="absolute inset-0 bg-black/10 backdrop-blur-sm" />
          <div className="relative px-8 py-10 md:py-12">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="rounded-xl bg-white/20 p-2.5 backdrop-blur-sm">
                    <Calendar className="h-7 w-7 text-white" />
                  </div>
                  <div>
                    <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-white">
                      Agenda Inteligente
                    </h1>
                    <p className="text-blue-100 mt-1 text-sm md:text-base">
                      Gerencie consultas, exames e procedimentos com facilidade
                    </p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="secondary" className="bg-white/20 text-white border-none">
                    <Clock className="mr-1 h-3 w-3" /> Horário comercial: 08:00 - 18:00
                  </Badge>
                  <Badge variant="secondary" className="bg-white/20 text-white border-none">
                    <Users className="mr-1 h-3 w-3" /> 3 profissionais ativos
                  </Badge>
                </div>
              </div>
              <div className="flex flex-wrap gap-3">
                <Button
                  onClick={() => router.push('/patients')}
                  className="bg-white/20 text-white hover:bg-white/30 backdrop-blur-sm gap-2 font-semibold transition-all"
                >
                  <Users className="h-5 w-5" />
                  Pacientes
                </Button>
                <Button
                  onClick={() => setScheduleModalOpen(true)}
                  className="bg-white text-indigo-700 hover:bg-indigo-50 shadow-lg gap-2 font-semibold transition-all hover:scale-105"
                >
                  <Plus className="h-5 w-5" />
                  Novo Agendamento
                </Button>
                <Button
                  onClick={() => setShowUnavailabilities(!showUnavailabilities)}
                  variant="outline"
                  className="border-white/30 text-white hover:bg-white/10 gap-2"
                >
                  <Lock className="h-5 w-5" />
                  {showUnavailabilities ? 'Ocultar indisponibilidades' : 'Indisponibilidades'}
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Alerta de conflitos */}
        {conflicts.length > 0 && (
          <div className="mx-auto">
            <ConflictDetection
              conflicts={conflicts}
              onViewSchedule={(scheduleId: string) => {
                const schedule = filteredSchedules.find(s => s.id === scheduleId);
                if (schedule) handleSelectSchedule(schedule);
              }}
            />
          </div>
        )}

        {/* Barra de filtros */}
        <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4">
          <ScheduleFilterBar
            onFiltersChange={setFilters}
            professionals={PROFESSIONALS}
            onCreateClick={() => setScheduleModalOpen(true)}
          />
        </div>

        {/* Painel de indisponibilidades */}
        {showUnavailabilities && (
          <Card className="border-0 shadow-md overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 border-b">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Lock className="h-5 w-5 text-indigo-600" />
                  Períodos de Indisponibilidade
                </CardTitle>
                <Button
                  size="sm"
                  onClick={() => {
                    setEditingUnavailability(null);
                    setUnavailabilityModalOpen(true);
                  }}
                  variant="outline"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Adicionar
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {unavailabilities.isLoading ? (
                <div className="flex justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <UnavailabilityList
                  unavailabilities={unavailabilities.data || []}
                  onEdit={(unav) => {
                    setEditingUnavailability(unav);
                    setUnavailabilityModalOpen(true);
                  }}
                  onDelete={handleDeleteUnavailability}
                  onAdd={() => setUnavailabilityModalOpen(true)}
                />
              )}
            </CardContent>
          </Card>
        )}

        {/* Tabs de visualização */}
        <Tabs value={view} onValueChange={(value) => setView(value as any)} className="space-y-6">
          <div className="flex justify-center">
            <TabsList className="bg-gray-100 dark:bg-gray-800 p-1 rounded-xl shadow-inner">
              <TabsTrigger value="day" className="rounded-lg data-[state=active]:bg-white data-[state=active]:text-indigo-600 data-[state=active]:shadow-md transition-all">
                <Calendar className="h-4 w-4 mr-2" />
                Dia
              </TabsTrigger>
              <TabsTrigger value="dragdrop" className="rounded-lg data-[state=active]:bg-white data-[state=active]:text-indigo-600 data-[state=active]:shadow-md transition-all">
                <CalendarClock className="h-4 w-4 mr-2" />
                Drag & Drop
              </TabsTrigger>
              <TabsTrigger value="week" className="rounded-lg data-[state=active]:bg-white data-[state=active]:text-indigo-600 data-[state=active]:shadow-md transition-all">
                <CalendarDays className="h-4 w-4 mr-2" />
                Semana
              </TabsTrigger>
              <TabsTrigger value="month" className="rounded-lg data-[state=active]:bg-white data-[state=active]:text-indigo-600 data-[state=active]:shadow-md transition-all">
                <Grid3x3 className="h-4 w-4 mr-2" />
                Mês
              </TabsTrigger>
            </TabsList>
          </div>

          {/* Visão Dia */}
          <TabsContent value="day" className="space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-muted-foreground" />
                <Input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="w-auto border-gray-300 focus:ring-indigo-500"
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedDate(today)}
                  className="gap-1"
                >
                  <CalendarClock className="h-4 w-4" />
                  Hoje
                </Button>
              </div>
            </div>

            {dayAgenda.isLoading ? (
              <div className="flex justify-center py-16">
                <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
              </div>
            ) : dayAgenda.error ? (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>Erro ao carregar agenda. Tente novamente.</AlertDescription>
              </Alert>
            ) : (
              dayAgenda.data && (
                <ScheduleDayView
                  date={selectedDate}
                  schedules={filteredSchedules}
                  onSelectSchedule={handleSelectSchedule}
                />
              )
            )}
          </TabsContent>

          {/* Visão Drag & Drop */}
          <TabsContent value="dragdrop" className="space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-muted-foreground" />
                <Input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="w-auto border-gray-300 focus:ring-indigo-500"
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedDate(today)}
                  className="gap-1"
                >
                  <CalendarClock className="h-4 w-4" />
                  Hoje
                </Button>
              </div>
            </div>

            <DragDropScheduleView
              date={selectedDate}
              schedules={dragDropSchedules}
              onScheduleReschedule={handleReschedule}
              onSelectSchedule={handleSelectSchedule}
              isLoading={dayAgenda.isLoading}
            />
          </TabsContent>

          {/* Visão Semana */}
          <TabsContent value="week">
            <ScheduleWeekView
              weekStart={selectedWeekStart}
              days={weekAgenda.data?.days || []}
              onSelectSchedule={handleSelectSchedule}
              onWeekChange={setSelectedWeekStart}
            />
          </TabsContent>

          {/* Visão Mês */}
          <TabsContent value="month">
            <ScheduleMonthView
              currentMonth={selectedMonthStart}
              allSchedules={allSchedules}
              onMonthChange={setSelectedMonthStart}
              onDayClick={(date) => {
                setSelectedDate(date);
                setView('day');
              }}
            />
          </TabsContent>
        </Tabs>

        {/* Modais */}
        <ScheduleModal
          open={scheduleModalOpen}
          onOpenChange={setScheduleModalOpen}
          initialDate={selectedDate}
        />

        <UnavailabilityModal
          open={unavailabilityModalOpen}
          onOpenChange={setUnavailabilityModalOpen}
          unavailability={editingUnavailability || undefined}
          onSave={handleUnavailabilitySave}
          professionals={PROFESSIONALS}
        />

        {/* Modal de detalhes do agendamento */}
        <Dialog open={detailsModalOpen} onOpenChange={setDetailsModalOpen}>
          <DialogContent className="bg-white border-none sm:max-w-lg rounded-2xl">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold">Detalhes do Agendamento</DialogTitle>
            </DialogHeader>
            {selectedSchedule && (
              <ScrollArea className="max-h-[70vh] pr-4">
                <div className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <p className="text-sm text-muted-foreground">Paciente</p>
                      <p className="font-semibold text-lg">{selectedSchedule.patientName}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm text-muted-foreground">Profissional</p>
                      <p className="font-semibold text-lg">{selectedSchedule.professionalName}</p>
                    </div>
                  </div>
                  <Separator />
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Data e Hora</p>
                    <p className="font-medium">
                      {format(parseISO(selectedSchedule.startTime), "dd 'de' MMMM 'de' yyyy 'às' HH:mm", { locale: ptBR })} -{' '}
                      {format(parseISO(selectedSchedule.endTime), 'HH:mm')}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Status</p>
                    <Badge className={`${STATUS_CONFIG[selectedSchedule.status]?.bgLight} ${STATUS_CONFIG[selectedSchedule.status]?.color} border`}>
                      {STATUS_CONFIG[selectedSchedule.status]?.label}
                    </Badge>
                  </div>
                  {selectedSchedule.notes && (
                    <div className="space-y-1">
                      <p className="text-sm text-muted-foreground">Observações</p>
                      <p className="text-sm bg-gray-50 p-3 rounded-md">{selectedSchedule.notes}</p>
                    </div>
                  )}
                </div>
              </ScrollArea>
            )}
            <DialogFooter className="gap-2">
              <Button 
                className="bg-indigo-600 rounded-xl text-white hover:bg-indigo-700" 
                onClick={() => setDetailsModalOpen(false)}
              >
                Fechar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}