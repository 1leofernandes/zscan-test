'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { 
  Loader2, 
  Calendar as CalendarIcon, 
  Clock, 
  User, 
  Tag, 
  FileText, 
  DoorOpen,
  Briefcase,
  GraduationCap,
  Wrench,
  Umbrella,
  X,
  CheckCircle2
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

// Schema de validação para indisponibilidade
const unavailabilitySchema = z.object({
  professionalId: z.string().min(1, 'Selecione um profissional'),
  professionalName: z.string().min(1, 'Nome do profissional é obrigatório'),
  type: z.enum(['vacation', 'break', 'training', 'maintenance', 'other']),
  title: z.string().optional(),
  description: z.string().optional(),
  startTime: z.string().optional(),
  endTime: z.string().optional(),
  isAllDay: z.boolean().default(true),
  resourceRoom: z.string().optional(),
});

type UnavailabilityFormData = z.infer<typeof unavailabilitySchema>;

export interface Unavailability {
  id?: string;
  professionalId: string;
  professionalName: string;
  type: string;
  title?: string;
  description?: string;
  startTime?: Date;
  endTime?: Date;
  isAllDay: boolean;
  resourceRoom?: string;
}

interface UnavailabilityModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  unavailability?: Unavailability | null;
  onSave: (data: Unavailability) => Promise<void>;
  professionals: { id: string; name: string }[];
}

const TYPE_CONFIG: Record<string, { label: string; icon: any; color: string; bgLight: string }> = {
  vacation: { 
    label: 'Férias', 
    icon: Umbrella, 
    color: 'text-blue-700', 
    bgLight: 'bg-blue-50 border-blue-200' 
  },
  break: { 
    label: 'Intervalo', 
    icon: Clock, 
    color: 'text-yellow-700', 
    bgLight: 'bg-yellow-50 border-yellow-200' 
  },
  training: { 
    label: 'Treinamento', 
    icon: GraduationCap, 
    color: 'text-purple-700', 
    bgLight: 'bg-purple-50 border-purple-200' 
  },
  maintenance: { 
    label: 'Manutenção', 
    icon: Wrench, 
    color: 'text-orange-700', 
    bgLight: 'bg-orange-50 border-orange-200' 
  },
  other: { 
    label: 'Outro', 
    icon: Briefcase, 
    color: 'text-gray-700', 
    bgLight: 'bg-gray-50 border-gray-200' 
  },
};

