'use client';

import { PatientForm } from '@/components/patients/patient-form';

export default function NewPatientPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Backdrop blur decorative elements */}
        <div className="absolute top-20 right-10 w-72 h-72 bg-emerald-300 rounded-full mix-blend-multiply filter blur-3xl opacity-10"></div>
        <div className="absolute -bottom-8 left-10 w-72 h-72 bg-teal-300 rounded-full mix-blend-multiply filter blur-3xl opacity-10"></div>

        {/* Content */}
        <div className="relative">
          <PatientForm />
        </div>
      </div>
    </div>
  );
}
