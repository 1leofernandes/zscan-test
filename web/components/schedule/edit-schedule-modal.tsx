'use client';

import { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
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
import { useUpdateSchedule, useValidateSchedule } from '@/lib/use-schedule';
import { ScheduleResponse, ProcedureType, OriginType, ScheduleStatus, UpdateScheduleDto } from '@/types/schedule';
import { Loader2, AlertTriangle } from 'lucide-react';

interface EditScheduleModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  schedule: ScheduleResponse | null;
}

const PROCEDURE_TYPES: { value: ProcedureType; label: string }[] = [
  { value: 'consultation', label: 'Consulta' },
  { value: 'checkup', label: 'Avaliação' },
  { value: 'imaging', label: 'Imagem' },
  { value: 'exam', label: 'Exame' },
  { value: 'follow_up', label: 'Retorno' },
  { value: 'surgery', label: 'Cirurgia' },
];

const ORIGIN_TYPES: { value: OriginType; label: string }[] = [
  { value: 'in_person', label: 'Presencial' },
  { value: 'phone', label: 'Telefone' },
  { value: 'online', label: 'Online' },
];

const STATUS_TYPES: { value: ScheduleStatus; label: string }[] = [
  { value: 'scheduled', label: 'Agendado' },
  { value: 'confirmed', label: 'Confirmado' },
  { value: 'in_attendance', label: 'Em Atendimento' },
  { value: 'completed', label: 'Concluído' },
  { value: 'cancelled', label: 'Cancelado' },
  { value: 'no_show', label: 'Falta' },
];

const PROFESSIONALS = [
  { id: '550e8400-e29b-41d4-a716-446655440000', name: 'Dr. Carlos Silva' },
  { id: '550e8400-e29b-41d4-a716-446655440001', name: 'Dra. Ana Paula' },
  { id: '550e8400-e29b-41d4-a716-446655440002', name: 'Dr. Roberto Lima' },
];

export function EditScheduleModal({
  open,
  onOpenChange,
  schedule,
}: EditScheduleModalProps) {
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [isValidating, setIsValidating] = useState(false);

  const { control, handleSubmit, reset, watch, setValue } = useForm<UpdateScheduleDto>({
    defaultValues: schedule ? {
      startTime: schedule.startTime,
      endTime: schedule.endTime,
      procedureType: schedule.procedureType,
      origin: schedule.origin,
      status: schedule.status,
      notes: schedule.notes,
      professionalId: schedule.professionalId,
      professionalName: schedule.professionalName,
    } : {},
  });

  const startTime = watch('startTime');
  const endTime = watch('endTime');

  const updateSchedule = useUpdateSchedule(schedule?.id || '');
  const validateSchedule = useValidateSchedule();

  const onSubmit = async (data: UpdateScheduleDto) => {
    setValidationErrors([]);

    if (!schedule) return;

    // Validar se há mudança de horário
    if (data.startTime !== schedule.startTime || data.endTime !== schedule.endTime) {
      try {
        setIsValidating(true);
        const validation = await validateSchedule.mutateAsync({
          professionalId: data.professionalId || schedule.professionalId,
          startTime: data.startTime || schedule.startTime,
          endTime: data.endTime || schedule.endTime,
          scheduleId: schedule.id,
        });

        if (!validation.valid) {
          setValidationErrors(validation.errors);
          return;
        }
      } catch (error: any) {
        setValidationErrors([error.message || 'Erro ao validar agendamento']);
        return;
      } finally {
        setIsValidating(false);
      }
    }

    try {
      await updateSchedule.mutateAsync(data);
      onOpenChange(false);
      reset();
    } catch (error: any) {
      setValidationErrors([error.response?.data?.message || 'Erro ao atualizar agendamento']);
    }
  };

  if (!schedule) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Editar Agendamento</DialogTitle>
          <DialogDescription>
            Paciente: <strong>{schedule.patientName}</strong>
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Erros de Validação */}
          {validationErrors.length > 0 && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <div className="space-y-1">
                  {validationErrors.map((error, idx) => (
                    <div key={idx}>{error}</div>
                  ))}
                </div>
              </AlertDescription>
            </Alert>
          )}

          {/* Data e Hora */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Data e Hora Início *</label>
              <Controller
                control={control}
                name="startTime"
                render={({ field }) => (
                  <Input
                    type="datetime-local"
                    value={field.value ? new Date(field.value).toISOString().slice(0, 16) : ''}
                    onChange={(e) => field.onChange(new Date(e.target.value).toISOString())}
                    required
                  />
                )}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Data e Hora Fim *</label>
              <Controller
                control={control}
                name="endTime"
                render={({ field }) => (
                  <Input
                    type="datetime-local"
                    value={field.value ? new Date(field.value).toISOString().slice(0, 16) : ''}
                    onChange={(e) => field.onChange(new Date(e.target.value).toISOString())}
                    required
                  />
                )}
              />
            </div>
          </div>

          {/* Profissional */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Profissional</label>
            <Controller
              control={control}
              name="professionalId"
              render={({ field }) => (
                <Select value={field.value || ''} onValueChange={(v) => {
                  field.onChange(v);
                  const prof = PROFESSIONALS.find(p => p.id === v);
                  if (prof) setValue('professionalName', prof.name);
                }}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um profissional" />
                  </SelectTrigger>
                  <SelectContent>
                    {PROFESSIONALS.map((prof) => (
                      <SelectItem key={prof.id} value={prof.id}>
                        {prof.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </div>

          {/* Tipo de Procedimento */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Tipo de Procedimento</label>
            <Controller
              control={control}
              name="procedureType"
              render={({ field }) => (
                <Select
                  value={field.value || 'consultation'}
                  onValueChange={(v) => field.onChange(v as ProcedureType)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PROCEDURE_TYPES.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </div>

          {/* Origem */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Origem</label>
            <Controller
              control={control}
              name="origin"
              render={({ field }) => (
                <Select
                  value={field.value || 'in_person'}
                  onValueChange={(v) => field.onChange(v as OriginType)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ORIGIN_TYPES.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </div>

          {/* Status */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Status</label>
            <Controller
              control={control}
              name="status"
              render={({ field }) => (
                <Select
                  value={field.value || 'scheduled'}
                  onValueChange={(v) => field.onChange(v as ScheduleStatus)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {STATUS_TYPES.map((status) => (
                      <SelectItem key={status.value} value={status.value}>
                        {status.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </div>

          {/* Observações */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Observações</label>
            <Controller
              control={control}
              name="notes"
              render={({ field }) => (
                <Textarea
                  placeholder="Observações clínicas ou instruções..."
                  className="h-20"
                  {...field}
                  value={field.value || ''}
                />
              )}
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                onOpenChange(false);
                reset();
              }}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={updateSchedule.isPending || isValidating}
            >
              {(updateSchedule.isPending || isValidating) && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              {isValidating ? 'Validando...' : 'Salvar Alterações'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
