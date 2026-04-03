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
  X,
  AlertCircle,
  Edit,
  Trash2,
  Clock,
  MapPin,
  User,
  Stethoscope,
  Activity,
  CheckCircle,
  XCircle,
  AlertTriangle,
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

import { ScheduleDayView } from '@/components/schedule/day-view';
import { ScheduleWeekView } from '@/components/schedule/week-view';
import { ScheduleMonthView } from '@/components/schedule/month-view';
import { ScheduleModal } from '@/components/schedule/schedule-modal';
import { useDayAgenda, useWeekAgenda } from '@/lib/use-schedule';
import { ScheduleResponse } from '@/types/schedule';

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: any }> = {
  scheduled: { label: 'Agendado', color: 'bg-blue-100 text-blue-800 border-blue-200', icon: Clock },
  confirmed: { label: 'Confirmado', color: 'bg-green-100 text-green-800 border-green-200', icon: CheckCircle },
  in_attendance: { label: 'Em Atendimento', color: 'bg-yellow-100 text-yellow-800 border-yellow-200', icon: Activity },
  completed: { label: 'Concluído', color: 'bg-gray-100 text-gray-800 border-gray-200', icon: CheckCircle },
  cancelled: { label: 'Cancelado', color: 'bg-red-100 text-red-800 border-red-200', icon: XCircle },
  no_show: { label: 'Falta', color: 'bg-orange-100 text-orange-800 border-orange-200', icon: AlertTriangle },
};

const PROCEDURE_ICONS: Record<string, any> = {
  consultation: Stethoscope,
  checkup: Activity,
  imaging: Activity,
  exam: Stethoscope,
  follow_up: Activity,
  surgery: AlertTriangle,
};

