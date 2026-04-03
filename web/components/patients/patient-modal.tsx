'use client';

import { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2 } from 'lucide-react';
import { useCreatePatient } from '@/lib/use-patients';
import apiClient from '@/lib/api-client';

// Validação de CPF (opcional - apenas para ajudar o usuário)
function validateCPFFormat(cpf: string): boolean {
  const cleaned = cpf.replace(/\D/g, '');
  if (cleaned.length !== 11) return true; // Allow to pass to backend
  return true; // Simplified - let backend validate
}

// Buscar CEP via ViaCEP
async function fetchCEP(cep: string) {
  const cleaned = cep.replace(/\D/g, '');
  if (cleaned.length !== 8) return null;

  try {
    const response = await fetch(`https://viacep.com.br/ws/${cleaned}/json/`);
    const data = await response.json();

    if (data.erro) {
      console.error('CEP não encontrado');
      return null;
    }

    return {
      street: data.logradouro,
      neighborhood: data.bairro,
      city: data.localidade,
      state: data.uf,
    };
  } catch (error) {
    console.error('Erro ao buscar CEP');
    return null;
  }
}

const patientSchema = z.object({
  fullName: z.string().min(1, 'Nome é obrigatório'),
  dateOfBirth: z.string().min(1, 'Data de nascimento é obrigatória'),
  cpf: z.string().min(1, 'CPF é obrigatório'),
  cns: z.string().optional(),
  gender: z.enum(['M', 'F', 'O']),
  phonePrimary: z.string().min(1, 'Telefone é obrigatório'),
  phoneSecondary: z.string().optional(),
  email: z.string().optional(),
  address: z.object({
    cep: z.string().min(1, 'CEP é obrigatório'),
    street: z.string().min(1, 'Rua é obrigatória'),
    number: z.string().min(1, 'Número é obrigatório'),
    complement: z.string().optional(),
    neighborhood: z.string().min(1, 'Bairro é obrigatório'),
    city: z.string().min(1, 'Cidade é obrigatória'),
    state: z.string().min(1, 'Estado é obrigatório'),
  }),
  clinicalNotes: z.string().optional(),
});

type PatientFormData = z.infer<typeof patientSchema>;

