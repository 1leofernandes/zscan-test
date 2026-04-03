'use client';

import { useState, useCallback } from 'react';
import { format, subDays, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  Calendar,
  X,
  ChevronDown,
  Filter,
  Plus,
  Clock,
  Stethoscope,
  AlertCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuCheckboxItem,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { ScheduleStatus, ProcedureType } from '@/types/schedule';

export interface ScheduleFilters {
  dateRange: 'today' | 'last7days' | 'custom' | null;
  customDateStart?: string;
  customDateEnd?: string;
  selectedProfessionals: string[];
  selectedStatuses: ScheduleStatus[];
  selectedProcedureTypes: ProcedureType[];
}

interface ScheduleFilterBarProps {
  onFiltersChange: (filters: ScheduleFilters) => void;
  professionals: Array<{ id: string; name: string }>;
  onCreateClick?: () => void;
}

const PROCEDURE_TYPES: { value: ProcedureType; label: string }[] = [
  { value: 'consultation', label: 'Consulta' },
  { value: 'checkup', label: 'Avaliação' },
  { value: 'imaging', label: 'Imagem' },
  { value: 'exam', label: 'Exame' },
  { value: 'follow_up', label: 'Retorno' },
  { value: 'surgery', label: 'Cirurgia' },
];

const STATUS_OPTIONS: { value: ScheduleStatus; label: string }[] = [
  { value: 'scheduled', label: 'Agendado' },
  { value: 'confirmed', label: 'Confirmado' },
  { value: 'in_attendance', label: 'Em Atendimento' },
  { value: 'completed', label: 'Concluído' },
  { value: 'cancelled', label: 'Cancelado' },
  { value: 'no_show', label: 'Falta' },
];

export function ScheduleFilterBar({
  onFiltersChange,
  professionals,
  onCreateClick,
}: ScheduleFilterBarProps) {
  const today = format(new Date(), 'yyyy-MM-dd');
  const [filters, setFilters] = useState<ScheduleFilters>({
    dateRange: null,
    selectedProfessionals: [],
    selectedStatuses: [],
    selectedProcedureTypes: [],
  });

  const handleDateRangeChange = useCallback(
    (range: 'today' | 'last7days' | null) => {
      const newFilters = { ...filters, dateRange: range };

      if (range === 'today') {
        newFilters.customDateStart = today;
        newFilters.customDateEnd = today;
      } else if (range === 'last7days') {
        newFilters.customDateStart = format(subDays(new Date(), 7), 'yyyy-MM-dd');
        newFilters.customDateEnd = today;
      }

      setFilters(newFilters);
      onFiltersChange(newFilters);
    },
    [today, filters, onFiltersChange]
  );

  const handleCustomDateChange = useCallback(
    (startDate: string, endDate: string) => {
      const newFilters = {
        ...filters,
        dateRange: 'custom' as const,
        customDateStart: startDate,
        customDateEnd: endDate,
      };
      setFilters(newFilters);
      onFiltersChange(newFilters);
    },
    [filters, onFiltersChange]
  );

  const handleProfessionalToggle = useCallback(
    (profId: string) => {
      const newProfessionals = filters.selectedProfessionals.includes(profId)
        ? filters.selectedProfessionals.filter((id) => id !== profId)
        : [...filters.selectedProfessionals, profId];

      const newFilters = { ...filters, selectedProfessionals: newProfessionals };
      setFilters(newFilters);
      onFiltersChange(newFilters);
    },
    [filters, onFiltersChange]
  );

  const handleStatusToggle = useCallback(
    (status: ScheduleStatus) => {
      const newStatuses = filters.selectedStatuses.includes(status)
        ? filters.selectedStatuses.filter((s) => s !== status)
        : [...filters.selectedStatuses, status];

      const newFilters = { ...filters, selectedStatuses: newStatuses };
      setFilters(newFilters);
      onFiltersChange(newFilters);
    },
    [filters, onFiltersChange]
  );

  const handleProcedureTypeToggle = useCallback(
    (procType: ProcedureType) => {
      const newTypes = filters.selectedProcedureTypes.includes(procType)
        ? filters.selectedProcedureTypes.filter((t) => t !== procType)
        : [...filters.selectedProcedureTypes, procType];

      const newFilters = { ...filters, selectedProcedureTypes: newTypes };
      setFilters(newFilters);
      onFiltersChange(newFilters);
    },
    [filters, onFiltersChange]
  );

  const handleClearFilters = useCallback(() => {
    const emptyFilters: ScheduleFilters = {
      dateRange: null,
      selectedProfessionals: [],
      selectedStatuses: [],
      selectedProcedureTypes: [],
    };
    setFilters(emptyFilters);
    onFiltersChange(emptyFilters);
  }, [onFiltersChange]);

  const hasActiveFilters =
    filters.dateRange ||
    filters.selectedProfessionals.length > 0 ||
    filters.selectedStatuses.length > 0 ||
    filters.selectedProcedureTypes.length > 0;

  return (
    <div className="space-y-4">
      <div className="flex gap-2 items-center flex-wrap">
        {/* Date Range Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="gap-2">
              <Calendar className="w-4 h-4" />
              {filters.dateRange === 'today' && 'Hoje'}
              {filters.dateRange === 'last7days' && 'Últimos 7 dias'}
              {filters.dateRange === 'custom' && 'Data customizada'}
              {!filters.dateRange && 'Data'}
              <ChevronDown className="w-3 h-3" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-56">
            <DropdownMenuLabel>Período</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => handleDateRangeChange('today')}>
              <span className="flex items-center gap-2">
                {filters.dateRange === 'today' && '✓ '}
                Hoje
              </span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleDateRangeChange('last7days')}>
              <span className="flex items-center gap-2">
                {filters.dateRange === 'last7days' && '✓ '}
                Últimos 7 dias
              </span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <div className="p-2 space-y-2">
              <label className="text-xs font-semibold text-muted-foreground">De:</label>
              <Input
                type="date"
                value={filters.customDateStart || today}
                onChange={(e) =>
                  handleCustomDateChange(
                    e.target.value,
                    filters.customDateEnd || today
                  )
                }
                className="h-8 text-xs"
              />
              <label className="text-xs font-semibold text-muted-foreground">Até:</label>
              <Input
                type="date"
                value={filters.customDateEnd || today}
                onChange={(e) =>
                  handleCustomDateChange(
                    filters.customDateStart || today,
                    e.target.value
                  )
                }
                className="h-8 text-xs"
              />
            </div>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Professional Filter */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="gap-2"
            >
              <Stethoscope className="w-4 h-4" />
              Profissional
              {filters.selectedProfessionals.length > 0 && (
                <Badge variant="secondary" className="ml-1">
                  {filters.selectedProfessionals.length}
                </Badge>
              )}
              <ChevronDown className="w-3 h-3" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-56">
            <DropdownMenuLabel>Selecione Profissionais</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {professionals.map((prof) => (
              <DropdownMenuCheckboxItem
                key={prof.id}
                checked={filters.selectedProfessionals.includes(prof.id)}
                onCheckedChange={() => handleProfessionalToggle(prof.id)}
              >
                {prof.name}
              </DropdownMenuCheckboxItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Status Filter */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="gap-2"
            >
              <AlertCircle className="w-4 h-4" />
              Status
              {filters.selectedStatuses.length > 0 && (
                <Badge variant="secondary" className="ml-1">
                  {filters.selectedStatuses.length}
                </Badge>
              )}
              <ChevronDown className="w-3 h-3" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-56">
            <DropdownMenuLabel>Filtrar Status</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {STATUS_OPTIONS.map((status) => (
              <DropdownMenuCheckboxItem
                key={status.value}
                checked={filters.selectedStatuses.includes(status.value)}
                onCheckedChange={() => handleStatusToggle(status.value)}
              >
                {status.label}
              </DropdownMenuCheckboxItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Procedure Type Filter */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="gap-2"
            >
              <Clock className="w-4 h-4" />
              Tipo
              {filters.selectedProcedureTypes.length > 0 && (
                <Badge variant="secondary" className="ml-1">
                  {filters.selectedProcedureTypes.length}
                </Badge>
              )}
              <ChevronDown className="w-3 h-3" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-56">
            <DropdownMenuLabel>Tipo de Procedimento</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {PROCEDURE_TYPES.map((type) => (
              <DropdownMenuCheckboxItem
                key={type.value}
                checked={filters.selectedProcedureTypes.includes(type.value)}
                onCheckedChange={() => handleProcedureTypeToggle(type.value)}
              >
                {type.label}
              </DropdownMenuCheckboxItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Clear Filters Button */}
        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClearFilters}
            className="gap-2 text-red-600 hover:text-red-700 hover:bg-red-50"
          >
            <X className="w-4 h-4" />
            Limpar
          </Button>
        )}

        {/* Create Button */}
        {onCreateClick && (
          <div className="ml-auto">
            <Button size="sm" onClick={onCreateClick} className="gap-2">
              <Plus className="w-4 h-4" />
              Novo Agendamento
            </Button>
          </div>
        )}
      </div>

      {/* Active Filters Display */}
      {hasActiveFilters && (
        <div className="flex gap-1 flex-wrap">
          {filters.dateRange === 'today' && (
            <Badge variant="default" className="cursor-pointer">
              Hoje
              <X
                className="w-3 h-3 ml-1"
                onClick={() => handleDateRangeChange(null)}
              />
            </Badge>
          )}
          {filters.dateRange === 'last7days' && (
            <Badge variant="default" className="cursor-pointer">
              Últimos 7 dias
              <X
                className="w-3 h-3 ml-1"
                onClick={() => handleDateRangeChange(null)}
              />
            </Badge>
          )}
          {filters.selectedProfessionals.map((profId) => {
            const prof = professionals.find((p) => p.id === profId);
            return (
              <Badge key={profId} variant="secondary" className="cursor-pointer">
                {prof?.name}
                <X
                  className="w-3 h-3 ml-1"
                  onClick={() => handleProfessionalToggle(profId)}
                />
              </Badge>
            );
          })}
          {filters.selectedStatuses.map((status) => {
            const label = STATUS_OPTIONS.find((s) => s.value === status)?.label;
            return (
              <Badge key={status} variant="secondary" className="cursor-pointer">
                {label}
                <X
                  className="w-3 h-3 ml-1"
                  onClick={() => handleStatusToggle(status)}
                />
              </Badge>
            );
          })}
          {filters.selectedProcedureTypes.map((procType) => {
            const label = PROCEDURE_TYPES.find((t) => t.value === procType)?.label;
            return (
              <Badge key={procType} variant="secondary" className="cursor-pointer">
                {label}
                <X
                  className="w-3 h-3 ml-1"
                  onClick={() => handleProcedureTypeToggle(procType)}
                />
              </Badge>
            );
          })}
        </div>
      )}
    </div>
  );
}
