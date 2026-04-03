'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
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
import { createPatientSchema, CreatePatientSchema } from '@/schemas';
import { useCreatePatient, useUpdatePatient } from '@/lib/use-patients';
import { PatientResponse } from '@/types/patient';
import {
  AlertCircle,
  ArrowLeft,
  Check,
  User,
  Calendar as CalendarIcon,
  CreditCard,
  Heart,
  Phone,
  Mail,
  MapPin,
  Building,
  Home,
  Stethoscope,
  Save,
  UserPlus,
  ArrowRight,
  Search,
  Loader2,
} from 'lucide-react';
import apiClient from '@/lib/api-client';

interface PatientFormProps {
  patient?: PatientResponse;
  isEditing?: boolean;
}

type FormStep = 'personal' | 'address' | 'health';

export function PatientForm({ patient, isEditing = false }: PatientFormProps) {
  const router = useRouter();
  const [step, setStep] = useState<FormStep>('personal');
  const [showCEPLookup, setShowCEPLookup] = useState(false);

  const form = useForm<CreatePatientSchema>({
    resolver: zodResolver(createPatientSchema),
    defaultValues: patient || {
      fullName: '',
      dateOfBirth: '',
      cpf: '',
      cns: '',
      gender: 'M',
      phonePrimary: '',
      phoneSecondary: '',
      email: '',
      address: {
        cep: '',
        street: '',
        number: '',
        neighborhood: '',
        city: '',
        state: '',
      },
      healthPlanId: '',
    },
  });

  const createPatient = useCreatePatient();
  const updatePatient = useUpdatePatient(patient?.id || '');

  const handleCEPLookup = async (cep: string) => {
    if (cep.length !== 8) return;

    try {
      setShowCEPLookup(true);
      const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
      const data = await response.json();

      if (!data.erro) {
        form.setValue('address.street', data.logradouro);
        form.setValue('address.neighborhood', data.bairro);
        form.setValue('address.city', data.localidade);
        form.setValue('address.state', data.uf);
      }
    } catch (error) {
      console.error('CEP lookup failed:', error);
    } finally {
      setShowCEPLookup(false);
    }
  };

  // ✅ Função para avançar para o próximo step (NÃO salva)
  const handleNextStep = async (e: React.MouseEvent) => {
    e.preventDefault(); // ✅ IMPEDE QUALQUER SUBMISSÃO DO FORMULÁRIO
    
    let fieldsToValidate: (keyof CreatePatientSchema)[] = [];
    
    if (step === 'personal') {
      fieldsToValidate = ['fullName', 'dateOfBirth', 'cpf', 'gender', 'phonePrimary'];
    } else if (step === 'address') {
      fieldsToValidate = ['address'];
    }
    
    const isValid = await form.trigger(fieldsToValidate as any);
    
    if (isValid) {
      const steps: FormStep[] = ['personal', 'address', 'health'];
      const currentIndex = steps.indexOf(step);
      if (currentIndex < steps.length - 1) {
        setStep(steps[currentIndex + 1]);
      }
    }
  };

  // ✅ Função para voltar ao step anterior
  const handlePrevStep = (e: React.MouseEvent) => {
    e.preventDefault(); // ✅ IMPEDE QUALQUER SUBMISSÃO DO FORMULÁRIO
    
    const steps: FormStep[] = ['personal', 'address', 'health'];
    const currentIndex = steps.indexOf(step);
    if (currentIndex > 0) {
      setStep(steps[currentIndex - 1]);
    }
  };

  // ✅ Função para cancelar
  const handleCancel = (e: React.MouseEvent) => {
    e.preventDefault();
    router.back();
  };

  // ✅ Função de submit APENAS no último step
  const onSubmit = async (data: CreatePatientSchema) => {
    console.log('onSubmit called with data:', data);
    try {
      let healthPlanValue = null;
      
      if (data.healthPlanId && ['particular', 'sus', 'unimed', 'bradesco', 'sulamerica'].includes(data.healthPlanId)) {
        healthPlanValue = null;
      } else {
        healthPlanValue = data.healthPlanId || null;
      }

      const formattedData = {
        ...data,
        healthPlanId: healthPlanValue,
        address: {
          ...data.address,
          cep: data.address.cep
            ? data.address.cep.replace(/(\d{5})(\d{3})/, '$1-$2').replace(/^-/, '')
            : '',
        },
      };

      console.log('Formatted data to send:', formattedData);

      if (isEditing && patient) {
        console.log('Updating patient...');
        const response = await apiClient.patch<PatientResponse>(`/patients/${patient.id}`, formattedData);
        console.log('Patient updated:', response.data);
      } else {
        console.log('Creating patient with POST to /patients...');
        const response = await apiClient.post<PatientResponse>('/patients', formattedData);
        console.log('Patient created:', response.data);
      }
      
      console.log('Patient saved successfully!');
      router.push('/patients');
    } catch (error: any) {
      console.error('Form submission failed:', error);
      console.error('Error response:', error?.response?.data);
      alert(error?.response?.data?.message || 'Erro ao salvar paciente. Tente novamente.');
    }
  };

  const isLoading = createPatient.isPending || updatePatient.isPending;
  const error = createPatient.error || updatePatient.error;

  const steps: FormStep[] = ['personal', 'address', 'health'];
  const stepIndex = steps.indexOf(step);

  return (
    <div className="max-w-3xl mx-auto">
      {/* Header */}
      <div className="bg-gradient-to-r from-emerald-600 to-teal-600 rounded-t-2xl shadow-lg p-8 text-white">
        <div className="flex items-center gap-4">
          <div className="bg-white/20 p-3 rounded-lg backdrop-blur-sm">
            <User className="w-8 h-8" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">{isEditing ? 'Editar Paciente' : 'Novo Paciente'}</h1>
            <p className="text-emerald-100 mt-1">{isEditing ? 'Atualize as informações do paciente' : 'Preencha os dados do novo paciente'}</p>
          </div>
        </div>
      </div>

      {/* Step Indicator */}
      <div className="bg-white px-8 pt-8 flex gap-3">
        {steps.map((stepName, idx) => {
          const stepConfig = {
            personal: { icon: User, label: 'Pessoal' },
            address: { icon: MapPin, label: 'Endereço' },
            health: { icon: Heart, label: 'Saúde' },
          };
          const config = stepConfig[stepName];
          const Icon = config.icon;
          
          return (
            <button
              key={stepName}
              type="button"
              onClick={() => {
                if (idx <= stepIndex) {
                  setStep(stepName);
                }
              }}
              className={`flex-1 py-3 px-4 rounded-xl font-medium text-sm transition-all ${
                idx === stepIndex
                  ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-lg scale-105'
                  : idx < stepIndex
                  ? 'bg-green-100 text-green-700 hover:bg-green-200'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              <div className="flex items-center justify-center gap-2">
                {idx < stepIndex ? (
                  <Check className="h-5 w-5" />
                ) : (
                  <Icon className="h-4 w-4" />
                )}
                <span className="capitalize">{config.label}</span>
              </div>
            </button>
          );
        })}
      </div>

      {/* Error Alert */}
      {error && (
        <div className="mx-8 mt-6 bg-red-50 border border-red-200 rounded-xl p-4 text-red-700 text-sm flex gap-3">
          <AlertCircle className="h-5 w-5 flex-shrink-0" />
          <div>Erro ao salvar paciente. Tente novamente.</div>
        </div>
      )}

      {/* Form */}
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="bg-white px-8 py-8 space-y-6 rounded-b-2xl shadow-lg border-x border-b border-slate-200">
          {/* Step 1: Personal Info */}
          {step === 'personal' && (
            <div className="space-y-5 bg-gradient-to-br from-emerald-50 to-teal-50 p-6 rounded-xl">
              <h3 className="text-lg font-semibold text-emerald-900 mb-4 flex items-center gap-2">
                <User className="w-5 h-5" />
                Informações Pessoais
              </h3>
              
              <FormField
                control={form.control}
                name="fullName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-slate-700 font-semibold flex items-center gap-2">
                      <User className="w-4 h-4" />
                      Nome Completo *
                    </FormLabel>
                    <FormControl>
                      <Input placeholder="João Silva" className="bg-white border-slate-200" {...field} />
                    </FormControl>
                    <FormMessage className="text-red-600" />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="dateOfBirth"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-slate-700 font-semibold flex items-center gap-2">
                        <CalendarIcon className="w-4 h-4" />
                        Data Nascimento *
                      </FormLabel>
                      <FormControl>
                        <Input type="date" className="bg-white border-slate-200" {...field} />
                      </FormControl>
                      <FormMessage className="text-red-600" />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="gender"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        <Heart className="w-4 h-4" />
                        Gênero *
                      </FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="M">Masculino</SelectItem>
                          <SelectItem value="F">Feminino</SelectItem>
                          <SelectItem value="O">Outro</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="cpf"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        <CreditCard className="w-4 h-4" />
                        CPF *
                      </FormLabel>
                      <FormControl>
                        <Input placeholder="12345678901" {...field} maxLength={11} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="cns"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        <Heart className="w-4 h-4" />
                        CNS
                      </FormLabel>
                      <FormControl>
                        <Input placeholder="123456789012345" {...field} maxLength={15} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="phonePrimary"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        <Phone className="w-4 h-4" />
                        Telefone 1 *
                      </FormLabel>
                      <FormControl>
                        <Input placeholder="11987654321" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="phoneSecondary"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        <Phone className="w-4 h-4" />
                        Telefone 2
                      </FormLabel>
                      <FormControl>
                        <Input placeholder="11987654321" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      <Mail className="w-4 h-4" />
                      Email
                    </FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="joao@example.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          )}

          {/* Step 2: Address */}
          {step === 'address' && (
            <div className="space-y-5 bg-gradient-to-br from-blue-50 to-indigo-50 p-6 rounded-xl">
              <h3 className="text-lg font-semibold text-blue-900 mb-4 flex items-center gap-2">
                <MapPin className="w-5 h-5" />
                Endereço
              </h3>
              
              <FormField
                control={form.control}
                name="address.cep"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-slate-700 font-semibold flex items-center gap-2">
                      <Home className="w-4 h-4" />
                      CEP *
                    </FormLabel>
                    <div className="flex gap-2">
                      <FormControl className="flex-1">
                        <Input
                          placeholder="12345678"
                          className="bg-white border-slate-200"
                          {...field}
                          maxLength={8}
                          onChange={(e) => {
                            field.onChange(e);
                            if (e.target.value.length === 8) {
                              handleCEPLookup(e.target.value);
                            }
                          }}
                        />
                      </FormControl>
                      <Button
                        type="button"
                        variant="outline"
                        disabled={showCEPLookup}
                      >
                        {showCEPLookup ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                        {showCEPLookup ? '' : 'Buscar'}
                      </Button>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="address.street"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      <MapPin className="w-4 h-4" />
                      Rua *
                    </FormLabel>
                    <FormControl>
                      <Input placeholder="Rua das Flores" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="address.number"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Número *</FormLabel>
                      <FormControl>
                        <Input placeholder="123" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="address.neighborhood"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Bairro *</FormLabel>
                      <FormControl>
                        <Input placeholder="Centro" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="address.state"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>UF *</FormLabel>
                      <FormControl>
                        <Input placeholder="SP" {...field} maxLength={2} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="address.city"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      <Building className="w-4 h-4" />
                      Cidade *
                    </FormLabel>
                    <FormControl>
                      <Input placeholder="São Paulo" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          )}

          {/* Step 3: Health Plan */}
          {step === 'health' && (
            <div className="space-y-5 bg-gradient-to-br from-purple-50 to-pink-50 p-6 rounded-xl">
              <h3 className="text-lg font-semibold text-purple-900 mb-4 flex items-center gap-2">
                <Stethoscope className="w-5 h-5" />
                Informações de Saúde
              </h3>
              
              <FormField
                control={form.control}
                name="healthPlanId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      <Heart className="w-4 h-4" />
                      Plano de Saúde
                    </FormLabel>
                    <Select 
                      onValueChange={(value) => {
                        const planMap: Record<string, string | null> = {
                          'particular': null,
                          'sus': null,
                          'unimed': null,
                          'bradesco': null,
                          'sulamerica': null,
                        };
                        field.onChange(planMap[value] || value);
                      }} 
                      value={field.value || 'particular'}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecionar plano" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="particular">Particular</SelectItem>
                        <SelectItem value="sus">SUS</SelectItem>
                        <SelectItem value="unimed">Unimed</SelectItem>
                        <SelectItem value="bradesco">Bradesco</SelectItem>
                        <SelectItem value="sulamerica">SulAmérica</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm">
                <p className="text-blue-900 flex items-center gap-2">
                  <Stethoscope className="w-4 h-4" />
                  Informações de saúde adicionais podem ser gerenciadas após a criação do paciente.
                </p>
              </div>
            </div>
          )}

          {/* Navigation */}
          <div className="flex justify-between gap-4 pt-8 border-t border-slate-200">
            <Button
              type="button"
              variant="outline"
              onClick={handlePrevStep}
              className="border-slate-300 text-slate-700 hover:bg-slate-100"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              {stepIndex === 0 ? 'Cancelar' : 'Voltar'}
            </Button>

            {stepIndex === steps.length - 1 ? (
              <Button 
                type="submit" 
                disabled={isLoading}
                className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-semibold shadow-lg"
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : isEditing ? (
                  <Save className="w-4 h-4 mr-2" />
                ) : (
                  <UserPlus className="w-4 h-4 mr-2" />
                )}
                {isLoading
                  ? 'Salvando...'
                  : isEditing
                  ? 'Atualizar Paciente'
                  : 'Criar Paciente'}
              </Button>
            ) : (
              <Button
                type="button"
                onClick={handleNextStep}
                className="bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white font-semibold shadow-lg"
              >
                Próximo
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            )}
          </div>
        </form>
      </Form>
    </div>
  );
}