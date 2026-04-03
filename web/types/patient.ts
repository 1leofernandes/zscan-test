export interface Address {
  cep: string;
  street: string;
  number: string;
  neighborhood: string;
  city: string;
  state: string;
  complement?: string;
}

export interface PatientResponse {
  id: string;
  fullName: string;
  dateOfBirth: string;
  cpf: string;
  cns?: string;
  gender: 'M' | 'F' | 'O';
  phonePrimary: string;
  phoneSecondary?: string;
  email?: string;
  address: Address;
  healthPlanId?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
}

export interface PaginatedPatients {
  items: PatientResponse[];
  total: number;
  page: number;
  pageSize: number;
  // totalPages: number;
}

export interface PatientFilters {
  search?: string;
  gender?: string;
  healthPlanId?: string;
  page: number;
  limit: number;
}

export type PatientCreateInput = Omit<PatientResponse, 'id' | 'createdAt' | 'updatedAt' | 'createdBy' | 'isActive'>;
export type PatientUpdateInput = Partial<PatientCreateInput>;
