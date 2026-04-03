'use client';

import { use } from 'react';
import { PatientForm } from '@/components/patients/patient-form';
import { usePatient } from '@/lib/use-patients';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';

interface EditPatientPageProps {
  params: Promise<{ id: string }>;
}

export default function EditPatientPage({ params }: EditPatientPageProps) {
  const { id } = use(params);
  const { data: patient, isLoading, error } = usePatient(id);

  if (isLoading) {
    return (
      <div className="max-w-2xl">
        <div className="space-y-4">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-96" />
          <div className="mt-8 space-y-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error || !patient) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Erro ao carregar paciente. Tente novamente.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="py-6">
      <PatientForm patient={patient} isEditing={true} />
    </div>
  );
}
