'use client';

import { useState } from 'react';
import { ColumnDef } from '@tanstack/react-table';
import { DataTable } from '@/components/ui/data-table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { PatientResponse } from '@/types/patient';
import { formatDate, formatPhone, formatCPF } from '@/lib/format';
import { MoreHorizontal, Pencil, Trash2 } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface PatientTableProps {
  patients: PatientResponse[];
  onEdit: (patient: PatientResponse) => void;
  onDelete: (patientId: string) => Promise<void>;
  isLoading?: boolean;
}

export function PatientTable({ patients, onEdit, onDelete, isLoading }: PatientTableProps) {
  const [deletePatientId, setDeletePatientId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDeleteConfirm = async () => {
    if (!deletePatientId) return;

    setIsDeleting(true);
    try {
      await onDelete(deletePatientId);
      setDeletePatientId(null);
    } finally {
      setIsDeleting(false);
    }
  };

  const columns: ColumnDef<PatientResponse>[] = [
    {
      accessorKey: 'fullName',
      header: 'Nome',
      cell: ({ row }: any) => (
        <div className="font-medium">{row.getValue('fullName')}</div>
      ),
    },
    {
      accessorKey: 'cpf',
      header: 'CPF',
      cell: ({ row }: any) => formatCPF(row.getValue('cpf') as string),
    },
    {
      accessorKey: 'phonePrimary',
      header: 'Telefone',
      cell: ({ row }: any) => formatPhone(row.getValue('phonePrimary') as string),
    },
    {
      accessorKey: 'dateOfBirth',
      header: 'Data Nascimento',
      cell: ({ row }: any) => formatDate(row.getValue('dateOfBirth') as string),
    },
    {
      accessorKey: 'gender',
      header: 'Gênero',
      cell: ({ row }: any) => {
        const gender = row.getValue('gender') as string;
        const genderLabel = {
          M: 'Masculino',
          F: 'Feminino',
          O: 'Outro',
        }[gender] || gender;

        return <Badge variant="outline">{genderLabel}</Badge>;
      },
    },
    {
      id: 'actions',
      header: 'Ações',
      cell: ({ row }: any) => {
        const patient = row.original;

        return (
          <>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-8 w-8 p-0">
                  <span className="sr-only">Abrir menu</span>
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem
                  onClick={() => onEdit(patient)}
                  className="cursor-pointer"
                >
                  <Pencil className="mr-2 h-4 w-4" />
                  Editar
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => setDeletePatientId(patient.id)}
                  className="cursor-pointer text-red-600"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Deletar
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <AlertDialog open={deletePatientId === patient.id} onOpenChange={(open: boolean) => {
              if (!open) setDeletePatientId(null);
            }}>
              <AlertDialogContent>
                <AlertDialogTitle>Deletar Paciente?</AlertDialogTitle>
                <AlertDialogDescription>
                  Tem certeza que deseja deletar <strong>{patient.fullName}</strong>? Esta ação não pode ser desfeita.
                </AlertDialogDescription>
                <div className="flex gap-3 justify-end">
                  <AlertDialogCancel disabled={isDeleting}>Cancelar</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleDeleteConfirm}
                    disabled={isDeleting}
                    className="bg-red-600 hover:bg-red-700"
                  >
                    {isDeleting ? 'Deletando...' : 'Deletar'}
                  </AlertDialogAction>
                </div>
              </AlertDialogContent>
            </AlertDialog>
          </>
        );
      },
    },
  ];

  return <DataTable columns={columns} data={patients} isLoading={isLoading} />;
}
