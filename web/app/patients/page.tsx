'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';
import { PatientTable } from '@/components/patients/patient-table';
import { usePatients, useDeletePatient } from '@/lib/use-patients';
import { PatientResponse, PatientFilters } from '@/types/patient';
import { AlertCircle, Plus, Search, Users } from 'lucide-react';

export default function PatientsPage() {
  const router = useRouter();
  const [filters, setFilters] = useState<PatientFilters>({
    search: '',
    page: 1,
    limit: 10,
  });
  const [selectedPatient, setSelectedPatient] = useState<PatientResponse | null>(null);

  const { data, isLoading, error, refetch } = usePatients(filters);
  const deletePatient = useDeletePatient();

  const totalPages = data ? Math.ceil(data.total / data.pageSize) : 0;

  const handleSearch = (value: string) => {
    setFilters((prev) => ({ ...prev, search: value, page: 1 }));
  };

  const handleGenderChange = (value: string) => {
    setFilters((prev) => ({
      ...prev,
      gender: value === 'all' ? undefined : value,
      page: 1,
    }));
  };

  const handlePageChange = (page: number) => {
    setFilters((prev) => ({ ...prev, page }));
  };

  const handleEdit = (patient: PatientResponse) => {
    setSelectedPatient(patient);
    router.push(`/patients/${patient.id}/edit`);
  };

  const handleDelete = async (patientId: string) => {
    // Promise personalizada para o toast
    const promise = deletePatient.mutateAsync(patientId);

    toast.promise(promise, {
      loading: 'Excluindo paciente...',
      success: (data) => {
        refetch();
        return 'Paciente excluído com sucesso!';
      },
      error: (err) => {
        const message = err?.response?.data?.message || 'Erro ao excluir paciente';
        return message;
      },
    });

    try {
      await promise;
    } catch (err) {
      // Erro já tratado pelo toast.promise
      console.error('Failed to delete patient:', err);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="mx-3 my-3 bg-gradient-to-r from-emerald-600 to-teal-600 rounded-2xl shadow-lg p-8 text-white">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="bg-white/20 p-2 rounded-lg backdrop-blur-sm">
                <Users className="w-6 h-6" />
              </div>
              <h1 className="text-4xl font-bold">Pacientes</h1>
            </div>
            <p className="text-emerald-100 text-lg">Gerencie os dados dos pacientes da clínica</p>
          </div>
          <Button
            onClick={() => router.push('/patients/new')}
            className="bg-white text-emerald-600 hover:bg-emerald-50 gap-2 font-semibold shadow-lg"
          >
            <Plus className="h-5 w-5" />
            Novo Paciente
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="mx-3 my-3 grid grid-cols-1 md:grid-cols-3 gap-4 bg-white p-6 rounded-xl shadow">
        <div className="space-y-2">
          <label className="text-sm font-semibold text-slate-700">Buscar</label>
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Por nome, CPF ou CNS..."
              className="pl-10 border-slate-200"
              value={filters.search}
              onChange={(e) => handleSearch(e.target.value)}
            />
          </div>
        </div>
        <div className="space-y-2">
          <label className="text-sm font-semibold text-slate-700">Gênero</label>
          <Select
            value={filters.gender || 'all'}
            onValueChange={handleGenderChange}
          >
            <SelectTrigger className="border-slate-200">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="M">Masculino</SelectItem>
              <SelectItem value="F">Feminino</SelectItem>
              <SelectItem value="O">Outro</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Error State */}
      {error && (
        <Alert variant="destructive" className="bg-red-50 border-red-200 mx-3">
          <AlertCircle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-700">
            Erro ao carregar pacientes. Tente novamente.
          </AlertDescription>
        </Alert>
      )}

      {/* Table */}
      <div className="mx-3 my-3 bg-white rounded-xl shadow-md overflow-hidden">
        <PatientTable
          patients={data?.items || []}
          onEdit={handleEdit}
          onDelete={handleDelete}
          isLoading={isLoading}
        />
      </div>

      {/* Pagination */}
      {data && totalPages > 1 && (
        <div className="flex justify-center p-6 bg-white rounded-xl shadow mx-3">
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  onClick={() =>
                    handlePageChange(Math.max(1, filters.page - 1))
                  }
                  className={
                    filters.page === 1 ? 'pointer-events-none opacity-50' : ''
                  }
                />
              </PaginationItem>

              {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                (page) => {
                  const isActive = page === filters.page;
                  const shouldShow =
                    page === 1 ||
                    page === totalPages ||
                    Math.abs(page - filters.page) <= 1;

                  if (!shouldShow) {
                    if (page === 2 && filters.page > 3) {
                      return <PaginationEllipsis key="ellipsis-start" />;
                    }
                    if (page === totalPages - 1 && filters.page < totalPages - 2) {
                      return <PaginationEllipsis key="ellipsis-end" />;
                    }
                    return null;
                  }

                  return (
                    <PaginationItem key={page}>
                      <PaginationLink
                        onClick={() => handlePageChange(page)}
                        isActive={isActive}
                      >
                        {page}
                      </PaginationLink>
                    </PaginationItem>
                  );
                }
              )}

              <PaginationItem>
                <PaginationNext
                  onClick={() =>
                    handlePageChange(Math.min(totalPages, filters.page + 1))
                  }
                  className={
                    filters.page === totalPages
                      ? 'pointer-events-none opacity-50'
                      : ''
                  }
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      )}

      {/* Summary */}
      {data && (
        <div className="text-sm text-muted-foreground text-center pb-6">
          Mostrando {data.items.length} de {data.total} pacientes
        </div>
      )}
    </div>
  );
}