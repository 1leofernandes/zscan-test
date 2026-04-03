'use client';

import { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { 
  Calendar as CalendarIcon, 
  Clock, 
  User, 
  Stethoscope, 
  Phone, 
  Video, 
  Building2,
  AlertCircle,
  CheckCircle2,
  Loader2,
  Search,
  X
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { useCreateSchedule, useValidateSchedule } from '@/lib/use-schedule';
import { usePatients } from '@/lib/use-patients';
import { CreateScheduleInput, ProcedureType, OriginType } from '@/types/schedule';
import { cn } from '@/lib/utils';

interface ScheduleModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialDate?: string;
  initialTime?: string;
}

const PROCEDURE_TYPES: { value: ProcedureType; label: string; icon: any; color: string }[] = [
  { value: 'consultation', label: 'Consulta', icon: Stethoscope, color: 'bg-blue-100 text-blue-700' },
  { value: 'checkup', label: 'Avaliação', icon: Stethoscope, color: 'bg-green-100 text-green-700' },
  { value: 'imaging', label: 'Imagem', icon: Stethoscope, color: 'bg-purple-100 text-purple-700' },
  { value: 'exam', label: 'Exame', icon: Stethoscope, color: 'bg-yellow-100 text-yellow-700' },
  { value: 'follow_up', label: 'Retorno', icon: Stethoscope, color: 'bg-orange-100 text-orange-700' },
  { value: 'surgery', label: 'Cirurgia', icon: Stethoscope, color: 'bg-red-100 text-red-700' },
];

const ORIGIN_TYPES: { value: OriginType; label: string; icon: any }[] = [
  { value: 'in_person', label: 'Presencial', icon: Building2 },
  { value: 'phone', label: 'Telefone', icon: Phone },
  { value: 'online', label: 'Online', icon: Video },
];

const PROFESSIONALS = [
  { id: '550e8400-e29b-41d4-a716-446655440000', name: 'Dr. Carlos Silva', specialty: 'Cardiologia', color: 'bg-indigo-100' },
  { id: '550e8400-e29b-41d4-a716-446655440001', name: 'Dra. Ana Paula', specialty: 'Dermatologia', color: 'bg-pink-100' },
  { id: '550e8400-e29b-41d4-a716-446655440002', name: 'Dr. Roberto Lima', specialty: 'Ortopedia', color: 'bg-emerald-100' },
];

const DURATION_OPTIONS = [
  { value: 15, label: '15 minutos' },
  { value: 30, label: '30 minutos' },
  { value: 45, label: '45 minutos' },
  { value: 60, label: '1 hora' },
  { value: 90, label: '1h 30min' },
  { value: 120, label: '2 horas' },
];

export function ScheduleModal({
  open,
  onOpenChange,
  initialDate,
  initialTime,
}: ScheduleModalProps) {
  const [patientSearch, setPatientSearch] = useState('');
  const [selectedPatient, setSelectedPatient] = useState<any>(null);
  const [durationMinutes, setDurationMinutes] = useState(30);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [isValidating, setIsValidating] = useState(false);

  const { control, handleSubmit, reset, setValue, watch } = useForm<CreateScheduleInput>({
    defaultValues: {
      patientId: '',
      professionalId: '',
      professionalName: '',
      startTime: initialDate && initialTime ? `${initialDate}T${initialTime}` : '',
      endTime: '',
      procedureType: 'consultation',
      origin: 'in_person',
      notes: '',
    },
  });

  const selectedProfessionalId = watch('professionalId');
  const startTimeValue = watch('startTime');

  const { data: patients, isLoading: isLoadingPatients } = usePatients({
    search: patientSearch,
    page: 1,
    limit: 10,
  });

  const createSchedule = useCreateSchedule();
  const validateSchedule = useValidateSchedule();

  const handleProfessionalChange = (professionalId: string) => {
    const professional = PROFESSIONALS.find(p => p.id === professionalId);
    if (professional) {
      setValue('professionalId', professionalId);
      setValue('professionalName', professional.name);
    }
  };

  const clearPatientSelection = () => {
    setSelectedPatient(null);
    setPatientSearch('');
    setValue('patientId', '');
  };

  const onSubmit = async (data: CreateScheduleInput) => {
    setValidationErrors([]);

    if (!selectedPatient) {
      setValidationErrors(['Selecione um paciente']);
      return;
    }

    if (!data.startTime) {
      setValidationErrors(['Selecione data e hora']);
      return;
    }

    if (!data.professionalId) {
      setValidationErrors(['Selecione um profissional']);
      return;
    }

    const startDateTime = new Date(data.startTime);
    const endDateTime = new Date(startDateTime.getTime() + durationMinutes * 60000);

    try {
      setIsValidating(true);
      const validation = await validateSchedule.mutateAsync({
        professionalId: data.professionalId,
        startTime: startDateTime.toISOString(),
        endTime: endDateTime.toISOString(),
      });

      if (!validation.valid) {
        setValidationErrors(validation.errors);
        return;
      }

      const payload: CreateScheduleInput = {
        patientId: selectedPatient.id,
        professionalId: data.professionalId,
        professionalName: data.professionalName,
        startTime: startDateTime.toISOString(),
        endTime: endDateTime.toISOString(),
        procedureType: data.procedureType,
        origin: data.origin,
        notes: data.notes || '',
      };

      await createSchedule.mutateAsync(payload);
      reset();
      setSelectedPatient(null);
      setPatientSearch('');
      onOpenChange(false);
    } catch (error: any) {
      console.error('❌ Erro ao criar agendamento:', error.response?.data || error.message);
      setValidationErrors([error.response?.data?.message || 'Erro ao criar agendamento']);
    } finally {
      setIsValidating(false);
    }
  };

  const selectedProcedure = PROCEDURE_TYPES.find(p => p.value === watch('procedureType'));
  const selectedOrigin = ORIGIN_TYPES.find(o => o.value === watch('origin'));
  const SelectedProcedureIcon = selectedProcedure?.icon || Stethoscope;
  const SelectedOriginIcon = selectedOrigin?.icon || Building2;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className=" border-none max-w-2xl max-h-[90vh] overflow-y-auto p-0 gap-0 bg-gradient-to-br from-white to-gray-50/50 rounded-2xl">
        {/* Header com gradiente */}
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-5 border-none">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-white flex items-center gap-2">
              <CalendarIcon className="h-6 w-6" />
              Novo Agendamento
            </DialogTitle>
            <p className="text-indigo-100 text-sm mt-1">
              Preencha as informações para criar um novo agendamento
            </p>
          </DialogHeader>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="px-6 py-5 space-y-5">
          {/* Erros de Validação */}
          {validationErrors.length > 0 && (
            <Alert variant="destructive" className="border-red-200 bg-red-50">
              <AlertCircle className="h-4 w-4 text-red-600" />
              <AlertDescription>
                <div className="space-y-1">
                  {validationErrors.map((error, idx) => (
                    <div key={idx} className="text-sm">{error}</div>
                  ))}
                </div>
              </AlertDescription>
            </Alert>
          )}

          {/* Seção: Paciente */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-blue-100 rounded-lg">
                <User className="h-4 w-4 text-blue-600" />
              </div>
              <Label className="text-base font-semibold text-gray-800">Dados do Paciente</Label>
            </div>
            
            <div className="relative">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Buscar paciente por nome ou CPF..."
                  value={patientSearch}
                  onChange={(e) => setPatientSearch(e.target.value)}
                  className="pl-9 bg-gray-50 border-gray-200 focus:bg-white transition-colors"
                />
              </div>

              {patientSearch && patients?.items && patients.items.length > 0 && (
                <div className="absolute top-12 left-0 right-0 border rounded-lg bg-white shadow-xl z-10 max-h-56 overflow-y-auto">
                  {patients.items.map((patient: any) => (
                    <button
                      key={patient.id}
                      type="button"
                      onClick={() => {
                        setSelectedPatient(patient);
                        setPatientSearch(patient.fullName);
                        setValue('patientId', patient.id);
                      }}
                      className="w-full text-left px-4 py-3 hover:bg-gray-50 border-b last:border-b-0 transition-colors"
                    >
                      <div className="font-medium text-gray-900">{patient.fullName}</div>
                      <div className="text-xs text-gray-500 mt-0.5">CPF: {patient.cpf}</div>
                    </button>
                  ))}
                </div>
              )}

              {isLoadingPatients && patientSearch && (
                <div className="absolute top-12 left-0 right-0 border rounded-lg bg-white shadow-xl z-10 p-4 text-center text-sm text-gray-500">
                  <Loader2 className="h-4 w-4 animate-spin inline mr-2" />
                  Buscando...
                </div>
              )}

              {selectedPatient && (
                <div className="mt-2 p-3 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-gray-900">{selectedPatient.fullName}</p>
                      <p className="text-xs text-gray-500 mt-0.5">CPF: {selectedPatient.cpf}</p>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={clearPatientSelection}
                      className="h-7 w-7 p-0 rounded-full hover:bg-blue-200"
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Seção: Data e Hora */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-green-100 rounded-lg">
                <Clock className="h-4 w-4 text-green-600" />
              </div>
              <Label className="text-base font-semibold text-gray-800">Data e Horário</Label>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Controller
                  control={control}
                  name="startTime"
                  render={({ field }) => (
                    <Input
                      type="datetime-local"
                      value={field.value || ''}
                      onChange={(e) => field.onChange(e.target.value)}
                      required
                      className="bg-gray-50 border-gray-200 focus:bg-white"
                    />
                  )}
                />
              </div>

              <div>
                <Select
                  value={durationMinutes.toString()}
                  onValueChange={(v) => setDurationMinutes(parseInt(v))}
                >
                  <SelectTrigger className="bg-gray-50 border-gray-200">
                    <SelectValue placeholder="Duração" />
                  </SelectTrigger>
                  <SelectContent>
                    {DURATION_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value.toString()}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Seção: Profissional */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-purple-100 rounded-lg">
                <Stethoscope className="h-4 w-4 text-purple-600" />
              </div>
              <Label className="text-base font-semibold text-gray-800">Profissional</Label>
            </div>
            
            <Select value={selectedProfessionalId} onValueChange={handleProfessionalChange}>
              <SelectTrigger className="bg-gray-50 border-gray-200">
                <SelectValue placeholder="Selecione um profissional" />
              </SelectTrigger>
              <SelectContent>
                {PROFESSIONALS.map((prof) => (
                  <SelectItem key={prof.id} value={prof.id}>
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${prof.color.replace('bg-', 'bg-').replace('100', '500')}`} />
                      {prof.name}
                      <Badge variant="outline" className="text-xs ml-2">{prof.specialty}</Badge>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Seção: Procedimento e Origem */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-700 flex items-center gap-1">
                <Stethoscope className="h-3 w-3" />
                Tipo de Procedimento
              </Label>
              <Controller
                control={control}
                name="procedureType"
                render={({ field }) => (
                  <Select
                    value={field.value}
                    onValueChange={(v) => field.onChange(v as ProcedureType)}
                  >
                    <SelectTrigger className="bg-gray-50 border-gray-200">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {PROCEDURE_TYPES.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          <div className="flex items-center gap-2">
                            <type.icon className="h-3 w-3" />
                            {type.label}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-700 flex items-center gap-1">
                <SelectedOriginIcon className="h-3 w-3" />
                Origem da Consulta
              </Label>
              <Controller
                control={control}
                name="origin"
                render={({ field }) => (
                  <Select
                    value={field.value}
                    onValueChange={(v) => field.onChange(v as OriginType)}
                  >
                    <SelectTrigger className="bg-gray-50 border-gray-200">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {ORIGIN_TYPES.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          <div className="flex items-center gap-2">
                            <type.icon className="h-3 w-3" />
                            {type.label}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
          </div>

          {/* Seção: Observações */}
          <div className="space-y-2">
            <Label className="text-sm font-medium text-gray-700">Observações</Label>
            <Controller
              control={control}
              name="notes"
              render={({ field }) => (
                <Textarea
                  placeholder="Observações clínicas ou instruções ao paciente..."
                  className="h-24 bg-gray-50 border-gray-200 focus:bg-white transition-colors"
                  {...field}
                />
              )}
            />
          </div>

          {/* Footer */}
          <DialogFooter className="gap-3 pt-4 border-t border-gray-100">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                reset();
                setSelectedPatient(null);
                setPatientSearch('');
                setValidationErrors([]);
                onOpenChange(false);
              }}
              className="border-gray-300 text-gray-700 hover:bg-gray-100"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={createSchedule.isPending || isValidating || !selectedPatient || !selectedProfessionalId || !startTimeValue}
              className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white shadow-lg transition-all hover:shadow-xl disabled:opacity-50"
            >
              {(createSchedule.isPending || isValidating) && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              {isValidating ? (
                'Validando disponibilidade...'
              ) : (
                <>
                  <CheckCircle2 className="mr-2 h-4 w-4" />
                  Criar Agendamento
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}