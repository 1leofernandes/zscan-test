import { z } from 'zod';

// Auth Schemas
export const loginSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(8, 'Senha deve ter pelo menos 8 caracteres'),
  tenantId: z.string().uuid().optional(),
});

export type LoginSchema = z.infer<typeof loginSchema>;

export const signupSchema = z.object({
  name: z.string().min(3, 'Nome deve ter pelo menos 3 caracteres'),
  email: z.string().email('Email inválido'),
  password: z.string().min(8, 'Senha deve ter pelo menos 8 caracteres'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Senhas não coincidem',
  path: ['confirmPassword'],
});

export type SignupSchema = z.infer<typeof signupSchema>;

// Patient Schemas
export const addressSchema = z.object({
  cep: z.string().regex(/^\d{5}-?\d{3}$|^$/, 'CEP inválido (formato: 12345-678 ou 12345678)'),
  street: z.string(),
  number: z.string(),
  complement: z.string().optional(),
  neighborhood: z.string(),
  city: z.string(),
  state: z.string().length(2, 'UF deve ter 2 caracteres'),
});

export type AddressSchema = z.infer<typeof addressSchema>;

export const createPatientSchema = z.object({
  fullName: z.string().min(3, 'Nome completo deve ter pelo menos 3 caracteres').max(100),
  dateOfBirth: z.string().refine(
    (date) => {
      const d = new Date(date);
      const age = new Date().getFullYear() - d.getFullYear();
      return age >= 0 && age <= 150;
    },
    'Data de nascimento inválida'
  ),
  cpf: z.string().regex(/^\d{11}$|^$/, 'CPF deve ter 11 dígitos'),
  cns: z.string().optional(),
  gender: z.enum(['M', 'F', 'O'], { errorMap: () => ({ message: 'Gênero inválido' }) }),
  phonePrimary: z.string().regex(/^\d{0,11}$/, 'Telefone inválido'),
  phoneSecondary: z.string().optional(),
  email: z.string().optional(),
  address: addressSchema,
  healthPlanId: z.string().optional(),
});

export type CreatePatientSchema = z.infer<typeof createPatientSchema>;

export const updatePatientSchema = z.object({
  fullName: z.string().min(3, 'Nome completo deve ter pelo menos 3 caracteres').max(100).optional(),
  dateOfBirth: z.string().refine(
    (date) => {
      const d = new Date(date);
      const age = new Date().getFullYear() - d.getFullYear();
      return age >= 0 && age <= 150;
    },
    'Data de nascimento inválida'
  ).optional(),
  cpf: z.string().regex(/^\d{11}$/, 'CPF deve ter 11 dígitos').optional(),
  cns: z.string().regex(/^\d{15}$/, 'CNS deve ter 15 dígitos').optional().or(z.literal('')),
  gender: z.enum(['M', 'F', 'O'], { errorMap: () => ({ message: 'Gênero inválido' }) }).optional(),
  phonePrimary: z.string().regex(/^\d{10,11}$/, 'Telefone inválido').optional(),
  phoneSecondary: z.string().regex(/^\d{10,11}$/, 'Telefone inválido').optional().or(z.literal('')),
  email: z.string().email('Email inválido').optional().or(z.literal('')),
  address: addressSchema.optional(),
  healthPlanId: z.string().optional(),
});
export type UpdatePatientSchema = z.infer<typeof updatePatientSchema>;

// Schedule Schemas
export const createScheduleSchema = z.object({
  patientId: z.string().uuid('ID de paciente inválido'),
  professionalId: z.string().uuid('ID de profissional inválido'),
  professionalName: z.string().min(3),
  resourceRoom: z.string().optional(),
  procedureType: z.enum([
    'consultation',
    'checkup',
    'imaging',
    'exam',
    'follow_up',
    'surgery',
  ]),
  startTime: z.string().datetime(),
  endTime: z.string().datetime(),
  status: z.enum([
    'scheduled',
    'confirmed',
    'in_attendance',
    'completed',
    'cancelled',
    'no_show',
  ]).optional(),
  origin: z.enum(['in_person', 'phone', 'online']).optional(),
  notes: z.string().optional(),
  patientInstructions: z.string().optional(),
}).refine(
  (data) => new Date(data.startTime) < new Date(data.endTime),
  {
    message: 'Hora de início deve ser anterior à hora de fim',
    path: ['startTime'],
  }
);

export type CreateScheduleSchema = z.infer<typeof createScheduleSchema>;

export const updateScheduleSchema = z.object({
  patientId: z.string().uuid('ID de paciente inválido').optional(),
  professionalId: z.string().uuid('ID de profissional inválido').optional(),
  professionalName: z.string().min(3).optional(),
  resourceRoom: z.string().optional(),
  procedureType: z.enum([
    'consultation',
    'checkup',
    'imaging',
    'exam',
    'follow_up',
    'surgery',
  ]).optional(),
  startTime: z.string().datetime().optional(),
  endTime: z.string().datetime().optional(),
  status: z.enum([
    'scheduled',
    'confirmed',
    'in_attendance',
    'completed',
    'cancelled',
    'no_show',
  ]).optional(),
  origin: z.enum(['in_person', 'phone', 'online']).optional(),
  notes: z.string().optional(),
  patientInstructions: z.string().optional(),
});
export type UpdateScheduleSchema = z.infer<typeof updateScheduleSchema>;

export const updateScheduleStatusSchema = z.object({
  status: z.enum([
    'scheduled',
    'confirmed',
    'in_attendance',
    'completed',
    'cancelled',
    'no_show',
  ]),
  notes: z.string().optional(),
});

export type UpdateScheduleStatusSchema = z.infer<typeof updateScheduleStatusSchema>;