interface PatientModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function PatientModal({
  open,
  onOpenChange,
  onSuccess,
}: PatientModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loadingCEP, setLoadingCEP] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const createPatient = useCreatePatient();

  const { control, handleSubmit, watch, setValue, reset } =
    useForm<PatientFormData>({
      resolver: zodResolver(patientSchema),
      defaultValues: {
        gender: 'M',
        address: {
          cep: '',
          street: '',
          number: '',
          complement: '',
          neighborhood: '',
          city: '',
          state: '',
        },
      },
    });

  const cepValue = watch('address.cep');

  const handleCEPChange = async (cep: string) => {
    setValue('address.cep', cep);

    if (cep.length === 9) {
      // CEP with hyphen
      setLoadingCEP(true);
      const addressData = await fetchCEP(cep);
      setLoadingCEP(false);

      if (addressData) {
        setValue('address.street', addressData.street);
        setValue('address.neighborhood', addressData.neighborhood);
        setValue('address.city', addressData.city);
        setValue('address.state', addressData.state);
      }
    }
  };

  const onSubmit = async (data: PatientFormData) => {
    console.log('==== FORM SUBMIT CALLED ====');
    console.log('Form data:', data);
    setIsSubmitting(true);
    setError(null);
    
    try {
      // Remove formatting for API
      const cleanCPF = data.cpf.replace(/\D/g, '');
      const cleanPhone = data.phonePrimary.replace(/\D/g, '');
      const cleanCEP = data.address.cep.replace(/\D/g, '');

      // Format CEP with hyphen
      const formattedCEP = cleanCEP.length === 8 
        ? `${cleanCEP.slice(0, 5)}-${cleanCEP.slice(5)}` 
        : cleanCEP;

      const formattedData = {
        fullName: data.fullName,
        dateOfBirth: data.dateOfBirth,
        cpf: cleanCPF,
        cns: data.cns || '',
        gender: data.gender,
        phonePrimary: cleanPhone,
        phoneSecondary: data.phoneSecondary?.replace(/\D/g, '') || '',
        email: data.email || '',
        address: {
          cep: formattedCEP,
          street: data.address.street,
          number: data.address.number,
          complement: data.address.complement || '',
          neighborhood: data.address.neighborhood,
          city: data.address.city,
          state: data.address.state,
        },
      };

      console.log('Sending to API:', formattedData);
      
      const response = await apiClient.post('/patients', formattedData);
      console.log('✓ Patient created successfully:', response.data);
      
      alert('Paciente criado com sucesso!');
      reset();
      setIsSubmitting(false);
      onOpenChange(false);
      onSuccess?.();
    } catch (err: any) {
      console.error('✗ Error creating patient:', err);
      console.error('Error details:', err?.response?.data);
      const errorMsg = err?.response?.data?.message || 'Erro ao criar paciente';
      setError(errorMsg);
      alert(`Erro: ${errorMsg}`);
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Novo Paciente</DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="personal" className="space-y-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="personal">Dados Pessoais</TabsTrigger>
            <TabsTrigger value="contact">Contato</TabsTrigger>
            <TabsTrigger value="clinical">Clínico</TabsTrigger>
          </TabsList>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded p-3 text-sm text-red-700">
              {error}
            </div>
          )}

          <form 
            onSubmit={(e) => {
              console.log('Form onSubmit event triggered');
              e.preventDefault();
              e.stopPropagation();
              handleSubmit(onSubmit, (errors) => {
                console.log('Form validation errors:', errors);
                const errorMessages = Object.entries(errors)
                  .map(([key, err]: any) => `${key}: ${err?.message}`)
                  .join(', ');
                setError(errorMessages || 'Verifique os campos obrigatórios');
              })(e);
            }} 
            className="space-y-4"
            noValidate
          >
            {/* Tab: Dados Pessoais */}
            <TabsContent value="personal" className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">
                  Nome Completo *
                </label>
                <Controller
                  control={control}
                  name="fullName"
                  render={({ field }) => (
                    <Input placeholder="Ex: João da Silva" {...field} />
                  )}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">
                    Data de Nascimento *
                  </label>
                  <Controller
                    control={control}
                    name="dateOfBirth"
                    render={({ field }) => (
                      <Input type="date" {...field} />
                    )}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Sexo *</label>
                  <Controller
                    control={control}
                    name="gender"
                    render={({ field }) => (
                      <Select value={field.value} onValueChange={field.onChange}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="M">Masculino</SelectItem>
                          <SelectItem value="F">Feminino</SelectItem>
                          <SelectItem value="O">Outro</SelectItem>
                        </SelectContent>
                      </Select>
                    )}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">CPF *</label>
                  <Controller
                    control={control}
                    name="cpf"
                    render={({ field }) => (
                      <Input
                        placeholder="000.000.000-00"
                        {...field}
                        onChange={(e) => {
                          const value = e.target.value
                            .replace(/\D/g, '')
                            .slice(0, 11);
                          const formatted =
                            value.length > 6
                              ? `${value.slice(0, 3)}.${value.slice(3, 6)}.${value.slice(6, 9)}-${value.slice(9, 11)}`
                              : value.length > 3
                              ? `${value.slice(0, 3)}.${value.slice(3, 6)}.${value.slice(6)}`
                              : value.length > 0
                              ? `${value.slice(0, 3)}.${value.slice(3)}`
                              : '';
                          field.onChange(formatted);
                        }}
                      />
                    )}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">CNS (Cartão SUS)</label>
                  <Controller
                    control={control}
                    name="cns"
                    render={({ field }) => (
                      <Input placeholder="Opcional" {...field} />
                    )}
                  />
                </div>
              </div>
            </TabsContent>

            {/* Tab: Contato */}
            <TabsContent value="contact" className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">
                  Telefone Principal *
                </label>
                <Controller
                  control={control}
                  name="phonePrimary"
                  render={({ field }) => (
                    <Input
                      placeholder="(11) 99999-9999"
                      {...field}
                      onChange={(e) => {
                        const value = e.target.value.replace(/\D/g, '');
                        const formatted =
                          value.length > 6
                            ? `(${value.slice(0, 2)}) ${value.slice(2, 7)}-${value.slice(7, 11)}`
                            : value.length > 2
                            ? `(${value.slice(0, 2)}) ${value.slice(2)}`
                            : `(${value}`;
                        field.onChange(formatted);
                      }}
                    />
                  )}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Telefone Secundário</label>
                <Controller
                  control={control}
                  name="phoneSecondary"
                  render={({ field }) => (
                    <Input
                      placeholder="(11) 99999-9999"
                      {...field}
                    />
                  )}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Email</label>
                <Controller
                  control={control}
                  name="email"
                  render={({ field }) => (
                    <Input
                      type="email"
                      placeholder="email@example.com"
                      {...field}
                    />
                  )}
                />
              </div>

              {/* Endereço */}
              <div className="pt-4 border-t space-y-4">
                <h3 className="font-medium">Endereço</h3>

                <div className="space-y-2">
                  <label className="text-sm font-medium">CEP</label>
                  <Controller
                    control={control}
                    name="address.cep"
                    render={({ field }) => (
                      <Input
                        placeholder="00000-000"
                        {...field}
                        onChange={(e) => {
                          const value = e.target.value
                            .replace(/\D/g, '')
                            .slice(0, 8);
                          const formatted =
                            value.length > 5
                              ? `${value.slice(0, 5)}-${value.slice(5)}`
                              : value;
                          handleCEPChange(formatted);
                        }}
                        disabled={loadingCEP}
                      />
                    )}
                  />
                  {loadingCEP && (
                    <p className="text-xs text-blue-600">Buscando CEP...</p>
                  )}
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="col-span-2 space-y-2">
                    <label className="text-sm font-medium">Rua</label>
                    <Controller
                      control={control}
                      name="address.street"
                      render={({ field }) => (
                        <Input placeholder="Rua Principal" {...field} />
                      )}
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Número</label>
                    <Controller
                      control={control}
                      name="address.number"
                      render={({ field }) => (
                        <Input placeholder="123" {...field} />
                      )}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Complemento</label>
                  <Controller
                    control={control}
                    name="address.complement"
                    render={({ field }) => (
                      <Input placeholder="Apt. 456" {...field} />
                    )}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Bairro</label>
                    <Controller
                      control={control}
                      name="address.neighborhood"
                      render={({ field }) => (
                        <Input placeholder="Centro" {...field} />
                      )}
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Cidade</label>
                    <Controller
                      control={control}
                      name="address.city"
                      render={({ field }) => (
                        <Input placeholder="São Paulo" {...field} />
                      )}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Estado</label>
                  <Controller
                    control={control}
                    name="address.state"
                    render={({ field }) => (
                      <Input placeholder="SP" maxLength={2} {...field} />
                    )}
                  />
                </div>
              </div>
            </TabsContent>

            {/* Tab: Clínico */}
            <TabsContent value="clinical" className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Observações Clínicas</label>
                <Controller
                  control={control}
                  name="clinicalNotes"
                  render={({ field }) => (
                    <Textarea
                      placeholder="Alergias, condições pré-existentes, observações importantes..."
                      className="h-32"
                      {...field}
                    />
                  )}
                />
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded p-3 text-sm text-blue-800">
                <p>
                  <strong>Nota:</strong> Dados sensíveis como observações clínicas
                  são armazenados com segurança e acesso restrito.
                </p>
              </div>
            </TabsContent>

            <DialogFooter className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  reset();
                  onOpenChange(false);
                }}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Criar Paciente
              </Button>
            </DialogFooter>
          </form>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