export default function SchedulePage() {
  const router = useRouter();
  const today = useMemo(() => format(new Date(), 'yyyy-MM-dd'), []);
  const [selectedDate, setSelectedDate] = useState(today);
  const [selectedWeekStart, setSelectedWeekStart] = useState(today);
  const [selectedMonthStart, setSelectedMonthStart] = useState(today);
  const [selectedSchedule, setSelectedSchedule] = useState<ScheduleResponse | null>(null);
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const [view, setView] = useState<'day' | 'week' | 'month'>('day');
  const [scheduleModalOpen, setScheduleModalOpen] = useState(false);
  const [allSchedules, setAllSchedules] = useState<Array<{ id: string; date: string; status: string }>>([]);

  const dayAgenda = useDayAgenda(selectedDate);
  const weekAgenda = useWeekAgenda(selectedWeekStart);

  // Coletar todos os agendamentos para a visão de mês
  useMemo(() => {
    const schedules: Array<{ id: string; date: string; status: string }> = [];
    if (dayAgenda.data?.schedules) {
      dayAgenda.data.schedules.forEach((s) => {
        const dateStr = format(parseISO(s.startTime), 'yyyy-MM-dd');
        schedules.push({ id: s.id, date: dateStr, status: s.status });
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

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSelectedDate(e.target.value);
  };

  const handleWeekChange = (date: string) => {
    setSelectedWeekStart(date);
  };

  const handleSelectSchedule = (schedule: ScheduleResponse) => {
    setSelectedSchedule(schedule);
    setDetailsModalOpen(true);
  };

  const ProcedureIcon = selectedSchedule ? PROCEDURE_ICONS[selectedSchedule.procedureType] || Stethoscope : Stethoscope;
  const StatusConfig = selectedSchedule ? STATUS_CONFIG[selectedSchedule.status] : STATUS_CONFIG.scheduled;
  const StatusIcon = StatusConfig?.icon || Clock;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="mx-3 my-3 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl shadow-lg p-8 text-white">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="bg-white/20 p-2 rounded-lg backdrop-blur-sm">
                <Calendar className="w-6 h-6" />
              </div>
              <h1 className="text-4xl font-bold">Agenda</h1>
            </div>
            <p className="text-blue-100 text-lg">Visualize e gerencie os agendamentos da clínica</p>
          </div>
          <div className="flex gap-3">
            <Button
              onClick={() => setScheduleModalOpen(true)}
              className="bg-white text-indigo-600 hover:bg-indigo-300 gap-2 font-semibold shadow-lg"
            >
              <Plus className="h-5 w-5" />
              Novo Agendamento
            </Button>
            <Button
              onClick={() => router.push('/patients')}
              variant="outline"
              className="gap-2 border-white/20 text-indigo-600 hover:bg-indigo-300 font-semibold"
            >
              <Users className="h-5 w-5 text-indigo-600 hover:text-indigo-600" />
              Ver Pacientes
            </Button>
          </div>
        </div>
      </div>

      {/* Tabs com ícones */}
      <Tabs value={view} onValueChange={(value) => setView(value as 'day' | 'week' | 'month')} className="mx-3 my-6 space-y-6">
        <div className="flex justify-center">
          <TabsList className="bg-slate-100 p-1 rounded-xl">
            <TabsTrigger value="day" className="rounded-lg data-[state=active]:bg-white data-[state=active]:text-indigo-600 data-[state=active]:shadow-md">
              <Calendar className="w-4 h-4 mr-2" />
              Dia
            </TabsTrigger>
            <TabsTrigger value="week" className="rounded-lg data-[state=active]:bg-white data-[state=active]:text-indigo-600 data-[state=active]:shadow-md">
              <CalendarDays className="w-4 h-4 mr-2" />
              Semana
            </TabsTrigger>
            <TabsTrigger value="month" className="rounded-lg data-[state=active]:bg-white data-[state=active]:text-indigo-600 data-[state=active]:shadow-md">
              <Grid3x3 className="w-4 h-4 mr-2" />
              Mês
            </TabsTrigger>
          </TabsList>
        </div>

        {/* Day View */}
        <TabsContent value="day" className="space-y-4 mx-3 my-3">
          <div className="flex flex-wrap gap-2 items-center">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <Input
              type="date"
              value={selectedDate}
              onChange={handleDateChange}
              className="w-auto"
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

          {dayAgenda.error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>Erro ao carregar agenda do dia</AlertDescription>
            </Alert>
          )}

          {dayAgenda.isLoading ? (
            <Card>
              <CardContent className="p-8 text-center">
                <p className="text-muted-foreground">Carregando...</p>
              </CardContent>
            </Card>
          ) : (
            dayAgenda.data && (
              <ScheduleDayView
                date={selectedDate}
                schedules={dayAgenda.data.schedules}
                onSelectSchedule={handleSelectSchedule}
              />
            )
          )}
        </TabsContent>

        {/* Week View */}
        <TabsContent value="week">
          {weekAgenda.error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>Erro ao carregar agenda da semana</AlertDescription>
            </Alert>
          )}

          {weekAgenda.isLoading ? (
            <Card>
              <CardContent className="p-8 text-center">
                <p className="text-muted-foreground">Carregando...</p>
              </CardContent>
            </Card>
          ) : (
            weekAgenda.data && (
              <ScheduleWeekView
                weekStart={selectedWeekStart}
                days={weekAgenda.data.days}
                onSelectSchedule={handleSelectSchedule}
                onWeekChange={handleWeekChange}
              />
            )
          )}
        </TabsContent>

        {/* Month View */}
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

      {/* Schedule Modal para Novo Agendamento */}
      <ScheduleModal
        open={scheduleModalOpen}
        onOpenChange={setScheduleModalOpen}
        initialDate={selectedDate}
        initialTime="09:00"
      />

      {/* Modal de Detalhes do Agendamento */}
      <Dialog open={detailsModalOpen} onOpenChange={setDetailsModalOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          {selectedSchedule && (
            <>
              <DialogHeader>
                <div className="flex items-center justify-between">
                  <DialogTitle className="text-2xl font-bold flex items-center gap-2">
                    <ProcedureIcon className="w-6 h-6 text-indigo-600" />
                    Detalhes do Agendamento
                  </DialogTitle>
                  <Badge className={`${StatusConfig.color} border`}>
                    <StatusIcon className="w-3 h-3 mr-1" />
                    {StatusConfig.label}
                  </Badge>
                </div>
              </DialogHeader>

              <div className="space-y-6">
                {/* Informações principais */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <p className="text-xs font-semibold text-blue-600 uppercase tracking-wider flex items-center gap-1">
                      <User className="w-3 h-3" />
                      Paciente
                    </p>
                    <p className="font-bold text-lg text-slate-900 mt-1">{selectedSchedule.patientName}</p>
                  </div>
                  <div className="bg-purple-50 p-4 rounded-lg">
                    <p className="text-xs font-semibold text-purple-600 uppercase tracking-wider flex items-center gap-1">
                      <User className="w-3 h-3" />
                      Profissional
                    </p>
                    <p className="font-bold text-lg text-slate-900 mt-1">{selectedSchedule.professionalName}</p>
                  </div>
                  <div className="bg-green-50 p-4 rounded-lg">
                    <p className="text-xs font-semibold text-green-600 uppercase tracking-wider flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      Data e Hora
                    </p>
                    <p className="font-bold text-lg text-slate-900 mt-1">
                      {format(parseISO(selectedSchedule.startTime), "d 'de' MMMM 'de' yyyy", { locale: ptBR })} às {format(parseISO(selectedSchedule.startTime), "HH:mm")}
                    </p>
                  </div>
                  <div className="bg-yellow-50 p-4 rounded-lg">
                    <p className="text-xs font-semibold text-yellow-600 uppercase tracking-wider flex items-center gap-1">
                      <Stethoscope className="w-3 h-3" />
                      Tipo de Procedimento
                    </p>
                    <p className="font-bold text-lg text-slate-900 mt-1 capitalize">{selectedSchedule.procedureType}</p>
                  </div>
                  <div className="bg-teal-50 p-4 rounded-lg">
                    <p className="text-xs font-semibold text-teal-600 uppercase tracking-wider flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      Origem
                    </p>
                    <p className="font-bold text-lg text-slate-900 mt-1 capitalize">{selectedSchedule.origin}</p>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-xs font-semibold text-gray-600 uppercase tracking-wider flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      Duração
                    </p>
                    <p className="font-bold text-lg text-slate-900 mt-1">
                      {(() => {
                        const start = parseISO(selectedSchedule.startTime);
                        const end = parseISO(selectedSchedule.endTime);
                        const diffMinutes = Math.round((end.getTime() - start.getTime()) / 60000);
                        if (diffMinutes >= 60) {
                          const hours = Math.floor(diffMinutes / 60);
                          const mins = diffMinutes % 60;
                          return mins > 0 ? `${hours}h ${mins}min` : `${hours}h`;
                        }
                        return `${diffMinutes}min`;
                      })()}
                    </p>
                  </div>
                  {/* <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-sm font-semibold text-gray-700 mb-2">Observações</p>
                    <p className="text-sm text-gray-600 whitespace-pre-wrap">{selectedSchedule.notes}</p>
                  </div> */}
                  {selectedSchedule.notes && (
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <p className="text-sm font-semibold text-gray-700 mb-2">Observações</p>
                      <p className="text-sm text-gray-600 whitespace-pre-wrap">{selectedSchedule.notes}</p>
                    </div>
                  )}
                </div>

                {/* Observações */}
                {selectedSchedule.notes && (
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-sm font-semibold text-gray-700 mb-2">Observações</p>
                    <p className="text-sm text-gray-600 whitespace-pre-wrap">{selectedSchedule.notes}</p>
                  </div>
                )}

                {/* Ações */}
                <DialogFooter className="flex gap-2 ">
                  <Button
                    variant="outline"
                    onClick={() => setDetailsModalOpen(false)}
                    className=" bg-slate-900 text-gray-100 border-white hover:bg-gray-600 hover:text-white"
                  >
                    Fechar
                  </Button>
                  <Button
                    variant="outline"
                    className="text-blue-600 hover:bg-blue-50"
                  >
                    <Edit className="w-4 h-4 mr-2" />
                    Editar
                  </Button>
                  <Button
                    variant="outline"
                    className="text-red-600 hover:bg-red-50"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Cancelar
                  </Button>
                </DialogFooter>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}