export function UnavailabilityModal({
  open,
  onOpenChange,
  unavailability,
  onSave,
  professionals,
}: UnavailabilityModalProps) {
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<UnavailabilityFormData>({
    resolver: zodResolver(unavailabilitySchema),
    defaultValues: {
      professionalId: '',
      professionalName: '',
      type: 'other',
      title: '',
      description: '',
      startTime: '',
      endTime: '',
      isAllDay: true,
      resourceRoom: '',
    },
  });

  const selectedType = form.watch('type');

  useEffect(() => {
    if (unavailability) {
      form.reset({
        professionalId: unavailability.professionalId,
        professionalName: unavailability.professionalName,
        type: unavailability.type as any,
        title: unavailability.title || '',
        description: unavailability.description || '',
        startTime: unavailability.startTime?.toISOString().slice(0, 16) || '',
        endTime: unavailability.endTime?.toISOString().slice(0, 16) || '',
        isAllDay: unavailability.isAllDay ?? true,
        resourceRoom: unavailability.resourceRoom || '',
      });
    } else {
      form.reset({
        professionalId: '',
        professionalName: '',
        type: 'other',
        title: '',
        description: '',
        startTime: '',
        endTime: '',
        isAllDay: true,
        resourceRoom: '',
      });
    }
  }, [unavailability, form]);

  const handleProfessionalChange = (professionalId: string) => {
    const professional = professionals.find(p => p.id === professionalId);
    form.setValue('professionalId', professionalId);
    form.setValue('professionalName', professional?.name || '');
  };

  const onSubmit = async (data: UnavailabilityFormData) => {
    setIsLoading(true);
    try {
      const payload: Unavailability = {
        professionalId: data.professionalId,
        professionalName: data.professionalName,
        type: data.type,
        title: data.title,
        description: data.description,
        startTime: data.startTime ? new Date(data.startTime) : undefined,
        endTime: data.endTime ? new Date(data.endTime) : undefined,
        isAllDay: data.isAllDay,
        resourceRoom: data.resourceRoom,
        ...(unavailability?.id && { id: unavailability.id }),
      };
      await onSave(payload);
      onOpenChange(false);
      form.reset();
    } catch (error) {
      console.error('Error saving unavailability:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const TypeIcon = selectedType ? TYPE_CONFIG[selectedType]?.icon : Briefcase;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="border-none max-w-2xl max-h-[90vh] overflow-y-auto p-0 gap-0 bg-gradient-to-br from-white to-gray-50/50 rounded-2xl">
        {/* Header com gradiente */}
        <div className="bg-gradient-to-r from-orange-600 to-red-600 px-6 py-5 ">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-white flex items-center gap-2">
              <Clock className="h-6 w-6" />
              {unavailability ? 'Editar Indisponibilidade' : 'Nova Indisponibilidade'}
            </DialogTitle>
            <p className="text-orange-100 text-sm mt-1">
              {unavailability 
                ? 'Atualize os dados do período de indisponibilidade' 
                : 'Registre um período em que o profissional não estará disponível'}
            </p>
          </DialogHeader>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="px-6 py-5 space-y-5">
            {/* Profissional */}
            <div className="space-y-2">
              <FormField
                control={form.control}
                name="professionalId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                      <User className="h-4 w-4 text-orange-600" />
                      Profissional
                    </FormLabel>
                    <Select
                      value={field.value}
                      onValueChange={handleProfessionalChange}
                    >
                      <FormControl>
                        <SelectTrigger className="bg-gray-50 border-gray-200 focus:ring-orange-500">
                          <SelectValue placeholder="Selecione um profissional" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {professionals.map((prof) => (
                          <SelectItem key={prof.id} value={prof.id}>
                            <div className="flex items-center gap-2">
                              <div className="w-2 h-2 rounded-full bg-orange-500" />
                              {prof.name}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Tipo de Indisponibilidade */}
            <div className="space-y-2">
              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                      <Tag className="h-4 w-4 text-orange-600" />
                      Tipo
                    </FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger className="bg-gray-50 border-gray-200">
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {Object.entries(TYPE_CONFIG).map(([key, config]) => (
                          <SelectItem key={key} value={key}>
                            <div className="flex items-center gap-2">
                              <config.icon className="h-4 w-4" />
                              {config.label}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              {selectedType && (
                <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm ${TYPE_CONFIG[selectedType]?.bgLight}`}>
                  <TypeIcon className="h-3.5 w-3.5" />
                  <span className={TYPE_CONFIG[selectedType]?.color}>
                    {TYPE_CONFIG[selectedType]?.label}
                  </span>
                </div>
              )}
            </div>

            {/* Título */}
            <div className="space-y-2">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                      <Tag className="h-4 w-4 text-orange-600" />
                      Título
                    </FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="Ex: Férias de 15 dias, Curso de atualização..." 
                        className="bg-gray-50 border-gray-200 focus:ring-orange-500 focus:bg-white transition-colors"
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <Separator className="my-2" />

            {/* Período */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-orange-100 rounded-lg">
                  <CalendarIcon className="h-4 w-4 text-orange-600" />
                </div>
                <h3 className="text-sm font-semibold text-gray-800">Período de Indisponibilidade</h3>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="startTime"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm text-gray-600">Data/Hora Início</FormLabel>
                      <FormControl>
                        <Input 
                          type="datetime-local" 
                          {...field} 
                          className="bg-gray-50 border-gray-200 focus:ring-orange-500"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="endTime"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm text-gray-600">Data/Hora Fim</FormLabel>
                      <FormControl>
                        <Input 
                          type="datetime-local" 
                          {...field} 
                          className="bg-gray-50 border-gray-200 focus:ring-orange-500"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Dia Inteiro */}
            <FormField
              control={form.control}
              name="isAllDay"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
                  <FormControl>
                    <input
                      type="checkbox"
                      checked={field.value}
                      onChange={field.onChange}
                      className="h-4 w-4 rounded border-gray-300 text-orange-600 focus:ring-orange-500"
                    />
                  </FormControl>
                  <FormLabel className="!mt-0 text-sm text-gray-700 cursor-pointer">
                    Dia inteiro
                  </FormLabel>
                </FormItem>
              )}
            />

            {/* Sala/Recurso */}
            <div className="space-y-2">
              <FormField
                control={form.control}
                name="resourceRoom"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                      <DoorOpen className="h-4 w-4 text-orange-600" />
                      Sala/Recurso
                    </FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="Ex: Sala 101, Equipamento de Raio-X..." 
                        className="bg-gray-50 border-gray-200 focus:ring-orange-500"
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Descrição */}
            <div className="space-y-2">
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                      <FileText className="h-4 w-4 text-orange-600" />
                      Descrição
                    </FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Informações adicionais sobre a indisponibilidade..."
                        className="h-24 bg-gray-50 border-gray-200 focus:ring-orange-500 focus:bg-white transition-colors"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Footer */}
            <DialogFooter className="gap-3 pt-4 border-t border-gray-100">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                className="border-gray-300 text-gray-700 hover:bg-gray-100"
              >
                Cancelar
              </Button>
              <Button 
                type="submit" 
                disabled={isLoading}
                className="bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 text-white shadow-lg transition-all hover:shadow-xl disabled:opacity-50"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="mr-2 h-4 w-4" />
                    {unavailability ? 'Atualizar' : 'Criar Indisponibilidade'}
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

// ============================================
// Componente UnavailabilityList aprimorado
// ============================================

export function UnavailabilityList({ 
  unavailabilities, 
  onEdit, 
  onDelete, 
  onAdd 
}: { 
  unavailabilities: Unavailability[];
  onEdit: (unav: Unavailability) => void;
  onDelete: (id: string) => void;
  onAdd: () => void;
}) {
  if (unavailabilities.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground bg-gray-50 rounded-lg">
        <Clock className="h-12 w-12 mx-auto text-gray-300 mb-3" />
        <p>Nenhuma indisponibilidade cadastrada</p>
        <Button variant="link" onClick={onAdd} className="mt-2 text-orange-600">
          Adicionar
        </Button>
      </div>
    );
  }

  const formatDateTime = (date?: Date) => {
    if (!date) return 'Não definida';
    return format(new Date(date), "dd/MM/yyyy HH:mm", { locale: ptBR });
  };

  const getTypeConfig = (type: string) => {
    return TYPE_CONFIG[type] || TYPE_CONFIG.other;
  };

  return (
    <div className="space-y-3">
      {unavailabilities.map((unav) => {
        const typeConfig = getTypeConfig(unav.type);
        const TypeIconComponent = typeConfig.icon;
        
        return (
          <div 
            key={unav.id} 
            className={`flex items-center justify-between p-4 rounded-xl border ${typeConfig.bgLight} hover:shadow-md transition-all`}
          >
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <div className={`p-1.5 rounded-lg bg-white/50`}>
                  <TypeIconComponent className={`h-4 w-4 ${typeConfig.color}`} />
                </div>
                <span className={`text-sm font-semibold ${typeConfig.color}`}>
                  {typeConfig.label}
                </span>
                {unav.title && (
                  <Badge variant="outline" className="text-xs">
                    {unav.title}
                  </Badge>
                )}
              </div>
              <p className="font-medium text-gray-900">
                {unav.professionalName}
              </p>
              <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                <span className="flex items-center gap-1">
                  <CalendarIcon className="h-3 w-3" />
                  {formatDateTime(unav.startTime)}
                </span>
                {unav.endTime && (
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    até {formatDateTime(unav.endTime)}
                  </span>
                )}
                {unav.isAllDay && (
                  <Badge variant="secondary" className="text-xs">
                    Dia inteiro
                  </Badge>
                )}
              </div>
              {unav.description && (
                <p className="text-xs text-gray-500 mt-2 line-clamp-1">
                  {unav.description}
                </p>
              )}
            </div>
            <div className="flex gap-2 ml-4">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => onEdit(unav)}
                className="hover:bg-white/50"
              >
                Editar
              </Button>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => onDelete(unav.id!)}
                className="text-red-600 hover:bg-red-50 hover:text-red-700"
              >
                Remover
              </Button>
            </div>
          </div>
        );
      })}
    </div>
  );
}